package com.rickphobia.ricknotes.core.inkfile

import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.Stroke
import com.rickphobia.ricknotes.core.ink.StrokeId
import com.rickphobia.ricknotes.core.ink.Tool
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json

/** Turns an [InkFile] into the JSON text saved beside the PDF, and back. */
object InkFileCodec {
    /** Raised whenever the layout below changes in a way an older app couldn't read. */
    const val FORMAT_VERSION = 1

    private val json =
        Json {
            prettyPrint = true
            // A newer app may add fields; the format version decides whether we can still read it.
            ignoreUnknownKeys = true
        }

    fun encode(file: InkFile): String =
        json.encodeToString(
            InkFileJson.serializer(),
            InkFileJson(
                formatVersion = FORMAT_VERSION,
                pdfPageCount = file.pdfPageCount,
                pages = file.pages.map { PageJson(it.id.value) },
                strokes = file.strokes.map { it.toJson() },
            ),
        )

    /** @throws InkFileDamaged if [text] isn't an Ink file this version of the app can read. */
    fun decode(
        text: String,
        fileName: String,
    ): InkFile =
        try {
            json.decodeFromString(InkFileJson.serializer(), text).toInkFile()
        } catch (e: SerializationException) {
            throw InkFileDamaged(fileName, "not valid Ink file JSON", e)
        } catch (e: IllegalArgumentException) {
            throw InkFileDamaged(fileName, e.message.orEmpty(), e)
        }

    private fun InkFileJson.toInkFile(): InkFile {
        require(formatVersion <= FORMAT_VERSION) { "format version $formatVersion is newer than this app reads" }
        val inkPages = pages.map { InkPage(PageId(it.id)) }
        val pageIds = inkPages.map { it.id }.toSet()
        val inkStrokes =
            strokes.map { stroke ->
                try {
                    stroke.toStroke().also {
                        require(it.pageId in pageIds) { "page ${stroke.page} is not in the page list" }
                    }
                } catch (e: IllegalArgumentException) {
                    throw IllegalArgumentException("stroke ${stroke.id}: ${e.message}", e)
                }
            }
        return InkFile(pdfPageCount, inkPages, inkStrokes)
    }

    private fun Stroke.toJson() =
        StrokeJson(
            id = id.value,
            page = pageId.value,
            tool = tool.name.lowercase(),
            colour = "#%08X".format(colourArgb),
            widthPt = widthPt,
            drawnAtMs = drawnAtMs,
            points = PointPacking.pack(points),
        )

    private fun StrokeJson.toStroke(): Stroke {
        val toolValue = Tool.entries.firstOrNull { it.name.lowercase() == tool }
        requireNotNull(toolValue) { "unknown tool \"$tool\"" }
        require(colour.matches(COLOUR)) { "colour \"$colour\" is not #AARRGGBB" }
        return Stroke(
            id = StrokeId(id),
            pageId = PageId(page),
            tool = toolValue,
            colourArgb = colour.substring(1).toLong(HEX).toInt(),
            widthPt = widthPt,
            drawnAtMs = drawnAtMs,
            points = PointPacking.unpack(points),
        )
    }

    private val COLOUR = Regex("#[0-9A-Fa-f]{8}")
    private const val HEX = 16
}

@Serializable
private data class InkFileJson(
    val formatVersion: Int,
    val pdfPageCount: Int,
    val pages: List<PageJson>,
    val strokes: List<StrokeJson>,
)

@Serializable
private data class PageJson(
    val id: String,
)

@Serializable
private data class StrokeJson(
    val id: String,
    val page: String,
    val tool: String,
    val colour: String,
    val widthPt: Float,
    val drawnAtMs: Long,
    val points: String,
)
