package com.rickphobia.ricknotes.viewer

import kotlin.math.roundToInt

/** A PDF page's size in PDF points (1/72 inch), as `PdfRenderer` reports it. */
data class PageSize(
    val widthPt: Int,
    val heightPt: Int,
) {
    val aspectRatio: Float get() = widthPt.toFloat() / heightPt

    /** The height in pixels of this page drawn [widthPx] wide, keeping its shape. */
    fun heightPx(widthPx: Int): Int = (widthPx.toLong() * heightPt / widthPt.toDouble()).roundToInt().coerceAtLeast(1)
}
