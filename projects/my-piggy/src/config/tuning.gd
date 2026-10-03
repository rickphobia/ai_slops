class_name Tuning
extends Resource
## The one table of game numbers. Rules and adapters read their numbers from here,
## never from literals. Every field starts as NAN, so a table that leaves one out
## is caught as "missing" instead of silently using a default.

## Allowed range per field, inclusive: [lowest, highest].
const LIMITS: Dictionary = {
	"walk_speed": [0.1, 10.0],
	"mouse_sensitivity": [0.0001, 0.05],
	"opening_seconds": [0.5, 20.0],
}

## How fast the Piggy walks, in metres per second.
@export var walk_speed: float = NAN
## How far the view turns per pixel of mouse movement, in radians.
@export var mouse_sensitivity: float = NAN
## How long the opening lasts: black, breathing and a heartbeat before the eyes open, in seconds.
@export var opening_seconds: float = NAN


## Loads a tuning table from a .tres file. Returns null if the file can't be loaded
## as a Tuning. The caller still has to check problems().
static func load_file(path: String) -> Tuning:
	if not ResourceLoader.exists(path):
		return null
	return load(path) as Tuning


## One message per bad field, each naming the field. Empty when the table is fine.
func problems() -> Array[String]:
	var found: Array[String] = []
	for field: String in LIMITS:
		var value: float = get(field)
		var limits: Array = LIMITS[field]
		var lowest: float = limits[0]
		var highest: float = limits[1]
		if is_nan(value):
			found.append("%s is missing from the tuning table" % field)
		elif value < lowest or value > highest:
			found.append(
				"%s is %s, but it must be between %s and %s" % [field, value, lowest, highest]
			)
	return found
