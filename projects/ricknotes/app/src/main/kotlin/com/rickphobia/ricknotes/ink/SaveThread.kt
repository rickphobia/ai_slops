package com.rickphobia.ricknotes.ink

import android.util.Log
import com.rickphobia.ricknotes.MainActivity
import com.rickphobia.ricknotes.core.session.Clock
import com.rickphobia.ricknotes.core.session.Scheduled
import java.util.concurrent.ScheduledThreadPoolExecutor
import java.util.concurrent.TimeUnit

/**
 * The [Clock] an open Document's session saves with: wall-clock time, and one background thread
 * that runs every save, so writing to disk never holds up the pen.
 */
internal class SaveThread(
    documentName: String,
) : Clock {
    private val executor =
        ScheduledThreadPoolExecutor(1) { Thread(it, "save-$documentName") }.apply {
            // Once the Document is closed, a waiting retry is dropped rather than kept running.
            executeExistingDelayedTasksAfterShutdownPolicy = false
        }

    override fun nowMs(): Long = System.currentTimeMillis()

    override fun schedule(
        delayMs: Long,
        task: () -> Unit,
    ): Scheduled {
        if (executor.isShutdown) {
            Log.w(MainActivity.LOG_TAG, "not scheduling another save: the Document is closed")
            return Scheduled {}
        }
        val future = executor.schedule(task, delayMs, TimeUnit.MILLISECONDS)
        return Scheduled { future.cancel(false) }
    }

    /** Runs [task] soon; ignored once closed, because closing already ran the last save. */
    fun run(task: () -> Unit) {
        if (executor.isShutdown) return
        executor.execute(task)
    }

    /** Lets work already handed over (such as the closing save) finish, then stops the thread. */
    fun close() {
        executor.shutdown()
    }
}
