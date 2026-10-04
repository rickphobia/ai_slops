package com.rickphobia.ricknotes.files

import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

class PdfListerTest {
    @get:Rule
    val temp = TemporaryFolder()

    private fun touch(relative: String) =
        File(temp.root, relative).apply {
            parentFile.mkdirs()
            writeText("")
        }

    @Test
    fun `lists pdfs in every subfolder sorted by folder then name`() {
        touch("Signals/Week 2.pdf")
        touch("Circuits/b.PDF")
        touch("Circuits/a.pdf")
        touch("top.pdf")

        val listed = PdfLister.list(temp.root).map { it.folder to it.name }

        assertEquals(
            listOf("" to "top.pdf", "Circuits" to "a.pdf", "Circuits" to "b.PDF", "Signals" to "Week 2.pdf"),
            listed,
        )
    }

    @Test
    fun `leaves out ink files and other non-pdf files`() {
        touch("Circuits/a.pdf")
        touch("Circuits/a.pdf.ink")
        touch("Circuits/slides.pptx")
        touch("Circuits/.versions/a.pdf.ink.1")

        assertEquals(listOf("a.pdf"), PdfLister.list(temp.root).map { it.name })
    }

    @Test
    fun `empty folder lists nothing`() {
        assertEquals(emptyList<PdfEntry>(), PdfLister.list(temp.root))
    }
}
