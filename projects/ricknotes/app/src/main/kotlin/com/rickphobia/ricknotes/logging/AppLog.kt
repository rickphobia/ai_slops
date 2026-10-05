package com.rickphobia.ricknotes.logging

import android.util.Log
import java.io.File
import java.io.IOException
import java.time.Instant

/**
 * The app's logger. Every line goes to logcat and, once [start] has run, to a rolling file the
 * user can send from Settings. That file leaves the tablet, so log file names, timings and errors
 * only: never stroke data, page images or clipboard text.
 */
object AppLog {
    const val TAG = "RickNotes"

    // Weeks of normal use, and still small enough to attach to a message.
    private const val MAX_FILE_BYTES = 1_000_000L

    @Volatile
    private var file: RollingLogFile? = null

    fun start(dir: File) {
        file = RollingLogFile(dir, MAX_FILE_BYTES)
    }

    fun d(message: String) = write(Log.DEBUG, "D", message, null)

    fun i(message: String) = write(Log.INFO, "I", message, null)

    fun w(
        message: String,
        error: Throwable? = null,
    ) = write(Log.WARN, "W", message, error)

    fun e(
        message: String,
        error: Throwable? = null,
    ) = write(Log.ERROR, "E", message, error)

    /** Writes the whole log to [target], for sharing. */
    fun exportTo(target: File) {
        checkNotNull(file) { "AppLog.start was not called" }.exportTo(target)
    }

    private fun write(
        priority: Int,
        level: String,
        message: String,
        error: Throwable?,
    ) {
        Log.println(priority, TAG, if (error == null) message else "$message\n${Log.getStackTraceString(error)}")
        val cause = error?.let { " (${it.javaClass.simpleName}: ${it.cause?.message ?: it.message})" }.orEmpty()
        try {
            file?.append("${Instant.now()} $level [${Thread.currentThread().name}] $message$cause")
        } catch (e: IOException) {
            // A full disk must not crash the app; logcat still has the line.
            Log.w(TAG, "couldn't write the log file", e)
        } catch (e: IllegalStateException) {
            Log.w(TAG, "couldn't rotate the log file", e)
        }
    }
}
