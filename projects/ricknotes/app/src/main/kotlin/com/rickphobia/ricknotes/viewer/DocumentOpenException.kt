package com.rickphobia.ricknotes.viewer

import java.io.FileNotFoundException

/**
 * A Document that can't be opened. [fileName] names the PDF and [reason] says why in words the
 * app can show, so the student knows it's the file and not the app.
 */
sealed class DocumentOpenException(
    val fileName: String,
    val reason: String,
    cause: Throwable?,
) : Exception("Can't open $fileName: it is $reason.", cause) {
    class Missing(
        fileName: String,
        cause: Throwable?,
    ) : DocumentOpenException(fileName, "missing or can't be read", cause)

    class PasswordProtected(
        fileName: String,
        cause: Throwable?,
    ) : DocumentOpenException(fileName, "password-protected", cause)

    class Damaged(
        fileName: String,
        cause: Throwable?,
    ) : DocumentOpenException(fileName, "damaged or not a PDF", cause)

    companion object {
        /**
         * Names what went wrong from what opening the PDF threw: `PdfRenderer` throws a
         * `SecurityException` for a password and an `IOException` for a file it can't parse.
         */
        fun from(
            fileName: String,
            cause: Exception,
        ): DocumentOpenException =
            when (cause) {
                is SecurityException -> PasswordProtected(fileName, cause)
                is FileNotFoundException -> Missing(fileName, cause)
                else -> Damaged(fileName, cause)
            }
    }
}

/** One page of an open Document that `PdfRenderer` couldn't draw. The rest still show. */
class PageRenderException(
    fileName: String,
    pageIndex: Int,
    cause: Throwable,
) : Exception("Can't draw page ${pageIndex + 1} of $fileName", cause)
