package com.rickphobia.ricknotes.adapters.settings

import android.content.Context
import android.content.SharedPreferences
import com.rickphobia.ricknotes.core.settings.SettingsSource

/** Reads settings from the app's private storage. Each app variant has its own file. */
class SharedPreferencesSettingsSource(
    private val preferences: SharedPreferences,
) : SettingsSource {
    override fun read(key: String): String? = preferences.getString(key, null)

    companion object {
        private const val FILE_NAME = "settings"

        fun open(context: Context) =
            SharedPreferencesSettingsSource(context.getSharedPreferences(FILE_NAME, Context.MODE_PRIVATE))
    }
}
