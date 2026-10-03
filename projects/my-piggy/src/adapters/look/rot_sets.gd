class_name RotSets
extends Node3D
## Shows each space of the house at its rot stage: the colour of its walls and floor, the
## colour of its lamp, and its props (RotProps). Tells the Night which spaces the Piggy can
## see into, since a space only rots while out of view.
## Rot changes colours, never light: every wall and lamp colour is scaled to the brightness
## of the one in the house scene, and lamp energy and placement are never touched, so the
## hiding places are as dark at every stage.

## A space's rot stage changed; the ambient bed plays its sound set.
signal rot_changed(space: StringName, stage: Hallucinations.Rot)

## Wall and floor tints per stage: warm and saturated, sour yellow-green, wet meat.
const SHELL_TINTS: Dictionary[Hallucinations.Rot, Color] = {
	Hallucinations.Rot.COSY: Color(0.85, 0.55, 0.35),
	Hallucinations.Rot.SOURED: Color(0.6, 0.62, 0.3),
	Hallucinations.Rot.GROTESQUE: Color(0.75, 0.2, 0.22),
}
## Lamp tints per stage: amber, sour, sickly green-brown.
const LAMP_TINTS: Dictionary[Hallucinations.Rot, Color] = {
	Hallucinations.Rot.COSY: Color(1.0, 0.68, 0.35),
	Hallucinations.Rot.SOURED: Color(0.9, 0.9, 0.45),
	Hallucinations.Rot.GROTESQUE: Color(0.55, 0.6, 0.25),
}
## Where in a space the eyes look for it: its middle and four points near its corners, at
## eye height, this far in from the walls.
const SIGHT_HEIGHT := 1.5
const SIGHT_INSET := 0.4

## The Piggy's eyes. Until set, nothing is in view.
var eyes: Camera3D
## Bodies the line of sight passes through (the Piggy's own).
var ignored: Array[RID] = []

var _night: Night
var _house: House
var _shown: Dictionary[StringName, Hallucinations.Rot] = {}
var _shells: Dictionary[StringName, CSGCombiner3D] = {}
var _lamps: Dictionary[StringName, OmniLight3D] = {}
var _materials: Dictionary[StringName, Dictionary] = {}
var _lamp_colours: Dictionary[StringName, Dictionary] = {}
var _props: Dictionary[StringName, Dictionary] = {}


## The colour `tint` at the brightness (luminance) of `like`.
static func at_brightness_of(tint: Color, like: Color) -> Color:
	var scaled := tint * (like.get_luminance() / tint.get_luminance())
	scaled.a = like.a
	return scaled


## Adds every space of the house to the Night's hallucinations and builds its three sets.
## Call once, after the house is in the tree.
func setup(night: Night, house: House) -> void:
	_night = night
	_house = house
	for space in house.spaces():
		night.hallucinations.add_space(space, night.body.humanity)
		_build(space)
		_show(space, night.hallucinations.rot(space))


func shown(space: StringName) -> Hallucinations.Rot:
	return _shown[space]


func _physics_process(_delta: float) -> void:
	if _night == null:
		return
	_night.look_at_spaces(_spaces_in_view())
	for space: StringName in _shown:
		var stage := _night.hallucinations.rot(space)
		if stage != _shown[space]:
			_show(space, stage)


func _build(space: StringName) -> void:
	var shell := _house.space_shell(space)
	var lamp := _house.space_lamp(space)
	_shells[space] = shell
	_lamps[space] = lamp
	var floor_part: CSGBox3D = shell.get_child(0)
	var base: ShaderMaterial = floor_part.material
	var base_albedo: Color = base.get_shader_parameter("albedo")
	var materials: Dictionary[Hallucinations.Rot, ShaderMaterial] = {}
	var lamp_colours: Dictionary[Hallucinations.Rot, Color] = {}
	var props: Dictionary[Hallucinations.Rot, Node3D] = {}
	for stage: Hallucinations.Rot in SHELL_TINTS:
		var material: ShaderMaterial = base.duplicate()
		material.set_shader_parameter("albedo", at_brightness_of(SHELL_TINTS[stage], base_albedo))
		materials[stage] = material
		lamp_colours[stage] = at_brightness_of(LAMP_TINTS[stage], lamp.light_color)
		var stage_props := RotProps.build(stage, _house.space_box(space))
		stage_props.visible = false
		add_child(stage_props)
		stage_props.name = "%s%s" % [String(space).capitalize(), stage_props.name]
		props[stage] = stage_props
	_materials[space] = materials
	_lamp_colours[space] = lamp_colours
	_props[space] = props


func _show(space: StringName, stage: Hallucinations.Rot) -> void:
	_shown[space] = stage
	for part: CSGBox3D in _shells[space].get_children():
		part.material = _materials[space][stage]
	_lamps[space].light_color = _lamp_colours[space][stage]
	var props: Dictionary = _props[space]
	for each: Hallucinations.Rot in props:
		var stage_props: Node3D = props[each]
		stage_props.visible = each == stage
	var which: String = Hallucinations.Rot.find_key(stage)
	GameLog.debug("The %s now looks %s" % [space, which.to_lower()])
	rot_changed.emit(space, stage)


## The space the eyes are in, and every space they can see a sight point of.
func _spaces_in_view() -> Array[StringName]:
	var in_view: Array[StringName] = []
	if eyes == null or not eyes.is_inside_tree():
		return in_view
	var here := _house.space_at(eyes.global_position)
	var world := eyes.get_world_3d().direct_space_state
	for space: StringName in _shown:
		if space == here or _can_see_into(world, _house.space_box(space)):
			in_view.append(space)
	return in_view


func _can_see_into(world: PhysicsDirectSpaceState3D, box: AABB) -> bool:
	var middle := box.get_center()
	var reach := box.size / 2.0 - Vector3.ONE * SIGHT_INSET
	for corner: Vector2 in [
		Vector2.ZERO, Vector2(-1, -1), Vector2(-1, 1), Vector2(1, -1), Vector2(1, 1)
	]:
		var point := Vector3(
			middle.x + corner.x * reach.x, SIGHT_HEIGHT, middle.z + corner.y * reach.z
		)
		if not eyes.is_position_in_frustum(point):
			continue
		var query := PhysicsRayQueryParameters3D.create(eyes.global_position, point)
		query.exclude = ignored
		if world.intersect_ray(query).is_empty():
			return true
	return false
