package com.rickphobia.ricknotes.ink

import com.rickphobia.ricknotes.core.ink.InkTool

/** What the pen does on the page: draw with an ink tool, or erase whole strokes. */
internal sealed interface PenMode {
    data class Draw(
        val tool: InkTool,
    ) : PenMode

    data object Erase : PenMode
}
