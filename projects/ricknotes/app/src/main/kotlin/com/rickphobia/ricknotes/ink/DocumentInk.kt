package com.rickphobia.ricknotes.ink

import android.graphics.Matrix
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.core.graphics.withMatrix
import androidx.ink.brush.Brush
import androidx.ink.brush.InputToolType
import androidx.ink.brush.StockBrushes
import androidx.ink.rendering.android.canvas.CanvasStrokeRenderer
import androidx.ink.strokes.MutableStrokeInputBatch
import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.PagePoint
import com.rickphobia.ricknotes.core.ink.Stroke
import com.rickphobia.ricknotes.core.ink.StrokeId
import com.rickphobia.ricknotes.core.ink.Tool
import com.rickphobia.ricknotes.core.session.SaveStatus
import com.rickphobia.ricknotes.core.session.SessionWarning
import com.rickphobia.ricknotes.core.session.strokesTouched
import com.rickphobia.ricknotes.logging.AppLog
import java.io.File
import androidx.ink.strokes.Stroke as InkStroke

// The smallest detail a stroke's outline keeps, in PDF points. A page is drawn 4 to 20 px per point
// (1x to 5x), so this is under half a pixel even at 5x.
private const val EPSILON_PT = 0.02f

/** The brush a Stroke of [tool], [colourArgb] and [widthPt] is drawn with, wet or saved. */
internal fun inkBrush(
    tool: Tool,
    colourArgb: Int,
    widthPt: Float,
): Brush {
    val family =
        when (tool) {
            Tool.PEN -> StockBrushes.pressurePen()
            Tool.HIGHLIGHTER -> StockBrushes.highlighter()
        }
    return Brush.createWithColorIntArgb(family, colourArgb, widthPt, EPSILON_PT)
}

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

/**
 * The ink of one open Document: its strokes for drawing, kept in `core`'s Document session, which
 * saves them to the Ink file beside [pdf] and keeps their undo history. [saveStatus] follows the
 * session, so the screen can show "Not saved".
 */
internal class DocumentInk private constructor(
    private val pdf: File,
    private val held: HeldSession,
    loaded: List<DrawnStroke>,
) {
    private val session = held.session
    private val strokes = mutableStateListOf<DrawnStroke>().apply { addAll(loaded) }

    // Strokes the eraser has touched in the gesture still going on: hidden, but not yet erased.
    private val erasing = mutableStateMapOf<StrokeId, Unit>()

    // Counts changes, so Compose reads canUndo and canRedo again after each one.
    private val changes = mutableIntStateOf(0)

    val readOnly: Boolean get() = session.readOnly
    val warnings: List<SessionWarning> get() = session.warnings
    val saveStatus: SaveStatus get() = held.status.current.value
    val canUndo: Boolean get() = changes.intValue.let { session.canUndo }
    val canRedo: Boolean get() = changes.intValue.let { session.canRedo }

    fun add(stroke: DrawnStroke) {
        session.addStroke(stroke.stroke)
        strokes.add(stroke)
        changes.intValue++
    }

    /** Hides the strokes on [pageId] the eraser touches moving from [from] to [to]; [finishErase] erases them. */
    fun eraseAlong(
        pageId: PageId,
        from: PagePoint,
        to: PagePoint,
    ) {
        val visible = strokes.map { it.stroke }.filter { it.id !in erasing }
        strokesTouched(visible, pageId, from, to).forEach { erasing[it.id] = Unit }
    }

    /** Erases what the eraser touched in this gesture, as one undo step. */
    fun finishErase() {
        if (erasing.isEmpty()) return
        val ids = erasing.keys.toSet()
        session.eraseStrokes(ids)
        strokes.removeAll { it.stroke.id in ids }
        erasing.clear()
        changes.intValue++
        AppLog.d("erased ${ids.size} strokes")
    }

    /** Shows again what a cancelled gesture touched. */
    fun cancelErase() = erasing.clear()

    fun undo() {
        if (session.undo()) followSession() else AppLog.w("undo with nothing to undo")
    }

    fun redo() {
        if (session.redo()) followSession() else AppLog.w("redo with nothing to redo")
    }

    /** The page's strokes in drawing order: highlighter first, so it sits under the pen's writing. */
    fun on(pageId: PageId): List<DrawnStroke> =
        strokes
            .filter { it.stroke.pageId == pageId && it.stroke.id !in erasing }
            .sortedBy { it.stroke.tool != Tool.HIGHLIGHTER }

    // Matches the drawn strokes to the session's after an undo or redo, keeping meshes already built.
    private fun followSession() {
        val built = strokes.associateBy { it.stroke.id }
        val now =
            session.strokes.mapNotNull { stroke ->
                built[stroke.id]
                    ?: stroke.toMesh()?.let { DrawnStroke(stroke, it) }
            }
        strokes.clear()
        strokes.addAll(now)
        changes.intValue++
    }

    /** Saves on the save thread without waiting: for when the app goes to the background. */
    fun saveInBackground() = SaveThread.run(session::saveNow)

    /** Saves what is left; the session keeps retrying after this if that save fails. */
    fun close() = InkSessions.close(pdf)

    companion object {
        /** Opens the ink beside [pdf] and builds every stroke's mesh. Slow: call it off the main thread. */
        fun open(
            pdf: File,
            pageCount: Int,
        ): DocumentInk {
            val held = InkSessions.open(pdf, pageCount)
            val strokes = held.session.strokes
            AppLog.i("loaded ${strokes.size} strokes for ${pdf.name}")
            return DocumentInk(
                pdf,
                held,
                strokes.mapNotNull { stroke ->
                    stroke.toMesh()?.let { DrawnStroke(stroke, it) }
                },
            )
        }
    }
}

/**
 * Rebuilds the mesh of a saved Stroke from its points, as Jetpack Ink drew it when it was wet, or
 * null if Ink rejects them: one stroke that can't be drawn must not keep the Document from opening.
 * It stays in the Ink file either way. Ink's native code reports a rejected input as an
 * IllegalArgumentException, IllegalStateException or plain RuntimeException depending on the check,
 * so all of them are caught.
 */
@Suppress("TooGenericExceptionCaught")
private fun Stroke.toMesh(): InkStroke? =
    try {
        val inputs = MutableStrokeInputBatch()
        addTo(inputs)
        InkStroke(inkBrush(tool, colourArgb, widthPt), inputs)
    } catch (e: RuntimeException) {
        AppLog.e("can't draw saved stroke ${id.value} on page ${pageId.value}; it is kept but not shown", e)
        null
    }

private fun Stroke.addTo(inputs: MutableStrokeInputBatch) {
    for (point in inkInputPoints(points)) {
        inputs.add(
            type = InputToolType.STYLUS,
            x = point.x,
            y = point.y,
            elapsedTimeMillis = point.elapsedMs,
            pressure = point.pressure,
        )
    }
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
