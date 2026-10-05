package com.rickphobia.ricknotes.core.inkfile

import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.Stroke
import com.rickphobia.ricknotes.core.ink.StrokeId
import com.rickphobia.ricknotes.core.ink.StrokePoint
import com.rickphobia.ricknotes.core.ink.Tool
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs

class InkFileCodecTest {
    private val points =
        listOf(
            StrokePoint(x = 72.5f, y = 100.25f, pressure = 0.4f, elapsedMs = 0),
            StrokePoint(x = 73.01f, y = 99.99f, pressure = 0.512f, elapsedMs = 8),
            StrokePoint(x = 0f, y = 841.89f, pressure = 1f, elapsedMs = 16),
        )
    private val file =
        InkFile(
            pdfPageCount = 2,
            pages = InkFile.pdfPages(2),
            strokes =
                listOf(
                    Stroke(StrokeId("a"), PageId("pdf-1"), Tool.PEN, 0xFF000000.toInt(), 1.5f, DRAWN_AT, points),
                    Stroke(StrokeId("b"), PageId("pdf-2"), Tool.HIGHLIGHTER, 0x80FFEB3B.toInt(), 12f, DRAWN_AT, points),
                ),
        )

    @Test
    fun `an Ink file round-trips exactly, packed points included`() {
        val text = InkFileCodec.encode(file)

        assertEquals(file, InkFileCodec.decode(text, "a.pdf.ink.json"))
        assertEquals(text, InkFileCodec.encode(InkFileCodec.decode(text, "a.pdf.ink.json")))
    }

    @Test
    fun `the file is readable JSON with the format version, page count, pages and stroke details`() {
        val text = InkFileCodec.encode(file)

        listOf(
            "\"formatVersion\": 1",
            "\"pdfPageCount\": 2",
            "\"id\": \"pdf-1\"",
            "\"tool\": \"highlighter\"",
            "\"colour\": \"#80FFEB3B\"",
        ).forEach { assertTrue("missing $it in\n$text", text.contains(it)) }
    }

    @Test
    fun `points are difference-encoded whole numbers in text`() {
        val text = InkFileCodec.encode(file)

        assertTrue(text, text.contains("\"points\": \"7250,10025,400,0,51,-26,112,8,-7301,74190,488,8\""))
    }

    @Test
    fun `a point off the stored grid comes back within half a step`() {
        val fine = StrokePoint(x = 10.123456f, y = 5.006f, pressure = 0.33333f, elapsedMs = 3)

        val back = PointPacking.unpack(PointPacking.pack(listOf(fine))).single()

        assertTrue(abs(back.x - fine.x) <= 0.005f && abs(back.y - fine.y) <= 0.005f)
        assertTrue(abs(back.pressure - fine.pressure) <= 0.0005f)
    }

    @Test
    fun `text that isn't an Ink file is reported as damaged`() {
        listOf(
            "",
            "{\"formatVersion\": 1",
            "{\"formatVersion\": 1, \"pdfPageCount\": 1, \"pages\": []}",
        ).forEach { text ->
            assertThrows(InkFileDamaged::class.java) { InkFileCodec.decode(text, "a.pdf.ink.json") }
        }
    }

    @Test
    fun `bad points, an unknown page or a newer format version are reported as damaged`() {
        val good = InkFileCodec.encode(file)
        listOf(
            good.replace("7250,10025,400,0,51", "7250,10025,400,0,x"),
            good.replace("7250,10025,400,0,51,-26,112,8,", "7250,10025,400,0,51,-26,"),
            good.replace("\"page\": \"pdf-2\"", "\"page\": \"pdf-9\""),
            good.replace("\"formatVersion\": 1", "\"formatVersion\": 2"),
        ).forEach { text ->
            assertThrows(text, InkFileDamaged::class.java) { InkFileCodec.decode(text, "a.pdf.ink.json") }
        }
    }

    private companion object {
        const val DRAWN_AT = 1_760_000_000_000
    }
}
