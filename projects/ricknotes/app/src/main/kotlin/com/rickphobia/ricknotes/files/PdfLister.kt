package com.rickphobia.ricknotes.files

import java.io.File

/** A PDF in the Study folder. [folder] is its folder relative to the Study folder ("" at the top). */
data class PdfEntry(
    val path: String,
    val folder: String,
    val name: String,
)

/**
 * Lists every PDF under the Study folder, subfolders included, sorted by folder then name.
 * Ink files, Versions and anything else that isn't a PDF are left out. A flat list stands in
 * for the folder tree until milestone 3.
 */
object PdfLister {
    fun list(studyFolder: File): List<PdfEntry> =
        studyFolder
            .walkTopDown()
            .filter { it.isFile && it.extension.equals("pdf", ignoreCase = true) }
            .map { file ->
                PdfEntry(
                    path = file.path,
                    folder =
                        file.parentFile
                            ?.relativeTo(studyFolder)
                            ?.invariantSeparatorsPath
                            .orEmpty(),
                    name = file.name,
                )
            }.sortedWith(
                compareBy(
                    String.CASE_INSENSITIVE_ORDER,
                    PdfEntry::folder,
                ).thenBy(String.CASE_INSENSITIVE_ORDER, PdfEntry::name),
            ).toList()
}
