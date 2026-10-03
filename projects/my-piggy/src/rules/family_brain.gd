class_name FamilyBrain
extends RefCounted
## What one family member is doing about the Piggy: their alert level and where they are
## headed. Takes perceptions (heard a noise, reached where they were going) and time; the
## actor reads `alert` and `target` and moves the body. Pure rules, no scene tree.

## The alert level went from one to another.
signal alert_changed(from: Alert, to: Alert)

enum Alert {
	## Walking the route, humming.
	UNAWARE,
	## Going to where a noise was heard.
	INVESTIGATING,
	## Looking around where the noise was, for a while.
	SEARCHING,
}

var alert: Alert = Alert.UNAWARE
## Where the noise was: where they go when investigating and look around when searching.
var target: Vector3 = Vector3.ZERO
## Where the family member is now. The actor keeps it up to date; hearing uses it.
var position: Vector3 = Vector3.ZERO

var _search_seconds: float
var _search_seconds_left: float = 0.0


func _init(search_seconds: float, at: Vector3) -> void:
	_search_seconds = search_seconds
	position = at


## Heard a noise: drop what they were doing and go there. A newer noise wins.
func hear(at: Vector3) -> void:
	target = at
	_change_to(Alert.INVESTIGATING)


## Reached the place they were going. Arriving at a noise starts the search.
func arrived() -> void:
	if alert == Alert.INVESTIGATING:
		_search_seconds_left = _search_seconds
		_change_to(Alert.SEARCHING)


func advance(delta: float) -> void:
	if alert != Alert.SEARCHING:
		return
	_search_seconds_left -= delta
	if _search_seconds_left <= 0.0:
		_change_to(Alert.UNAWARE)


## An alert level's name in lower case, for logs and the debug overlay.
static func alert_name(level: Alert) -> String:
	var key: String = Alert.find_key(level)
	return key.to_lower()


func _change_to(level: Alert) -> void:
	if level == alert:
		return
	var before := alert
	alert = level
	alert_changed.emit(before, level)
