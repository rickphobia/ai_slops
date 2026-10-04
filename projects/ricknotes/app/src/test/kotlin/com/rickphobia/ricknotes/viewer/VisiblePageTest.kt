package com.rickphobia.ricknotes.viewer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class VisiblePageTest {
    @Test
    fun `the current page is the one filling most of the screen`() {
        val pages = listOf(VisiblePage(4, top = -900, height = 1000), VisiblePage(5, top = 108, height = 1000))

        assertEquals(5, currentPage(pages, viewportHeight = 800))
    }

    @Test
    fun `a page filling the screen is current even when the next one shows`() {
        val pages = listOf(VisiblePage(0, top = -100, height = 700), VisiblePage(1, top = 608, height = 700))

        assertEquals(0, currentPage(pages, viewportHeight = 800))
    }

    @Test
    fun `a page mostly scrolled off is not current`() {
        val pages = listOf(VisiblePage(2, top = -600, height = 1000), VisiblePage(3, top = 408, height = 1000))

        assertEquals(2, currentPage(pages, viewportHeight = 800))
    }

    @Test
    fun `a jumped-to slide at the top stays current when the next one shows as much`() {
        // Upright tablet, 16:9 slides: page 12 at the top, 13 below it, 14 cut off.
        val pages =
            listOf(
                VisiblePage(11, top = 0, height = 1035),
                VisiblePage(12, top = 1043, height = 1035),
                VisiblePage(13, top = 2086, height = 1035),
            )

        assertEquals(11, currentPage(pages, viewportHeight = 2944))
    }

    @Test
    fun `nothing laid out yet means no current page`() {
        assertNull(currentPage(emptyList(), viewportHeight = 800))
    }

    @Test
    fun `a typed page number becomes that page`() {
        assertEquals(41, pageIndexFromNumber(" 42 ", pageCount = 100))
    }

    @Test
    fun `a page number outside the Document is refused`() {
        assertNull(pageIndexFromNumber("0", pageCount = 100))
        assertNull(pageIndexFromNumber("101", pageCount = 100))
        assertNull(pageIndexFromNumber("twelve", pageCount = 100))
    }
}
