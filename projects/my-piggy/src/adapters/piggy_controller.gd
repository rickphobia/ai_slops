class_name PiggyController
extends CharacterBody3D
## First-person Piggy: WASD to walk, Ctrl or C to creep, Shift to trot, mouse to look while
## the mouse is captured, and doors nudged open by walking into them. The body moves it
## too: a lunge, a camera jerk, the twitching of the warning signs, and the head pressed
## into a bowl while giving in.
## Reads input through the input map (see project.godot), numbers from the Tuning.
## Main owns the mouse (capturing it, pausing), tells it what the body is doing, and turns
## this node off when the player has no control.

## Looking straight up or down would flip the camera over, so pitch stops short of 90°.
const PITCH_LIMIT: float = 1.4
## How far down the head is pressed while giving in: into the bowl, nearly straight down.
const GIVE_IN_PITCH: float = -1.3
## How fast a camera jerk settles back, per second (exponential).
const JERK_SETTLE_RATE: float = 6.0

var _tuning: Tuning
var _pitch: float = 0.0
## The player's sensitivity setting, a multiplier on the tuning's mouse_sensitivity.
var _sensitivity_scale: float = 1.0
## The body's limit on speed, as a fraction of normal (slowed by suppressing, 0 giving in).
var _speed_factor: float = 1.0
var _is_twitching: bool = false
## The camera's offset from where the player points it: x is yaw, y is pitch, in radians.
var _jerk: Vector2 = Vector2.ZERO
var _give_in_seconds_left: float = 0.0

@onready var _camera: Camera3D = $Camera3D


## Hands the controller its numbers. Call before it enters the scene tree.
func setup(tuning: Tuning) -> void:
	_tuning = tuning


func set_sensitivity_scale(scale: float) -> void:
	_sensitivity_scale = scale


## How fast the body lets the Piggy move this step, as a fraction of normal.
func set_speed_factor(factor: float) -> void:
	_speed_factor = factor


## Twitches the camera while the body shows its warning signs.
func set_warning(is_warning: bool) -> void:
	_is_twitching = is_warning


## True while the player is moving at trot speed: trot held, moving, and not creeping
## (creep wins when both are held).
func is_trotting() -> bool:
	var creeping := Input.is_action_pressed("creep")
	return Input.is_action_pressed("trot") and not creeping and _wanted_direction() != Vector2.ZERO


func _unhandled_input(event: InputEvent) -> void:
	var motion := event as InputEventMouseMotion
	if motion != null and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		look(motion.relative)


func _physics_process(delta: float) -> void:
	_give_in_seconds_left = maxf(_give_in_seconds_left - delta, 0.0)
	var wanted := _wanted_direction()
	var direction := global_transform.basis * Vector3(wanted.x, 0.0, wanted.y)
	var speed := _current_speed() * _speed_factor
	velocity.x = direction.x * speed
	velocity.z = direction.z * speed
	if not is_on_floor():
		var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
		velocity.y -= gravity * delta
	# Sliding cancels the part of the velocity that runs into a door, so remember the push first.
	var pushing := velocity
	move_and_slide()
	_push_doors(pushing)
	_move_camera(delta)


## Where the Piggy is and which way they face, for a checkpoint.
func pose() -> PiggyPose:
	return PiggyPose.new(global_position, rotation.y, _pitch)


## Puts the Piggy back at a pose, standing still.
func place(at: PiggyPose) -> void:
	global_position = at.position
	rotation.y = at.yaw
	_pitch = at.pitch
	velocity = Vector3.ZERO
	_jerk = Vector2.ZERO
	_give_in_seconds_left = 0.0
	_apply_camera()


## Turns the view by a mouse movement in pixels. Ignored while giving in: the head is in the bowl.
func look(relative: Vector2) -> void:
	if _give_in_seconds_left > 0.0:
		return
	var sensitivity := _tuning.mouse_sensitivity * _sensitivity_scale
	rotate_y(-relative.x * sensitivity)
	_pitch = clampf(_pitch - relative.y * sensitivity, -PITCH_LIMIT, PITCH_LIMIT)
	_apply_camera()


## An outburst throws the head about.
func jerk_camera() -> void:
	var size := _tuning.outburst_camera_jerk
	_jerk = Vector2(randf_range(-size, size), randf_range(-size, size))
	_apply_camera()


## A lunge outburst throws the Piggy forward a short way; walls still stop them.
func lunge() -> void:
	move_and_collide(-global_transform.basis.z * _tuning.lunge_distance)


## Turns to a give-in spot and presses the head down into it; looking away is blocked until
## the time is up.
func start_give_in(spot: Vector3, seconds: float) -> void:
	var toward := spot - global_position
	if Vector2(toward.x, toward.z).length() > 0.01:
		rotation.y = atan2(-toward.x, -toward.z)
	_pitch = GIVE_IN_PITCH
	_give_in_seconds_left = seconds
	_apply_camera()


func _wanted_direction() -> Vector2:
	return Input.get_vector("move_left", "move_right", "move_forward", "move_back")


func _current_speed() -> float:
	if Input.is_action_pressed("creep"):
		return _tuning.creep_speed
	if Input.is_action_pressed("trot"):
		return _tuning.trot_speed
	return _tuning.walk_speed


func _move_camera(delta: float) -> void:
	_jerk *= exp(-JERK_SETTLE_RATE * delta)
	if _is_twitching and _give_in_seconds_left <= 0.0:
		var size := _tuning.warning_camera_twitch
		_jerk += Vector2(randf_range(-size, size), randf_range(-size, size)) * 0.5
	_apply_camera()


func _apply_camera() -> void:
	_camera.rotation.x = clampf(_pitch + _jerk.y, -PITCH_LIMIT, PITCH_LIMIT)
	_camera.rotation.y = _jerk.x


## Each door the Piggy ran into this step is pushed once, at the first point it was touched.
func _push_doors(pushing: Vector3) -> void:
	var pushed: Array[Door] = []
	for index in get_slide_collision_count():
		var collision := get_slide_collision(index)
		var door := collision.get_collider() as Door
		if door != null and not pushed.has(door):
			pushed.append(door)
			door.push(pushing, collision.get_position())
