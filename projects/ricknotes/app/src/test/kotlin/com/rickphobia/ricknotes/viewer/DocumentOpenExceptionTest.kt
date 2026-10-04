package com.rickphobia.ricknotes.viewer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.FileNotFoundException
import java.io.IOException

class DocumentOpenExceptionTest {
    private val name = "Lecture 3.pdf"

    @Test
    fun `a security exception means the PDF is password-protected`() {
        val error = DocumentOpenException.from(name, SecurityException("password required"))
        assertTrue(error is DocumentOpenException.PasswordProtected)
        assertEquals("Can't open Lecture 3.pdf: it is password-protected.", error.message)
    }

    @Test
    fun `a missing file is reported as missing, not damaged`() {
        val error = DocumentOpenException.from(name, FileNotFoundException("/Study/Lecture 3.pdf"))
        assertTrue(error is DocumentOpenException.Missing)
        assertEquals("Can't open Lecture 3.pdf: it is missing or can't be read.", error.message)
    }

    @Test
    fun `any other read failure means the PDF is damaged`() {
        val cause = IOException("file not in PDF format or corrupted")
        val error = DocumentOpenException.from(name, cause)
        assertTrue(error is DocumentOpenException.Damaged)
        assertEquals("Can't open Lecture 3.pdf: it is damaged or not a PDF.", error.message)
        assertSame(cause, error.cause)
    }
}
