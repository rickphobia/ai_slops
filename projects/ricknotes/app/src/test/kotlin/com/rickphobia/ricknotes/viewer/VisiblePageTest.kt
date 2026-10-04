package com.rickphobia.ricknotes.viewer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class VisiblePageTest {
    @Test
    fun `the current page is the one across the middle of the screen`() {
        val pages = listOf(VisiblePage(4, top = -900, height = 1000), VisiblePage(5, top = 108, height = 1000))

        assertEquals(5, currentPage(pages, viewportHeight = 800))
    }

    @Test
    fun `a page filling the screen is current even when the next one shows`() {
        val pages = listOf(VisiblePage(0, top = -100, height = 700), VisiblePage(1, top = 608, height = 700))

        assertEquals(0, currentPage(pages, viewportHeight = 800))
    }

    @Test
    fun `with the middle in a gap, the nearest page is current`() {
        val pages = listOf(VisiblePage(2, top = -600, height = 1000), VisiblePage(3, top = 408, height = 1000))

        assertEquals(2, currentPage(pages, viewportHeight = 800))
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
