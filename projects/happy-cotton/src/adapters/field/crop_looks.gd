class_name CropLooks
extends RefCounted
## Builds what a cotton plant looks like at each growth stage, from the CC0 plant models in
## assets/ (credits in assets/CREDITS.md). Each look is a fresh node standing on y = 0.
##
## The models share one green material; it is replaced with a dusty, muted one so the crop
## matches the field. Flowers and bolls are small low-poly spheres added on top.

const LEAF_COLOUR := Color(0.36, 0.4, 0.27)
const FLOWER_COLOUR := Color(0.85, 0.8, 0.62)
const GREEN_BOLL_COLOUR := Color(0.42, 0.44, 0.28)
const COTTON_COLOUR := Color(0.9, 0.88, 0.82)

const SEEDLING_MODEL := preload("res://assets/kenney-nature-kit/crops_leafsStageA.glb")
const YOUNG_PLANT_MODEL := preload("res://assets/kenney-nature-kit/crops_leafsStageB.glb")
const BUSH_MODEL := preload("res://assets/kenney-nature-kit/plant_bushDetailed.glb")

## Where buds sit on the bush, as fractions of its size: spread over the top and sides.
const BUD_SPOTS: Array[Vector3] = [
	Vector3(0.0, 1.0, 0.0),
	Vector3(0.55, 0.75, 0.2),
	Vector3(-0.5, 0.7, 0.35),
	Vector3(0.15, 0.65, -0.6),
	Vector3(-0.35, 0.85, -0.3),
	Vector3(0.4, 0.5, 0.55),
	Vector3(-0.6, 0.45, -0.1),
]

## Public so tests can find the open bolls on a ripe plant.
var cotton := _material(COTTON_COLOUR)

var _leaf := _material(LEAF_COLOUR)
var _flower := _material(FLOWER_COLOUR)
var _green_boll := _material(GREEN_BOLL_COLOUR)


## A new node showing the plant at a stage. EMPTY has no plant, so it is an empty node.
func build(stage: PlotView.Stage) -> Node3D:
	match stage:
		PlotView.Stage.SEEDLING:
			return _plant(SEEDLING_MODEL, 2.0)
		PlotView.Stage.FLOWERING:
			return _with_buds(_plant(YOUNG_PLANT_MODEL, 1.8), 1.2, 4, 0.06, _flower)
		PlotView.Stage.BOLL:
			return _with_buds(_plant(BUSH_MODEL, 2.6), 0.9, 7, 0.08, _green_boll)
		PlotView.Stage.RIPE:
			return _with_buds(_plant(BUSH_MODEL, 2.8), 0.97, 7, 0.13, cotton)
	return Node3D.new()


func _plant(model: PackedScene, scale: float) -> Node3D:
	var plant := model.instantiate() as Node3D
	plant.scale = Vector3.ONE * scale
	for mesh in plant.find_children("*", "MeshInstance3D", true, false):
		(mesh as MeshInstance3D).material_override = _leaf
	return plant


## Adds round buds over the plant's outer surface. Sizes are in metres, after scaling.
func _with_buds(
	plant: Node3D, reach: float, count: int, radius: float, material: Material
) -> Node3D:
	var bud := SphereMesh.new()
	bud.radius = radius
	bud.height = radius * 2.0
	bud.radial_segments = 8
	bud.rings = 4
	bud.material = material
	var size := _bounds_of(plant).size * plant.scale
	var holder := Node3D.new()
	holder.add_child(plant)
	for spot_index in count:
		var spot := BUD_SPOTS[spot_index]
		var instance := MeshInstance3D.new()
		instance.mesh = bud
		instance.position = Vector3(
			spot.x * size.x / 2.0 * reach, spot.y * size.y * reach, spot.z * size.z / 2.0 * reach
		)
		holder.add_child(instance)
	return holder


## The plant's unscaled bounds, from its meshes (all imported at the model's origin).
func _bounds_of(plant: Node3D) -> AABB:
	var bounds := AABB()
	for mesh in plant.find_children("*", "MeshInstance3D", true, false):
		bounds = bounds.merge((mesh as MeshInstance3D).mesh.get_aabb())
	return bounds


func _material(colour: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = colour
	material.roughness = 1.0
	return material
