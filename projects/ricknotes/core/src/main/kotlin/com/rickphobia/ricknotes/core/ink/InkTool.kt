package com.rickphobia.ricknotes.core.ink

/** The pen colours the toolbar offers. */
enum class PenColour(
    val argb: Int,
) {
    BLACK(0xFF000000.toInt()),
    BLUE(0xFF1565C0.toInt()),
    RED(0xFFD32F2F.toInt()),
    GREEN(0xFF2E7D32.toInt()),
}

/** What the pen draws with: one of the pens, or the highlighter. Saved into each Stroke it draws. */
sealed interface InkTool {
    val tool: Tool
    val colourArgb: Int
    val widthPt: Float

    data class Pen(
        val colour: PenColour,
    ) : InkTool {
        override val tool: Tool get() = Tool.PEN
        override val colourArgb: Int get() = colour.argb
        override val widthPt: Float get() = PEN_WIDTH_PT
    }

    data object Highlighter : InkTool {
        override val tool: Tool get() = Tool.HIGHLIGHTER
        override val colourArgb: Int get() = HIGHLIGHTER_ARGB
        override val widthPt: Float get() = HIGHLIGHTER_WIDTH_PT
    }
}

// About 0.5 mm: a fine ballpoint, readable at 1x without crowding small handwriting.
private const val PEN_WIDTH_PT = 1.5f

// Yellow at about 40% opacity: the text stays readable through it.
private const val HIGHLIGHTER_ARGB = 0x66FFEB3B

// About a line of lecture-slide text tall.
private const val HIGHLIGHTER_WIDTH_PT = 12f

/**
 * The toolbar's rule for a tap on a pen of [colour]: tapping the pen already in use moves on to the
 * next of [favourites]; any other tap picks that pen.
 */
fun InkTool.afterTappingPen(
    colour: PenColour,
    favourites: FavouritePens,
): InkTool =
    if (this is InkTool.Pen &&
        this.colour == colour
    ) {
        InkTool.Pen(favourites.after(colour))
    } else {
        InkTool.Pen(colour)
    }

/** The short list of pen colours that tapping the current pen cycles through. Never empty, no repeats. */
data class FavouritePens(
    val colours: List<PenColour>,
) {
    init {
        require(colours.isNotEmpty()) { "Favourite pens can't be empty" }
        require(colours.distinct().size == colours.size) { "Favourite pens has a colour twice: $colours" }
    }

    /** The colour after [colour], wrapping round; the first one if [colour] isn't a favourite. */
    fun after(colour: PenColour): PenColour {
        val index = colours.indexOf(colour)
        return colours[(index + 1) % colours.size]
    }

    /** Whether [colour] can be taken out: the list can't be emptied. */
    fun canRemove(colour: PenColour): Boolean = colour in colours && colours.size > 1

    /** The list without [colour]. @throws IllegalArgumentException if that would empty it. */
    fun without(colour: PenColour): FavouritePens = FavouritePens(colours - colour)

    /** The list with [colour] added at the end, or unchanged if it is already in it. */
    fun with(colour: PenColour): FavouritePens = if (colour in colours) this else FavouritePens(colours + colour)

    /** The list with [colour] one place earlier, or unchanged if it is first or missing. */
    fun movedEarlier(colour: PenColour): FavouritePens {
        val index = colours.indexOf(colour)
        if (index <= 0) return this
        val reordered = colours.toMutableList()
        reordered[index] = reordered[index - 1]
        reordered[index - 1] = colour
        return FavouritePens(reordered)
    }

    companion object {
        val DEFAULT = FavouritePens(listOf(PenColour.BLACK, PenColour.BLUE, PenColour.RED, PenColour.GREEN))
    }
}
