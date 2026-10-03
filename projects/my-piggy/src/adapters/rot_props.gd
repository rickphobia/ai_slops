class_name RotProps
extends RefCounted
## Placeholder props for each rot stage of a space, as flat coloured panels on its west wall
## and floor until the custom-made sets exist: kids' drawings, family photos and a clock
## (cosy); stains, grime and a cloud of flies (soured); wet meat, pig-faced photos and drips
## (grotesque). They don't cast shadows, so the shadow layout is the same at every stage.

const COSY_DRAWING := Color(0.95, 0.75, 0.2)
const COSY_PHOTO := Color(0.55, 0.4, 0.3)
const CLOCK := Color(0.85, 0.82, 0.7)
const STAIN := Color(0.3, 0.25, 0.12)
const FLY := Color(0.02, 0.02, 0.02)
const MEAT := Color(0.45, 0.06, 0.08)
const PIG_PHOTO := Color(0.9, 0.55, 0.6)
const DRIP := Color(0.35, 0.3, 0.15)
const FLIES := 12
## How far the panels stand off the wall and floor, so they never flicker into them.
const STAND_OFF := 0.01


## The props for one rot stage inside `box` (a space's inside, in world coordinates).
static func build(stage: Hallucinations.Rot, box: AABB) -> Node3D:
	var props := Node3D.new()
	var which: String = Hallucinations.Rot.find_key(stage)
	props.name = which.capitalize()
	var wall_x := box.position.x + STAND_OFF
	var middle_z := box.get_center().z
	match stage:
		Hallucinations.Rot.COSY:
			_on_wall(
				props, wall_x, Vector3(0.0, 1.2, middle_z - 0.5), Vector2(0.4, 0.3), COSY_DRAWING
			)
			_on_wall(
				props, wall_x, Vector3(0.0, 1.6, middle_z + 0.3), Vector2(0.3, 0.4), COSY_PHOTO
			)
			_on_wall(props, wall_x, Vector3(0.0, 1.9, middle_z - 0.1), Vector2(0.25, 0.25), CLOCK)
		Hallucinations.Rot.SOURED:
			_on_wall(props, wall_x, Vector3(0.0, 1.0, middle_z), Vector2(1.2, 0.8), STAIN)
			_on_wall(
				props, wall_x, Vector3(0.0, 1.6, middle_z + 0.3), Vector2(0.3, 0.4), COSY_PHOTO
			)
			_on_floor(props, Vector3(box.position.x + 0.6, 0.0, middle_z), STAIN)
			_add_flies(props, Vector3(box.position.x + 0.4, 1.3, middle_z - 0.4))
		Hallucinations.Rot.GROTESQUE:
			_on_wall(props, wall_x, Vector3(0.0, 1.3, middle_z), Vector2(2.0, 2.2), MEAT)
			_on_wall(
				props,
				wall_x + STAND_OFF,
				Vector3(0.0, 1.6, middle_z + 0.3),
				Vector2(0.3, 0.4),
				PIG_PHOTO
			)
			_on_floor(props, Vector3(box.position.x + 0.5, 0.0, middle_z), DRIP)
			_add_flies(props, Vector3(box.position.x + 0.4, 1.3, middle_z - 0.4))
	return props


## A panel flat against the west wall, facing into the space (+X). `at.x` is ignored.
static func _on_wall(
	props: Node3D, wall_x: float, at: Vector3, size: Vector2, colour: Color
) -> void:
	var panel := _panel(size, colour)
	panel.rotation.y = PI / 2.0
	panel.position = Vector3(wall_x, at.y, at.z)
	props.add_child(panel)


static func _on_floor(props: Node3D, at: Vector3, colour: Color) -> void:
	var panel := _panel(Vector2(0.8, 0.6), colour)
	panel.rotation.x = -PI / 2.0
	panel.position = Vector3(at.x, STAND_OFF, at.z)
	props.add_child(panel)


## Tiny black specks around a point; they stand still until real flies exist.
static func _add_flies(props: Node3D, around: Vector3) -> void:
	var scatter := RandomNumberGenerator.new()
	scatter.seed = 5
	for index in FLIES:
		var speck := MeshInstance3D.new()
		var mesh := BoxMesh.new()
		mesh.size = Vector3.ONE * 0.02
		mesh.material = _material(FLY)
		speck.mesh = mesh
		speck.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		speck.position = (
			around
			+ Vector3(
				scatter.randf_range(0.0, 0.4),
				scatter.randf_range(-0.3, 0.3),
				scatter.randf_range(-0.3, 0.3)
			)
		)
		props.add_child(speck)


static func _panel(size: Vector2, colour: Color) -> MeshInstance3D:
	var quad := QuadMesh.new()
	quad.size = size
	quad.material = _material(colour)
	var panel := MeshInstance3D.new()
	panel.mesh = quad
	panel.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return panel


static func _material(colour: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = colour
	return material
