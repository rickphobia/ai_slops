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
## The route point they walk to next while unaware. The actor moves it on as they arrive.
var route_point: int = 0

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


## Puts them back on their route at this spot, unaware, with nothing remembered of the
## Piggy (after a checkpoint is restored). Reports the alert level change, if there is one.
func back_on_route(spot: RouteSpot) -> void:
	position = spot.position
	facing = spot.facing
	route_point = spot.next_point
	target = spot.position
	_search_seconds_left = 0.0
	_change_to(Alert.UNAWARE)


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
