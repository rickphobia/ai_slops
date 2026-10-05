package com.rickphobia.ricknotes.core.ink

import org.junit.Assert.assertThrows
import org.junit.Test

class StrokeTest {
    private val point = StrokePoint(x = 10f, y = 20f, pressure = 0.5f, elapsedMs = 0)

    private fun stroke(
        points: List<StrokePoint> = listOf(point),
        widthPt: Float = 1.5f,
    ) = Stroke(StrokeId("s1"), PageId.ofPdfPage(0), Tool.PEN, PenColour.BLACK.argb, widthPt, 0, points)

    @Test
    fun `a stroke needs at least one point`() {
        assertThrows(IllegalArgumentException::class.java) { stroke(points = emptyList()) }
    }

    @Test
    fun `a stroke needs a width above zero`() {
        assertThrows(IllegalArgumentException::class.java) { stroke(widthPt = 0f) }
    }

    @Test
    fun `pressure must be between 0 and 1`() {
        assertThrows(IllegalArgumentException::class.java) { point.copy(pressure = 1.5f) }
    }

    @Test
    fun `a point's time can't be before the stroke started`() {
        assertThrows(IllegalArgumentException::class.java) { point.copy(elapsedMs = -1) }
    }
}
