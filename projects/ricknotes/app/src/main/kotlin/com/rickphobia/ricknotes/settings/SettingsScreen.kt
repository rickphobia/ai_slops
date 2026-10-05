package com.rickphobia.ricknotes.settings

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.rickphobia.ricknotes.R

/** Long-pressing the title opens the hidden pen test screen. */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun SettingsScreen(
    studyFolder: String,
    onChangeFolder: () -> Unit,
    onOpenPenTest: () -> Unit,
    onShareLog: () -> Unit,
    onBack: () -> Unit,
) {
    BackHandler(onBack = onBack)
    Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        TextButton(onClick = onBack) { Text(stringResource(R.string.back)) }
        Text(
            text = stringResource(R.string.settings),
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.combinedClickable(onClick = {}, onLongClick = onOpenPenTest),
        )
        Text(text = stringResource(R.string.study_folder), style = MaterialTheme.typography.titleMedium)
        Text(text = studyFolder, style = MaterialTheme.typography.bodyLarge)
        OutlinedButton(onClick = onChangeFolder) { Text(stringResource(R.string.change_folder)) }
        Text(text = stringResource(R.string.problems), style = MaterialTheme.typography.titleMedium)
        OutlinedButton(onClick = onShareLog) { Text(stringResource(R.string.share_log)) }
    }
}
