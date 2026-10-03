class_name Door
extends AnimatableBody3D
## An interior door the Piggy nudges open with their head. This body's origin is the hinge;
## the panel swings around it, away from whoever pushes, and stays where it was left. Each
## push creaks once, louder the faster it was pushed (see DoorCreak).

## A creak started: its noise radius in metres and where it came from. Ticket 06 turns
## this into a noise Mum can hear.
signal creaked(noise_radius: float, at: Vector3)

# How the door moves, not how the game plays (that is the tuning table's job).
## How far the door swings either way from closed. Past 90° it would cut into the wall.
const WIDEST_OPEN := PI / 2.0
## A push this close to the hinge would spin the door wildly, so the lever never counts
## as shorter than this, in metres.
const SHORTEST_LEVER := 0.25
## The panel moves a little faster than the push so the Piggy doesn't grind against it.
const FOLLOW_AHEAD := 1.2
## Physics frames without a push before the next push counts as a new one (and creaks).
const PUSH_GAP_FRAMES := 6

var _tuning: Tuning
var _angle: float = 0.0
var _last_push_frame: int = -1000

@onready var _creak: AudioStreamPlayer3D = $Creak


## Hands the door its numbers. Call before the first push.
func setup(tuning: Tuning) -> void:
	_tuning = tuning


func _ready() -> void:
	_creak.stream = PlaceholderSounds.creak()


## The Piggy pushed the panel at a point while trying to move at this velocity.
func push(velocity: Vector3, contact: Vector3) -> void:
	var along_panel := global_basis.x
	var lever := maxf((contact - global_position).dot(along_panel), SHORTEST_LEVER)
	# Direction a point on the panel moves when the door turns the positive way.
	var swing := Vector3.UP.cross(along_panel)
	var push_speed := velocity.dot(swing)
	var before := _angle
	var turn := push_speed / lever * FOLLOW_AHEAD * get_physics_process_delta_time()
	_angle = clampf(_angle + turn, -WIDEST_OPEN, WIDEST_OPEN)
	rotate_object_local(Vector3.UP, _angle - before)
	if is_equal_approx(_angle, before):
		return
	var frame := Engine.get_physics_frames()
	if frame - _last_push_frame > PUSH_GAP_FRAMES:
		_start_creak(absf(push_speed))
	_last_push_frame = frame


## How far the door is open, in degrees from closed (either way).
func open_degrees() -> float:
	return rad_to_deg(absf(_angle))


func _start_creak(push_speed: float) -> void:
	var radius := DoorCreak.noise_radius(push_speed, _tuning)
	# The sound follows the noise radius so what the player hears matches what Mum will.
	_creak.volume_db = linear_to_db(radius / _tuning.door_creak_loudest_radius)
	_creak.play()
	creaked.emit(radius, global_position)
