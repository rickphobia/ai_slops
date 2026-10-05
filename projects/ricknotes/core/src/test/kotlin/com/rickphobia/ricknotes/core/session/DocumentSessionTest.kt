package com.rickphobia.ricknotes.core.session

import com.rickphobia.ricknotes.core.ink.InkTool
import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.PenColour
import com.rickphobia.ricknotes.core.ink.Stroke
import com.rickphobia.ricknotes.core.ink.StrokeId
import com.rickphobia.ricknotes.core.ink.StrokePoint
import com.rickphobia.ricknotes.core.ink.Tool
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.nio.file.Files
import java.nio.file.Path

/** A clock that only moves when the test says so, running whatever falls due. */
private class FakeClock : Clock {
    private var now = 0L
    private val tasks = mutableListOf<Pair<Long, () -> Unit>>()

    override fun nowMs(): Long = now

    override fun schedule(
        delayMs: Long,
        task: () -> Unit,
    ): Scheduled {
        val entry = now + delayMs to task
        tasks.add(entry)
        return Scheduled { tasks.remove(entry) }
    }

    fun advance(ms: Long) {
        val until = now + ms
        while (true) {
            val next = tasks.filter { it.first <= until }.minByOrNull { it.first } ?: break
            tasks.remove(next)
            now = next.first
            next.second()
        }
        now = until
    }
}

private class RecordingListener : SaveListener {
    val statuses = mutableListOf<SaveStatus>()
    val failures = mutableListOf<InkSaveFailed>()
    var saves = 0

    override fun statusChanged(status: SaveStatus) {
        statuses.add(status)
    }

    override fun saved(
        fileName: String,
        bytes: Int,
        durationMs: Long,
    ) {
        saves++
    }

    override fun saveFailed(error: InkSaveFailed) {
        failures.add(error)
    }
}

class DocumentSessionTest {
    @get:Rule val folder = TemporaryFolder()

    private val clock = FakeClock()
    private val pdf: Path by lazy {
        folder.root
            .toPath()
            .resolve("Week 1.pdf")
            .also { Files.write(it, PDF_BYTES) }
    }
    private val inkFile: Path get() = pdf.resolveSibling("Week 1.pdf.ink.json")
    private val temporaryFile: Path get() = pdf.resolveSibling(".Week 1.pdf.ink.json.tmp")

    private fun stroke(
        id: String,
        page: Int = 0,
    ) = Stroke(
        StrokeId(id),
        PageId.ofPdfPage(page),
        Tool.PEN,
        PenColour.BLACK.argb,
        InkTool.Pen(PenColour.BLACK).widthPt,
        drawnAtMs = 1_760_000_000_000,
        points = listOf(StrokePoint(10f, 20f, 0.5f, 0), StrokePoint(11.25f, 22.5f, 0.75f, 9)),
    )

    private fun open(
        pageCount: Int = 3,
        listener: SaveListener = RecordingListener(),
    ) = DocumentSession.open(pdf, pageCount, clock, listener)

    @Test
    fun `a Document with no Ink file opens empty and writes nothing until there is ink`() {
        val session = open()
        clock.advance(10_000)
        session.saveNow()

        assertEquals(emptyList<Stroke>(), session.strokes)
        assertFalse(Files.exists(inkFile))
    }

    @Test
    fun `ink is saved 2 seconds after the last stroke and is all there on reopening`() {
        val session = open()
        session.addStroke(stroke("a"))
        clock.advance(1_500)
        session.addStroke(stroke("b", page = 2))
        clock.advance(1_999)
        assertFalse("saved before 2 s had passed since the last stroke", Files.exists(inkFile))

        clock.advance(1)

        assertEquals(SaveStatus.SAVED, session.status)
        assertEquals(listOf(stroke("a"), stroke("b", page = 2)), open().strokes)
    }

    @Test
    fun `going to the background saves at once`() {
        val session = open()
        session.addStroke(stroke("a"))

        session.saveNow()

        assertEquals(listOf(stroke("a")), open().strokes)
    }

    @Test
    fun `the PDF is never changed`() {
        val session = open()
        session.addStroke(stroke("a"))
        session.saveNow()

        assertArrayEquals(PDF_BYTES, Files.readAllBytes(pdf))
    }

    @Test
    fun `a stray temporary file from an interrupted save is ignored on open`() {
        open().apply {
            addStroke(stroke("a"))
            saveNow()
        }
        Files.writeString(temporaryFile, "{ half a fil")

        val session = open()

        assertEquals(listOf(stroke("a")), session.strokes)
        assertTrue(session.warnings.isEmpty())
        session.addStroke(stroke("b"))
        session.saveNow()
        assertEquals(listOf(stroke("a"), stroke("b")), open().strokes)
    }

    @Test
    fun `a failed save keeps the old file and the changes, shows Not saved, and retries until it works`() {
        val listener = RecordingListener()
        val session = open(listener = listener)
        session.addStroke(stroke("a"))
        session.saveNow()
        val before = Files.readAllBytes(inkFile)
        // A folder where the temporary file goes makes every write fail, as a full disk would.
        Files.createDirectory(temporaryFile)
        Files.writeString(temporaryFile.resolve("keep"), "x")

        session.addStroke(stroke("b"))
        clock.advance(2_000)

        assertEquals(SaveStatus.FAILED, session.status)
        assertArrayEquals(before, Files.readAllBytes(inkFile))
        assertEquals(listOf(stroke("a"), stroke("b")), session.strokes)
        assertEquals(1, listener.failures.size)

        clock.advance(DocumentSession.RETRY_DELAY_MS)
        assertEquals("still failing, so retried again", 2, listener.failures.size)
        assertEquals(SaveStatus.FAILED, session.status)

        temporaryFile.toFile().deleteRecursively()
        clock.advance(DocumentSession.RETRY_DELAY_MS)

        assertEquals(SaveStatus.SAVED, session.status)
        assertEquals(SaveStatus.SAVED, listener.statuses.last())
        assertEquals(listOf(stroke("a"), stroke("b")), open().strokes)
    }

    @Test
    fun `a damaged Ink file opens read-only with a warning and is never overwritten`() {
        val damaged = "{\"formatVersion\": 1, \"pdfPageCount\": 3, \"pages\": [{\"id\": \"pdf-1\"}], \"strokes\": [{"
        Files.writeString(inkFile, damaged)

        val session = open()

        assertTrue(session.readOnly)
        assertTrue(session.warnings.single() is SessionWarning.InkFileUnreadable)
        assertThrows(IllegalStateException::class.java) { session.addStroke(stroke("a")) }
        session.saveNow()
        clock.advance(60_000)
        assertEquals(damaged, Files.readString(inkFile))
    }

    @Test
    fun `a PDF whose page count changed since the ink was saved shows a warning`() {
        open(pageCount = 3).apply {
            addStroke(stroke("a"))
            saveNow()
        }

        assertEquals(listOf(SessionWarning.PdfPageCountChanged(3, 5)), open(pageCount = 5).warnings)
        assertEquals(emptyList<SessionWarning>(), open(pageCount = 3).warnings)
    }

    @Test
    fun `strokes keep their IDs and pages across a reopen`() {
        open(pageCount = 2).apply {
            addStroke(stroke("first", page = 1))
            saveNow()
        }

        val reopened = open(pageCount = 2).strokes.single()

        assertEquals(StrokeId("first"), reopened.id)
        assertEquals(PageId("pdf-2"), reopened.pageId)
    }

    private companion object {
        val PDF_BYTES = "%PDF-1.7 not really".toByteArray()
    }
}
