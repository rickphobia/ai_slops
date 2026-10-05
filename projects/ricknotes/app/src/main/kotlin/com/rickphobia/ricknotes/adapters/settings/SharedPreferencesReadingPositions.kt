package com.rickphobia.ricknotes.adapters.settings

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.core.content.edit
import com.rickphobia.ricknotes.MainActivity
import com.rickphobia.ricknotes.viewer.ReadingPosition
import com.rickphobia.ricknotes.viewer.ReadingPositions
import java.io.File

/**
 * Keeps each Document's last page and zoom in the app's private storage, keyed by the PDF's path,
 * in a file of its own so the settings file stays small and readable.
 */
class SharedPreferencesReadingPositions(
    private val preferences: SharedPreferences,
) : ReadingPositions {
    override fun load(documentPath: String): ReadingPosition? {
        val stored = preferences.getString(documentPath, null) ?: return null
        return ReadingPosition.decode(stored).also {
            if (it == null) {
                Log.w(MainActivity.LOG_TAG, "ignoring unreadable reading position for ${File(documentPath).name}")
            }
        }
    }

    override fun save(
        documentPath: String,
        position: ReadingPosition,
    ) {
        preferences.edit { putString(documentPath, position.encode()) }
    }

    companion object {
        private const val FILE_NAME = "reading_positions"

        fun open(context: Context) =
            SharedPreferencesReadingPositions(context.getSharedPreferences(FILE_NAME, Context.MODE_PRIVATE))
    }
}
