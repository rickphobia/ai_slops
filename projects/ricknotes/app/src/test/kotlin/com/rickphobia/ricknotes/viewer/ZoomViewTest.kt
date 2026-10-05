package com.rickphobia.ricknotes.viewer

import org.junit.Assert.assertEquals
import org.junit.Test

class ZoomViewTest {
    private val viewportWidth = 1000f

    @Test
    fun `pinching out keeps the point under the fingers still sideways`() {
        val step = ZoomView(zoom = 1f, panX = 0f).pinch(pinchAt(focusX = 400f, zoomChange = 2f))

        assertEquals(2f, step.view.zoom)
        // The point 400 px into the page is now 800 px in, so pan 400 px to keep it under x = 400.
        assertEquals(400f, step.view.panX)
    }

    @Test
    fun `pinching out scrolls down so the line under the fingers stays put`() {
        val step =
            ZoomView(
                zoom = 1f,
                panX = 0f,
            ).pinch(pinchAt(focusY = 300f, offsetInFirstPage = 100f, zoomChange = 2f))

        // 400 px below the first page's top becomes 800 px below it.
        assertEquals(400f, step.scrollY)
    }

    @Test
    fun `zoom stops at the maximum`() {
        val step = ZoomView(zoom = 4f, panX = 0f).pinch(pinchAt(zoomChange = 3f))

        assertEquals(ZoomLimits.MAX, step.view.zoom)
    }

    @Test
    fun `zoom stops at the page filling the width`() {
        val step = ZoomView(zoom = 1.5f, panX = 200f).pinch(pinchAt(zoomChange = 0.25f))

        assertEquals(ZoomLimits.MIN, step.view.zoom)
        assertEquals(0f, step.view.panX)
    }

    @Test
    fun `a pinch past a limit doesn't scroll`() {
        val step = ZoomView(zoom = ZoomLimits.MAX, panX = 0f).pinch(pinchAt(focusY = 300f, zoomChange = 2f))

        assertEquals(0f, step.scrollY)
    }

    @Test
    fun `moving two fingers pans and scrolls with them`() {
        val step = ZoomView(zoom = 2f, panX = 300f).pinch(pinchAt().copy(moveX = 50f, moveY = 70f))

        assertEquals(250f, step.view.panX)
        assertEquals(-70f, step.scrollY)
    }

    @Test
    fun `panning stops at the page's edges`() {
        val view = ZoomView(zoom = 2f, panX = 900f)

        assertEquals(1000f, view.panBy(-500f, viewportWidth).panX)
        assertEquals(0f, view.panBy(5000f, viewportWidth).panX)
    }

    @Test
    fun `a stored zoom outside the limits is brought back inside them`() {
        assertEquals(ZoomLimits.MAX, ZoomLimits.clamp(40f))
        assertEquals(ZoomLimits.MIN, ZoomLimits.clamp(Float.NaN))
    }

    private fun pinchAt(
        focusX: Float = 0f,
        focusY: Float = 0f,
        offsetInFirstPage: Float = 0f,
        zoomChange: Float = 1f,
    ) = Pinch(
        focusX = focusX,
        focusY = focusY,
        offsetInFirstPage = offsetInFirstPage,
        zoomChange = zoomChange,
        moveX = 0f,
        moveY = 0f,
        viewportWidth = viewportWidth,
    )
}
