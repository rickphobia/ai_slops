package com.rickphobia.ricknotes.ink

import org.junit.Assert.assertEquals
import org.junit.Test

class WetInkHandoffTest {
    private val removed = mutableListOf<Set<String>>()
    private val handoff = WetInkHandoff<String> { removed += it }

    @Test
    fun `a finished stroke stays in the wet layer until its page has drawn it`() {
        handoff.handedOff("a")

        assertEquals(emptyList<Set<String>>(), removed)

        handoff.drawnByPage("a")

        assertEquals(listOf(setOf("a")), removed)
    }

    @Test
    fun `a stroke whose page never draws it leaves the wet layer when its time is up`() {
        handoff.handedOff("a")

        handoff.timedOut("a")

        assertEquals(listOf(setOf("a")), removed)
    }

    @Test
    fun `a stroke leaves the wet layer once, however it is released`() {
        handoff.handedOff("a")

        handoff.drawnByPage("a")
        handoff.drawnByPage("a")
        handoff.timedOut("a")

        assertEquals(listOf(setOf("a")), removed)
    }

    @Test
    fun `each stroke waits for its own drawing`() {
        handoff.handedOff("a")
        handoff.handedOff("b")

        handoff.drawnByPage("b")

        assertEquals(listOf(setOf("b")), removed)
    }
}
