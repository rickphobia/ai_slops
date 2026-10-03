class_name PlayerSettings
extends RefCounted
## The player's own settings from the pause menu: mouse sensitivity and master volume.
## Kept in Godot's user folder, which the web build stores in the browser (IndexedDB),
## so they survive between visits. Not to be confused with the Tuning, which the player
## never changes.

const DEFAULT_PATH := "user://settings.cfg"
const SECTION := "player"

## Sensitivity is a multiplier on the tuning's mouse_sensitivity, so 1.0 is "as designed".
const MIN_SENSITIVITY_SCALE := 0.25
const MAX_SENSITIVITY_SCALE := 3.0
const DEFAULT_SENSITIVITY_SCALE := 1.0
## Master volume, 0 (silent) to 1 (full).
const DEFAULT_VOLUME := 0.8

var sensitivity_scale: float = DEFAULT_SENSITIVITY_SCALE
var volume: float = DEFAULT_VOLUME


## Settings from the file, or the defaults when there is no file yet (a first visit).
## Values out of range, from a hand-edited file, are held to the range.
static func load_file(path: String) -> PlayerSettings:
	var settings := PlayerSettings.new()
	var file := ConfigFile.new()
	if file.load(path) != OK:
		return settings
	var sensitivity: float = file.get_value(SECTION, "sensitivity_scale", DEFAULT_SENSITIVITY_SCALE)
	var saved_volume: float = file.get_value(SECTION, "volume", DEFAULT_VOLUME)
	settings.set_sensitivity_scale(sensitivity)
	settings.set_volume(saved_volume)
	return settings


func set_sensitivity_scale(value: float) -> void:
	sensitivity_scale = clampf(value, MIN_SENSITIVITY_SCALE, MAX_SENSITIVITY_SCALE)


func set_volume(value: float) -> void:
	volume = clampf(value, 0.0, 1.0)


## Returns Godot's error code so the caller can log a failed save.
func save_file(path: String) -> Error:
	var file := ConfigFile.new()
	file.set_value(SECTION, "sensitivity_scale", sensitivity_scale)
	file.set_value(SECTION, "volume", volume)
	return file.save(path)
