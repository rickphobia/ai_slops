package com.rickphobia.ricknotes.core.session

import com.rickphobia.ricknotes.core.ink.PageId
import com.rickphobia.ricknotes.core.ink.PagePoint
import com.rickphobia.ricknotes.core.ink.Stroke
import kotlin.math.hypot

/** How far from its path the eraser reaches, in PDF points: about 2 mm across, a pencil eraser's tip. */
const val ERASER_RADIUS_PT = 3f

/**
 * The strokes on [pageId] that the eraser touches as it moves from [from] to [to], in page points.
 * A stroke is touched if any part of its line, at its full width, comes within [radiusPt] of the
 * eraser's path. The whole path is checked, not just its ends, so a fast swipe misses nothing.
 */
fun strokesTouched(
    strokes: List<Stroke>,
    pageId: PageId,
    from: PagePoint,
    to: PagePoint,
    radiusPt: Float = ERASER_RADIUS_PT,
): List<Stroke> =
    strokes.filter { stroke ->
        stroke.pageId == pageId &&
            stroke.segments().any { (a, b) -> distance(from, to, a, b) <= radiusPt + stroke.widthPt / 2 }
    }

private fun Stroke.segments(): List<Pair<PagePoint, PagePoint>> {
    val corners = points.map { PagePoint(it.x, it.y) }
    return if (corners.size == 1) listOf(corners[0] to corners[0]) else corners.zipWithNext()
}

/** The shortest distance between segments a1-a2 and b1-b2. */
private fun distance(
    a1: PagePoint,
    a2: PagePoint,
    b1: PagePoint,
    b2: PagePoint,
): Float {
    if (crosses(a1, a2, b1, b2)) return 0f
    return minOf(
        distanceToSegment(a1, b1, b2),
        distanceToSegment(a2, b1, b2),
        distanceToSegment(b1, a1, a2),
        distanceToSegment(b2, a1, a2),
    )
}

private fun distanceToSegment(
    p: PagePoint,
    s1: PagePoint,
    s2: PagePoint,
): Float {
    val dx = s2.x - s1.x
    val dy = s2.y - s1.y
    val lengthSquared = dx * dx + dy * dy
    val along = if (lengthSquared == 0f) 0f else ((p.x - s1.x) * dx + (p.y - s1.y) * dy) / lengthSquared
    val t = along.coerceIn(0f, 1f)
    return hypot(p.x - (s1.x + t * dx), p.y - (s1.y + t * dy))
}

private fun crosses(
    a1: PagePoint,
    a2: PagePoint,
    b1: PagePoint,
    b2: PagePoint,
): Boolean = side(b1, b2, a1) * side(b1, b2, a2) < 0 && side(a1, a2, b1) * side(a1, a2, b2) < 0

// Positive if p is left of the line o-q, negative if right, zero if on it.
private fun side(
    o: PagePoint,
    q: PagePoint,
    p: PagePoint,
): Float = (q.x - o.x) * (p.y - o.y) - (q.y - o.y) * (p.x - o.x)
