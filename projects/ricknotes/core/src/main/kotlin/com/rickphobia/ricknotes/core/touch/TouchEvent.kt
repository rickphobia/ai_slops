package com.rickphobia.ricknotes.core.touch

enum class PointerKind { PEN, FINGER }

enum class TouchPhase { DOWN, MOVE, UP, CANCEL }

/**
 * One pointer's change, as plain values the app makes from Android's touch events. [x] and [y] are
 * screen pixels, [pressure] runs from 0 to 1 and [timeMs] is the event's time on a steady clock.
 */
data class TouchEvent(
    val pointerId: Int,
    val kind: PointerKind,
    val phase: TouchPhase,
    val x: Float,
    val y: Float,
    val pressure: Float,
    val timeMs: Long,
)

/** What a touch means for the open Document. Positions are screen pixels. */
sealed interface TouchAction {
    data class StartStroke(
        val pointerId: Int,
        val x: Float,
        val y: Float,
    ) : TouchAction

    data class ExtendStroke(
        val pointerId: Int,
        val x: Float,
        val y: Float,
    ) : TouchAction

    data class EndStroke(
        val pointerId: Int,
    ) : TouchAction

    /** The stroke is dropped: Android cancelled the pen's touch. */
    data class CancelStroke(
        val pointerId: Int,
    ) : TouchAction

    /** Fingers touched down: anything still moving the view (a fling) should stop. */
    data object ScrollStart : TouchAction

    /** One finger moved by ([dx], [dy]): the pages follow it. */
    data class Scroll(
        val dx: Float,
        val dy: Float,
        val timeMs: Long,
    ) : TouchAction

    /**
     * Two or more fingers moved: zoom by [zoomChange] about ([focusX], [focusY]), the point between
     * them, and follow that point's move of ([moveX], [moveY]).
     */
    data class Pinch(
        val focusX: Float,
        val focusY: Float,
        val zoomChange: Float,
        val moveX: Float,
        val moveY: Float,
    ) : TouchAction

    /** The last finger lifted: the view may carry on with a fling. */
    data object ScrollEnd : TouchAction

    data object Ignore : TouchAction
}
