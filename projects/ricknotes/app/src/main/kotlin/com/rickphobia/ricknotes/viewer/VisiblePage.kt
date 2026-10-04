package com.rickphobia.ricknotes.viewer

/** A page the list has laid out: [top] is its distance from the screen's top, in pixels. */
data class VisiblePage(
    val index: Int,
    val top: Int,
    val height: Int,
)

/**
 * The page filling most of the screen, the earlier one on a tie, or null if none is laid out. A page
 * a jump or reopen puts at the top of the screen is therefore the current page, so saving the
 * current page and reopening there never drifts to the next one.
 */
fun currentPage(
    visible: List<VisiblePage>,
    viewportHeight: Int,
): Int? =
    visible
        .sortedBy { it.index }
        .maxByOrNull { page ->
            (minOf(page.top + page.height, viewportHeight) - maxOf(page.top, 0)).coerceAtLeast(0)
        }?.index

/** The page index for a page number typed by the student, or null if no such page exists. */
fun pageIndexFromNumber(
    typed: String,
    pageCount: Int,
): Int? =
    typed
        .trim()
        .toIntOrNull()
        ?.takeIf { it in 1..pageCount }
        ?.minus(1)
