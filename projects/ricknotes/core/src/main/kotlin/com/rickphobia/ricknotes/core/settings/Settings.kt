package com.rickphobia.ricknotes.core.settings

/** The app's settings after loading and validation. A null field means "not chosen yet". */
data class Settings(
    val studyFolder: String?,
)

/** Where stored settings are read from: the app's private storage, or a map in tests. */
fun interface SettingsSource {
    fun read(key: String): String?
}

/** A stored setting that can't be used. [key] names the setting so the app can say which one. */
class InvalidSettingException(
    val key: String,
    reason: String,
) : IllegalArgumentException("Setting '$key' $reason")
