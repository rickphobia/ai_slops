class_name WorkerMotion
extends RefCounted
## Moves the Worker model to match what the rules say he is doing. Sent to the Generator, he
## walks out through the fence's gate to the turnstile and runs laps of the track, keeping in
## step with the rules' lap clock so he passes the turnstile as each lap ends. He slows on his
## last lap, staggers and stands bent over at the turnstile to breathe, and goes back along the
## track and through the gate to his place beside the plots when he is sent to the field or to
## rest. As Exhaustion rises he slumps forward and his walk slows. Only the Worker's own walk,
## run, stagger and idle animations are used; never a fighting one.

## Emitted each time he runs through the turnstile, so the field can turn it.
signal pushed_through_turnstile

const WALK_SPEED := 1.4
## On the way back he jogs along the track to the gate, at this speed, in metres a second.
const JOG_BACK_SPEED := 2.6
## The share of the gap to the lap clock's place he closes each second. He trails it by its
## speed divided by this: under a metre at a running pace.
const KEEP_UP_RATE := 4.0
## However far behind the lap clock he is, he never runs faster than this, in metres a second.
const FASTEST_RUN_SPEED := 6.0
## Moving slower than this, in metres a second, he walks rather than runs.
const RUN_FROM_SPEED := 2.0
## The ground speed the Run animation's stride matches at its normal speed.
const RUN_STRIDE_SPEED := 3.5
## His pace as he reaches the turnstile at the end of his last lap, as a share of his usual.
const LAST_LAP_END_PACE := 0.5
## Closer than this to where he should be, in metres, and he is there.
const ARRIVED_WITHIN := 0.02
## How far he leans forward, and how slowly his animations play, fully exhausted.
const MOST_SLUMP_DEGREES := 14.0
const SLOWEST_ANIMATION_SPEED := 0.6
const STANDING := &"Idle_Neutral"
const WALKING := &"Walk"
const RUNNING := &"Run"
const STAGGERING := &"HitRecieve"
const BREATHING := &"Idle"
## Played on a loop; the stagger plays once, then he breathes.
const LOOPING: Array[StringName] = [STANDING, WALKING, RUNNING, BREATHING]

var _body: Node3D
var _player: AnimationPlayer
var _track: TrackPath
## The way from his place beside the plots, through the gate, to the turnstile.
var _gate_way: Curve3D = Curve3D.new()
var _home_facing: float
var _activity := WorkerView.Activity.IN_FIELD
var _laps_left := 0
var _lap_progress := 0.0
## On the track, or somewhere on the way between it and his place.
var _on_track := false
## Off the track: how far along the way to the turnstile he is.
var _way_distance := 0.0
## On the track: how far past the turnstile he is, above 0 and up to one lap. A whole lap
## means he stands at the turnstile, not yet through it.
var _track_distance := 0.0
var _breath_shown := false
## 1 rested, down to SLOWEST_ANIMATION_SPEED spent: his walk and animations together.
var _speed := 1.0


## `body` starts at his place beside the plots. `player` may be null if the model has none;
## he then moves without animating. `gate` is a point just inside the fence's gate.
func _init(body: Node3D, player: AnimationPlayer, track: TrackPath, gate: Vector3) -> void:
	_body = body
	_player = player
	_track = track
	_home_facing = body.rotation.y
	for point: Vector3 in [body.position, gate, track.point_at(0.0)]:
		_gate_way.add_point(point)
	if _player != null:
		for animation in LOOPING:
			_player.get_animation(animation).loop_mode = Animation.LOOP_LINEAR
	_play(STANDING)


## Takes the rules' latest view of the Worker; update() moves him to match it.
func show(view: WorkerView) -> void:
	_slump(view.exhaustion / Exhaustion.MOST)
	if view.activity != WorkerView.Activity.BREATHING:
		_breath_shown = false
	_activity = view.activity
	_laps_left = view.laps_left
	_lap_progress = view.lap_progress


## Moves him some seconds closer to where he should be.
func update(delta: float) -> void:
	if delta <= 0.0:
		return
	if _is_home():
		if _on_track:
			_jog_back(delta)
		else:
			_walk_way(-WALK_SPEED * _speed * delta)
	elif _on_track:
		_keep_up(delta)
	else:
		_walk_way(WALK_SPEED * _speed * delta)


## In the field or resting, his place is beside the plots.
func _is_home() -> bool:
	return _activity in [WorkerView.Activity.IN_FIELD, WorkerView.Activity.RESTING]


