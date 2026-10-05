package com.rickphobia.ricknotes.ink

import android.graphics.Matrix
import android.util.Log
import android.view.MotionEvent
import android.view.View
import androidx.ink.authoring.InProgressStrokeId
import androidx.ink.authoring.InProgressStrokesFinishedListener
import androidx.ink.authoring.InProgressStrokesView
import androidx.ink.brush.Brush
import androidx.ink.brush.StockBrushes
import androidx.ink.strokes.StrokeInput
import com.rickphobia.ricknotes.MainActivity
import com.rickphobia.ricknotes.core.ink.DefaultPen
import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.PagePlacement
import com.rickphobia.ricknotes.core.ink.ScreenPoint
import com.rickphobia.ricknotes.core.ink.Stroke
import com.rickphobia.ricknotes.core.ink.StrokeId
import com.rickphobia.ricknotes.core.ink.StrokePoint
import com.rickphobia.ricknotes.core.ink.Tool
import com.rickphobia.ricknotes.core.ink.pageAt
import com.rickphobia.ricknotes.core.touch.TouchAction
import com.rickphobia.ricknotes.core.touch.TouchInterpreter
import java.util.UUID
import androidx.ink.strokes.Stroke as InkStroke

// The smallest detail a stroke's outline keeps, in PDF points. A page is drawn 4 to 20 px per point
// (1x to 5x), so this is under half a pixel even at 5x.
private const val EPSILON_PT = 0.02f

/** What the touch layer asks of the page list when fingers move it. */
internal interface TouchNavigation {
    /** Fingers or the pen touched down: stop any fling. */
    fun stop()

    fun scroll(action: TouchAction.Scroll)

    fun pinch(action: TouchAction.Pinch)

    fun scrollEnd()
}

/**
 * Carries out what `core`'s touch interpreter makes of each touch on an open Document. The pen's
 * strokes are drawn by Jetpack Ink's low-latency [InProgressStrokesView] in page coordinates, and
 * handed to [ink] once finished, which draws them with their page from then on.
 */
internal class DocumentTouch(
    private val inProgress: InProgressStrokesView,
    private val ink: DocumentInk,
    private val placements: () -> List<PagePlacement>,
    private val navigation: TouchNavigation,
) : InProgressStrokesFinishedListener {
    private val interpreter = TouchInterpreter()
    private val penBrush =
        Brush.createWithColorIntArgb(
            StockBrushes.pressurePen(),
            DefaultPen.COLOUR_ARGB,
            DefaultPen.WIDTH_PT,
            EPSILON_PT,
        )

    // Strokes the pen is drawing, by pointer, and what each will need once Ink hands it back.
    private val drawing = mutableMapOf<Int, InProgressStrokeId>()
    private val started = mutableMapOf<InProgressStrokeId, StartedStroke>()

    private data class StartedStroke(
        val pageId: PageId,
        val drawnAtMs: Long,
    )

    fun onTouch(
        view: View,
        event: MotionEvent,
    ) {
        for (touch in event.toTouchEvents()) {
            when (val action = interpreter.handle(touch)) {
                is TouchAction.StartStroke -> {
                    start(view, event, action)
                }

                is TouchAction.ExtendStroke -> {
                    drawing[action.pointerId]?.let { inProgress.addToStroke(event, action.pointerId, it) }
                }

                is TouchAction.EndStroke -> {
                    drawing.remove(action.pointerId)?.let { inProgress.finishStroke(event, action.pointerId, it) }
                }

                is TouchAction.CancelStroke -> {
                    cancel(event, action.pointerId)
                }

                TouchAction.ScrollStart -> {
                    navigation.stop()
                }

                is TouchAction.Scroll -> {
                    navigation.scroll(action)
                }

                is TouchAction.Pinch -> {
                    navigation.pinch(action)
                }

                TouchAction.ScrollEnd -> {
                    navigation.scrollEnd()
                }

                TouchAction.Ignore -> {}
            }
        }
    }

    private fun start(
        view: View,
        event: MotionEvent,
        action: TouchAction.StartStroke,
    ) {
        navigation.stop()
        val page = pageAt(placements(), ScreenPoint(action.x, action.y))
        if (page == null) {
            Log.d(MainActivity.LOG_TAG, "pen down outside any page; no stroke")
            return
        }
        // Without this Android batches pen samples once per frame, which the pen tip shows as lag.
        view.requestUnbufferedDispatch(event)
        val id = inProgress.startStroke(event, action.pointerId, penBrush, page.screenToPage())
        drawing[action.pointerId] = id
        started[id] = StartedStroke(page.pageId, System.currentTimeMillis())
    }

    private fun cancel(
        event: MotionEvent,
        pointerId: Int,
    ) {
        val id = drawing.remove(pointerId) ?: return
        started.remove(id)
        inProgress.cancelStroke(id, event)
    }

    override fun onStrokesFinished(strokes: Map<InProgressStrokeId, InkStroke>) {
        for ((id, mesh) in strokes) {
            val start = started.remove(id)
            when {
                start == null -> {}

                mesh.inputs.isEmpty() -> {
                    Log.w(MainActivity.LOG_TAG, "dropped a stroke with no points on page ${start.pageId.value}")
                }

                else -> {
                    ink.add(DrawnStroke(mesh.toStroke(start), mesh))
                }
            }
        }
        // In the same frame as the page starts drawing them, so they never flicker or show twice.
        inProgress.removeFinishedStrokes(strokes.keys)
    }

    private fun InkStroke.toStroke(start: StartedStroke): Stroke {
        val input = StrokeInput()
        val points =
            List(inputs.size) { index ->
                inputs.populate(index, input)
                val pressure = if (input.hasPressure) input.pressure.coerceIn(0f, 1f) else 1f
                StrokePoint(input.x, input.y, pressure, input.elapsedTimeMillis)
            }
        return Stroke(
            id = StrokeId(UUID.randomUUID().toString()),
            pageId = start.pageId,
            tool = Tool.PEN,
            colourArgb = brush.colorIntArgb,
            widthPt = brush.size,
            drawnAtMs = start.drawnAtMs,
            points = points,
        )
    }
}

/** The same mapping as [PagePlacement.toPage], as a matrix for Jetpack Ink. */
private fun PagePlacement.screenToPage(): Matrix =
    Matrix().apply {
        setTranslate(-left, -top)
        postScale(1f / pixelsPerPoint, 1f / pixelsPerPoint)
    }
