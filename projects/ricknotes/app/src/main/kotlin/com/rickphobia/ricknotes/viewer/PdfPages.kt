package com.rickphobia.ricknotes.viewer

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.util.LruCache
import androidx.core.graphics.createBitmap
import com.rickphobia.ricknotes.logging.AppLog
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import java.util.concurrent.Executors

/**
 * Draws the pages of one Document with `PdfRenderer`.
 *
 * `PdfRenderer` isn't safe to share between threads, so each Document gets its own thread and
 * every call to the renderer runs on it; nothing renders on the main thread. The PDF is opened
 * read-only and never written. Drawn pages are kept in a cache limited to [cacheBytes].
 */
class PdfPages(
    private val file: File,
    cacheBytes: Int = defaultCacheBytes(),
) {
    private val executor = Executors.newSingleThreadExecutor { Thread(it, "pdf-${file.name}") }
    private val thread = executor.asCoroutineDispatcher()

    // Touched only on [thread].
    private var descriptor: ParcelFileDescriptor? = null
    private var renderer: PdfRenderer? = null
    private var closed = false

    private val cache =
        object : LruCache<PageKey, Bitmap>(cacheBytes) {
            override fun sizeOf(
                key: PageKey,
                value: Bitmap,
            ) = value.allocationByteCount
        }

    private data class PageKey(
        val pageIndex: Int,
        val widthPx: Int,
    )

    /** Opens the PDF and returns the size of every page. */
    suspend fun open(): List<PageSize> =
        withContext(thread) {
            check(renderer == null && !closed) { "${file.name} is already open or closed" }
            val started = SystemClock.elapsedRealtime()
            val opened =
                try {
                    val fd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
                    descriptor = fd
                    PdfRenderer(fd)
                } catch (e: IOException) {
                    throw openFailure(e)
                } catch (e: SecurityException) {
                    throw openFailure(e)
                }
            renderer = opened
            val sizes =
                try {
                    (0 until opened.pageCount).map { index ->
                        opened.openPage(index).use { PageSize(widthPt = it.width, heightPt = it.height) }
                    }
                } catch (e: IllegalStateException) {
                    throw openFailure(e)
                }
            if (sizes.isEmpty()) throw openFailure(IOException("the PDF has no pages"))
            AppLog.i(
                "opened ${file.name}: ${sizes.size} pages in ${SystemClock.elapsedRealtime() - started} ms",
            )
            sizes
        }

    /** The page already drawn [widthPx] wide, if the cache still holds it. */
    fun cached(
        pageIndex: Int,
        widthPx: Int,
    ): Bitmap? = cache.get(PageKey(pageIndex, widthPx))

    /**
     * Draws page [pageIndex] [widthPx] wide, or returns it from the cache. A call cancelled before
     * its turn on the render thread never renders, so a fast fling only draws where it stops.
     */
    suspend fun render(
        pageIndex: Int,
        size: PageSize,
        widthPx: Int,
    ): Bitmap {
        val key = PageKey(pageIndex, widthPx)
        cache.get(key)?.let { return it }
        return withContext(thread) {
            if (closed) throw CancellationException("${file.name} is closed")
            cache.get(key) ?: draw(pageIndex, size.heightPx(widthPx), widthPx).also { cache.put(key, it) }
        }
    }

    private fun draw(
        pageIndex: Int,
        heightPx: Int,
        widthPx: Int,
    ): Bitmap {
        val opened = checkNotNull(renderer) { "${file.name} is not open" }
        val started = SystemClock.elapsedRealtime()
        return try {
            opened.openPage(pageIndex).use { page ->
                // PDF pages have no background of their own, so draw on white paper.
                createBitmap(widthPx, heightPx).also {
                    it.eraseColor(Color.WHITE)
                    page.render(it, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                }
            }
        } catch (e: IllegalStateException) {
            throw PageRenderException(file.name, pageIndex, e)
        } catch (e: IllegalArgumentException) {
            throw PageRenderException(file.name, pageIndex, e)
        }.also {
            AppLog.d(
                "rendered ${file.name} page ${pageIndex + 1} at ${widthPx}px in " +
                    "${SystemClock.elapsedRealtime() - started} ms",
            )
        }
    }

    /** Closes the PDF once any render already running finishes, then ends the render thread. */
    fun close() {
        cache.evictAll()
        executor.execute {
            closed = true
            renderer?.close()
            descriptor?.close()
            renderer = null
            descriptor = null
            AppLog.i("closed ${file.name}")
        }
        executor.shutdown()
    }

    private fun openFailure(cause: Exception): DocumentOpenException {
        renderer?.close()
        descriptor?.close()
        renderer = null
        descriptor = null
        return DocumentOpenException.from(file.name, cause)
    }

    companion object {
        // Bitmaps live outside the Java heap, but its limit is a fair measure of what this
        // device gives one app. A quarter holds a few full-width pages either side of the screen.
        private const val CACHE_SHARE_OF_HEAP = 4

        private fun defaultCacheBytes(): Int =
            (Runtime.getRuntime().maxMemory() / CACHE_SHARE_OF_HEAP).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
    }
}
