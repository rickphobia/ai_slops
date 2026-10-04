package com.rickphobia.ricknotes.core.settings

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class SettingsLoaderTest {
    @get:Rule
    val temp = TemporaryFolder()

    private fun sourceOf(vararg stored: Pair<String, String>) = SettingsSource { key -> stored.toMap()[key] }

    private fun loadStudyFolder(value: String) = SettingsLoader.load(sourceOf(SettingsLoader.STUDY_FOLDER_KEY to value))

    private fun rejectedStudyFolder(value: String) =
        assertThrows(InvalidSettingException::class.java) { loadStudyFolder(value) }

    @Test
    fun `nothing stored loads with no study folder`() {
        assertNull(SettingsLoader.load(sourceOf()).studyFolder)
    }

    @Test
    fun `stored existing study folder is loaded`() {
        val folder = temp.newFolder("Study").path

        assertEquals(folder, loadStudyFolder(folder).studyFolder)
    }

    @Test
    fun `relative study folder is rejected naming the setting`() {
        val error = rejectedStudyFolder("Study")

        assertEquals(SettingsLoader.STUDY_FOLDER_KEY, error.key)
        assertEquals("is not an absolute path", error.reason)
    }

    @Test
    fun `missing study folder is rejected naming the folder`() {
        val missing = temp.root.resolve("gone").path

        val error = rejectedStudyFolder(missing)

        assertEquals(missing, error.value)
        assertEquals("does not exist", error.reason)
    }

    @Test
    fun `a file instead of a folder is rejected`() {
        assertEquals("is not a folder", rejectedStudyFolder(temp.newFile("notes.pdf").path).reason)
    }

    @Test
    fun `unreadable study folder is rejected`() {
        val folder = temp.newFolder("Locked")
        assertTrue(folder.setReadable(false))
        try {
            assertTrue(rejectedStudyFolder(folder.path).reason.startsWith("can't be read"))
        } finally {
            folder.setReadable(true)
        }
    }

    @Test
    fun `saving a valid study folder writes it`() {
        val folder = temp.newFolder("Study").path
        val saved = mutableMapOf<String, String>()

        SettingsLoader.saveStudyFolder({ key, value -> saved[key] = value }, folder)

        assertEquals(mapOf(SettingsLoader.STUDY_FOLDER_KEY to folder), saved)
    }

    @Test
    fun `saving a missing study folder writes nothing`() {
        val saved = mutableMapOf<String, String>()

        assertThrows(InvalidSettingException::class.java) {
            SettingsLoader.saveStudyFolder({ key, value -> saved[key] = value }, temp.root.resolve("gone").path)
        }
        assertTrue(saved.isEmpty())
    }
}
