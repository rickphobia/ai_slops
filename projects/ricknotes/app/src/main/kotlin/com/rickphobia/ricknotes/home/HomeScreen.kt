package com.rickphobia.ricknotes.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import com.rickphobia.ricknotes.R

@Composable
fun HomeScreen(versionName: String) {
    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            Column(
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(text = stringResource(R.string.app_name), style = MaterialTheme.typography.displayMedium)
                Text(text = stringResource(R.string.version, versionName), style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}

@Preview(widthDp = 1280, heightDp = 800)
@Composable
private fun HomeScreenPreview() {
    HomeScreen(versionName = "0.1.0")
}
