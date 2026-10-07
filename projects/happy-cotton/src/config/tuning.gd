class_name Tuning
extends Resource
## The one table of game numbers. Rules and adapters read their numbers from here,
## never from literals. Every field starts as NAN, so a table that leaves one out
## is caught as "missing" instead of silently using a default.
## A ticket that adds a rule adds its numbers here, to LIMITS, and to data/tuning.tres.

## Allowed range per field, inclusive: [lowest, highest].
const LIMITS: Dictionary = {
	"grow_seconds": [1.0, 86400.0],
	"shift_seconds": [10.0, 86400.0],
	"first_quota": [1.0, 10000.0],
	"quota_rise": [1.0, 10000.0],
	"labour_points_per_pick": [1.0, 10000.0],
}
## Fields that count things (picks, points), so they must be whole numbers.
const WHOLE_NUMBERS: Array[String] = ["first_quota", "quota_rise", "labour_points_per_pick"]

## How long a planted plot takes to ripen, in seconds of real time.
@export var grow_seconds: float = NAN
## How long a Shift lasts, in seconds of online play.
@export var shift_seconds: float = NAN
## Cotton picks demanded in the first Shift.
@export var first_quota: float = NAN
## How many more picks each Shift demands than the last. At least 1: the Quota never falls.
@export var quota_rise: float = NAN
## Labour Points earned for each pick.
@export var labour_points_per_pick: float = NAN


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
		elif field in WHOLE_NUMBERS and value != roundf(value):
			found.append("%s is %s, but it must be a whole number" % [field, value])
	return found
