package com.rickphobia.ricknotes

import android.net.Uri
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.rickphobia.ricknotes.core.settings.InvalidSettingException
import com.rickphobia.ricknotes.core.settings.SettingsLoader
import com.rickphobia.ricknotes.core.settings.SettingsSource
import com.rickphobia.ricknotes.core.settings.SettingsStore
import com.rickphobia.ricknotes.diagnostics.PenTestScreen
import com.rickphobia.ricknotes.files.PdfEntry
import com.rickphobia.ricknotes.home.HomeScreen
import com.rickphobia.ricknotes.settings.SettingsScreen
import com.rickphobia.ricknotes.studyfolder.AllFilesAccessScreen
import com.rickphobia.ricknotes.studyfolder.PickFolderScreen
import com.rickphobia.ricknotes.viewer.DocumentScreen

/** Which screen is showing. Without a usable Study folder the app only offers the picker. */
private sealed interface Screen {
    data class PickFolder(
        val problem: String?,
    ) : Screen

    data class Home(
        val studyFolder: String,
    ) : Screen

    data class Settings(
        val studyFolder: String,
    ) : Screen

    data class PenTest(
        val studyFolder: String,
    ) : Screen

    data class Document(
        val studyFolder: String,
        val pdf: PdfEntry,
    ) : Screen
}

private fun problemText(error: InvalidSettingException) = "The Study folder ${error.value} ${error.reason}."

private fun startScreen(source: SettingsSource): Screen =
    try {
        SettingsLoader.load(source).studyFolder?.let { Screen.Home(it) } ?: Screen.PickFolder(problem = null)
    } catch (e: InvalidSettingException) {
        Log.w(MainActivity.LOG_TAG, "stored settings unusable: ${e.message}")
        Screen.PickFolder(problemText(e))
    }

@Composable
fun <S> RickNotesApp(
    versionName: String,
    hasAllFilesAccess: Boolean,
    settings: S,
    openAllFilesAccessSetting: () -> Unit,
    pickedFolderPath: (Uri) -> String?,
) where S : SettingsSource, S : SettingsStore {
    var screen by remember(hasAllFilesAccess) { mutableStateOf(startScreen(settings)) }

    val picker =
        rememberLauncherForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri ->
            if (uri == null) return@rememberLauncherForActivityResult
            val path = pickedFolderPath(uri)
            screen =
                if (path == null) {
                    Log.w(MainActivity.LOG_TAG, "picked folder is not on the tablet's own storage")
                    Screen.PickFolder("Pick a folder on the tablet's own storage, not an SD card or USB drive.")
                } else {
                    try {
                        SettingsLoader.saveStudyFolder(settings, path)
                        Log.i(MainActivity.LOG_TAG, "study folder chosen")
                        Screen.Home(path)
                    } catch (e: InvalidSettingException) {
                        Log.w(MainActivity.LOG_TAG, "picked folder unusable: ${e.message}")
                        Screen.PickFolder(problemText(e))
                    }
                }
        }
    val pickFolder = { picker.launch(null) }

    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            if (!hasAllFilesAccess) {
                AllFilesAccessScreen(onOpenSetting = openAllFilesAccessSetting)
                return@Surface
            }
            when (val current = screen) {
                is Screen.PickFolder -> {
                    PickFolderScreen(problem = current.problem, onPick = pickFolder)
                }

                is Screen.Home -> {
                    HomeScreen(
                        versionName = versionName,
                        studyFolder = current.studyFolder,
                        onOpenSettings = { screen = Screen.Settings(current.studyFolder) },
                        onOpenPdf = { pdf -> screen = Screen.Document(current.studyFolder, pdf) },
                    )
                }

                is Screen.Settings -> {
                    SettingsScreen(
                        studyFolder = current.studyFolder,
                        onChangeFolder = pickFolder,
                        onOpenPenTest = { screen = Screen.PenTest(current.studyFolder) },
                        onBack = { screen = Screen.Home(current.studyFolder) },
                    )
                }

                is Screen.PenTest -> {
                    PenTestScreen(onBack = { screen = Screen.Settings(current.studyFolder) })
                }

                is Screen.Document -> {
                    DocumentScreen(pdf = current.pdf, onBack = { screen = Screen.Home(current.studyFolder) })
                }
            }
        }
    }
}
