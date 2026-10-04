package com.rickphobia.ricknotes.core.settings

import java.nio.file.Files
import java.nio.file.InvalidPathException
import java.nio.file.Path

/** The one place settings are read, validated and saved. */
object SettingsLoader {
    const val STUDY_FOLDER_KEY = "study_folder"

    /** @throws InvalidSettingException if a stored value can't be used. */
    fun load(source: SettingsSource): Settings =
        Settings(
            studyFolder = source.read(STUDY_FOLDER_KEY)?.let(::validateStudyFolder),
        )

    /** Validates [path] and saves it as the Study folder. @throws InvalidSettingException if it can't be used. */
    fun saveStudyFolder(
        store: SettingsStore,
        path: String,
    ) {
        store.write(STUDY_FOLDER_KEY, validateStudyFolder(path))
    }

    // Checked on every start too: the folder can be renamed, deleted or lose its permission
    // between runs, and the app should say so rather than show an empty list.
    private fun validateStudyFolder(value: String): String {
        val path =
            try {
                Path.of(value)
            } catch (e: InvalidPathException) {
                throw invalidStudyFolder(value, "is not a valid path").apply { initCause(e) }
            }
        val problem =
            when {
                !path.isAbsolute -> "is not an absolute path"
                !Files.exists(path) -> "does not exist"
                !Files.isDirectory(path) -> "is not a folder"
                !Files.isReadable(path) -> "can't be read (is \"All files access\" still granted?)"
                else -> null
            }
        if (problem != null) throw invalidStudyFolder(value, problem)
        return value
    }

    private fun invalidStudyFolder(
        value: String,
        reason: String,
    ) = InvalidSettingException(STUDY_FOLDER_KEY, value, reason)
}
