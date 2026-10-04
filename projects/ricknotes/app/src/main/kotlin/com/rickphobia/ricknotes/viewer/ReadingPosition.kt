package com.rickphobia.ricknotes.viewer

/** Where the student left a Document: the page across the middle of the screen, and the zoom. */
data class ReadingPosition(
    val pageIndex: Int,
    val zoom: Float,
) {
    fun encode(): String = "$pageIndex$SEPARATOR$zoom"

    /** This position made valid for a PDF of [pageCount] pages, which may have changed since it was saved. */
    fun fitTo(pageCount: Int): ReadingPosition =
        ReadingPosition(pageIndex.coerceIn(0, pageCount - 1), ZoomLimits.clamp(zoom))

    companion object {
        private const val SEPARATOR = ';'

        /** The position [encode] wrote, or null if [text] isn't one. */
        fun decode(text: String): ReadingPosition? {
            val parts = text.split(SEPARATOR)
            val page = parts.getOrNull(0)?.toIntOrNull()?.takeIf { it >= 0 }
            val zoom = parts.getOrNull(1)?.toFloatOrNull()
            return if (parts.size == 2 && page != null && zoom != null) ReadingPosition(page, zoom) else null
        }
    }
}

/** Where each Document's [ReadingPosition] is kept between opens, keyed by the PDF's path. */
interface ReadingPositions {
    fun load(documentPath: String): ReadingPosition?

    fun save(
        documentPath: String,
        position: ReadingPosition,
    )
}
