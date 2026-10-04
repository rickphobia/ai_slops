package com.rickphobia.ricknotes.core.settings

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

class SettingsLoaderTest {
    private fun sourceOf(vararg stored: Pair<String, String>) = SettingsSource { key -> stored.toMap()[key] }

    @Test
    fun `nothing stored loads with no study folder`() {
        assertNull(SettingsLoader.load(sourceOf()).studyFolder)
    }

    @Test
    fun `stored absolute study folder is loaded`() {
        val settings = SettingsLoader.load(sourceOf(SettingsLoader.STUDY_FOLDER_KEY to "/storage/emulated/0/Study"))

        assertEquals("/storage/emulated/0/Study", settings.studyFolder)
    }

    @Test
    fun `relative study folder is rejected naming the setting`() {
        val error =
            assertThrows(InvalidSettingException::class.java) {
                SettingsLoader.load(sourceOf(SettingsLoader.STUDY_FOLDER_KEY to "Study"))
            }

        assertEquals(SettingsLoader.STUDY_FOLDER_KEY, error.key)
    }
}
