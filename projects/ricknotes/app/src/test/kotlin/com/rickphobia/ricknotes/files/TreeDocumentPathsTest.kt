package com.rickphobia.ricknotes.files

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TreeDocumentPathsTest {
    private val root = "/storage/emulated/0"

    @Test
    fun `primary subfolder becomes a path under the storage root`() {
        assertEquals("/storage/emulated/0/Study/Year 2", TreeDocumentPaths.toPath("primary:Study/Year 2", root))
    }

    @Test
    fun `primary root is the storage root`() {
        assertEquals(root, TreeDocumentPaths.toPath("primary:", root))
    }

    @Test
    fun `other volumes are not supported`() {
        assertNull(TreeDocumentPaths.toPath("1A2B-3C4D:Study", root))
    }

    @Test
    fun `an id without a volume is not supported`() {
        assertNull(TreeDocumentPaths.toPath("raw", root))
    }
}
