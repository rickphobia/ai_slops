package com.rickphobia.ricknotes.ink

import com.rickphobia.ricknotes.core.session.Clock
import com.rickphobia.ricknotes.core.session.Scheduled
import com.rickphobia.ricknotes.logging.AppLog
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * The [Clock] Document sessions save with: wall-clock time, and one background thread for the
 * whole app that runs every save and retry, so disk work never holds up the pen and a retry can
 * outlive its screen. It lives as long as the app.
 */
internal object SaveThread : Clock {
    private val executor = Executors.newSingleThreadScheduledExecutor { Thread(it, "ink-save") }

    override fun nowMs(): Long = System.currentTimeMillis()

    override fun schedule(
        delayMs: Long,
        task: () -> Unit,
    ): Scheduled {
        val future = executor.schedule(logged(task), delayMs, TimeUnit.MILLISECONDS)
        return Scheduled { future.cancel(false) }
    }

    fun run(task: () -> Unit) {
        executor.execute(logged(task))
    }

    // An executor keeps a task's exception to itself; a bug in saving must reach the log. Any
    // exception is logged and rethrown, never swallowed.
    @Suppress("TooGenericExceptionCaught")
    private fun logged(task: () -> Unit): Runnable =
        Runnable {
            try {
                task()
            } catch (e: RuntimeException) {
                AppLog.e("ink save thread task failed", e)
                throw e
            }
        }
}
