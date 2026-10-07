class_name Tuning
extends Resource
## The one table of game numbers. Rules and adapters read their numbers from here,
## never from literals. Every field starts as NAN, so a table that leaves one out
## is caught as "missing" instead of silently using a default.
## A ticket that adds a rule adds its numbers here, to LIMITS, and to data/tuning.tres.

## Allowed range per field, inclusive: [lowest, highest].
const LIMITS: Dictionary = {
	"grow_seconds": [1.0, 86400.0],
}

## How long a planted plot takes to ripen, in seconds of real time.
@export var grow_seconds: float = NAN


static func load_file(path: String) -> Tuning:
	if not ResourceLoader.exists(path):
		return null
	return load(path) as Tuning


## Everything wrong with the table, one line per bad value, each naming the field.
## Empty when the table is good.
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
