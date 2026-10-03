class_name FamilyBrain
extends RefCounted
## What one family member is doing about the Piggy: their alert level and where they are
## headed. Takes perceptions (heard a noise, saw the Piggy, lost sight, reached where they
## were going) and time; the actor reads `alert` and `target` and moves the body. Pure
## rules, no scene tree.

## The alert level went from one to another.
signal alert_changed(from: Alert, to: Alert)

enum Alert {
	## Walking the route, humming.
	UNAWARE,
	## Going to where a noise was heard.
	INVESTIGATING,
	## Looking around where the noise was, or where the Piggy was last seen, for a while.
	SEARCHING,
	## Running at the Piggy, who is in sight.
	CHASING,
}

var alert: Alert = Alert.UNAWARE
## Where the noise was, or where the Piggy is (chasing) or was last seen (searching after).
var target: Vector3 = Vector3.ZERO
## Where the family member is now. The actor keeps it up to date; hearing and sight use it.
var position: Vector3 = Vector3.ZERO
## Which way they face, flat on the floor. The actor keeps it up to date; sight uses it.
var facing: Vector3 = Vector3.FORWARD

var _search_seconds: float
var _search_seconds_left: float = 0.0


func _init(search_seconds: float, at: Vector3) -> void:
	_search_seconds = search_seconds
	position = at


## Heard a noise: drop what they were doing and go there. A newer noise wins, but a chase
## goes on: they can see where the Piggy is.
func hear(at: Vector3) -> void:
	if alert == Alert.CHASING:
		return
	target = at
	_change_to(Alert.INVESTIGATING)


## Sees the Piggy at this point: chase.
func see(at: Vector3) -> void:
	target = at
	_change_to(Alert.CHASING)


## Lost sight of the Piggy during a chase: search where they were last seen.
func lost_sight() -> void:
	if alert == Alert.CHASING:
		_start_search()


## Reached the place they were going. Arriving at a noise starts the search.
func arrived() -> void:
	if alert == Alert.INVESTIGATING:
		_start_search()


func advance(delta: float) -> void:
	if alert != Alert.SEARCHING:
		return
	_search_seconds_left -= delta
	if _search_seconds_left <= 0.0:
		_change_to(Alert.UNAWARE)


## What a checkpoint keeps of this family member.
func state() -> FamilyMemberState:
	return FamilyMemberState.new(alert, target, position, facing, _search_seconds_left)


## Puts them back as they were. Reports the alert level change, if there is one.
func restore(saved: FamilyMemberState) -> void:
	target = saved.target
	position = saved.position
	facing = saved.facing
	_search_seconds_left = saved.search_seconds_left
	_change_to(saved.alert)


## An alert level's name in lower case, for logs and the debug overlay.
static func alert_name(level: Alert) -> String:
	var key: String = Alert.find_key(level)
	return key.to_lower()


func _start_search() -> void:
	_search_seconds_left = _search_seconds
	_change_to(Alert.SEARCHING)


func _change_to(level: Alert) -> void:
	if level == alert:
		return
	var before := alert
	alert = level
	alert_changed.emit(before, level)
