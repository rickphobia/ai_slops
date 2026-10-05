package com.rickphobia.ricknotes.ink

import com.rickphobia.ricknotes.core.ink.InkTool
import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.PenColour
import com.rickphobia.ricknotes.core.ink.Stroke
import com.rickphobia.ricknotes.core.ink.StrokeId
import com.rickphobia.ricknotes.core.ink.StrokePoint
import com.rickphobia.ricknotes.core.ink.Tool
import com.rickphobia.ricknotes.core.inkfile.InkFile
import com.rickphobia.ricknotes.core.inkfile.InkFileCodec
import org.junit.Assert.assertEquals
import org.junit.Test

class InkInputPointsTest {
    private fun stroke(points: List<StrokePoint>) =
        Stroke(
            StrokeId("s"),
            PageId.ofPdfPage(0),
            Tool.PEN,
            PenColour.BLACK.argb,
            InkTool.Pen(PenColour.BLACK).widthPt,
            0,
            points,
        )

    private fun savedAndLoaded(stroke: Stroke): Stroke {
        val text = InkFileCodec.encode(InkFile(1, InkFile.pdfPages(1), listOf(stroke)))
        return InkFileCodec.decode(text, "a.pdf.ink.json").strokes.single()
    }

    @Test
    fun `two pen samples in one millisecond that saving rounds to one point give Ink only one`() {
        // The pen reported both within 0.01 pt in the same millisecond: distinct when drawn, but the
        // same place and time once saved, which Jetpack Ink rejects as a duplicate input.
        val drawn =
            stroke(
                listOf(
                    StrokePoint(10.001f, 20f, 0.5f, 4),
                    StrokePoint(10.002f, 20f, 0.6f, 4),
                    StrokePoint(11f, 21f, 0.6f, 8),
                ),
            )
        val loaded = savedAndLoaded(drawn)
        assertEquals("saving made a duplicate", loaded.points[0].x, loaded.points[1].x)

        val inputs = inkInputPoints(loaded.points)

        assertEquals(listOf(loaded.points[0], loaded.points[2]), inputs)
    }

    @Test
    fun `points at different places or times all reach Ink`() {
        val points =
            listOf(
                StrokePoint(10f, 20f, 0.5f, 0),
                StrokePoint(10f, 20f, 0.5f, 8),
                StrokePoint(10.5f, 20f, 0.5f, 8),
            )

        assertEquals(points, inkInputPoints(points))
    }
}
