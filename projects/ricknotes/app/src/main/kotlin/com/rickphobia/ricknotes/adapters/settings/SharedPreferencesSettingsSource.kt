package com.rickphobia.ricknotes.adapters.settings

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import com.rickphobia.ricknotes.core.settings.SettingsSource
import com.rickphobia.ricknotes.core.settings.SettingsStore

/** Reads and writes settings in the app's private storage. Each app variant has its own file. */
class SharedPreferencesSettingsSource(
    private val preferences: SharedPreferences,
) : SettingsSource,
    SettingsStore {
    override fun read(key: String): String? = preferences.getString(key, null)

    override fun write(
        key: String,
        value: String,
    ) {
        preferences.edit { putString(key, value) }
    }

    companion object {
        private const val FILE_NAME = "settings"

        fun open(context: Context) =
            SharedPreferencesSettingsSource(context.getSharedPreferences(FILE_NAME, Context.MODE_PRIVATE))
    }
}
