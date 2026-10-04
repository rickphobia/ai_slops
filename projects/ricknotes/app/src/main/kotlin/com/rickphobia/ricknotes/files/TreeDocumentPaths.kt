package com.rickphobia.ricknotes.files

/**
 * Turns the folder the system picker returns into a normal file path. The app works with paths
 * (decision 0002), but Android's only folder picker returns a tree document ID such as
 * "primary:Study/Year 2". Only the tablet's own storage is supported: an SD card or USB drive
 * returns null so the caller can say so.
 */
object TreeDocumentPaths {
    private const val PRIMARY_VOLUME = "primary"

    fun toPath(
        treeDocumentId: String,
        primaryStorageRoot: String,
    ): String? {
        val volume = treeDocumentId.substringBefore(':')
        if (volume != PRIMARY_VOLUME || !treeDocumentId.contains(':')) return null
        val relative = treeDocumentId.substringAfter(':').trim('/')
        return if (relative.isEmpty()) primaryStorageRoot else "${primaryStorageRoot.trimEnd('/')}/$relative"
    }
}
