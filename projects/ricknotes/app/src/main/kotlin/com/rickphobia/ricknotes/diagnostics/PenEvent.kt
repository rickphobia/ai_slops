package com.rickphobia.ricknotes.diagnostics

import android.view.MotionEvent
import java.util.Locale

/** One stylus event as the pen test screen shows it, already turned into plain names. */
data class PenEvent(
    val timeMs: Long,
    val kind: Kind,
    val action: String,
    val toolType: String,
    val buttonState: Int,
    val pressure: Float,
    val hovering: Boolean,
    val keyCode: String?,
) {
    enum class Kind { MOTION, KEY }

    fun describe(): String =
        buildString {
            append("$timeMs $kind $action tool=$toolType buttons=${buttonNames(buttonState)}")
            append(" pressure=${String.format(Locale.ROOT, "%.2f", pressure)}")
            append(" hover=${if (hovering) "yes" else "no"}")
            keyCode?.let { append(" key=$it") }
        }
}

private val NAMED_BUTTONS =
    listOf(
        MotionEvent.BUTTON_PRIMARY to "PRIMARY",
        MotionEvent.BUTTON_SECONDARY to "SECONDARY",
        MotionEvent.BUTTON_TERTIARY to "TERTIARY",
        MotionEvent.BUTTON_BACK to "BACK",
        MotionEvent.BUTTON_FORWARD to "FORWARD",
        MotionEvent.BUTTON_STYLUS_PRIMARY to "STYLUS_PRIMARY",
        MotionEvent.BUTTON_STYLUS_SECONDARY to "STYLUS_SECONDARY",
    )

/** Names every bit of a `MotionEvent` button state; bits Android doesn't name are shown in hex so none go unseen. */
fun buttonNames(buttonState: Int): String {
    if (buttonState == 0) return "none"
    val named = NAMED_BUTTONS.filter { (bit, _) -> buttonState and bit != 0 }.map { it.second }
    val unnamed = NAMED_BUTTONS.fold(buttonState) { rest, (bit, _) -> rest and bit.inv() }
    val hex = if (unnamed != 0) listOf("0x${Integer.toHexString(unnamed)}") else emptyList()
    return (named + hex).joinToString(" ")
}

/** The events seen so far, newest first, keeping at most [capacity]. */
class PenEventLog(
    private val capacity: Int,
    val events: List<PenEvent> = emptyList(),
) {
    fun add(event: PenEvent) = PenEventLog(capacity, (listOf(event) + events).take(capacity))
}
