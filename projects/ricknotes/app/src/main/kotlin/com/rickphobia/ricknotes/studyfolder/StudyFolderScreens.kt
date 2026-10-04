package com.rickphobia.ricknotes.studyfolder

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.rickphobia.ricknotes.R

@Composable
private fun CenteredMessage(
    title: String,
    body: String,
    problem: String?,
    buttonText: String,
    onClick: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(text = title, style = MaterialTheme.typography.headlineMedium)
        if (problem != null) {
            Text(
                text = problem,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.widthIn(max = 640.dp),
            )
        }
        Text(text = body, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.widthIn(max = 640.dp))
        Button(onClick = onClick) { Text(buttonText) }
    }
}

@Composable
fun AllFilesAccessScreen(onOpenSetting: () -> Unit) {
    CenteredMessage(
        title = stringResource(R.string.all_files_access_title),
        body = stringResource(R.string.all_files_access_body),
        problem = null,
        buttonText = stringResource(R.string.all_files_access_button),
        onClick = onOpenSetting,
    )
}

@Composable
fun PickFolderScreen(
    problem: String?,
    onPick: () -> Unit,
) {
    CenteredMessage(
        title = stringResource(R.string.pick_folder_title),
        body = stringResource(R.string.pick_folder_body),
        problem = problem,
        buttonText = stringResource(R.string.pick_folder_button),
        onClick = onPick,
    )
}

@Preview(widthDp = 1280, heightDp = 800)
@Composable
private fun PickFolderScreenPreview() {
    PickFolderScreen(problem = "The Study folder /storage/emulated/0/Study does not exist.", onPick = {})
}
