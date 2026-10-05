package com.rickphobia.ricknotes.viewer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PageDetailTest {
    private val screen = ViewportSize(width = 1000, height = 800)

    @Test
    fun `the visible part of a page is where it meets the screen`() {
        val placed = PlacedPage(top = -500, left = 10, width = 3000, height = 2000)

        assertEquals(
            PixelRect(left = 290, top = 500, right = 1290, bottom = 1300),
            placed.visiblePart(panX = 300, screen),
        )
    }

    @Test
    fun `a page below the screen has no visible part`() {
        assertNull(PlacedPage(top = 900, left = 0, width = 3000, height = 2000).visiblePart(panX = 0, screen))
    }

    @Test
    fun `a zoomed page gets a sharp part with a margin around what shows`() {
        val visible = PixelRect(left = 1000, top = 1000, right = 2000, bottom = 1800)

        val plan = planDetail(current = null, visible = visible, page = zoomedPage, margin = 100)

        assertEquals(DetailPlan.Render(PixelRect(900, 900, 2100, 1900)), plan)
    }

    @Test
    fun `the margin stops at the page's edges`() {
        val visible = PixelRect(left = 0, top = 1500, right = 1000, bottom = 2000)

        val plan = planDetail(current = null, visible = visible, page = zoomedPage, margin = 100)

        assertEquals(DetailPlan.Render(PixelRect(0, 1400, 1100, 2000)), plan)
    }

    @Test
    fun `a small scroll inside the sharp part keeps it`() {
        val current = SharpPart(PixelRect(900, 900, 2100, 1900), pageWidth = zoomedPage.width)

        val plan = planDetail(current, PixelRect(1050, 950, 2050, 1750), zoomedPage, margin = 100)

        assertEquals(DetailPlan.Keep, plan)
    }

    @Test
    fun `scrolling past the sharp part renders a new one`() {
        val current = SharpPart(PixelRect(900, 900, 2100, 1900), pageWidth = zoomedPage.width)

        val plan = planDetail(current, PixelRect(1000, 1150, 2000, 1950), zoomedPage, margin = 100)

        assertEquals(DetailPlan.Render(PixelRect(900, 1050, 2100, 2000)), plan)
    }

    @Test
    fun `a new zoom never keeps the old sharp part`() {
        val current = SharpPart(PixelRect(0, 0, 3000, 2000), pageWidth = 2500)

        val plan = planDetail(current, PixelRect(0, 0, 1000, 800), zoomedPage, margin = 0)

        assertEquals(DetailPlan.Render(PixelRect(0, 0, 1000, 800)), plan)
    }

    @Test
    fun `a page at its normal width needs no sharp part`() {
        val page = PageScale(width = 980, height = 650, baseWidth = 980)

        assertEquals(DetailPlan.Drop, planDetail(current = null, PixelRect(0, 0, 980, 650), page, margin = 100))
    }

    @Test
    fun `a page scrolled off the screen drops its sharp part`() {
        val current = SharpPart(PixelRect(0, 0, 1000, 800), pageWidth = zoomedPage.width)

        assertEquals(DetailPlan.Drop, planDetail(current, visible = null, page = zoomedPage, margin = 100))
    }

    private companion object {
        val zoomedPage = PageScale(width = 3000, height = 2000, baseWidth = 1000)
    }
}
