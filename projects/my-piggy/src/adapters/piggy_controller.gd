class_name PiggyController
extends CharacterBody3D
## First-person Piggy: WASD to walk, mouse to look, click to capture the mouse.
## Reads input through the input map (see project.godot), numbers from the Tuning.

## Looking straight up or down would flip the camera over, so pitch stops short of 90°.
const PITCH_LIMIT: float = 1.4

var _tuning: Tuning
var _pitch: float = 0.0

@onready var _camera: Camera3D = $Camera3D


## Hands the controller its numbers. Call before it enters the scene tree.
func setup(tuning: Tuning) -> void:
	_tuning = tuning


func _unhandled_input(event: InputEvent) -> void:
	var click := event as InputEventMouseButton
	if click != null and click.pressed:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		return
	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		return
	var motion := event as InputEventMouseMotion
	if motion != null and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		_look(motion.relative)


func _physics_process(delta: float) -> void:
	var wanted := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := global_transform.basis * Vector3(wanted.x, 0.0, wanted.y)
	velocity.x = direction.x * _tuning.walk_speed
	velocity.z = direction.z * _tuning.walk_speed
	if not is_on_floor():
		var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
		velocity.y -= gravity * delta
	move_and_slide()


func _look(relative: Vector2) -> void:
	rotate_y(-relative.x * _tuning.mouse_sensitivity)
	_pitch = clampf(_pitch - relative.y * _tuning.mouse_sensitivity, -PITCH_LIMIT, PITCH_LIMIT)
	_camera.rotation.x = _pitch
