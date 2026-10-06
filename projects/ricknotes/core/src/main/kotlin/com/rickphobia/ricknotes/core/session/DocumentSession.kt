package com.rickphobia.ricknotes.core.session

import com.rickphobia.ricknotes.core.ink.Stroke
import com.rickphobia.ricknotes.core.inkfile.InkFile
import com.rickphobia.ricknotes.core.inkfile.InkFileCodec
import com.rickphobia.ricknotes.core.inkfile.InkFileDamaged
import com.rickphobia.ricknotes.core.inkfile.InkPage
import java.io.IOException
import java.nio.file.Path

/** Something the student should be told about when a Document opens. */
sealed interface SessionWarning {
    /** The PDF has [nowPages] pages but had [recordedPages] when its ink was last saved: ink may not line up. */
    data class PdfPageCountChanged(
        val recordedPages: Int,
        val nowPages: Int,
    ) : SessionWarning

    /** The Ink file can't be read, so the Document is open read-only and the file is left alone. */
    data class InkFileUnreadable(
        val error: InkFileDamaged,
    ) : SessionWarning
}

enum class SaveStatus {
    /** Everything drawn is in the Ink file. */
    SAVED,

    /** There are changes a save is scheduled for. */
    PENDING,

    /** The last save failed: changes are only in memory until a retry succeeds. Shown as "Not saved". */
    FAILED,
}

/** A save that didn't reach the Ink file; the old file is untouched and the changes are kept. */
class InkSaveFailed(
    val fileName: String,
    cause: Exception,
) : Exception("couldn't save $fileName: ${cause.message}", cause)

/**
 * What the session reports as it saves, for the screen and the log. Called on whichever thread
 * saved; [statusChanged] is called with the session's lock held, so statuses arrive in order and it
 * must not call back into the session.
 */
interface SaveListener {
    fun statusChanged(status: SaveStatus) {}

    fun saved(
        fileName: String,
        bytes: Int,
        durationMs: Long,
    ) {}

    fun saveFailed(error: InkSaveFailed) {}
}

/**
 * One open Document's ink: the seam the screen talks to (spec, Seam 1). It loads the Ink file
 * beside the PDF, keeps the strokes, and saves [SAVE_DELAY_MS] after the last change or at once on
 * [saveNow]. It may be called from any thread.
 */
class DocumentSession private constructor(
    private val store: InkFileStore,
    private val clock: Clock,
    private val listener: SaveListener,
    loaded: InkFile,
    pdfPageCount: Int,
    val warnings: List<SessionWarning>,
) {
    /** True when the Ink file couldn't be read: nothing may be drawn and nothing is ever saved. */
    val readOnly: Boolean = warnings.any { it is SessionWarning.InkFileUnreadable }

    private val lock = Any()

    // Held for a whole save, so two saves never write the temporary file at once.
    private val writing = Any()
    private val pageCount = pdfPageCount
    private val pages: List<InkPage> = loaded.pages + InkFile.pdfPages(pdfPageCount).filter { it !in loaded.pages }
    private val strokeList = loaded.strokes.toMutableList()
    private var revision = 0L
    private var savedRevision = 0L
    private var pendingSave: Scheduled? = null
    private var currentStatus = SaveStatus.SAVED

    val strokes: List<Stroke> get() = synchronized(lock) { strokeList.toList() }

    val status: SaveStatus get() = synchronized(lock) { currentStatus }

    fun addStroke(stroke: Stroke) {
        check(!readOnly) { "${store.fileName} is open read-only" }
        synchronized(lock) {
            strokeList.add(stroke)
            revision++
            scheduleSave(SAVE_DELAY_MS)
            if (currentStatus != SaveStatus.FAILED) setStatus(SaveStatus.PENDING)
        }
    }

    /** Saves any changes now, for when the app goes to the background or the Document closes. */
    fun saveNow() {
        synchronized(lock) {
            pendingSave?.cancel()
            pendingSave = null
        }
        save()
    }

    private fun save() {
        if (readOnly) return
        synchronized(writing) {
            val changes =
                synchronized(lock) {
                    (InkFile(pageCount, pages, strokeList.toList()) to revision).takeIf { revision != savedRevision }
                }
            changes?.let { (file, savingRevision) -> write(file, savingRevision) }
        }
    }

    private fun write(
        file: InkFile,
        savingRevision: Long,
    ) {
        val started = clock.nowMs()
        val bytes = InkFileCodec.encode(file).toByteArray(Charsets.UTF_8)
        val failure =
            try {
                store.write(bytes)
                null
            } catch (e: IOException) {
                e
            } catch (e: SecurityException) {
                e
            }
        if (failure != null) {
            synchronized(lock) {
                scheduleSave(RETRY_DELAY_MS)
                setStatus(SaveStatus.FAILED)
            }
            listener.saveFailed(InkSaveFailed(store.fileName, failure))
        } else {
            synchronized(lock) {
                savedRevision = savingRevision
                setStatus(if (savedRevision == revision) SaveStatus.SAVED else SaveStatus.PENDING)
            }
            listener.saved(store.fileName, bytes.size, clock.nowMs() - started)
        }
    }

    // Call with [lock] held.
    private fun scheduleSave(delayMs: Long) {
        pendingSave?.cancel()
        pendingSave = clock.schedule(delayMs) { save() }
    }

    // Call with [lock] held.
    private fun setStatus(status: SaveStatus) {
        if (status == currentStatus) return
        currentStatus = status
        listener.statusChanged(status)
    }

    companion object {
        /** A save happens this long after the last change: soon enough that a force-close loses little. */
        const val SAVE_DELAY_MS = 2_000L

        /** A failed save is tried again this often until it works. */
        const val RETRY_DELAY_MS = 5_000L

        /**
         * Opens the ink of the Document at [pdf], which has [pdfPageCount] pages. A missing Ink file
         * starts empty; an unreadable one opens read-only with a warning.
         */
        fun open(
            pdf: Path,
            pdfPageCount: Int,
            clock: Clock,
            listener: SaveListener = object : SaveListener {},
        ): DocumentSession {
            val store = InkFileStore(pdf)
            val loaded =
                try {
                    load(store)
                } catch (e: InkFileDamaged) {
                    return readOnly(store, clock, listener, pdfPageCount, e)
                }
            val warnings =
                listOfNotNull(
                    loaded?.takeIf { it.pdfPageCount != pdfPageCount }?.let {
                        SessionWarning.PdfPageCountChanged(it.pdfPageCount, pdfPageCount)
                    },
                )
            val start = loaded ?: InkFile.empty(pdfPageCount)
            return DocumentSession(store, clock, listener, start, pdfPageCount, warnings)
        }

        /** The Ink file's contents, or null if there is none. */
        private fun load(store: InkFileStore): InkFile? {
            val fileName = store.fileName
            val text =
                try {
                    store.read()
                } catch (e: IOException) {
                    throw InkFileDamaged(fileName, "can't read it", e)
                }
            return text?.let { InkFileCodec.decode(it, fileName) }
        }

        private fun readOnly(
            store: InkFileStore,
            clock: Clock,
            listener: SaveListener,
            pdfPageCount: Int,
            error: InkFileDamaged,
        ) = DocumentSession(
            store,
            clock,
            listener,
            InkFile.empty(pdfPageCount),
            pdfPageCount,
            listOf(SessionWarning.InkFileUnreadable(error)),
        )
    }
}
