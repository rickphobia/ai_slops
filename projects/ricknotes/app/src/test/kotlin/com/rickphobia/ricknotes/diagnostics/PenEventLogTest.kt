package com.rickphobia.ricknotes.diagnostics

import org.junit.Assert.assertEquals
import org.junit.Test

class PenEventLogTest {
    private fun event(timeMs: Long) =
        PenEvent(timeMs, PenEvent.Kind.KEY, "ACTION_DOWN", "-", 0, 0f, hovering = false, keyCode = null)

    @Test
    fun `newest event comes first`() {
        val log = PenEventLog(capacity = 10).add(event(1)).add(event(2))
        assertEquals(listOf(2L, 1L), log.events.map { it.timeMs })
    }

    @Test
    fun `the oldest events drop off past capacity`() {
        val log = (1L..5L).fold(PenEventLog(capacity = 3)) { acc, t -> acc.add(event(t)) }
        assertEquals(listOf(5L, 4L, 3L), log.events.map { it.timeMs })
    }
}
