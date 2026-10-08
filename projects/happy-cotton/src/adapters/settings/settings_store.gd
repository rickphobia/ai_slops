class_name SettingsStore
extends RefCounted
## The player's settings in a JSON file of their own under Godot's user folder (the browser's
## IndexedDB on the web), apart from the game save so that Start over keeps them. A file that
## can't be read, or holds bad values, gives the defaults for what is wrong and a warning in
## the log; the next change overwrites it, as settings are cheap to set again.

const DEFAULT_PATH := "user://settings.json"

var _path: String


## `path` is the settings file; tests pass their own.
func _init(path: String = DEFAULT_PATH) -> void:
	_path = path


func read() -> PlayerSettings:
	if not FileAccess.file_exists(_path):
		return PlayerSettings.new()
	var json := JSON.new()
	# A file that isn't JSON leaves json.data null, which from_save() reports.
	json.parse(FileAccess.get_file_as_string(_path))
	var settings := PlayerSettings.from_save(json.data)
	for problem in settings.problems:
		GameLog.warning("settings value ignored", {"path": _path, "problem": problem})
	return settings


## Writes the settings through a temporary file. Returns an empty string, or what went wrong.
func write(settings: PlayerSettings) -> String:
	var temporary := _path + ".tmp"
	var file := FileAccess.open(temporary, FileAccess.WRITE)
	if file == null:
		return "could not open %s: %s" % [temporary, error_string(FileAccess.get_open_error())]
	file.store_string(JSON.stringify(settings.to_save(), "", true, true))
	file.close()
	var renamed := DirAccess.rename_absolute(temporary, _path)
	if renamed != OK:
		return "could not replace %s: %s" % [_path, error_string(renamed)]
	return ""


## Deletes the file, for tests. Returns whether there is no file now.
func discard() -> bool:
	return not FileAccess.file_exists(_path) or DirAccess.remove_absolute(_path) == OK
