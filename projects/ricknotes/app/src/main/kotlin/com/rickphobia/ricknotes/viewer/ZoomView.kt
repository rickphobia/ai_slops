package com.rickphobia.ricknotes.viewer

/** How far a Document zooms. 1 is the page filling the screen's width. */
object ZoomLimits {
    const val MIN = 1f

    // At 5x a slide's smallest labels (R₂ subscripts) are finger-sized on the 12.7" screen.
    const val MAX = 5f

    fun clamp(zoom: Float): Float = if (zoom.isNaN()) MIN else zoom.coerceIn(MIN, MAX)
}

/**
 * One step of a two-finger gesture, in screen pixels. [focusX] and [focusY] are the point between
 * the fingers, [offsetInFirstPage] is how far the top of the screen is below the top of the first
 * page showing, and [moveX]/[moveY] is how far the fingers moved together.
 */
data class Pinch(
    val focusX: Float,
    val focusY: Float,
    val offsetInFirstPage: Float,
    val zoomChange: Float,
    val moveX: Float,
    val moveY: Float,
    val viewportWidth: Float,
)

/** A pinch's outcome: the new view, and how far to scroll the page list down. */
data class ZoomStep(
    val view: ZoomView,
    val scrollY: Float,
)

/**
 * The zoom and sideways pan of an open Document. The page list is [zoom] times the screen's width
 * and [panX] pixels of it are scrolled off the left edge.
 */
data class ZoomView(
    val zoom: Float,
    val panX: Float,
) {
    /** Zooms about the point between the fingers, so that point stays under them, and follows their move. */
    fun pinch(pinch: Pinch): ZoomStep {
        val newZoom = ZoomLimits.clamp(zoom * pinch.zoomChange)
        val factor = newZoom / zoom
        // Everything below the first page's top grows by the same factor (the gaps between pages
        // don't, which is a few pixels of drift at most).
        val scrollY = (pinch.offsetInFirstPage + pinch.focusY) * (factor - 1) - pinch.moveY
        val newPanX = (panX + pinch.focusX) * factor - pinch.focusX - pinch.moveX
        return ZoomStep(
            view = ZoomView(newZoom, clampPan(newPanX, newZoom, pinch.viewportWidth)),
            scrollY = scrollY,
        )
    }

    /** Pans sideways by a finger moving [dx] pixels, stopping at the page's edges. */
    fun panBy(
        dx: Float,
        viewportWidth: Float,
    ): ZoomView = copy(panX = clampPan(panX - dx, zoom, viewportWidth))

    private fun clampPan(
        pan: Float,
        zoom: Float,
        viewportWidth: Float,
    ): Float = pan.coerceIn(0f, (viewportWidth * zoom - viewportWidth).coerceAtLeast(0f))
}
