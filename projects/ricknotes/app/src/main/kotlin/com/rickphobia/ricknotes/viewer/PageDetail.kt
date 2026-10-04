package com.rickphobia.ricknotes.viewer

/** A rectangle in whole pixels; [right] and [bottom] are just outside it. */
data class PixelRect(
    val left: Int,
    val top: Int,
    val right: Int,
    val bottom: Int,
) {
    val width: Int get() = right - left
    val height: Int get() = bottom - top

    fun contains(other: PixelRect): Boolean =
        other.left >= left && other.top >= top && other.right <= right && other.bottom <= bottom
}

/** The screen the pages show on, in pixels. */
data class Screen(
    val width: Int,
    val height: Int,
)

/** A page laid out in the zoomed page list: [top] from the screen's top, [left] from the list's left edge. */
data class PlacedPage(
    val top: Int,
    val left: Int,
    val width: Int,
    val height: Int,
) {
    /** The part of the page on screen, in the page's own zoomed pixels, or null if none of it shows. */
    fun visiblePart(
        panX: Int,
        screen: Screen,
    ): PixelRect? {
        val part =
            PixelRect(
                left = (panX - left).coerceAtLeast(0),
                top = (-top).coerceAtLeast(0),
                right = (panX - left + screen.width).coerceAtMost(width),
                bottom = (screen.height - top).coerceAtMost(height),
            )
        return part.takeIf { it.width > 0 && it.height > 0 }
    }
}

/** A page's size at the current zoom, and the width its whole-page image is drawn at. */
data class PageScale(
    val width: Int,
    val height: Int,
    val baseWidth: Int,
)

/** A sharp image of part of a page, drawn for a page [pageWidth] pixels wide. */
data class SharpPart(
    val region: PixelRect,
    val pageWidth: Int,
)

/** What to do about a page's sharp part once the view settles. */
sealed interface DetailPlan {
    /** The current one still covers what shows. */
    data object Keep : DetailPlan

    /** No sharp part is needed: the whole-page image is sharp enough, or the page is off screen. */
    data object Drop : DetailPlan

    data class Render(
        val region: PixelRect,
    ) : DetailPlan
}

/**
 * Decides whether a zoomed page needs a new sharp part. The whole page is only ever drawn at the
 * screen's width (a whole page at 5x would be hundreds of MB), so when zoomed in, the part that
 * shows is drawn again at full resolution with [margin] pixels to spare, so small scrolls stay sharp.
 */
fun planDetail(
    current: SharpPart?,
    visible: PixelRect?,
    page: PageScale,
    margin: Int,
): DetailPlan =
    when {
        visible == null || page.width <= page.baseWidth -> {
            DetailPlan.Drop
        }

        current != null && current.pageWidth == page.width && current.region.contains(visible) -> {
            DetailPlan.Keep
        }

        else -> {
            DetailPlan.Render(
                PixelRect(
                    left = (visible.left - margin).coerceAtLeast(0),
                    top = (visible.top - margin).coerceAtLeast(0),
                    right = (visible.right + margin).coerceAtMost(page.width),
                    bottom = (visible.bottom + margin).coerceAtMost(page.height),
                ),
            )
        }
    }
