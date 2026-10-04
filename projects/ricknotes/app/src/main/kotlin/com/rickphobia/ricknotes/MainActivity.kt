package com.rickphobia.ricknotes

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.rickphobia.ricknotes.adapters.settings.SharedPreferencesSettingsSource
import com.rickphobia.ricknotes.core.settings.SettingsLoader
import com.rickphobia.ricknotes.home.HomeScreen

/** Wires the pieces together; the rules live in `core`. */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val settings = SettingsLoader.load(SharedPreferencesSettingsSource.open(this))
        Log.i(LOG_TAG, "started ${BuildConfig.VERSION_NAME}; study folder chosen: ${settings.studyFolder != null}")

        enableEdgeToEdge()
        setContent { HomeScreen(versionName = BuildConfig.VERSION_NAME) }
    }

    private companion object {
        const val LOG_TAG = "RickNotes"
    }
}
