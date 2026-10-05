package com.rickphobia.ricknotes.core.ink

import com.rickphobia.ricknotes.core.ink.PenColour.BLACK
import com.rickphobia.ricknotes.core.ink.PenColour.BLUE
import com.rickphobia.ricknotes.core.ink.PenColour.GREEN
import com.rickphobia.ricknotes.core.ink.PenColour.RED
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class InkToolTest {
    private val favourites = FavouritePens.DEFAULT

    @Test
    fun `tapping the current pen cycles black blue red green and back`() {
        var tool: InkTool = InkTool.Pen(BLACK)
        val seen = mutableListOf<PenColour>()
        repeat(4) {
            tool = tool.afterTappingPen((tool as InkTool.Pen).colour, favourites)
            seen.add((tool as InkTool.Pen).colour)
        }

        assertEquals(listOf(BLUE, RED, GREEN, BLACK), seen)
    }

    @Test
    fun `tapping another pen picks it without cycling`() {
        assertEquals(InkTool.Pen(RED), InkTool.Pen(BLACK).afterTappingPen(RED, favourites))
    }

    @Test
    fun `tapping a pen while highlighting picks that pen`() {
        assertEquals(InkTool.Pen(BLACK), InkTool.Highlighter.afterTappingPen(BLACK, favourites))
    }

    @Test
    fun `cycling only goes through the favourites`() {
        val blackAndRed = FavouritePens(listOf(BLACK, RED))

        assertEquals(InkTool.Pen(RED), InkTool.Pen(BLACK).afterTappingPen(BLACK, blackAndRed))
        assertEquals(InkTool.Pen(BLACK), InkTool.Pen(RED).afterTappingPen(RED, blackAndRed))
    }

    @Test
    fun `a pen that is not a favourite cycles to the first favourite`() {
        assertEquals(RED, FavouritePens(listOf(RED, GREEN)).after(BLUE))
    }

    @Test
    fun `a single favourite cycles to itself`() {
        assertEquals(RED, FavouritePens(listOf(RED)).after(RED))
    }

    @Test
    fun `favourite pens can't be empty or repeat a colour`() {
        assertThrows(IllegalArgumentException::class.java) { FavouritePens(emptyList()) }
        assertThrows(IllegalArgumentException::class.java) { FavouritePens(listOf(RED, RED)) }
    }

    @Test
    fun `highlighter is translucent and records its tool`() {
        val alpha = InkTool.Highlighter.colourArgb ushr 24

        assertTrue("alpha $alpha", alpha in 1..254)
        assertEquals(Tool.HIGHLIGHTER, InkTool.Highlighter.tool)
        assertEquals(Tool.PEN, InkTool.Pen(RED).tool)
        assertEquals(RED.argb, InkTool.Pen(RED).colourArgb)
    }

    @Test
    fun `editing the favourites adds, removes and reorders`() {
        val edited =
            FavouritePens.DEFAULT
                .without(BLUE)
                .movedEarlier(RED)
                .with(BLUE)

        assertEquals(listOf(RED, BLACK, GREEN, BLUE), edited.colours)
        assertEquals(edited, edited.with(RED))
        assertEquals(edited, edited.movedEarlier(RED))
    }

    @Test
    fun `the last favourite can't be removed`() {
        val one = FavouritePens(listOf(RED))

        assertEquals(false, one.canRemove(RED))
        assertEquals(true, FavouritePens.DEFAULT.canRemove(RED))
        assertThrows(IllegalArgumentException::class.java) { one.without(RED) }
    }
}
