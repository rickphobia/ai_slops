class_name GameLog
extends RefCounted
## The project logger: a level, an event and key=value fields on top of Godot's printing,
## one line per event, so a player's report can be read without re-running their game.
## Never log secrets or anything that identifies the player.

enum Level { DEBUG, INFO, WARNING, ERROR }

## Lines below this level are dropped.
static var minimum_level: Level = Level.INFO
## Where finished lines go: func(level: Level, line: String). Tests swap it to capture
## lines; when unset, lines go to Godot's output.
static var sink: Callable = Callable()


static func debug(event: String, fields: Dictionary = {}) -> void:
	_write(Level.DEBUG, event, fields)


static func info(event: String, fields: Dictionary = {}) -> void:
	_write(Level.INFO, event, fields)


static func warning(event: String, fields: Dictionary = {}) -> void:
	_write(Level.WARNING, event, fields)


static func error(event: String, fields: Dictionary = {}) -> void:
	_write(Level.ERROR, event, fields)


static func reset() -> void:
	minimum_level = Level.INFO
	sink = Callable()


## `[info] game started version="dev build"`: the level, the event, then each field in the
## order given. Values go through var_to_str, so strings are quoted and escaped and a field
## with spaces can't run into the next one.
static func format_line(level: Level, event: String, fields: Dictionary) -> String:
	var parts: Array[String] = ["[%s]" % _level_name(level), event]
	for key: Variant in fields:
		parts.append("%s=%s" % [key, var_to_str(fields[key])])
	return " ".join(parts)


static func _write(level: Level, event: String, fields: Dictionary) -> void:
	if level < minimum_level:
		return
	var line := format_line(level, event, fields)
	if sink.is_valid():
		sink.call(level, line)
		return
	match level:
		Level.WARNING:
			push_warning(line)
		Level.ERROR:
			push_error(line)
		_:
			print(line)


static func _level_name(level: Level) -> String:
	match level:
		Level.DEBUG:
			return "debug"
		Level.INFO:
			return "info"
		Level.WARNING:
			return "warning"
		_:
			return "error"
