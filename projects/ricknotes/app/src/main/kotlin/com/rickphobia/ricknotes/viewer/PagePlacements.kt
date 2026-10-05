package com.rickphobia.ricknotes.viewer

import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.PagePlacement

/**
 * Where each page on screen is right now, for turning pen positions into page points. Pages sit
 * [gapPx] in from the zoomed list's left edge, and the list is slid [ZoomView.panX] to the left.
 */
internal fun pagePlacements(
    visible: List<VisiblePage>,
    pageSizes: List<PageSize>,
    pageWidthPx: Int,
    gapPx: Int,
    view: ZoomView,
): List<PagePlacement> =
    visible.map { page ->
        val size = pageSizes[page.index]
        PagePlacement(
            pageId = PageId.ofPdfPage(page.index),
            left = gapPx - view.panX,
            top = page.top.toFloat(),
            pixelsPerPoint = pageWidthPx.toFloat() / size.widthPt,
            widthPt = size.widthPt.toFloat(),
            heightPt = size.heightPt.toFloat(),
        )
    }
