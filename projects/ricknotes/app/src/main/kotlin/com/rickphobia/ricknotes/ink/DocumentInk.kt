package com.rickphobia.ricknotes.ink

import android.graphics.Matrix
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.core.graphics.withMatrix
import androidx.ink.rendering.android.canvas.CanvasStrokeRenderer
import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.Stroke
import androidx.ink.strokes.Stroke as InkStroke

/**
 * A finished Stroke, with the mesh Jetpack Ink built for it so it isn't rebuilt every frame.
 * [onFirstDraw] runs once, after its page has drawn it for the first time.
 */
internal class DrawnStroke(
    val stroke: Stroke,
    val mesh: InkStroke,
    private var onFirstDraw: (() -> Unit)? = null,
) {
    fun drawn() {
        val firstDraw = onFirstDraw ?: return
        onFirstDraw = null
        firstDraw()
    }
}

/** The strokes of one open Document. In memory only until saving arrives (ticket 09). */
internal class DocumentInk {
    private val strokes = mutableStateListOf<DrawnStroke>()

    fun add(stroke: DrawnStroke) {
        strokes.add(stroke)
    }

    fun on(pageId: PageId): List<DrawnStroke> = strokes.filter { it.stroke.pageId == pageId }
}

/**
 * Draws a page's finished strokes over it. Strokes are in PDF points, so scaling them by the page's
 * drawn width keeps them on the same spot of the page at any zoom. Ink past the page's edge is cut
 * off, as it will be in an exported PDF.
 */
@Composable
internal fun PageInk(
    strokes: List<DrawnStroke>,
    pageWidthPt: Float,
    renderer: CanvasStrokeRenderer,
) {
    if (strokes.isEmpty()) return
    Canvas(modifier = Modifier.fillMaxSize().clipToBounds()) {
        val pixelsPerPoint = size.width / pageWidthPt
        val pageToBox = Matrix().apply { setScale(pixelsPerPoint, pixelsPerPoint) }
        drawIntoCanvas { canvas ->
            val native = canvas.nativeCanvas
            // The renderer uses the transform to pick its detail but leaves applying it to us.
            native.withMatrix(pageToBox) {
                strokes.forEach {
                    renderer.draw(native, it.mesh, pageToBox)
                    it.drawn()
                }
            }
        }
    }
}
