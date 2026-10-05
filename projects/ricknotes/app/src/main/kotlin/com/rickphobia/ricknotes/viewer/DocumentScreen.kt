package com.rickphobia.ricknotes.viewer

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.rickphobia.ricknotes.R
import com.rickphobia.ricknotes.files.PdfEntry
import com.rickphobia.ricknotes.logging.AppLog
import java.io.File

private sealed interface Opening {
    data object InProgress : Opening

    data class Ready(
        val pageSizes: List<PageSize>,
    ) : Opening

    data class Failed(
        val error: DocumentOpenException,
    ) : Opening
}

/** One Document, scrolling continuously from page to page, reopened where it was left in [positions]. */
@Composable
fun DocumentScreen(
    pdf: PdfEntry,
    positions: ReadingPositions,
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
                AppLog.w("opening a Document failed: ${e.message}", e)
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
                PageList(OpenDocument(pages, current.pageSizes, pdf.path, positions))
            }
        }
    }
}
