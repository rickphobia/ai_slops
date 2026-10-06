package com.rickphobia.ricknotes.core.ink

/** A Stroke's ID: made once when it is drawn and never changed, so other records can point at it. */
@JvmInline
value class StrokeId(
    val value: String,
)

/**
 * A page's ID. A PDF's own pages are `pdf-<number>`: the PDF is never changed, so its page N stays
 * page N. Inserted pages (milestone 3) will get IDs of their own, so inserting one renumbers nothing.
 */
@JvmInline
value class PageId(
    val value: String,
) {
    companion object {
        fun ofPdfPage(index: Int): PageId = PageId("pdf-${index + 1}")
    }
}

enum class Tool { PEN, HIGHLIGHTER }

/**
 * One sampled position of the pen, in PDF points (1/72 inch) from the page's top-left corner, so it
 * lines up at any zoom or screen size. [pressure] runs from 0 to 1; [elapsedMs] counts from the
 * Stroke's first point.
 */
data class StrokePoint(
    val x: Float,
    val y: Float,
    val pressure: Float,
    val elapsedMs: Long,
) {
    init {
        require(pressure in 0f..1f) { "pressure must be between 0 and 1, was $pressure" }
        require(elapsedMs >= 0) { "a point can't come before its stroke started, was $elapsedMs ms" }
    }
}

/** One continuous line from pen down to pen up, on one page. [drawnAtMs] is wall-clock epoch time. */
data class Stroke(
    val id: StrokeId,
    val pageId: PageId,
    val tool: Tool,
    val colourArgb: Int,
    val widthPt: Float,
    val drawnAtMs: Long,
    val points: List<StrokePoint>,
) {
    init {
        require(points.isNotEmpty()) { "stroke ${id.value} has no points" }
        require(widthPt > 0f) { "stroke ${id.value} has width $widthPt" }
    }
}
