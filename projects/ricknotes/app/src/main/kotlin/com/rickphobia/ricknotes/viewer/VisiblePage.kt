package com.rickphobia.ricknotes.viewer

import kotlin.math.abs

/** A page the list has laid out: [top] is its distance from the screen's top, in pixels. */
data class VisiblePage(
    val index: Int,
    val top: Int,
    val height: Int,
)

/** The page across the middle of the screen (or nearest it, if the middle is a gap), or null if none is laid out. */
fun currentPage(
    visible: List<VisiblePage>,
    viewportHeight: Int,
): Int? {
    val middle = viewportHeight / 2
    return visible
        .minByOrNull { page ->
            when {
                middle < page.top -> page.top - middle
                middle >= page.top + page.height -> abs(middle - (page.top + page.height))
                else -> 0
            }
        }?.index
}

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
