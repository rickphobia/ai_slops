package com.rickphobia.ricknotes.core.inkfile

import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.Stroke

/** One page of a Document as its Ink file lists it. Inserted pages (milestone 3) will add a background. */
data class InkPage(
    val id: PageId,
)

/**
 * Everything an Ink file holds: the PDF's page count when it was saved, the page list, and the
 * strokes. The PDF itself is never written to (decision 0003).
 */
data class InkFile(
    val pdfPageCount: Int,
    val pages: List<InkPage>,
    val strokes: List<Stroke>,
) {
    companion object {
        /** A Document nobody has written on yet: one page per PDF page and no strokes. */
        fun empty(pdfPageCount: Int): InkFile = InkFile(pdfPageCount, pdfPages(pdfPageCount), emptyList())

        fun pdfPages(count: Int): List<InkPage> = List(count) { InkPage(PageId.ofPdfPage(it)) }
    }
}

/** An Ink file that can't be read: never overwritten, so the Document opens read-only. */
class InkFileDamaged(
    val fileName: String,
    val reason: String,
    cause: Throwable? = null,
) : Exception("$fileName can't be read ($reason)", cause)
