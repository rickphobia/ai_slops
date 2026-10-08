class_name PlayerSettings
extends RefCounted
## The player's own settings: text size, reduced motion, master volume and mute. They are kept
## apart from the game save (see SettingsStore), so starting over keeps them. A stored value
## that is missing or makes no sense falls back to its default and is named in `problems`: a
## bad settings file is logged, never a reason to stop the game.

## The text sizes on offer, as a share of the normal size.
const TEXT_SCALES: Array[float] = [1.0, 1.25, 1.5]
const DEFAULT_TEXT_SCALE := 1.0
## Master volume, from 0 (silent) to 1 (as the sounds were made).
const DEFAULT_VOLUME := 1.0

var text_scale := DEFAULT_TEXT_SCALE
## Less on-screen motion: no slump or stagger for the Worker and no confetti.
var reduced_motion := false
var volume := DEFAULT_VOLUME
var muted := false
## What was wrong with the stored settings, one line per field; empty if nothing was.
var problems: Array[String] = []


## Reads settings written by to_save(), falling back to the default for anything bad.
static func from_save(stored: Variant) -> PlayerSettings:
	var settings := PlayerSettings.new()
	if not stored is Dictionary:
		settings.problems.append("settings are not a dictionary: %s" % type_string(typeof(stored)))
		return settings
	var fields: Dictionary = stored
	var scale: Variant = fields.get("text_scale", DEFAULT_TEXT_SCALE)
	if _number(scale) in TEXT_SCALES:
		settings.text_scale = _number(scale)
	else:
		settings.problems.append("text_scale %s is not one of %s" % [scale, TEXT_SCALES])
	var level: Variant = fields.get("volume", DEFAULT_VOLUME)
	if _number(level) >= 0.0 and _number(level) <= 1.0:
		settings.volume = _number(level)
	else:
		settings.problems.append("volume %s is not a number from 0 to 1" % [level])
	settings.reduced_motion = _flag(fields, "reduced_motion", settings.problems)
	settings.muted = _flag(fields, "muted", settings.problems)
	return settings


func to_save() -> Dictionary:
	return {
		"text_scale": text_scale,
		"reduced_motion": reduced_motion,
		"volume": volume,
		"muted": muted,
	}


func is_silent() -> bool:
	return muted or volume <= 0.0


## A stored number as a float (JSON may give a whole number as an int), or NAN if it isn't one.
static func _number(value: Variant) -> float:
	if value is float or value is int:
		var number: float = value
		return number
	return NAN


static func _flag(fields: Dictionary, field: String, problems: Array[String]) -> bool:
	var value: Variant = fields.get(field, false)
	if value is bool:
		return value
	problems.append("%s %s is not true or false" % [field, value])
	return false
