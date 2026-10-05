package com.rickphobia.ricknotes

import android.content.Intent
import android.os.Bundle
import android.os.Environment
import android.provider.DocumentsContract
import android.provider.Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.mutableStateOf
import androidx.core.net.toUri
import com.rickphobia.ricknotes.adapters.settings.SharedPreferencesReadingPositions
import com.rickphobia.ricknotes.adapters.settings.SharedPreferencesSettingsSource
import com.rickphobia.ricknotes.files.TreeDocumentPaths

/** Wires the pieces together; the rules live in `core`. */
class MainActivity : ComponentActivity() {
    // Re-read on every resume: the user grants "All files access" in the system's settings
    // screen and comes back with Back, which only resumes this activity.
    private val hasAllFilesAccess = mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.i(LOG_TAG, "started ${BuildConfig.VERSION_NAME}")
        val storage =
            AppStorage(
                settings = SharedPreferencesSettingsSource.open(this),
                readingPositions = SharedPreferencesReadingPositions.open(this),
            )

        enableEdgeToEdge()
        setContent {
            RickNotesApp(
                versionName = BuildConfig.VERSION_NAME,
                hasAllFilesAccess = hasAllFilesAccess.value,
                storage = storage,
                openAllFilesAccessSetting = ::openAllFilesAccessSetting,
                pickedFolderPath = ::pickedFolderPath,
            )
        }
    }

    override fun onResume() {
        super.onResume()
        hasAllFilesAccess.value = Environment.isExternalStorageManager()
        Log.i(LOG_TAG, "all files access granted: ${hasAllFilesAccess.value}")
    }

    private fun openAllFilesAccessSetting() {
        startActivity(Intent(ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, "package:$packageName".toUri()))
    }

    private fun pickedFolderPath(treeUri: android.net.Uri): String? =
        TreeDocumentPaths.toPath(
            treeDocumentId = DocumentsContract.getTreeDocumentId(treeUri),
            primaryStorageRoot = Environment.getExternalStorageDirectory().path,
        )

    companion object {
        const val LOG_TAG = "RickNotes"
    }
}
