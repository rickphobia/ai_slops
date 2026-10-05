package com.rickphobia.ricknotes.core.session

import java.io.FileOutputStream
import java.io.IOException
import java.nio.file.Files
import java.nio.file.NoSuchFileException
import java.nio.file.Path
import java.nio.file.StandardCopyOption

/**
 * Where a Document's Ink file lives, and how it is read and safely replaced. The Ink file is
 * `<pdf name>.ink.json` beside the PDF. A save goes to a hidden temporary file in the same folder
 * first (`.<pdf name>.ink.json.tmp`), is flushed to disk, then renamed over the Ink file in one
 * step, so a crash mid-save leaves the old Ink file whole.
 */
internal class InkFileStore(
    pdf: Path,
) {
    val inkFile: Path = pdf.resolveSibling("${pdf.fileName}$INK_SUFFIX")
    val temporaryFile: Path = pdf.resolveSibling(".${pdf.fileName}$INK_SUFFIX$TEMPORARY_SUFFIX")

    /** The Ink file's text, or null if this Document has none yet. */
    fun read(): String? =
        try {
            Files.readString(inkFile)
        } catch (_: NoSuchFileException) {
            null
        }

    /** @throws IOException if any step fails; the Ink file is then as it was before. */
    fun write(text: String) {
        // A temporary file left by an interrupted save is simply written over.
        FileOutputStream(temporaryFile.toFile()).use { out ->
            out.write(text.toByteArray(Charsets.UTF_8))
            out.fd.sync()
        }
        Files.move(temporaryFile, inkFile, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
    }

    companion object {
        const val INK_SUFFIX = ".ink.json"

        /** Temporary files start with "." and end with this: the pattern the sync app is told to skip. */
        const val TEMPORARY_SUFFIX = ".tmp"
    }
}
