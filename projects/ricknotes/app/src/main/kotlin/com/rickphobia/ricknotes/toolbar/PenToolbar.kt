package com.rickphobia.ricknotes.toolbar

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.rickphobia.ricknotes.R
import com.rickphobia.ricknotes.core.ink.FavouritePens
import com.rickphobia.ricknotes.core.ink.InkTool
import com.rickphobia.ricknotes.core.ink.PenColour
import com.rickphobia.ricknotes.core.ink.afterTappingPen
import com.rickphobia.ricknotes.logging.AppLog

private val SWATCH = 32.dp

/**
 * The Document's pens and highlighter, picking [tool]. The tool in use has a thick ring round it;
 * tapping the pen in use moves on through [favouritePens].
 */
@Composable
fun PenToolbar(
    tool: MutableState<InkTool>,
    favouritePens: FavouritePens,
) {
    val current = tool.value
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        PenColour.entries.forEach { colour ->
            ToolSwatch(
                colour = Color(colour.argb),
                shape = CircleShape,
                label = penName(colour),
                selected = current == InkTool.Pen(colour),
                onClick = {
                    tool.value = current.afterTappingPen(colour, favouritePens)
                    AppLog.d("tool: ${tool.value}")
                },
            )
        }
        ToolSwatch(
            colour = Color(InkTool.Highlighter.colourArgb),
            shape = RoundedCornerShape(4.dp),
            label = stringResource(R.string.highlighter),
            selected = current == InkTool.Highlighter,
            onClick = {
                tool.value = InkTool.Highlighter
                AppLog.d("tool: highlighter")
            },
        )
    }
}

/** A round swatch of a pen's colour, as the toolbar and the Favourite pens editor show it. */
@Composable
fun PenSwatch(
    colour: PenColour,
    size: Dp = SWATCH,
) {
    Box(modifier = Modifier.size(size).background(Color(colour.argb), CircleShape))
}

@Composable
fun penName(colour: PenColour): String =
    stringResource(
        when (colour) {
            PenColour.BLACK -> R.string.pen_black
            PenColour.BLUE -> R.string.pen_blue
            PenColour.RED -> R.string.pen_red
            PenColour.GREEN -> R.string.pen_green
        },
    )

@Composable
private fun ToolSwatch(
    colour: Color,
    shape: Shape,
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val ring = if (selected) 4.dp else 1.dp
    val ringColour = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
    Box(
        modifier =
            Modifier
                .size(SWATCH + 12.dp)
                .border(ring, ringColour, shape)
                .clickable(onClick = onClick)
                .semantics {
                    contentDescription = label
                    this.selected = selected
                },
        contentAlignment = Alignment.Center,
    ) {
        Box(modifier = Modifier.size(SWATCH).background(colour, shape))
    }
}
