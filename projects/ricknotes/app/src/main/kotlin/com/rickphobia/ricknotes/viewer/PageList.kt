package com.rickphobia.ricknotes.viewer

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListLayoutInfo
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import com.rickphobia.ricknotes.logging.AppLog
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.io.File
import kotlin.math.roundToInt

private val PAGE_GAP = 8.dp

// How long the view must be still before zoomed pages are drawn sharp again: long enough to skip
// the frames of a pinch or fling, short enough that the student doesn't wait.
private const val SETTLE_MS = 250L

// The reading position is saved this long after it stops changing, and again on leaving.
private const val SAVE_DELAY_MS = 500L

// A sharp part reaches this share of the screen past each edge, so small scrolls stay sharp.
private const val SHARP_MARGIN_SHARE = 8

/** Where the pages of one Document are being looked at from: what [PageList] needs from its screen. */
internal data class OpenDocument(
    val pages: PdfPages,
    val pageSizes: List<PageSize>,
    val path: String,
    val positions: ReadingPositions,
)

/**
 * The pages of a Document in one zoomable column: one finger scrolls, two fingers pinch-zoom and
 * pan. It reopens where the student left it and remembers where they leave it.
 */
@Composable
internal fun PageList(document: OpenDocument) {
    val pageCount = document.pageSizes.size
    val restored = remember(document.path) { restoredPosition(document) }
    val listState = rememberLazyListState(initialFirstVisibleItemIndex = restored.pageIndex)
    val view = remember { mutableStateOf(ZoomView(restored.zoom, panX = 0f)) }
    var settled by remember { mutableStateOf<SettledView?>(null) }
    val scope = rememberCoroutineScope()

    BoxWithConstraints(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surfaceVariant).clipToBounds(),
    ) {
        val screen = ViewportSize(constraints.maxWidth, constraints.maxHeight)
        val gapPx = with(LocalDensity.current) { PAGE_GAP.roundToPx() }
        val pageWidthPx = zoomedListWidth(screen, view.value) - gapPx * 2
        val pageLayout = { index: Int, size: PageSize ->
            PageLayout(index, size, baseWidthPx = screen.width - gapPx * 2, sharpMarginPx = sharpMargin(screen))
        }
        val current by remember(screen) {
            derivedStateOf {
                currentPage(visiblePages(listState.layoutInfo), screen.height) ?: listState.firstVisibleItemIndex
            }
        }
        LaunchedEffect(listState, screen, gapPx) {
            snapshotFlow { listState.layoutInfo to view.value }.collectLatest { (info, stillView) ->
                delay(SETTLE_MS)
                settled = settle(info, stillView, screen, gapPx)
            }
        }
        SavePosition(document) { ReadingPosition(current, view.value.zoom) }

        LazyColumn(
            state = listState,
            contentPadding = PaddingValues(PAGE_GAP),
            verticalArrangement = Arrangement.spacedBy(PAGE_GAP),
            modifier = Modifier.zoomable(view, listState, screen),
        ) {
            itemsIndexed(document.pageSizes) { index, size ->
                val part = settled?.takeIf { it.pageWidth == pageWidthPx }
                PageView(
                    document.pages,
                    pageLayout(index, size),
                    part?.let { SettledPart(it.pageWidth, it.visibleParts[index]) },
                )
            }
        }
        PageNavigator(
            pageIndex = current,
            pageCount = pageCount,
            onJump = { index -> scope.launch { listState.scrollToItem(index) } },
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp),
        )
    }
}

private fun restoredPosition(document: OpenDocument): ReadingPosition {
    val position =
        document.positions.load(document.path)?.fitTo(document.pageSizes.size) ?: ReadingPosition(0, ZoomLimits.MIN)
    AppLog.i("reopening ${File(document.path).name} at page ${position.pageIndex + 1}, zoom ${position.zoom}")
    return position
}

/** The page list's width at [view]'s zoom: the pages plus the gaps either side. */
private fun zoomedListWidth(
    screen: ViewportSize,
    view: ZoomView,
): Int = (screen.width * view.zoom).roundToInt()

private fun sharpMargin(screen: ViewportSize): Int = minOf(screen.width, screen.height) / SHARP_MARGIN_SHARE

/** Saves where the student is once it stops changing, and again when the Document closes. */
@Composable
private fun SavePosition(
    document: OpenDocument,
    position: () -> ReadingPosition,
) {
    LaunchedEffect(document) {
        snapshotFlow(position).collectLatest {
            delay(SAVE_DELAY_MS)
            document.positions.save(document.path, it)
        }
    }
    DisposableEffect(document) {
        onDispose { document.positions.save(document.path, position()) }
    }
}

/**
 * Pinch-zoom and sideways pan for the page list. The list is laid out as wide as the zoomed pages
 * and slides sideways under the screen; up and down is the list's own scrolling.
 */
private fun Modifier.zoomable(
    view: MutableState<ZoomView>,
    listState: LazyListState,
    screen: ViewportSize,
): Modifier =
    pinchAndPan(
        key = screen,
        onPinch = { centroid, pan, zoomChange ->
            val pinch =
                Pinch(
                    focusX = centroid.x,
                    focusY = centroid.y,
                    offsetInFirstPage = listState.firstVisibleItemScrollOffset.toFloat(),
                    zoomChange = zoomChange,
                    moveX = pan.x,
                    moveY = pan.y,
                    viewportWidth = screen.width.toFloat(),
                )
            val step = view.value.pinch(pinch)
            view.value = step.view
            listState.dispatchRawDelta(step.scrollY)
        },
        onPanX = { dx -> view.value = view.value.panBy(dx, screen.width.toFloat()) },
    ).layout { measurable, constraints ->
        val contentWidth = zoomedListWidth(screen, view.value)
        val placeable = measurable.measure(Constraints.fixed(contentWidth, constraints.maxHeight))
        layout(constraints.maxWidth, constraints.maxHeight) {
            placeable.place(-view.value.panX.roundToInt(), 0)
        }
    }

/** The view once it stopped moving: the page width, and which part of each laid-out page shows. */
private data class SettledView(
    val pageWidth: Int,
    val visibleParts: Map<Int, PixelRect?>,
)

private fun settle(
    info: LazyListLayoutInfo,
    view: ZoomView,
    screen: ViewportSize,
    gapPx: Int,
): SettledView {
    val pageWidth = zoomedListWidth(screen, view) - gapPx * 2
    val parts =
        visiblePages(info).associate { page ->
            page.index to
                PlacedPage(page.top, gapPx, pageWidth, page.height).visiblePart(view.panX.roundToInt(), screen)
        }
    return SettledView(pageWidth, parts)
}

// Item offsets count from the end of the list's top padding; the screen's top is viewportStartOffset.
private fun visiblePages(info: LazyListLayoutInfo): List<VisiblePage> =
    info.visibleItemsInfo.map { VisiblePage(it.index, it.offset - info.viewportStartOffset, it.size) }
