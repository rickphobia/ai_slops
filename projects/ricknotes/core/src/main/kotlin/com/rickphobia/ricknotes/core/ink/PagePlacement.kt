package com.rickphobia.ricknotes.core.ink

/** A position on screen, in pixels from the drawing area's top-left corner. */
data class ScreenPoint(
    val x: Float,
    val y: Float,
)

/** A position on a page, in PDF points from the page's top-left corner. */
data class PagePoint(
    val x: Float,
    val y: Float,
)

/**
 * Where a page is on screen right now: its top-left corner at ([left], [top]) in screen pixels,
 * drawn [pixelsPerPoint] pixels per PDF point. Scrolling moves the corner and zooming changes the
 * scale; a point on the page stays the same.
 */
data class PagePlacement(
    val pageId: PageId,
    val left: Float,
    val top: Float,
    val pixelsPerPoint: Float,
    val widthPt: Float,
    val heightPt: Float,
) {
    init {
        require(pixelsPerPoint > 0f) { "page ${pageId.value} is drawn at $pixelsPerPoint px per point" }
    }

    fun toPage(screen: ScreenPoint): PagePoint =
        PagePoint((screen.x - left) / pixelsPerPoint, (screen.y - top) / pixelsPerPoint)

    fun toScreen(page: PagePoint): ScreenPoint =
        ScreenPoint(left + page.x * pixelsPerPoint, top + page.y * pixelsPerPoint)

    operator fun contains(screen: ScreenPoint): Boolean {
        val page = toPage(screen)
        return page.x in 0f..widthPt && page.y in 0f..heightPt
    }
}

/** The page under [screen], or null if it is in a gap between pages or beside them. */
fun pageAt(
    placements: List<PagePlacement>,
    screen: ScreenPoint,
): PagePlacement? = placements.firstOrNull { screen in it }
