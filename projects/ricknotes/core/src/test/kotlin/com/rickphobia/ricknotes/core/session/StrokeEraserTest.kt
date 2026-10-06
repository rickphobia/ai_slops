package com.rickphobia.ricknotes.core.session

import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.PagePoint
import com.rickphobia.ricknotes.core.ink.Stroke
import com.rickphobia.ricknotes.core.ink.StrokeId
import com.rickphobia.ricknotes.core.ink.StrokePoint
import com.rickphobia.ricknotes.core.ink.Tool
import org.junit.Assert.assertEquals
import org.junit.Test

class StrokeEraserTest {
    private val page = PageId.ofPdfPage(0)

    // A horizontal line from (0, y) to (100, y), 2 pt wide.
    private fun line(
        id: String,
        pageId: PageId = page,
        y: Float = 50f,
    ) = Stroke(
        StrokeId(id),
        pageId,
        Tool.PEN,
        0,
        widthPt = 2f,
        drawnAtMs = 0,
        points = listOf(StrokePoint(0f, y, 0.5f, 0), StrokePoint(100f, y, 0.5f, 10)),
    )

    private fun touched(
        strokes: List<Stroke>,
        from: PagePoint,
        to: PagePoint = from,
    ) = strokesTouched(strokes, page, from, to, radiusPt = 3f).map { it.id.value }

    @Test
    fun `the eraser touches a stroke within its reach plus half the stroke's width`() {
        assertEquals(listOf("a"), touched(listOf(line("a")), PagePoint(50f, 54f)))
        assertEquals(emptyList<String>(), touched(listOf(line("a")), PagePoint(50f, 54.1f)))
    }

    @Test
    fun `a fast swipe across a stroke touches it even with no sample near it`() {
        assertEquals(listOf("a"), touched(listOf(line("a")), PagePoint(50f, 0f), PagePoint(50f, 100f)))
    }

    @Test
    fun `only strokes on the eraser's page are touched`() {
        val strokes = listOf(line("a"), line("b", pageId = PageId.ofPdfPage(1)), line("c", y = 80f))

        assertEquals(listOf("a"), touched(strokes, PagePoint(10f, 50f)))
    }

    @Test
    fun `a one-point stroke is a dot that can be touched`() {
        val dot = line("dot").copy(points = listOf(StrokePoint(20f, 20f, 0.5f, 0)))

        assertEquals(listOf("dot"), touched(listOf(dot), PagePoint(23f, 21f)))
    }
}
