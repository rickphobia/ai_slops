package com.rickphobia.ricknotes.ink

import androidx.compose.runtime.mutableStateOf
import com.rickphobia.ricknotes.core.session.DocumentSession
import com.rickphobia.ricknotes.core.session.InkSaveFailed
import com.rickphobia.ricknotes.core.session.SaveListener
import com.rickphobia.ricknotes.core.session.SaveStatus
import com.rickphobia.ricknotes.logging.AppLog
import java.io.File

/** A Document session and its save status as Compose state. */
internal class HeldSession(
    val session: DocumentSession,
    val status: SaveStatusState,
)

/**
 * The app's Document sessions, one per PDF. A closed Document's session is let go only once its ink
 * is saved: until then it keeps retrying, and reopening the Document gets the same session back
 * with every stroke, instead of reading an Ink file that is about to be replaced.
 */
internal object InkSessions {
    private class Entry(
        val held: HeldSession,
    ) {
        var openTabs = 0
    }

    private val entries = mutableMapOf<String, Entry>()

    /** Slow when the Ink file has to be read: call it off the main thread. */
    @Synchronized
    fun open(
        pdf: File,
        pageCount: Int,
    ): HeldSession {
        val entry =
            entries.getOrPut(pdf.path) {
                val status = SaveStatusState(pdf.name)
                val session = DocumentSession.open(pdf.toPath(), pageCount, SaveThread, status)
                session.warnings.forEach { AppLog.w("${pdf.name}: $it") }
                Entry(HeldSession(session, status))
            }
        entry.openTabs++
        return entry.held
    }

    /** Saves the closed Document's ink, and lets its session go once it is saved and not open again. */
    fun close(pdf: File) {
        val entry = synchronized(this) { entries.getValue(pdf.path).also { it.openTabs-- } }
        SaveThread.run {
            entry.held.session.saveNow()
            val saved = entry.held.session.status == SaveStatus.SAVED
            synchronized(InkSessions) { if (saved && entry.openTabs == 0) entries.remove(pdf.path) }
            if (saved) {
                AppLog.i("closed ${pdf.name}")
            } else {
                AppLog.w("closed ${pdf.name} with ink not yet saved; still retrying")
            }
        }
    }
}

/** The session's save status as Compose state, and the save log. */
internal class SaveStatusState(
    private val documentName: String,
) : SaveListener {
    // Written from the save thread: Compose state may be set from any thread.
    val current = mutableStateOf(SaveStatus.SAVED)

    override fun statusChanged(status: SaveStatus) {
        current.value = status
    }

    override fun saved(
        fileName: String,
        bytes: Int,
        durationMs: Long,
    ) {
        AppLog.i("saved $fileName: $bytes bytes in $durationMs ms")
    }

    override fun saveFailed(error: InkSaveFailed) {
        AppLog.e("save failed for $documentName; will retry", error)
    }
}