## Walks a distance along the way to the turnstile (negative: back towards his place).
func _walk_way(distance: float) -> void:
	var way_length := _gate_way.get_baked_length()
	var was := _way_distance
	_way_distance = clampf(_way_distance + distance, 0.0, way_length)
	_body.position = _gate_way.sample_baked(_way_distance)
	if _way_distance == was:
		if _way_distance == 0.0:
			_body.rotation.y = _home_facing
			_play(STANDING)
		return
	_face(_gate_way.sample_baked(_way_distance + signf(distance) * 0.05) - _body.position)
	_play(WALKING)
	if _way_distance == way_length:
		_on_track = true
		_track_distance = _track.length()


## Back along the track the shorter way to the turnstile, then off it towards the gate.
func _jog_back(delta: float) -> void:
	var lap := _track.length()
	var forwards := _track_distance >= lap / 2.0
	var left := lap - _track_distance if forwards else _track_distance
	var step := minf(JOG_BACK_SPEED * _speed * delta, left)
	_track_distance += step if forwards else -step
	_body.position = _track.point_at(_track_distance)
	_face(_track.heading_at(_track_distance) * (1.0 if forwards else -1.0))
	_play_moving(step / delta)
	if is_equal_approx(step, left):
		_on_track = false


## Runs towards the lap clock's place on the track, or towards the turnstile to breathe.
func _keep_up(delta: float) -> void:
	var lap := _track.length()
	var breathing := _activity == WorkerView.Activity.BREATHING
	var target := 0.0 if breathing else _clock_distance() * lap
	var gap := fposmod(target - _track_distance, lap)
	if gap > lap / 2.0 and not breathing:
		# The clock is behind him, which only happens when he comes back to the turnstile
		# part way through a lap: he waits there for it to come round.
		_face(_track.heading_at(_track_distance))
		_play(STANDING)
		return
	if gap < ARRIVED_WITHIN:
		_track_distance = fposmod(target - ARRIVED_WITHIN / 2.0, lap) + ARRIVED_WITHIN / 2.0
		if breathing:
			_breathe()
		return
	var step := minf(gap * (1.0 - exp(-KEEP_UP_RATE * delta)), FASTEST_RUN_SPEED * delta)
	_track_distance += step
	if _track_distance > lap:
		_track_distance -= lap
		pushed_through_turnstile.emit()
	_body.position = _track.point_at(_track_distance)
	_face(_track.heading_at(_track_distance))
	_play_moving(step / delta)


## How far round the track the lap clock has him, as a share of a lap. On his last lap he
## starts at his usual pace and eases to LAST_LAP_END_PACE of it by the turnstile.
func _clock_distance() -> float:
	var progress := _lap_progress
	if _laps_left > 1:
		return progress
	var ease := 1.0 - LAST_LAP_END_PACE
	return progress + ease * progress * progress * (1.0 - progress)


## Stands him bent over at the turnstile. He staggers into each breath once.
func _breathe() -> void:
	_body.position = _track.point_at(0.0)
	_face(_track.heading_at(0.0))
	if _breath_shown:
		return
	_breath_shown = true
	if _player != null:
		_player.speed_scale = _speed
		_player.play(STAGGERING)
		_player.queue(BREATHING)


## Walks or runs, in step with how fast he is moving over the ground.
func _play_moving(ground_speed: float) -> void:
	if ground_speed < RUN_FROM_SPEED:
		_play(WALKING, ground_speed / WALK_SPEED)
	else:
		_play(RUNNING, ground_speed / RUN_STRIDE_SPEED)


## Leans him forward and slows him in step with `share` of the most Exhaustion.
func _slump(share: float) -> void:
	_body.rotation.x = deg_to_rad(MOST_SLUMP_DEGREES) * share
	_speed = lerpf(1.0, SLOWEST_ANIMATION_SPEED, share)
	if _player != null:
		_player.speed_scale = _speed


## Turns him to face along a direction on the ground. The model faces +z.
func _face(direction: Vector3) -> void:
	if not direction.is_zero_approx():
		_body.rotation.y = atan2(direction.x, direction.z)


## `pace` is the animation's speed relative to normal; standing and breathing play at the
## Exhaustion slowdown.
func _play(animation: StringName, pace := -1.0) -> void:
	if _player == null:
		return
	_player.speed_scale = _speed if pace < 0.0 else clampf(pace, 0.5, 1.8)
	if _player.current_animation != animation:
		_player.play(animation)
