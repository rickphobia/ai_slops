package com.rickphobia.ricknotes.viewer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ReadingPositionTest {
    @Test
    fun `a saved position reads back the same`() {
        val position = ReadingPosition(pageIndex = 41, zoom = 2.5f)

        assertEquals(position, ReadingPosition.decode(position.encode()))
    }

    @Test
    fun `an unreadable saved position is ignored`() {
        assertNull(ReadingPosition.decode("page 4"))
        assertNull(ReadingPosition.decode("4;"))
        assertNull(ReadingPosition.decode("-1;2.0"))
    }

    @Test
    fun `a position past the end of a shortened PDF goes to its last page`() {
        assertEquals(ReadingPosition(9, 2f), ReadingPosition(pageIndex = 60, zoom = 2f).fitTo(pageCount = 10))
    }

    @Test
    fun `a saved zoom outside the limits is brought inside them`() {
        assertEquals(ReadingPosition(3, ZoomLimits.MAX), ReadingPosition(3, zoom = 99f).fitTo(pageCount = 10))
    }
}
