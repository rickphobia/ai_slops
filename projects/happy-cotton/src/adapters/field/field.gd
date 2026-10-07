class_name Field
extends Node3D
## The field the Worker works: a grid of plots seen from a fixed, angled camera. Shows each
## plot's growth stage with placeholder shapes, shows the time left on a growing plot, and
## reports which plot was tapped. Knows nothing of the rules beyond the plot views it is shown.
##
## Touches and mouse clicks arrive the same way: Godot turns a touch into a left click
## (input_devices/pointing/emulate_mouse_from_touch, on by default), so only clicks are handled.

signal plot_tapped(index: int)

## Plots are raised beds this tall, in metres, centred on the ground.
const SOIL_HEIGHT := 0.1
## Placeholder colours until ticket 05 gives the field its grounded look.
const SOIL_COLOUR := Color(0.36, 0.27, 0.19)
const LEAF_COLOUR := Color(0.33, 0.45, 0.24)
const FLOWER_COLOUR := Color(0.86, 0.8, 0.55)
const COTTON_COLOUR := Color(0.95, 0.94, 0.9)

@export var columns := 4
@export var rows := 3
@export var spacing := 2.4
@export var plot_size := 2.0
## How long the time-left label stays up after a tap, in seconds.
@export var time_left_shown_seconds := 3.0

var _grid: PlotGrid
var _crops: Array[MeshInstance3D] = []
var _crop_looks: Dictionary[PlotView.Stage, Mesh] = {}
var _labelled_plot := -1
var _label_seconds_remaining := 0.0

@onready var _camera: Camera3D = $Camera
@onready var _time_left: Label3D = $TimeLeft


func _ready() -> void:
	_grid = PlotGrid.new(columns, rows, spacing, plot_size)
	_crop_looks = _make_crop_looks()
	var soil := BoxMesh.new()
	soil.size = Vector3(plot_size, SOIL_HEIGHT, plot_size)
	soil.material = _material(SOIL_COLOUR)
	for index in _grid.count():
		var plot := Node3D.new()
		plot.name = "Plot%d" % index
		plot.position = _grid.centre_of(index)
		var soil_instance := MeshInstance3D.new()
		soil_instance.mesh = soil
		plot.add_child(soil_instance)
		var crop := MeshInstance3D.new()
		crop.visible = false
		plot.add_child(crop)
		_crops.append(crop)
		add_child(plot)
	_time_left.visible = false


func plot_count() -> int:
	return _grid.count()


## Redraws every plot from the rules' views, and keeps the time-left label current.
func show_plots(views: Array[PlotView]) -> void:
	for index in views.size():
		var stage := views[index].stage
		var crop := _crops[index]
		crop.visible = stage != PlotView.Stage.EMPTY
		if crop.visible and crop.mesh != _crop_looks[stage]:
			crop.mesh = _crop_looks[stage]
			# Meshes are centred on their origin; lift each one so it stands on the soil.
			crop.position.y = SOIL_HEIGHT / 2.0 - crop.mesh.get_aabb().position.y
	if _labelled_plot >= 0:
		var labelled := views[_labelled_plot]
		if labelled.seconds_left <= 0.0:
			_hide_time_left()
		else:
			_time_left.text = time_left_text(labelled.seconds_left)


## Shows how long a growing plot has left, above the plot, for a few seconds.
func show_time_left(index: int, seconds_left: float) -> void:
	_labelled_plot = index
	_label_seconds_remaining = time_left_shown_seconds
	_time_left.position = _grid.centre_of(index) + Vector3(0.0, 1.4, 0.0)
	_time_left.text = time_left_text(seconds_left)
	_time_left.visible = true


## "2:05 left": whole seconds rounded up, so the label never shows 0:00 on a growing plot.
static func time_left_text(seconds_left: float) -> String:
	var whole := ceili(seconds_left)
	return "%d:%02d left" % [floori(whole / 60.0), whole % 60]


func _process(delta: float) -> void:
	if _labelled_plot < 0:
		return
	_label_seconds_remaining -= delta
	if _label_seconds_remaining <= 0.0:
		_hide_time_left()


func _unhandled_input(event: InputEvent) -> void:
	if not event is InputEventMouseButton:
		return
	var click := event as InputEventMouseButton
	if not click.pressed or click.button_index != MOUSE_BUTTON_LEFT:
		return
	var index := _plot_under(click.position)
	if index >= 0:
		get_viewport().set_input_as_handled()
		plot_tapped.emit(index)


## The plot under a screen position: follow the camera ray down to the ground (y = 0).
func _plot_under(screen_position: Vector2) -> int:
	var origin := _camera.project_ray_origin(screen_position)
	var direction := _camera.project_ray_normal(screen_position)
	if direction.y >= 0.0:
		return -1
	var ground_point := origin + direction * (-origin.y / direction.y)
	return _grid.index_at(ground_point)


func _hide_time_left() -> void:
	_labelled_plot = -1
	_time_left.visible = false


func _make_crop_looks() -> Dictionary[PlotView.Stage, Mesh]:
	var seedling := CylinderMesh.new()
	seedling.top_radius = 0.1
	seedling.bottom_radius = 0.15
	seedling.height = 0.6
	seedling.material = _material(LEAF_COLOUR)
	var flowering := SphereMesh.new()
	flowering.radius = 0.35
	flowering.height = 0.7
	flowering.material = _material(FLOWER_COLOUR)
	var boll := SphereMesh.new()
	boll.radius = 0.45
	boll.height = 0.9
	boll.material = _material(LEAF_COLOUR)
	var ripe := SphereMesh.new()
	ripe.radius = 0.6
	ripe.height = 1.2
	ripe.material = _material(COTTON_COLOUR)
	return {
		PlotView.Stage.SEEDLING: seedling,
		PlotView.Stage.FLOWERING: flowering,
		PlotView.Stage.BOLL: boll,
		PlotView.Stage.RIPE: ripe,
	}


func _material(colour: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = colour
	material.roughness = 1.0
	return material
