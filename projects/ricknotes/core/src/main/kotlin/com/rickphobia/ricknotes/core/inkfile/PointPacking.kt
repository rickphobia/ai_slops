package com.rickphobia.ricknotes.core.inkfile

import com.rickphobia.ricknotes.core.ink.StrokePoint
import kotlin.math.roundToLong

/**
 * Packs a Stroke's points as text (decision 0003): each point is x, y, pressure and time as whole
 * numbers, and each number after the first point is the difference from the one before, so a pen
 * moving smoothly writes short numbers. `"1234,5678,500,0,12,-3,4,8"` is two points.
 *
 * Positions are kept to 1/100 of a PDF point (under 0.004 mm) and pressure to 1/1000, finer than
 * the pen or the screen can tell apart; a point already on that grid comes back exactly.
 */
internal object PointPacking {
    const val POSITION_STEPS_PER_PT = 100f
    const val PRESSURE_STEPS = 1000f
    private const val VALUES_PER_POINT = 4

    fun pack(points: List<StrokePoint>): String {
        val previous = LongArray(VALUES_PER_POINT)
        val packed = StringBuilder()
        for (point in points) {
            val values =
                longArrayOf(
                    (point.x * POSITION_STEPS_PER_PT).roundToLong(),
                    (point.y * POSITION_STEPS_PER_PT).roundToLong(),
                    (point.pressure * PRESSURE_STEPS).roundToLong(),
                    point.elapsedMs,
                )
            for (channel in values.indices) {
                if (packed.isNotEmpty()) packed.append(',')
                packed.append(values[channel] - previous[channel])
                previous[channel] = values[channel]
            }
        }
        return packed.toString()
    }

    /** @throws IllegalArgumentException if [packed] isn't whole points of whole numbers. */
    fun unpack(packed: String): List<StrokePoint> {
        val numbers =
            packed.split(',').map { it.toLongOrNull() ?: throw IllegalArgumentException("\"$it\" is not a number") }
        require(numbers.size % VALUES_PER_POINT == 0) { "${numbers.size} numbers is not whole points" }
        val running = LongArray(VALUES_PER_POINT)
        return numbers.chunked(VALUES_PER_POINT).map { differences ->
            for (channel in running.indices) running[channel] += differences[channel]
            StrokePoint(
                x = running[0] / POSITION_STEPS_PER_PT,
                y = running[1] / POSITION_STEPS_PER_PT,
                pressure = running[2] / PRESSURE_STEPS,
                elapsedMs = running[3],
            )
        }
    }
}
