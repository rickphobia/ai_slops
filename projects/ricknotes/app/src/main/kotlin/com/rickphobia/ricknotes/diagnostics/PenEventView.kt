package com.rickphobia.ricknotes.diagnostics

import android.annotation.SuppressLint
import android.content.Context
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View

private val HOVER_ACTIONS =
    setOf(MotionEvent.ACTION_HOVER_ENTER, MotionEvent.ACTION_HOVER_MOVE, MotionEvent.ACTION_HOVER_EXIT)

/**
 * A plain View rather than Compose input, so it sees the raw `MotionEvent`s (touch, hover,
 * button press) and, while focused, the `KeyEvent`s a pen button may send instead.
 */
@SuppressLint("ViewConstructor")
class PenEventView(
    context: Context,
    private val onEvent: (PenEvent) -> Unit,
) : View(context) {
    init {
        isFocusable = true
        isFocusableInTouchMode = true
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        requestFocus()
    }

    @SuppressLint("ClickableViewAccessibility") // a diagnostics surface with nothing to click
    override fun onTouchEvent(event: MotionEvent): Boolean {
        reportMotion(event)
        return true
    }

    // Hover and stylus button press/release arrive here, not in onTouchEvent.
    override fun onGenericMotionEvent(event: MotionEvent): Boolean {
        reportMotion(event)
        return true
    }

    override fun onKeyDown(
        keyCode: Int,
        event: KeyEvent,
    ): Boolean = reportKey(event)

    override fun onKeyUp(
        keyCode: Int,
        event: KeyEvent,
    ): Boolean = reportKey(event)

    private fun reportMotion(event: MotionEvent) {
        val index = event.actionIndex
        onEvent(
            PenEvent(
                timeMs = event.eventTime,
                kind = PenEvent.Kind.MOTION,
                action = MotionEvent.actionToString(event.actionMasked),
                toolType = toolTypeName(event.getToolType(index)),
                buttonState = event.buttonState,
                pressure = event.getPressure(index),
                hovering = event.actionMasked in HOVER_ACTIONS,
                keyCode = null,
            ),
        )
    }

    private fun reportKey(event: KeyEvent): Boolean {
        onEvent(
            PenEvent(
                timeMs = event.eventTime,
                kind = PenEvent.Kind.KEY,
                action = if (event.action == KeyEvent.ACTION_DOWN) "ACTION_DOWN" else "ACTION_UP",
                toolType = "-",
                buttonState = 0,
                pressure = 0f,
                hovering = false,
                keyCode = KeyEvent.keyCodeToString(event.keyCode),
            ),
        )
        // Back must still leave the screen; every other key is kept here so nothing else reacts to it.
        return event.keyCode != KeyEvent.KEYCODE_BACK
    }

    private fun toolTypeName(toolType: Int) =
        when (toolType) {
            MotionEvent.TOOL_TYPE_FINGER -> "FINGER"
            MotionEvent.TOOL_TYPE_STYLUS -> "STYLUS"
            MotionEvent.TOOL_TYPE_ERASER -> "ERASER"
            MotionEvent.TOOL_TYPE_MOUSE -> "MOUSE"
            else -> "UNKNOWN($toolType)"
        }
}
