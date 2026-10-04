package com.rickphobia.ricknotes.core.settings

import java.nio.file.InvalidPathException
import java.nio.file.Path

/** The one place stored settings are read and validated, once at startup. */
object SettingsLoader {
    const val STUDY_FOLDER_KEY = "study_folder"

    /** @throws InvalidSettingException if a stored value can't be used. */
    fun load(source: SettingsSource): Settings =
        Settings(
            studyFolder = source.read(STUDY_FOLDER_KEY)?.let(::validateStudyFolder),
        )

    // A path the app saved itself is always absolute; anything else means the stored value is damaged.
    private fun validateStudyFolder(value: String): String {
        val isAbsolute =
            try {
                Path.of(value).isAbsolute
            } catch (e: InvalidPathException) {
                throw InvalidSettingException(STUDY_FOLDER_KEY, "is not a valid path: '$value'").apply { initCause(e) }
            }
        if (!isAbsolute) throw InvalidSettingException(STUDY_FOLDER_KEY, "must be an absolute path, got '$value'")
        return value
    }
}
