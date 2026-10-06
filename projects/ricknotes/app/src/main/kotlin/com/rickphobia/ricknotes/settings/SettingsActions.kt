package com.rickphobia.ricknotes.settings

/** What the Settings screen's buttons do. */
class SettingsActions(
    val changeFolder: () -> Unit,
    val openPenTest: () -> Unit,
    val shareLog: () -> Unit,
    val back: () -> Unit,
)
