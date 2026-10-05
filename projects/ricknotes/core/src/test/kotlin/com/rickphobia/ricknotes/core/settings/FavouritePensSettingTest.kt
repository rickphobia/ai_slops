package com.rickphobia.ricknotes.core.settings

import com.rickphobia.ricknotes.core.ink.FavouritePens
import com.rickphobia.ricknotes.core.ink.PenColour.BLACK
import com.rickphobia.ricknotes.core.ink.PenColour.GREEN
import com.rickphobia.ricknotes.core.ink.PenColour.RED
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class FavouritePensSettingTest {
    private val stored = mutableMapOf<String, String>()
    private val source = SettingsSource { stored[it] }
    private val store = SettingsStore { key, value -> stored[key] = value }

    private fun rejected(value: String): InvalidSettingException {
        stored[SettingsLoader.FAVOURITE_PENS_KEY] = value
        return assertThrows(InvalidSettingException::class.java) { SettingsLoader.loadFavouritePens(source) }
    }

    @Test
    fun `nothing stored loads the default list`() {
        assertEquals(FavouritePens.DEFAULT, SettingsLoader.loadFavouritePens(source))
    }

    @Test
    fun `saved list loads back in its order`() {
        val pens = FavouritePens(listOf(RED, BLACK, GREEN))

        SettingsLoader.saveFavouritePens(store, pens)

        assertEquals("red,black,green", stored[SettingsLoader.FAVOURITE_PENS_KEY])
        assertEquals(pens, SettingsLoader.loadFavouritePens(source))
    }

    @Test
    fun `empty list is rejected`() {
        assertEquals("is empty", rejected("").reason)
    }

    @Test
    fun `repeated colour is rejected`() {
        assertEquals("lists a colour twice", rejected("red,red").reason)
    }

    @Test
    fun `unknown colour is rejected naming it`() {
        val error = rejected("black,purple")

        assertEquals(SettingsLoader.FAVOURITE_PENS_KEY, error.key)
        assertEquals("names an unknown colour \"purple\"", error.reason)
    }
}
