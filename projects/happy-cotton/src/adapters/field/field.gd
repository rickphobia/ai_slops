class_name Field
extends Node3D
## The field the Worker works: a fenced grid of plots seen from a fixed, angled camera, with
## the Worker standing beside it. Shows each plot's growth stage as a cotton plant (see
## CropLooks), shows the time left on a growing plot, and reports which plot was tapped.
## Knows nothing of the rules beyond the plot views it is shown.
##
## Touches and mouse clicks arrive the same way: Godot turns a touch into a left click
## (input_devices/pointing/emulate_mouse_from_touch, on by default), so only clicks are handled.

signal plot_tapped(index: int)

## Plots are raised beds this tall, in metres, centred on the ground.
const SOIL_HEIGHT := 0.1
## Tilled soil: the dust texture, darker.
const SOIL_COLOUR := Color(0.42, 0.34, 0.27)
const SOIL_TEXTURE := preload("res://assets/polyhaven/dry_ground_01_diff_1k.jpg")
## Weathered, unpainted planks instead of the model's warm wood.
const FENCE_COLOUR := Color(0.33, 0.3, 0.26)
const FENCE_MODEL := preload("res://assets/kenney-nature-kit/fence_planks.glb")
## The fence model is one metre long; scaled up so it reaches a person's waist.
const FENCE_SCALE := 2.0
## How far back from its origin the fence model's planks sit, in model units.
const FENCE_BACK_EDGE := 0.465
## The Worker stands still, breathing, while the player taps.
const WORKER_ANIMATION := &"Idle_Neutral"

@export var columns := 4
@export var rows := 3
@export var spacing := 2.4
@export var plot_size := 2.0
## How long the time-left label stays up after a tap, in seconds.
@export var time_left_shown_seconds := 3.0
## The fence's distance from the outer plots' edges, in metres.
@export var fence_margin := 1.6

var _grid: PlotGrid
var _crop_looks := CropLooks.new()
var _crops: Array[Node3D] = []
var _shown_stages: Array[PlotView.Stage] = []
var _labelled_plot := -1
var _label_seconds_remaining := 0.0

@onready var _camera: Camera3D = $Camera
@onready var _time_left: Label3D = $TimeLeft


func _ready() -> void:
	_grid = PlotGrid.new(columns, rows, spacing, plot_size)
	var soil := BoxMesh.new()
	soil.size = Vector3(plot_size, SOIL_HEIGHT, plot_size)
	var soil_material := _material(SOIL_COLOUR)
	soil_material.albedo_texture = SOIL_TEXTURE
	soil.material = soil_material
	for index in _grid.count():
		var plot := Node3D.new()
		plot.name = "Plot%d" % index
		plot.position = _grid.centre_of(index)
		var soil_instance := MeshInstance3D.new()
		soil_instance.mesh = soil
		plot.add_child(soil_instance)
		var crop := Node3D.new()
		crop.position.y = SOIL_HEIGHT / 2.0
		plot.add_child(crop)
		_crops.append(crop)
		_shown_stages.append(PlotView.Stage.EMPTY)
		add_child(plot)
	_build_fence()
	_start_worker_idle()
	_time_left.visible = false


func plot_count() -> int:
	return _grid.count()


## Redraws every plot from the rules' views, and keeps the time-left label current.
func show_plots(views: Array[PlotView]) -> void:
	for index in views.size():
		var stage := views[index].stage
		if stage == _shown_stages[index]:
			continue
		_shown_stages[index] = stage
		var crop := _crops[index]
		for old_look in crop.get_children():
			old_look.queue_free()
		crop.add_child(_crop_looks.build(stage))
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


## A plank fence around the plots, one model per metre-run, leaving no gaps at the corners.
func _build_fence() -> void:
	var half_x := (columns - 1) * spacing / 2.0 + plot_size / 2.0 + fence_margin
	var half_z := (rows - 1) * spacing / 2.0 + plot_size / 2.0 + fence_margin
	var fence := Node3D.new()
	fence.name = "Fence"
	var planks := _material(FENCE_COLOUR)
	for side in [Vector2(0, -1), Vector2(0, 1), Vector2(-1, 0), Vector2(1, 0)] as Array[Vector2]:
		var along_x := side.y != 0.0
		var half_length := half_x if along_x else half_z
		var pieces := ceili(half_length * 2.0 / FENCE_SCALE)
		for piece in pieces:
			var offset := -half_length + (piece + 0.5) * half_length * 2.0 / pieces
			var section := FENCE_MODEL.instantiate() as Node3D
			for mesh in section.find_children("*", "MeshInstance3D", true, false):
				(mesh as MeshInstance3D).material_override = planks
			section.scale = Vector3(half_length * 2.0 / pieces, FENCE_SCALE, FENCE_SCALE)
			if along_x:
				section.position = Vector3(offset, 0.0, side.y * half_z)
			else:
				section.position = Vector3(side.x * half_x, 0.0, offset)
				section.rotation.y = PI / 2.0
			# The model's planks run along its back edge; move them onto the fence line.
			section.translate_object_local(Vector3(0.0, 0.0, FENCE_BACK_EDGE))
			fence.add_child(section)
	add_child(fence)


func _start_worker_idle() -> void:
	var players := $Worker.find_children("*", "AnimationPlayer", true, false)
	if players.is_empty():
		GameLog.warning("worker has no animation player")
		return
	var player := players[0] as AnimationPlayer
	player.get_animation(WORKER_ANIMATION).loop_mode = Animation.LOOP_LINEAR
	player.play(WORKER_ANIMATION)


func _material(colour: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = colour
	material.roughness = 1.0
	return material
