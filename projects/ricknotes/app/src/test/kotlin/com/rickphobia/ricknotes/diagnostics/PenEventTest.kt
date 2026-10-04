package com.rickphobia.ricknotes.diagnostics

import android.view.MotionEvent
import org.junit.Assert.assertEquals
import org.junit.Test

class PenEventTest {
    private fun event(
        kind: PenEvent.Kind = PenEvent.Kind.MOTION,
        action: String = "ACTION_HOVER_MOVE",
        buttonState: Int = 0,
        keyCode: String? = null,
    ) = PenEvent(
        timeMs = 1_234,
        kind = kind,
        action = action,
        toolType = "STYLUS",
        buttonState = buttonState,
        pressure = 0.5f,
        hovering = true,
        keyCode = keyCode,
    )

    @Test
    fun `a hover with the stylus side button held names the button`() {
        assertEquals(
            "1234 MOTION ACTION_HOVER_MOVE tool=STYLUS buttons=STYLUS_PRIMARY pressure=0.50 hover=yes",
            event(buttonState = MotionEvent.BUTTON_STYLUS_PRIMARY).describe(),
        )
    }

    @Test
    fun `several buttons and an unnamed bit are all listed`() {
        assertEquals(
            "PRIMARY STYLUS_SECONDARY 0x1000",
            buttonNames(MotionEvent.BUTTON_PRIMARY or MotionEvent.BUTTON_STYLUS_SECONDARY or 0x1000),
        )
    }

    @Test
    fun `no buttons held reads none`() {
        assertEquals("none", buttonNames(0))
    }

    @Test
    fun `a key event shows its key code`() {
        assertEquals(
            "1234 KEY ACTION_DOWN tool=STYLUS buttons=none pressure=0.50 hover=yes key=KEYCODE_STYLUS_BUTTON_PRIMARY",
            event(
                kind = PenEvent.Kind.KEY,
                action = "ACTION_DOWN",
                keyCode = "KEYCODE_STYLUS_BUTTON_PRIMARY",
            ).describe(),
        )
    }
}
