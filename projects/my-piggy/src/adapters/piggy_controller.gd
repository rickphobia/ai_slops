class_name PiggyController
extends CharacterBody3D
## First-person Piggy: WASD to walk, mouse to look while the mouse is captured, and doors
## nudged open by walking into them.
## Reads input through the input map (see project.godot), numbers from the Tuning.
## Main owns the mouse (capturing it, pausing) and turns this node off when the player
## has no control.

## Looking straight up or down would flip the camera over, so pitch stops short of 90°.
const PITCH_LIMIT: float = 1.4

var _tuning: Tuning
var _pitch: float = 0.0
## The player's sensitivity setting, a multiplier on the tuning's mouse_sensitivity.
var _sensitivity_scale: float = 1.0

@onready var _camera: Camera3D = $Camera3D


## Hands the controller its numbers. Call before it enters the scene tree.
func setup(tuning: Tuning) -> void:
	_tuning = tuning


func set_sensitivity_scale(scale: float) -> void:
	_sensitivity_scale = scale


func _unhandled_input(event: InputEvent) -> void:
	var motion := event as InputEventMouseMotion
	if motion != null and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		look(motion.relative)


func _physics_process(delta: float) -> void:
	var wanted := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var direction := global_transform.basis * Vector3(wanted.x, 0.0, wanted.y)
	velocity.x = direction.x * _tuning.walk_speed
	velocity.z = direction.z * _tuning.walk_speed
	if not is_on_floor():
		var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
		velocity.y -= gravity * delta
	# Sliding cancels the part of the velocity that runs into a door, so remember the push first.
	var pushing := velocity
	move_and_slide()
	_push_doors(pushing)


## Where the Piggy is and which way they face, for a checkpoint.
func pose() -> PiggyPose:
	return PiggyPose.new(global_position, rotation.y, _pitch)


## Puts the Piggy back at a pose, standing still.
func place(at: PiggyPose) -> void:
	global_position = at.position
	rotation.y = at.yaw
	_pitch = at.pitch
	_camera.rotation.x = _pitch
	velocity = Vector3.ZERO


## Turns the view by a mouse movement in pixels. Called for each mouse motion while captured.
func look(relative: Vector2) -> void:
	var sensitivity := _tuning.mouse_sensitivity * _sensitivity_scale
	rotate_y(-relative.x * sensitivity)
	_pitch = clampf(_pitch - relative.y * sensitivity, -PITCH_LIMIT, PITCH_LIMIT)
	_camera.rotation.x = _pitch


## Each door the Piggy ran into this step is pushed once, at the first point it was touched.
func _push_doors(pushing: Vector3) -> void:
	var pushed: Array[Door] = []
	for index in get_slide_collision_count():
		var collision := get_slide_collision(index)
		var door := collision.get_collider() as Door
		if door != null and not pushed.has(door):
			pushed.append(door)
			door.push(pushing, collision.get_position())
