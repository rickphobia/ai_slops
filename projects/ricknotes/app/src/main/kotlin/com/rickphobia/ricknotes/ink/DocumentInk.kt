package com.rickphobia.ricknotes.ink

import android.graphics.Matrix
import android.util.Log
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
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
import com.rickphobia.ricknotes.MainActivity
import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.Stroke
import com.rickphobia.ricknotes.core.session.DocumentSession
import com.rickphobia.ricknotes.core.session.InkSaveFailed
import com.rickphobia.ricknotes.core.session.SaveListener
import com.rickphobia.ricknotes.core.session.SaveStatus
import com.rickphobia.ricknotes.core.session.SessionWarning
import java.io.File
import androidx.ink.strokes.Stroke as InkStroke

// The smallest detail a stroke's outline keeps, in PDF points. A page is drawn 4 to 20 px per point
// (1x to 5x), so this is under half a pixel even at 5x.
private const val EPSILON_PT = 0.02f

/** The brush a pen Stroke of [colourArgb] and [widthPt] is drawn with, wet or saved. */
internal fun penBrush(
    colourArgb: Int,
    widthPt: Float,
): Brush = Brush.createWithColorIntArgb(StockBrushes.pressurePen(), colourArgb, widthPt, EPSILON_PT)

/** A finished Stroke, with the mesh Jetpack Ink built for it so it isn't rebuilt every frame. */
internal class DrawnStroke(
    val stroke: Stroke,
    val mesh: InkStroke,
)

/**
 * The ink of one open Document: its strokes for drawing, kept in `core`'s Document session, which
 * saves them to the Ink file beside the PDF on [saveThread]. [saveStatus] follows the session, so
 * the screen can show "Not saved".
 */
internal class DocumentInk private constructor(
    private val session: DocumentSession,
    private val saveThread: SaveThread,
    loaded: List<DrawnStroke>,
    private val status: SaveStatusState,
) {
    private val strokes = mutableStateListOf<DrawnStroke>().apply { addAll(loaded) }

    val readOnly: Boolean get() = session.readOnly
    val warnings: List<SessionWarning> get() = session.warnings
    val saveStatus: SaveStatus get() = status.current.value

    fun add(stroke: DrawnStroke) {
        strokes.add(stroke)
        session.addStroke(stroke.stroke)
    }

    fun on(pageId: PageId): List<DrawnStroke> = strokes.filter { it.stroke.pageId == pageId }

    /** Saves now, off the main thread: for when the app goes to the background. */
    fun saveSoon() = saveThread.run(session::saveNow)

    /** Saves what is left and lets the save thread end once it has. */
    fun close() {
        saveSoon()
        saveThread.close()
    }

    companion object {
        /** Reads the Ink file beside [pdf] and builds every stroke's mesh. Slow: call it off the main thread. */
        fun open(
            pdf: File,
            pageCount: Int,
        ): DocumentInk {
            val status = SaveStatusState(pdf.name)
            val saveThread = SaveThread(pdf.name)
            val session = DocumentSession.open(pdf.toPath(), pageCount, saveThread, status)
            session.warnings.forEach { Log.w(MainActivity.LOG_TAG, "${pdf.name}: $it") }
            Log.i(MainActivity.LOG_TAG, "loaded ${session.strokes.size} strokes for ${pdf.name}")
            return DocumentInk(session, saveThread, session.strokes.map { DrawnStroke(it, it.toMesh()) }, status)
        }
    }
}

/** The session's save status as Compose state, and the save log. */
private class SaveStatusState(
    private val documentName: String,
) : SaveListener {
    val current = mutableStateOf(SaveStatus.SAVED)

    override fun statusChanged(status: SaveStatus) {
        current.value = status
    }

    override fun saved(
        fileName: String,
        bytes: Int,
        durationMs: Long,
    ) {
        Log.i(MainActivity.LOG_TAG, "saved $fileName: $bytes bytes in $durationMs ms")
    }

    override fun saveFailed(error: InkSaveFailed) {
        Log.e(MainActivity.LOG_TAG, "save failed for $documentName; will retry", error)
    }
}

/** Rebuilds the mesh of a saved Stroke from its points, as Jetpack Ink drew it when it was wet. */
private fun Stroke.toMesh(): InkStroke {
    val inputs = MutableStrokeInputBatch()
    for (point in points) {
        inputs.add(
            type = InputToolType.STYLUS,
            x = point.x,
            y = point.y,
            elapsedTimeMillis = point.elapsedMs,
            pressure = point.pressure,
        )
    }
    return InkStroke(penBrush(colourArgb, widthPt), inputs)
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
            native.withMatrix(pageToBox) { strokes.forEach { renderer.draw(native, it.mesh, pageToBox) } }
        }
    }
}
