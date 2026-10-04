package com.rickphobia.ricknotes.viewer

import android.util.Log
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.rickphobia.ricknotes.MainActivity
import com.rickphobia.ricknotes.R
import com.rickphobia.ricknotes.files.PdfEntry
import java.io.File

private val PAGE_GAP = 8.dp

private sealed interface Opening {
    data object InProgress : Opening

    data class Ready(
        val pageSizes: List<PageSize>,
    ) : Opening

    data class Failed(
        val error: DocumentOpenException,
    ) : Opening
}

/** One Document, scrolling continuously from page to page. */
@Composable
fun DocumentScreen(
    pdf: PdfEntry,
    onBack: () -> Unit,
) {
    BackHandler(onBack = onBack)
    val pages = remember(pdf.path) { PdfPages(File(pdf.path)) }
    DisposableEffect(pages) { onDispose { pages.close() } }
    val opening by produceState<Opening>(Opening.InProgress, pages) {
        value =
            try {
                Opening.Ready(pages.open())
            } catch (e: DocumentOpenException) {
                Log.w(MainActivity.LOG_TAG, e.message, e)
                Opening.Failed(e)
            }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(modifier = Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onBack) { Text(stringResource(R.string.back)) }
            Text(text = pdf.name, style = MaterialTheme.typography.titleMedium)
        }
        when (val current = opening) {
            Opening.InProgress -> {
                Text(stringResource(R.string.opening_document), modifier = Modifier.padding(24.dp))
            }

            is Opening.Failed -> {
                Text(
                    text = current.error.message.orEmpty(),
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.padding(24.dp),
                )
            }

            is Opening.Ready -> {
                PageList(pages, current.pageSizes)
            }
        }
    }
}

@Composable
private fun PageList(
    pages: PdfPages,
    pageSizes: List<PageSize>,
) {
    BoxWithConstraints(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surfaceVariant)) {
        val widthPx = with(LocalDensity.current) { (maxWidth - PAGE_GAP * 2).roundToPx() }
        LazyColumn(
            contentPadding = PaddingValues(PAGE_GAP),
            verticalArrangement = Arrangement.spacedBy(PAGE_GAP),
        ) {
            itemsIndexed(pageSizes) { index, size ->
                Page(pages, index, size, widthPx)
            }
        }
    }
}

@Composable
private fun Page(
    pages: PdfPages,
    index: Int,
    size: PageSize,
    widthPx: Int,
) {
    // The page's box takes its final shape at once, so the list never jumps when a page arrives.
    val drawn by produceState<PageImage>(
        pages.cached(index, widthPx)?.let { PageImage.Drawn(it.asImageBitmap()) } ?: PageImage.Pending,
        pages,
        index,
        widthPx,
    ) {
        if (value is PageImage.Drawn) return@produceState
        value =
            try {
                PageImage.Drawn(pages.render(index, size, widthPx).asImageBitmap())
            } catch (e: PageRenderException) {
                Log.e(MainActivity.LOG_TAG, e.message, e)
                PageImage.Failed
            }
    }
    Box(
        modifier = Modifier.fillMaxWidth().aspectRatio(size.aspectRatio).background(Color.White),
        contentAlignment = Alignment.Center,
    ) {
        when (val current = drawn) {
            is PageImage.Drawn -> {
                Image(
                    bitmap = current.bitmap,
                    contentDescription = stringResource(R.string.page_number, index + 1),
                    modifier = Modifier.fillMaxSize(),
                )
            }

            PageImage.Failed -> {
                Text(stringResource(R.string.page_failed, index + 1), color = Color.DarkGray)
            }

            PageImage.Pending -> {}
        }
    }
}

private sealed interface PageImage {
    data object Pending : PageImage

    data object Failed : PageImage

    data class Drawn(
        val bitmap: ImageBitmap,
    ) : PageImage
}
