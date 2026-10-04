package com.rickphobia.ricknotes.viewer

import org.junit.Assert.assertEquals
import org.junit.Test

class PageSizeTest {
    @Test
    fun `an A4 portrait page keeps its shape at screen width`() {
        assertEquals(2601, PageSize(widthPt = 595, heightPt = 842).heightPx(widthPx = 1838))
    }

    @Test
    fun `a 16 by 9 slide is wider than tall`() {
        assertEquals(1080, PageSize(widthPt = 960, heightPt = 540).heightPx(widthPx = 1920))
    }

    @Test
    fun `a sliver of a page is still at least one pixel tall`() {
        assertEquals(1, PageSize(widthPt = 1000, heightPt = 1).heightPx(widthPx = 10))
    }
}
