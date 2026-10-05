package com.rickphobia.ricknotes.ink

/**
 * When a finished stroke leaves Jetpack Ink's wet layer: only once its page has drawn it, or when
 * its time is up if the page never does (it scrolled away first).
 *
 * Ink's own advice is to remove a stroke in the same UI-thread turn as handing it over, but the
 * page draws it a frame later, so for a frame it showed nowhere: the flicker on pen up. Waiting for
 * the page's draw swaps that gap for a frame drawn twice, which opaque ink doesn't show.
 */
internal class WetInkHandoff<Id>(
    private val removeFromWetLayer: (Set<Id>) -> Unit,
) {
    private val waiting = mutableSetOf<Id>()

    fun handedOff(id: Id) {
        waiting += id
    }

    fun drawnByPage(id: Id) = release(id)

    fun timedOut(id: Id) = release(id)

    private fun release(id: Id) {
        if (waiting.remove(id)) removeFromWetLayer(setOf(id))
    }
}
