class_name LyingObjects
extends Node
## Puts the lying objects in the house (a SlopBowl on each slop bowl, a Reflection on the
## hallway mirror and the back-door glass) and, every physics step, tells the Night which
## of them the Piggy can see, then shows what Hallucinations says each one shows.
## In view means inside the camera's view with nothing solid in between.

## How far in front of an object's marker its in-view points sit, so the rays to them don't
## stop at the wall or floor the object is on.
const SIGHT_POINT_OFFSET := 0.15
## Points around the middle that also count: if any one is visible, the object is in view,
## so a half-visible object never changes.
const SIGHT_SPREAD: Array[Vector3] = [
	Vector3.ZERO,
	Vector3(0.3, 0.0, 0.0),
	Vector3(-0.3, 0.0, 0.0),
	Vector3(0.0, 0.5, 0.0),
	Vector3(0.0, -0.5, 0.0),
]

var eyes: Camera3D
## Bodies a sight line passes through: the Piggy's own body.
var ignored: Array[RID] = []

var _night: Night
var _bowls: Dictionary[StringName, SlopBowl] = {}
var _reflections: Dictionary[StringName, Reflection] = {}
var _sight_points: Dictionary[StringName, Node3D] = {}


## Adds the objects at the house's markers and to the Night's hallucinations.
func setup(
	night: Night, slop_bowls: Array[Marker3D], mirror: Marker3D, back_door_glass: Marker3D
) -> void:
	_night = night
	for marker in slop_bowls:
		var bowl := SlopBowl.new()
		marker.add_child(bowl)
		_add(marker, Hallucinations.Kind.SLOP_BOWL, Vector3.UP)
		_bowls[marker.name] = bowl
	_add_reflection(mirror, Hallucinations.Kind.MIRROR)
	_add_reflection(back_door_glass, Hallucinations.Kind.DOOR_GLASS)
	_show_all()


## The flies over each slop bowl, to register with SoundOcclusion.
func sounds() -> Array[AudioStreamPlayer3D]:
	var found: Array[AudioStreamPlayer3D] = []
	for bowl: SlopBowl in _bowls.values():
		found.append(bowl.flies())
	return found


## What a lying object shows now (for tests and the debug overlay).
func showing(object: StringName) -> Hallucinations.Shows:
	return _night.hallucinations.shows(object)


## Whether giving in at this spot eats snacks: it is a slop bowl that shows them now.
func eats_snacks_at(spot: StringName) -> bool:
	return _bowls.has(spot) and showing(spot) == Hallucinations.Shows.SNACKS


func _physics_process(delta: float) -> void:
	if _night == null or eyes == null or not eyes.is_inside_tree():
		return
	var in_view: Array[StringName] = []
	var space := eyes.get_world_3d().direct_space_state
	for object: StringName in _sight_points:
		if _can_see_any(space, _sight_points[object]):
			in_view.append(object)
	_night.look(delta, in_view)
	_show_all()


func _add(marker: Marker3D, kind: Hallucinations.Kind, facing: Vector3) -> void:
	_night.hallucinations.add(marker.name, kind, _night.body.humanity)
	var sight_point := Node3D.new()
	sight_point.position = facing * SIGHT_POINT_OFFSET
	marker.add_child(sight_point)
	_sight_points[marker.name] = sight_point


func _add_reflection(marker: Marker3D, kind: Hallucinations.Kind) -> void:
	var reflection := Reflection.new()
	marker.add_child(reflection)
	_add(marker, kind, Vector3.BACK)
	_reflections[marker.name] = reflection


func _can_see_any(space: PhysicsDirectSpaceState3D, sight_point: Node3D) -> bool:
	for spread in SIGHT_SPREAD:
		if _can_see(space, sight_point.global_transform * spread):
			return true
	return false


func _can_see(space: PhysicsDirectSpaceState3D, point: Vector3) -> bool:
	if not eyes.is_position_in_frustum(point):
		return false
	var query := PhysicsRayQueryParameters3D.create(eyes.global_position, point)
	query.exclude = ignored
	return space.intersect_ray(query).is_empty()


func _show_all() -> void:
	for object: StringName in _bowls:
		var bowl := _bowls[object]
		if bowl.showing() != showing(object):
			_log_change(object, showing(object))
		bowl.show_as(showing(object))
	for object: StringName in _reflections:
		var reflection := _reflections[object]
		if reflection.showing() != showing(object):
			_log_change(object, showing(object))
		reflection.show_as(showing(object))


static func _log_change(object: StringName, shows: Hallucinations.Shows) -> void:
	var which: String = Hallucinations.Shows.find_key(shows)
	GameLog.debug("%s now shows %s" % [object, which.to_lower()])
