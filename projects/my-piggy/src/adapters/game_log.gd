class_name GameLog
extends RefCounted
## The project logger: levels on top of Godot's printing. Every line carries the step
## of the night and the space name, so a line can be placed without re-running.
## Never log player data or secrets. (There is no player data in this game.)

enum Level { DEBUG, INFO, WARNING, ERROR }

## What the next lines are about. Main keeps these up to date from the Night.
static var step: int = 0
static var space: String = "none"
## Lines below this level are dropped.
static var minimum_level: Level = Level.INFO
## Where finished lines go: func(level: Level, line: String). Tests swap it to capture
## lines; when unset, lines go to Godot's output.
static var sink: Callable = Callable()


static func debug(message: String) -> void:
	_write(Level.DEBUG, message)


static func info(message: String) -> void:
	_write(Level.INFO, message)


static func warning(message: String) -> void:
	_write(Level.WARNING, message)


static func error(message: String) -> void:
	_write(Level.ERROR, message)


static func reset() -> void:
	step = 0
	space = "none"
	minimum_level = Level.INFO
	sink = Callable()


static func _write(level: Level, message: String) -> void:
	if level < minimum_level:
		return
	var line := "[%s] step=%d space=%s %s" % [_level_name(level), step, space, message]
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
