package com.rickphobia.ricknotes.ink

import android.annotation.SuppressLint
import android.content.Context
import android.view.MotionEvent
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.widget.FrameLayout
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.ink.authoring.InProgressStrokesView
import com.rickphobia.ricknotes.core.ink.InkTool
import com.rickphobia.ricknotes.core.ink.PagePlacement
import com.rickphobia.ricknotes.core.touch.TouchAction

/**
 * The layer over an open Document's pages that takes every touch on them: the pen draws in it with
 * Jetpack Ink's low-latency renderer, and fingers move the pages under it through [navigation].
 * It is an Android View, not Compose, because low-latency ink needs the raw [MotionEvent]s.
 */
@Composable
internal fun InkLayer(
    ink: DocumentInk,
    placements: () -> List<PagePlacement>,
    navigation: TouchNavigation,
    currentTool: () -> InkTool,
) {
    val currentPlacements = rememberUpdatedState(placements)
    val currentNavigation = rememberUpdatedState(navigation)
    val tool = rememberUpdatedState(currentTool)
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            TouchLayerView(context).also { layer ->
                val touch =
                    DocumentTouch(
                        inProgress = layer.inProgress,
                        ink = ink,
                        placements = { currentPlacements.value() },
                        navigation = DelegatingNavigation { currentNavigation.value },
                        clockMs = System::currentTimeMillis,
                        currentTool = { tool.value() },
                    )
                layer.inProgress.addFinishedStrokesListener(touch)
                layer.onTouch = touch::onTouch
            }
        },
    )
}

// Lets the View, made once, follow a navigation that Compose may replace on recomposition.
private class DelegatingNavigation(
    private val current: () -> TouchNavigation,
) : TouchNavigation {
    override fun stop() = current().stop()

    override fun scroll(action: TouchAction.Scroll) = current().scroll(action)

    override fun pinch(action: TouchAction.Pinch) = current().pinch(action)

    override fun scrollEnd() = current().scrollEnd()
}

// Touches on the pages are writing and moving, never clicks, so there is no click to perform.
@SuppressLint("ViewConstructor", "ClickableViewAccessibility")
private class TouchLayerView(
    context: Context,
) : FrameLayout(context) {
    val inProgress = InProgressStrokesView(context)
    var onTouch: (TouchLayerView, MotionEvent) -> Unit = { _, _ -> }

    init {
        addView(inProgress, LayoutParams(MATCH_PARENT, MATCH_PARENT))
        // Sets up the low-latency renderer now rather than on the first stroke, so it isn't late.
        inProgress.eagerInit()
    }

    // Every touch is ours, even if a child of the Ink view would take it.
    override fun onInterceptTouchEvent(event: MotionEvent): Boolean = true

    override fun onTouchEvent(event: MotionEvent): Boolean {
        onTouch(this, event)
        return true
    }
}
