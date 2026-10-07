class_name WorkerMotion
extends RefCounted
## Moves the Worker model to match what the rules say he is doing: he walks out to the
## Generator and runs on it, slows on his last lap, staggers and stands bent over to breathe,
## and walks back to his place beside the plots when he is sent to the field. Only the
## Worker's own walk, run, stagger and idle animations are used; never a fighting one.

const WALK_SPEED := 1.4
const STANDING := &"Idle_Neutral"
const WALKING := &"Walk"
const RUNNING := &"Run"
const STAGGERING := &"HitRecieve"
const BREATHING := &"Idle"
## Played on a loop; the stagger plays once, then he breathes.
const LOOPING: Array[StringName] = [STANDING, WALKING, RUNNING, BREATHING]

var _body: Node3D
var _player: AnimationPlayer
var _home: Vector3
var _home_facing: float
var _run_spot: Vector3
var _run_facing: float
var _activity := WorkerView.Activity.IN_FIELD
var _laps_left := 0


## `body` starts at his place beside the plots. `player` may be null if the model has none;
## he then moves without animating.
func _init(body: Node3D, player: AnimationPlayer, run_spot: Vector3, run_facing: float) -> void:
	_body = body
	_player = player
	_home = body.position
	_home_facing = body.rotation.y
	_run_spot = run_spot
	_run_facing = run_facing
	if _player != null:
		for animation in LOOPING:
			_player.get_animation(animation).loop_mode = Animation.LOOP_LINEAR
	_play(STANDING)


## Takes the rules' latest view of the Worker. A change is shown at once if he is already
## where it happens; otherwise when he gets there.
func show(view: WorkerView) -> void:
	if view.activity == _activity and view.laps_left == _laps_left:
		return
	var was := _activity
	_activity = view.activity
	_laps_left = view.laps_left
	if _arrived():
		_settle(was)


## Walks him some seconds closer to where he should be.
func update(delta: float) -> void:
	if _arrived():
		return
	var to_target := _target() - _body.position
	var step := WALK_SPEED * delta
	if step >= to_target.length():
		_body.position = _target()
		_settle(_activity)
		return
	_body.position += to_target.normalized() * step
	_body.rotation.y = atan2(to_target.x, to_target.z)
	_play(WALKING)


func _settle(was: WorkerView.Activity) -> void:
	match _activity:
		WorkerView.Activity.IN_FIELD:
			_body.rotation.y = _home_facing
			_play(STANDING)
		WorkerView.Activity.RUNNING:
			_body.rotation.y = _run_facing
			# On his last lap before he stops, he slows to a walk.
			_play(RUNNING if _laps_left > 1 else WALKING)
		WorkerView.Activity.BREATHING:
			_body.rotation.y = _run_facing
			if was == WorkerView.Activity.RUNNING and _player != null:
				_player.play(STAGGERING)
				_player.queue(BREATHING)
			else:
				_play(BREATHING)


func _target() -> Vector3:
	return _home if _activity == WorkerView.Activity.IN_FIELD else _run_spot


func _arrived() -> bool:
	return _body.position.is_equal_approx(_target())


func _play(animation: StringName) -> void:
	if _player != null and _player.current_animation != animation:
		_player.play(animation)
