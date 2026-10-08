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
	"study_session_seconds": [1.0, 86400.0],
	"study_session_cap_seconds": [1.0, 604800.0],
	"lap_seconds": [0.5, 600.0],
	"laps_before_breath": [1.0, 1000.0],
	"breath_seconds": [0.5, 600.0],
	"offline_growth_rate": [0.01, 1.0],
	"offline_cap_seconds": [60.0, 2592000.0],
	"wither_seconds": [1.0, 2592000.0],
	"negligence_labour_points": [0.0, 10000.0],
	"negligence_study_session_seconds": [1.0, 604800.0],
}
## Fields that count things (picks, points), so they must be whole numbers.
const WHOLE_NUMBERS: Array[String] = [
	"first_quota",
	"quota_rise",
	"labour_points_per_pick",
	"laps_before_breath",
	"negligence_labour_points",
]

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
## How long the first Study Session after a met Quota lasts, in seconds of real time. Each
## one in a row lasts twice as long as the last.
@export var study_session_seconds: float = NAN
## The longest a Study Session can last, however many come in a row. At least
## study_session_seconds.
@export var study_session_cap_seconds: float = NAN
## How long one lap on the Generator takes, in seconds of online play.
@export var lap_seconds: float = NAN
## How many laps the Worker runs on the Generator before he stops to breathe. Leaving the
## Generator doesn't rest him: the laps since his last breath carry over.
@export var laps_before_breath: float = NAN
## How long he stands bent over on the Generator, breathing, before he runs again. Crops halt
## meanwhile.
@export var breath_seconds: float = NAN
## How fast crops grow while the game is closed or its tab hidden (the night shift), as a share
## of how fast they grow while the Worker runs on the Generator. No Generator is needed.
@export var offline_growth_rate: float = NAN
## The most offline time one return counts, in seconds. More is cut to this, so one bad
## timestamp can't move the Farm on by years.
@export var offline_cap_seconds: float = NAN
## How long ripe cotton can wait to be picked before it Withers, in seconds counted outside
## Study Sessions, online or offline.
@export var wither_seconds: float = NAN
## Labour Points docked for each Withered plot. The balance never goes below zero.
@export var negligence_labour_points: float = NAN
## How long the Study Session for Negligence lasts. It must be longer than the cap for a missed
## Quota, so Negligence is always punished more severely.
@export var negligence_study_session_seconds: float = NAN


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
	if study_session_cap_seconds < study_session_seconds:
		var cap_problem := "study_session_cap_seconds is %s, but it must be at least %s"
		found.append(cap_problem % [study_session_cap_seconds, study_session_seconds])
	if negligence_study_session_seconds <= study_session_cap_seconds:
		var negligence_problem := (
			"negligence_study_session_seconds is %s, but it must be longer than"
			+ " study_session_cap_seconds (%s)"
		)
		found.append(
			negligence_problem % [negligence_study_session_seconds, study_session_cap_seconds]
		)
	return found
