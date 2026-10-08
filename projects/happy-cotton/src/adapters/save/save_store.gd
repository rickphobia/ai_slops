class_name SaveStore
extends RefCounted
## The one save slot: a JSON file under Godot's user folder, which the web export keeps in the
## browser's storage (IndexedDB), so there is no account and nothing leaves the device. The
## file holds the Farm's save and when it was written. A file that can't be read is never
## overwritten: keep_aside() moves it next to the slot so a new game can start, and discard()
## does the same rather than delete it. A failed move or delete says why in last_problem().
## The web export copies the user folder to IndexedDB on the frame after a write, and a hidden
## tab gets no frames, so a save written as the tab hides lands only when it is shown again.

const DEFAULT_PATH := "user://save.json"

var _path: String
var _last_problem := ""


## `path` is the slot's file; tests pass their own.
func _init(path: String = DEFAULT_PATH) -> void:
	_path = path


func path() -> String:
	return _path


## Why the last keep_aside() or discard() failed; empty if it didn't.
func last_problem() -> String:
	return _last_problem


func has_save() -> bool:
	return FileAccess.file_exists(_path)


## Writes the save through a temporary file, so a failed write leaves the last save whole.
## Returns an empty string, or what went wrong.
func write(farm_save: Dictionary, saved_at: float) -> String:
	var text := JSON.stringify({"saved_at": saved_at, "farm": farm_save}, "", true, true)
	var temporary := _path + ".tmp"
	var file := FileAccess.open(temporary, FileAccess.WRITE)
	if file == null:
		return "could not open %s: %s" % [temporary, error_string(FileAccess.get_open_error())]
	file.store_string(text)
	file.close()
	var renamed := DirAccess.rename_absolute(temporary, _path)
	if renamed != OK:
		return "could not replace %s: %s" % [_path, error_string(renamed)]
	return ""


func read() -> StoredSave:
	if not has_save():
		return StoredSave.new(StoredSave.Status.NONE)
	var text := FileAccess.get_file_as_string(_path)
	if text.is_empty():
		var opened := FileAccess.get_open_error()
		return _damaged("empty" if opened == OK else "unreadable: " + error_string(opened))
	var json := JSON.new()
	if json.parse(text) != OK:
		return _damaged(
			"not JSON (line %d: %s)" % [json.get_error_line(), json.get_error_message()]
		)
	var parsed: Variant = json.data
	if not parsed is Dictionary:
		return _damaged("not a save")
	var contents: Dictionary = parsed
	var saved_at: Variant = contents.get("saved_at")
	var farm: Variant = contents.get("farm")
	if not (saved_at is float or saved_at is int) or not farm is Dictionary:
		return _damaged("not a save")
	var farm_save: Dictionary = farm
	var saved_time: float = saved_at
	return StoredSave.new(StoredSave.Status.FOUND, farm_save, saved_time)


## Moves the slot's file to the first free `<name>.damaged-N.json` beside it, so the next save
## can't overwrite it. Returns the new path, or an empty string if it couldn't be moved.
func keep_aside() -> String:
	var number := 1
	while FileAccess.file_exists(_aside_path(number)):
		number += 1
	var aside := _aside_path(number)
	var moved := DirAccess.rename_absolute(_path, aside)
	_last_problem = "" if moved == OK else _failure("move %s to %s" % [_path, aside], moved)
	return aside if moved == OK else ""


## Empties the slot for a confirmed "Start over": deletes a save that can be read, but keeps
## one that can't aside, like any damaged save. Returns whether the slot is now empty.
func discard() -> bool:
	_last_problem = ""
	if not has_save():
		return true
	if read().status == StoredSave.Status.DAMAGED:
		return not keep_aside().is_empty()
	var removed := DirAccess.remove_absolute(_path)
	if removed != OK:
		_last_problem = _failure("delete " + _path, removed)
	return removed == OK


func _aside_path(number: int) -> String:
	return "%s.damaged-%d.json" % [_path.get_basename(), number]


func _failure(action: String, error: Error) -> String:
	return "could not %s: %s" % [action, error_string(error)]


func _damaged(why: String) -> StoredSave:
	return StoredSave.new(StoredSave.Status.DAMAGED, {}, 0.0, why)
