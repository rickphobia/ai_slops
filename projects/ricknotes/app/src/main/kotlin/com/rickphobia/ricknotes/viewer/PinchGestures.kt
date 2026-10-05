package com.rickphobia.ricknotes.viewer

import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.calculateCentroid
import androidx.compose.foundation.gestures.calculatePan
import androidx.compose.foundation.gestures.calculateZoom
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChange

/**
 * Two fingers pinch-zoom and pan; one finger pans sideways while the page list underneath scrolls
 * it up and down. Events are read before the list sees them, and two-finger moves are consumed so
 * the list doesn't also scroll them. [key] restarts the gesture when the screen changes size.
 */
internal fun Modifier.pinchAndPan(
    key: Any,
    onPinch: (centroid: Offset, pan: Offset, zoomChange: Float) -> Unit,
    onPanX: (dx: Float) -> Unit,
): Modifier =
    pointerInput(key) {
        awaitEachGesture {
            awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Initial)
            do {
                val event = awaitPointerEvent(PointerEventPass.Initial)
                val down = event.changes.filter { it.pressed }
                if (down.size >= 2) {
                    onPinch(event.calculateCentroid(), event.calculatePan(), event.calculateZoom())
                    event.changes.forEach { it.consume() }
                } else if (down.size == 1) {
                    onPanX(down.first().positionChange().x)
                }
            } while (event.changes.any { it.pressed })
        }
    }
