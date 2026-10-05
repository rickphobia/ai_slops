package com.rickphobia.ricknotes.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.rickphobia.ricknotes.R
import com.rickphobia.ricknotes.core.ink.FavouritePens
import com.rickphobia.ricknotes.core.ink.PenColour
import com.rickphobia.ricknotes.toolbar.PenSwatch
import com.rickphobia.ricknotes.toolbar.penName

/**
 * The Favourite pens in cycling order, each with "Move up" and "Remove", then the pens not in the
 * list to add. The last pen has no "Remove": the list can't be emptied.
 */
@Composable
fun FavouritePensEditor(
    pens: FavouritePens,
    onChange: (FavouritePens) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(text = stringResource(R.string.favourite_pens), style = MaterialTheme.typography.titleMedium)
        Text(text = stringResource(R.string.favourite_pens_help), style = MaterialTheme.typography.bodyMedium)
        pens.colours.forEachIndexed { index, colour ->
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                PenSwatch(colour)
                Text(text = penName(colour), modifier = Modifier.width(80.dp))
                TextButton(onClick = { onChange(pens.movedEarlier(colour)) }, enabled = index > 0) {
                    Text(stringResource(R.string.move_up))
                }
                TextButton(onClick = { onChange(pens.without(colour)) }, enabled = pens.canRemove(colour)) {
                    Text(stringResource(R.string.remove))
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            PenColour.entries.filter { it !in pens.colours }.forEach { colour ->
                OutlinedButton(onClick = { onChange(pens.with(colour)) }) {
                    Text(stringResource(R.string.add_pen, penName(colour)))
                }
            }
        }
    }
}
