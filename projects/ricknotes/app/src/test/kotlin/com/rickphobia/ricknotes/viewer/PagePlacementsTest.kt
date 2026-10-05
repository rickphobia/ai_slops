package com.rickphobia.ricknotes.viewer

import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.PagePlacement
import org.junit.Assert.assertEquals
import org.junit.Test

class PagePlacementsTest {
    @Test
    fun `each laid-out page is placed after the gap, slid left by the pan, at its zoomed scale`() {
        val sizes = listOf(PageSize(720, 540), PageSize(595, 842))
        val visible = listOf(VisiblePage(1, top = -300, height = 4245))

        val placements =
            pagePlacements(visible, sizes, pageWidthPx = 3000, gapPx = 20, view = ZoomView(2f, panX = 500f))

        assertEquals(
            listOf(PagePlacement(PageId.ofPdfPage(1), left = -480f, top = -300f, 3000f / 595, 595f, 842f)),
            placements,
        )
    }
}
