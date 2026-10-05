package com.rickphobia.ricknotes.viewer

import androidx.compose.foundation.gestures.FlingBehavior
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.MutableState
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.util.VelocityTracker
import com.rickphobia.ricknotes.core.touch.TouchAction
import com.rickphobia.ricknotes.ink.TouchNavigation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

/**
 * Moves the page list the way the fingers on the ink layer say: one finger scrolls up and down (and
 * sideways when zoomed) and flings when let go, two fingers pinch-zoom about the point between them.
 */
internal class PageNavigation(
    private val view: MutableState<ZoomView>,
    private val listState: LazyListState,
    private val screen: ViewportSize,
    private val scope: CoroutineScope,
    private val flingBehavior: FlingBehavior,
) : TouchNavigation {
    private val velocity = VelocityTracker()
    private var travelled = Offset.Zero
    private var fling: Job? = null

    override fun stop() {
        fling?.cancel()
        fling = null
        velocity.resetTracking()
    }

    override fun scroll(action: TouchAction.Scroll) {
        // The list scrolls forward as the finger moves up.
        listState.dispatchRawDelta(-action.dy)
        view.value = view.value.panBy(action.dx, screen.width.toFloat())
        travelled += Offset(action.dx, action.dy)
        velocity.addPosition(action.timeMs, travelled)
    }

    override fun pinch(action: TouchAction.Pinch) {
        // A pinch ends in no fling, even if one finger carries on after the other lifts.
        velocity.resetTracking()
        val pinch =
            Pinch(
                focusX = action.focusX,
                focusY = action.focusY,
                offsetInFirstPage = listState.firstVisibleItemScrollOffset.toFloat(),
                zoomChange = action.zoomChange,
                moveX = action.moveX,
                moveY = action.moveY,
                viewportWidth = screen.width.toFloat(),
            )
        val step = view.value.pinch(pinch)
        view.value = step.view
        listState.dispatchRawDelta(step.scrollY)
    }

    override fun scrollEnd() {
        val fingerVelocity = velocity.calculateVelocity().y
        velocity.resetTracking()
        fling = scope.launch { listState.scroll { with(flingBehavior) { performFling(-fingerVelocity) } } }
    }
}
