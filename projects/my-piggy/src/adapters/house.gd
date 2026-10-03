class_name House
extends Node3D
## The grey-box house: bedroom, hallway, kitchen, their doors, the walkable area for
## pathfinding, and the named markers later tickets attach to (give-in spots, mirror,
## back-door glass, Mum's start and route). This is the only file that knows the layout.
## Says which space a point is in and whether it is at the back door; main tells the Night.

## A door creaked: its noise radius in metres and where it came from.
signal door_creaked(noise_radius: float, at: Vector3)

## The point a Piggy is not in any space (in a wall, or outside the house).
const NO_SPACE: StringName = &""

@onready var _space_bounds: Node3D = $SpaceBounds
@onready var _back_door_exit: Area3D = $BackDoorExit
@onready var _walkable: NavigationRegion3D = $Walkable


func _ready() -> void:
	# CSG builds its shapes in a deferred call queued as each one entered the tree, before
	# this, so deferring the bake runs it after them.
	_bake_walkable.call_deferred()


## Hands the doors their numbers. Call once, before play.
func setup(tuning: Tuning) -> void:
	for door: Door in find_children("*", "Door", true, false):
		door.setup(tuning)
		door.creaked.connect(door_creaked.emit)


## Where the Piggy wakes, and which way they face.
func piggy_spawn() -> Marker3D:
	return $Markers/PiggySpawn


## The middle of the spot in front of the back door that ends the night.
func back_door_exit() -> Vector3:
	return _back_door_exit.global_position


## The space a point is in: the name of its box under SpaceBounds, or NO_SPACE.
func space_at(point: Vector3) -> StringName:
	for bounds: Area3D in _space_bounds.get_children():
		if _box_contains(bounds, point):
			return StringName(bounds.name)
	return NO_SPACE


func is_at_back_door(point: Vector3) -> bool:
	return _box_contains(_back_door_exit, point)


## The walkable area for pathfinding (Mum will walk on it).
func walkable() -> NavigationRegion3D:
	return _walkable


## Baked when the house loads rather than in the editor, so editing the layout can never
## leave a stale walkable area behind. It is a few boxes, so it is quick. The faces come
## from the CSG collision shapes: Godot's own parser would read the meshes back from the
## renderer, which it reports as an error.
func _bake_walkable() -> void:
	var source := NavigationMeshSourceGeometryData3D.new()
	for shape: CSGShape3D in _walkable.find_children("*", "CSGShape3D", true, false):
		if shape.is_root_shape():
			var faces := shape.bake_collision_shape()
			if faces == null:
				GameLog.warning("Walkable area: %s has no collision shape to bake" % shape.name)
				continue
			source.add_faces(faces.get_faces(), shape.global_transform)
	NavigationServer3D.bake_from_source_geometry_data(_walkable.navigation_mesh, source)


## Space bounds are boxes checked with plain maths instead of physics overlap, so the answer is
## exact for a point and doesn't depend on which physics frame asks.
static func _box_contains(area: Area3D, point: Vector3) -> bool:
	var shape: CollisionShape3D = area.get_child(0)
	var box: BoxShape3D = shape.shape
	var local := shape.global_transform.affine_inverse() * point
	var half := box.size / 2.0
	return absf(local.x) <= half.x and absf(local.y) <= half.y and absf(local.z) <= half.z
