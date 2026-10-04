package com.rickphobia.ricknotes.viewer

import android.util.Log
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.rickphobia.ricknotes.MainActivity
import com.rickphobia.ricknotes.R

/** "12 / 100" over the pages. Tapping it asks for a page and [onJump] goes there. */
@Composable
internal fun PageNavigator(
    pageIndex: Int,
    pageCount: Int,
    onJump: (pageIndex: Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    var asking by remember { mutableStateOf(false) }
    PageIndicator(pageIndex, pageCount, onClick = { asking = true }, modifier = modifier)
    if (asking) {
        JumpToPageDialog(
            pageCount = pageCount,
            onJump = { index ->
                asking = false
                Log.i(MainActivity.LOG_TAG, "jumping to page ${index + 1} of $pageCount")
                onJump(index)
            },
            onDismiss = { asking = false },
        )
    }
}

@Composable
private fun PageIndicator(
    pageIndex: Int,
    pageCount: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        onClick = onClick,
        modifier = modifier,
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.inverseSurface.copy(alpha = INDICATOR_ALPHA),
        contentColor = MaterialTheme.colorScheme.inverseOnSurface,
    ) {
        Text(
            text = stringResource(R.string.page_indicator, pageIndex + 1, pageCount),
            style = MaterialTheme.typography.labelLarge,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
        )
    }
}

/** Asks for a page number; [onJump] gets the page's index, and only a page that exists can be chosen. */
@Composable
private fun JumpToPageDialog(
    pageCount: Int,
    onJump: (pageIndex: Int) -> Unit,
    onDismiss: () -> Unit,
) {
    var typed by remember { mutableStateOf("") }
    val target = pageIndexFromNumber(typed, pageCount)
    val jump = { target?.let(onJump) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(stringResource(R.string.go_to_page)) },
        text = {
            OutlinedTextField(
                value = typed,
                onValueChange = { typed = it },
                label = { Text(stringResource(R.string.page_number_range, pageCount)) },
                singleLine = true,
                isError = typed.isNotBlank() && target == null,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Go),
                keyboardActions = KeyboardActions(onGo = { jump() }),
            )
        },
        confirmButton = {
            TextButton(onClick = { jump() }, enabled = target != null) { Text(stringResource(R.string.go)) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.cancel)) } },
    )
}

private const val INDICATOR_ALPHA = 0.8f
