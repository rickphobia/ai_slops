package com.rickphobia.ricknotes.core.ink

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PagePlacementTest {
    // A 600 x 800 pt page drawn 1200 px wide (2 px per point), its top-left corner at (16, -400).
    private val page = PagePlacement(PageId.ofPdfPage(0), left = 16f, top = -400f, pixelsPerPoint = 2f, 600f, 800f)

    @Test
    fun `screen position becomes page points from the page's top-left corner`() {
        assertEquals(PagePoint(100f, 250f), page.toPage(ScreenPoint(216f, 100f)))
    }

    @Test
    fun `page point goes back to the same screen position`() {
        val screen = ScreenPoint(333f, 77f)

        val back = page.toScreen(page.toPage(screen))

        assertEquals(screen.x, back.x, TOLERANCE)
        assertEquals(screen.y, back.y, TOLERANCE)
    }

    @Test
    fun `the same page point lands where the page is after zooming and scrolling`() {
        val zoomed = page.copy(left = -500f, top = 30f, pixelsPerPoint = 6f)

        assertEquals(ScreenPoint(100f, 1530f), zoomed.toScreen(PagePoint(100f, 250f)))
    }

    @Test
    fun `the page under a point is found, and none in the gap between pages`() {
        val below = PagePlacement(PageId.ofPdfPage(1), left = 16f, top = 1208f, pixelsPerPoint = 2f, 600f, 800f)
        val pages = listOf(page, below)

        assertEquals(page.pageId, pageAt(pages, ScreenPoint(20f, 1199f))?.pageId)
        assertEquals(below.pageId, pageAt(pages, ScreenPoint(20f, 1210f))?.pageId)
        assertNull(pageAt(pages, ScreenPoint(20f, 1204f)))
        assertNull(pageAt(pages, ScreenPoint(10f, 500f)))
    }

    @Test
    fun `a PDF page's ID depends only on its place in the PDF`() {
        assertEquals(PageId("pdf-3"), PageId.ofPdfPage(2))
    }

    private companion object {
        const val TOLERANCE = 0.001f
    }
}
