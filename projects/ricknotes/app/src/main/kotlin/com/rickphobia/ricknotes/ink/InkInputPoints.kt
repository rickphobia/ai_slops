package com.rickphobia.ricknotes.ink

import com.rickphobia.ricknotes.core.ink.StrokePoint

/**
 * A saved Stroke's points as Jetpack Ink will take them. Ink rejects a point at the same place and
 * time as the one before it, and saving rounds positions to 1/100 PDF point, so two pen samples
 * from the same millisecond can come back as one point twice. The repeat adds nothing to the line.
 */
internal fun inkInputPoints(points: List<StrokePoint>): List<StrokePoint> {
    val kept = ArrayList<StrokePoint>(points.size)
    for (point in points) {
        val previous = kept.lastOrNull()
        val repeat =
            previous != null && previous.x == point.x && previous.y == point.y && previous.elapsedMs == point.elapsedMs
        if (!repeat) kept.add(point)
    }
    return kept
}
