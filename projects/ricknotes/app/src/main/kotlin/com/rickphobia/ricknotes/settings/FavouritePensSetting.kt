package com.rickphobia.ricknotes.settings

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.rickphobia.ricknotes.core.ink.FavouritePens
import com.rickphobia.ricknotes.core.settings.InvalidSettingException
import com.rickphobia.ricknotes.core.settings.SettingsLoader
import com.rickphobia.ricknotes.core.settings.SettingsSource
import com.rickphobia.ricknotes.core.settings.SettingsStore
import com.rickphobia.ricknotes.logging.AppLog

/** The Favourite pens as the screens see them: loaded once, saved on every change. */
class FavouritePensSetting<S>(
    private val settings: S,
) where S : SettingsSource, S : SettingsStore {
    var pens by mutableStateOf(load())
        private set

    fun change(pens: FavouritePens) {
        SettingsLoader.saveFavouritePens(settings, pens)
        AppLog.i("Favourite pens: ${pens.colours}")
        this.pens = pens
    }

    // A broken stored list mustn't keep the student from writing: they get the default and can edit it.
    private fun load(): FavouritePens =
        try {
            SettingsLoader.loadFavouritePens(settings)
        } catch (e: InvalidSettingException) {
            AppLog.w("stored Favourite pens unusable, using the default: ${e.message}")
            FavouritePens.DEFAULT
        }
}
