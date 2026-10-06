package com.rickphobia.ricknotes.core.session

/**
 * The time, and a way to run something later. The app's clock runs tasks on a background thread;
 * tests use a fake one they move forward by hand.
 */
interface Clock {
    fun nowMs(): Long

    /** Runs [task] once, [delayMs] from now, unless the returned handle is cancelled first. */
    fun schedule(
        delayMs: Long,
        task: () -> Unit,
    ): Scheduled
}

fun interface Scheduled {
    fun cancel()
}
