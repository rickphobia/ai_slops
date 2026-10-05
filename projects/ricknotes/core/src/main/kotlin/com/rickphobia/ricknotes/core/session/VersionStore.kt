package com.rickphobia.ricknotes.core.session

import java.io.IOException
import java.nio.file.Files
import java.nio.file.NoSuchFileException
import java.nio.file.Path

/** A Version that couldn't be taken. The Ink file and the session carry on as before. */
class VersionFailed(
    val fileName: String,
    cause: Exception,
) : Exception("couldn't take a Version of $fileName: ${cause.message}", cause)

/**
 * A Document's Versions: copies of its Ink file in the hidden [FOLDER] beside it, named
 * `<ink file name>.<time in ms>.version`. Only the newest [KEEP] are kept.
 */
internal class VersionStore(
    private val inkFile: Path,
) {
    private val folder: Path = inkFile.resolveSibling(FOLDER)
    private val prefix = "${inkFile.fileName}."

    /**
     * Copies the Ink file as it is now into a Version taken at [nowMs], then drops the oldest beyond
     * [KEEP]. Does nothing if there is no Ink file.
     *
     * @throws IOException if the copy or the clean-up fails.
     */
    fun take(nowMs: Long) {
        val bytes =
            try {
                Files.readAllBytes(inkFile)
            } catch (_: NoSuchFileException) {
                return
            }
        Files.createDirectories(folder)
        writeSafely(folder.resolve("$prefix$nowMs$SUFFIX"), bytes)
        dropOldest()
    }

    private fun dropOldest() {
        val ours =
            Files.list(folder).use { files ->
                // Not Stream.toList(): Android only has it from API 34, and core sticks to API 26.
                files
                    .iterator()
                    .asSequence()
                    .mapNotNull { file -> takenAtMs(file.fileName.toString())?.let { it to file } }
                    .toList()
            }
        ours.sortedByDescending { it.first }.drop(KEEP).forEach { Files.deleteIfExists(it.second) }
    }

    // Null for anything that isn't one of this Document's Versions, such as another Document's.
    private fun takenAtMs(name: String): Long? =
        name
            .takeIf { it.startsWith(prefix) && it.endsWith(SUFFIX) }
            ?.substring(prefix.length, name.length - SUFFIX.length)
            ?.toLongOrNull()

    companion object {
        /** The hidden folder beside the Documents that holds their Versions; the sync app skips it. */
        const val FOLDER = ".versions"
        const val SUFFIX = ".version"

        /** Versions kept per Document: enough to go back hours without filling the tablet. */
        const val KEEP = 10
    }
}
