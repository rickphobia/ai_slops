package com.rickphobia.ricknotes.home

import android.util.Log
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.rickphobia.ricknotes.MainActivity
import com.rickphobia.ricknotes.R
import com.rickphobia.ricknotes.files.PdfEntry
import com.rickphobia.ricknotes.files.PdfLister
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

@Composable
fun HomeScreen(
    versionName: String,
    studyFolder: String,
    onOpenSettings: () -> Unit,
) {
    // A large Study folder takes a moment to walk, so it is listed off the main thread.
    val pdfs by produceState<List<PdfEntry>?>(initialValue = null, studyFolder) {
        value =
            withContext(Dispatchers.IO) {
                PdfLister.list(File(studyFolder)).also { Log.i(MainActivity.LOG_TAG, "listed ${it.size} PDFs") }
            }
    }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = stringResource(R.string.app_name), style = MaterialTheme.typography.headlineMedium)
                Text(text = studyFolder, style = MaterialTheme.typography.bodyMedium)
            }
            Text(text = stringResource(R.string.version, versionName), style = MaterialTheme.typography.bodySmall)
            TextButton(onClick = onOpenSettings) { Text(stringResource(R.string.settings)) }
        }
        val listed = pdfs
        when {
            listed == null -> {
                Text(stringResource(R.string.listing_pdfs), modifier = Modifier.padding(top = 24.dp))
            }

            listed.isEmpty() -> {
                Text(stringResource(R.string.no_pdfs), modifier = Modifier.padding(top = 24.dp))
            }

            else -> {
                LazyColumn(modifier = Modifier.padding(top = 16.dp), verticalArrangement = Arrangement.Top) {
                    items(listed, key = PdfEntry::path) { pdf ->
                        Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                            Text(text = pdf.name, style = MaterialTheme.typography.bodyLarge)
                            if (pdf.folder.isNotEmpty()) {
                                Text(text = pdf.folder, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        HorizontalDivider()
                    }
                }
            }
        }
    }
}
