package com.rickphobia.ricknotes.core.touch

import kotlin.math.hypot

/**
 * Turns touches on an open Document into what they mean: the pen draws, one finger scrolls, two or
 * more fingers scroll and zoom. A finger never draws. While the pen is down, fingers do nothing,
 * so a hand that brushes the screen mid-stroke neither scrolls the page nor breaks the stroke.
 *
 * One interpreter per open Document; it remembers which pointers are down between events.
 */
class TouchInterpreter {
    private var penPointer: Int? = null

    // Every finger that is down, with where it last was. Kept up to date even while the pen draws,
    // so a finger that carries on after the pen lifts moves the view from where it is, not jumps.
    private val fingers = LinkedHashMap<Int, Position>()

    fun handle(event: TouchEvent): TouchAction =
        when (event.kind) {
            PointerKind.PEN -> handlePen(event)
            PointerKind.FINGER -> handleFinger(event)
        }

    private fun handlePen(event: TouchEvent): TouchAction {
        val drawing = penPointer
        return when {
            event.phase == TouchPhase.DOWN && drawing == null -> {
                penPointer = event.pointerId
                TouchAction.StartStroke(event.pointerId, event.x, event.y)
            }

            event.pointerId != drawing -> {
                TouchAction.Ignore
            }

            event.phase == TouchPhase.MOVE -> {
                TouchAction.ExtendStroke(event.pointerId, event.x, event.y)
            }

            event.phase == TouchPhase.UP -> {
                penPointer = null
                TouchAction.EndStroke(event.pointerId)
            }

            event.phase == TouchPhase.CANCEL -> {
                penPointer = null
                TouchAction.CancelStroke(event.pointerId)
            }

            else -> {
                TouchAction.Ignore
            }
        }
    }

    private fun handleFinger(event: TouchEvent): TouchAction {
        val before = fingers.toMap()
        val position = Position(event.x, event.y)
        when (event.phase) {
            TouchPhase.DOWN, TouchPhase.MOVE -> fingers[event.pointerId] = position
            TouchPhase.UP, TouchPhase.CANCEL -> fingers.remove(event.pointerId)
        }
        if (penPointer != null) return TouchAction.Ignore
        return when (event.phase) {
            TouchPhase.DOWN -> if (before.isEmpty()) TouchAction.ScrollStart else TouchAction.Ignore
            TouchPhase.MOVE -> move(before, event)
            TouchPhase.UP -> if (fingers.isEmpty()) TouchAction.ScrollEnd else TouchAction.Ignore
            TouchPhase.CANCEL -> TouchAction.Ignore
        }
    }

    private fun move(
        before: Map<Int, Position>,
        event: TouchEvent,
    ): TouchAction {
        val last = before[event.pointerId]
        return when {
            last == null -> TouchAction.Ignore
            fingers.size == 1 -> TouchAction.Scroll(event.x - last.x, event.y - last.y, event.timeMs)
            else -> pinch(before)
        }
    }

    private fun pinch(before: Map<Int, Position>): TouchAction {
        val oldCentre = centre(before.values)
        val newCentre = centre(fingers.values)
        val oldSpread = spread(before.values, oldCentre)
        val newSpread = spread(fingers.values, newCentre)
        return TouchAction.Pinch(
            focusX = newCentre.x,
            focusY = newCentre.y,
            zoomChange = if (oldSpread > 0f && newSpread > 0f) newSpread / oldSpread else 1f,
            moveX = newCentre.x - oldCentre.x,
            moveY = newCentre.y - oldCentre.y,
        )
    }

    private data class Position(
        val x: Float,
        val y: Float,
    )

    private fun centre(positions: Collection<Position>): Position =
        Position(positions.map { it.x }.average().toFloat(), positions.map { it.y }.average().toFloat())

    /** The fingers' average distance from their centre: how far apart they are. */
    private fun spread(
        positions: Collection<Position>,
        centre: Position,
    ): Float = positions.map { hypot(it.x - centre.x, it.y - centre.y) }.average().toFloat()
}
