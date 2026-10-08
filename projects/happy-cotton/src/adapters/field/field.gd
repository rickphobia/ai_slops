class_name Field
extends Node3D
## The field the Worker works: a fenced grid of plots seen from a fixed, angled camera, with
## the Worker beside it and the Generator outside its gate. Shows each plot's growth stage as
## a cotton plant (see CropLooks), shows the time left on a growing plot, shows the Worker
## walking to the Generator and running on it (see WorkerMotion), and reports which plot, or
## the Generator, was tapped. Knows nothing of the rules beyond the views it is shown.
##
## Dragging pans the camera and pinching or the mouse wheel zooms it (within FieldCamera's
## limits); a tap counts on release, only if the pointer barely moved (PointerGesture).
## Touches are read as touches, so a pinch's two fingers can be told apart; the left clicks
## Godot makes up from a touch (emulate_mouse_from_touch, kept on so The App's buttons work
## with touch) are ignored here. Input reaches this only after The App's controls pass on it.

signal plot_tapped(index: int)
signal generator_tapped

## Plots are raised beds this tall, in metres, centred on the ground.
const SOIL_HEIGHT := 0.1
## Tilled soil: the dust texture, darker.
const SOIL_COLOUR := Color(0.42, 0.34, 0.27)
const SOIL_TEXTURE := preload("res://assets/polyhaven/dry_ground_01_diff_1k.jpg")
## How far a finger or the mouse may move between press and release, in viewport units
## (the 1280x720 base size, whatever the screen), and still count as a tap.
const TAP_SLOP := 12.0
## The pointer id the mouse uses in a gesture; touch fingers are numbered from 0.
const MOUSE_POINTER := -2

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
var _gesture := PointerGesture.new(TAP_SLOP)
var _worker: WorkerMotion
var _view: FieldCamera
## The unit vector from the ground back to the camera: the camera's fixed angle.
var _camera_back: Vector3

@onready var _camera: Camera3D = $Camera
@onready var _time_left: Label3D = $TimeLeft
@onready var _generator: Generator = $Generator


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
	add_child(FenceLook.build(_fence_half_size(), _generator.position.z))
	_start_camera()
	_start_worker()
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


## Shows the Worker where the rules put him, and lights the loudspeaker while he runs.
func show_worker(view: WorkerView) -> void:
	_worker.show(view)
	_generator.set_lit(view.activity == WorkerView.Activity.RUNNING)


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
	_worker.update(delta)
	if _labelled_plot < 0:
		return
	_label_seconds_remaining -= delta
	if _label_seconds_remaining <= 0.0:
		_hide_time_left()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		_on_pointer_button(touch.index, touch.position, touch.pressed, touch.canceled)
	elif event is InputEventScreenDrag:
		var drag := event as InputEventScreenDrag
		_move_pointer(drag.index, drag.position)
	elif event.device == InputEvent.DEVICE_ID_EMULATION:
		return
	elif event is InputEventMouseButton:
		var click := event as InputEventMouseButton
		if click.button_index == MOUSE_BUTTON_LEFT:
			_on_pointer_button(MOUSE_POINTER, click.position, click.pressed, false)
		elif click.pressed and click.button_index == MOUSE_BUTTON_WHEEL_UP:
			_zoom_at(click.position, 1.0 / FieldCamera.WHEEL_ZOOM_STEP)
		elif click.pressed and click.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_zoom_at(click.position, FieldCamera.WHEEL_ZOOM_STEP)
		else:
			return
	elif event is InputEventMouseMotion:
		if not _gesture.is_pressed(MOUSE_POINTER):
			return
		_move_pointer(MOUSE_POINTER, (event as InputEventMouseMotion).position)
	else:
		return
	get_viewport().set_input_as_handled()


func _on_pointer_button(pointer: int, position: Vector2, pressed: bool, canceled: bool) -> void:
	if pressed:
		_gesture.press(pointer, position)
	elif canceled:
		_gesture.cancel(pointer)
	elif _gesture.release(pointer):
		var ground_point := _ground_under(position)
		if not ground_point.is_finite():
			return
		var index := _grid.index_at(ground_point)
		if index >= 0:
			plot_tapped.emit(index)
		elif _generator.covers(ground_point):
			generator_tapped.emit()


## One finger pans so the ground under it stays under it; two pan by their midpoint and zoom
## by how much their spread changed, towards the point between them.
func _move_pointer(pointer: int, position: Vector2) -> void:
	var midpoint_before := _gesture.midpoint()
	var spread_before := _gesture.spread()
	_gesture.move(pointer, position)
	_pan(midpoint_before, _gesture.midpoint())
	var spread_after := _gesture.spread()
	if spread_before > 0.0 and spread_after > 0.0:
		_zoom_at(_gesture.midpoint(), spread_before / spread_after)


## Slides the camera so the ground under one screen point moves to another.
func _pan(from_screen: Vector2, to_screen: Vector2) -> void:
	var from_ground := _ground_under(from_screen)
	var to_ground := _ground_under(to_screen)
	if not from_ground.is_finite() or not to_ground.is_finite():
		return
	var offset := from_ground - to_ground
	_view.pan(Vector2(offset.x, offset.z))
	_place_camera()


## Zooms by a factor while keeping the ground under a screen point where it is.
func _zoom_at(screen_position: Vector2, factor: float) -> void:
	var anchor := _ground_under(screen_position)
	_view.zoom_by(factor)
	_place_camera()
	var drifted := _ground_under(screen_position)
	if not anchor.is_finite() or not drifted.is_finite():
		return
	var offset := anchor - drifted
	_view.pan(Vector2(offset.x, offset.z))
	_place_camera()


## Where the camera ray through a screen position meets the ground (y = 0); not finite when
## the ray never comes down to it.
func _ground_under(screen_position: Vector2) -> Vector3:
	var origin := _camera.project_ray_origin(screen_position)
	var direction := _camera.project_ray_normal(screen_position)
	if direction.y >= 0.0:
		return Vector3(INF, INF, INF)
	return origin + direction * (-origin.y / direction.y)


## The camera starts where the scene puts it; from then on it keeps that angle and only
## slides and zooms along it, over the fenced field.
func _start_camera() -> void:
	_camera_back = _camera.transform.basis.z.normalized()
	var start_distance := _camera.position.y / _camera_back.y
	var start_focus := _camera.position - _camera_back * start_distance
	_view = FieldCamera.new(
		Vector2(start_focus.x, start_focus.z), start_distance, _fence_half_size()
	)
	_place_camera()


func _place_camera() -> void:
	_camera.position = _view.position_along(_camera_back)


func _hide_time_left() -> void:
	_labelled_plot = -1
	_time_left.visible = false


## How far the fence reaches from the field's centre: across (x) and front to back (y).
func _fence_half_size() -> Vector2:
	return Vector2(
		(columns - 1) * spacing / 2.0 + plot_size / 2.0 + fence_margin,
		(rows - 1) * spacing / 2.0 + plot_size / 2.0 + fence_margin
	)


func _start_worker() -> void:
	var body: Node3D = $Worker
	var players := body.find_children("*", "AnimationPlayer", true, false)
	var player: AnimationPlayer = null
	if players.is_empty():
		GameLog.warning("worker has no animation player")
	else:
		player = players[0] as AnimationPlayer
	_worker = WorkerMotion.new(body, player, _generator.run_spot(), _generator.run_facing())


func _material(colour: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = colour
	material.roughness = 1.0
	return material
