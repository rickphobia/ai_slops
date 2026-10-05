package com.rickphobia.ricknotes.core.touch

import com.rickphobia.ricknotes.core.touch.PointerKind.FINGER
import com.rickphobia.ricknotes.core.touch.PointerKind.PEN
import com.rickphobia.ricknotes.core.touch.TouchPhase.CANCEL
import com.rickphobia.ricknotes.core.touch.TouchPhase.DOWN
import com.rickphobia.ricknotes.core.touch.TouchPhase.MOVE
import com.rickphobia.ricknotes.core.touch.TouchPhase.UP
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TouchInterpreterTest {
    private val interpreter = TouchInterpreter()
    private var clock = 0L

    private fun touch(
        pointerId: Int,
        kind: PointerKind,
        phase: TouchPhase,
        x: Float,
        y: Float,
    ): TouchAction {
        clock += FRAME_MS
        val pressure = if (kind == PEN) 0.5f else 1f
        return interpreter.handle(TouchEvent(pointerId, kind, phase, x, y, pressure, clock))
    }

    private fun pen(
        phase: TouchPhase,
        x: Float,
        y: Float,
    ) = touch(PEN_ID, PEN, phase, x, y)

    private fun finger(
        id: Int,
        phase: TouchPhase,
        x: Float,
        y: Float,
    ) = touch(id, FINGER, phase, x, y)

    @Test
    fun `the pen draws a stroke from down to up`() {
        assertEquals(TouchAction.StartStroke(PEN_ID, 10f, 20f), pen(DOWN, 10f, 20f))
        assertEquals(TouchAction.ExtendStroke(PEN_ID, 15f, 25f), pen(MOVE, 15f, 25f))
        assertEquals(TouchAction.EndStroke(PEN_ID), pen(UP, 15f, 25f))
    }

    @Test
    fun `a cancelled pen drops its stroke`() {
        pen(DOWN, 10f, 20f)

        assertEquals(TouchAction.CancelStroke(PEN_ID), pen(CANCEL, 10f, 20f))
    }

    @Test
    fun `one finger scrolls by how far it moved and never draws`() {
        val actions =
            listOf(
                finger(1, DOWN, 100f, 500f),
                finger(1, MOVE, 104f, 470f),
                finger(1, MOVE, 104f, 430f),
                finger(1, UP, 104f, 430f),
            )

        assertEquals(TouchAction.ScrollStart, actions[0])
        assertEquals(TouchAction.Scroll(4f, -30f, 2 * FRAME_MS), actions[1])
        assertEquals(TouchAction.Scroll(0f, -40f, 3 * FRAME_MS), actions[2])
        assertEquals(TouchAction.ScrollEnd, actions[3])
        assertTrue(actions.none { it is TouchAction.StartStroke || it is TouchAction.ExtendStroke })
    }

    @Test
    fun `two fingers spreading apart zoom in about the point between them`() {
        finger(1, DOWN, 100f, 500f)
        finger(2, DOWN, 300f, 500f)

        val pinch = finger(2, MOVE, 500f, 500f) as TouchAction.Pinch

        // The fingers were 200 px apart and now are 400 px: twice as far.
        assertEquals(2f, pinch.zoomChange, TOLERANCE)
        assertEquals(300f, pinch.focusX, TOLERANCE)
        assertEquals(500f, pinch.focusY, TOLERANCE)
    }

    @Test
    fun `two fingers moving together scroll without zooming`() {
        finger(1, DOWN, 100f, 500f)
        finger(2, DOWN, 300f, 500f)

        val first = finger(1, MOVE, 100f, 440f) as TouchAction.Pinch
        val second = finger(2, MOVE, 300f, 440f) as TouchAction.Pinch

        // Each finger's move shifts the point between them by half of it.
        assertEquals(-30f, first.moveY, TOLERANCE)
        assertEquals(-30f, second.moveY, TOLERANCE)
        assertEquals(1f, second.zoomChange * first.zoomChange, TOLERANCE)
    }

    @Test
    fun `lifting one of two fingers carries on scrolling from where the other one is`() {
        finger(1, DOWN, 100f, 500f)
        finger(2, DOWN, 300f, 500f)
        finger(2, MOVE, 300f, 450f)

        assertEquals(TouchAction.Ignore, finger(2, UP, 300f, 450f))
        assertEquals(TouchAction.Scroll(0f, -20f, 5 * FRAME_MS), finger(1, MOVE, 100f, 480f))
    }

    @Test
    fun `a finger while the pen draws neither scrolls nor stops the stroke`() {
        pen(DOWN, 10f, 20f)

        assertEquals(TouchAction.Ignore, finger(1, DOWN, 500f, 500f))
        assertEquals(TouchAction.Ignore, finger(1, MOVE, 500f, 400f))
        assertEquals(TouchAction.ExtendStroke(PEN_ID, 12f, 22f), pen(MOVE, 12f, 22f))
        assertEquals(TouchAction.EndStroke(PEN_ID), pen(UP, 12f, 22f))
    }

    @Test
    fun `a finger still down after the pen lifts scrolls from where it is, with no jump`() {
        pen(DOWN, 10f, 20f)
        finger(1, DOWN, 500f, 500f)
        finger(1, MOVE, 500f, 400f)
        pen(UP, 10f, 20f)

        assertEquals(TouchAction.Scroll(0f, -10f, 5 * FRAME_MS), finger(1, MOVE, 500f, 390f))
    }

    @Test
    fun `the pen landing mid-scroll draws, and the scroll stops`() {
        finger(1, DOWN, 500f, 500f)
        finger(1, MOVE, 500f, 450f)

        assertEquals(TouchAction.StartStroke(PEN_ID, 10f, 20f), pen(DOWN, 10f, 20f))
        assertEquals(TouchAction.Ignore, finger(1, MOVE, 500f, 400f))
    }

    @Test
    fun `a cancelled finger ends its scroll without a fling`() {
        finger(1, DOWN, 500f, 500f)
        finger(1, MOVE, 500f, 450f)

        assertEquals(TouchAction.Ignore, finger(1, CANCEL, 500f, 450f))
        assertEquals(TouchAction.ScrollStart, finger(2, DOWN, 300f, 300f))
    }

    @Test
    fun `a pen move with no stroke started is ignored`() {
        assertEquals(TouchAction.Ignore, pen(MOVE, 10f, 20f))
        assertEquals(TouchAction.Ignore, pen(UP, 10f, 20f))
    }

    private companion object {
        const val PEN_ID = 0
        const val FRAME_MS = 8L
        const val TOLERANCE = 0.001f
    }
}
