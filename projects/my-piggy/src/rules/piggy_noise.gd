class_name PiggyNoise
extends RefCounted
## A sound the Piggy makes, with a position and a loudness (how far it is heard, in metres,
## before walls and doors cut it down). Made from footsteps, door pushes and body events;
## decides who hears it using the distance a DistanceProvider gives. Read-only once made.

enum Gait { STILL, CREEP, WALK, TROT }

## What made it, for the logs: footsteps, door, snort, squeal, lunge, give_in.
var source: StringName
var position: Vector3
var loudness: float


func _init(from_source: StringName, at: Vector3, radius: float) -> void:
	source = from_source
	position = at
	loudness = radius


## The noise a body event makes, or null for a silent one.
static func from_body_event(event: BodyEvent) -> PiggyNoise:
	if event.loudness <= 0.0:
		return null
	var made_by: StringName = &"give_in"
	if event.kind == BodyEvent.Kind.OUTBURST:
		var which: String = BodyEvent.Outburst.find_key(event.outburst)
		made_by = StringName(which.to_lower())
	return PiggyNoise.new(made_by, event.position, event.loudness)


## A door creak pushed by the Piggy.
static func from_door(radius: float, at: Vector3) -> PiggyNoise:
	return PiggyNoise.new(&"door", at, radius)


## One footstep at this gait, or null when it makes no sound (standing still, or a creep
## tuned to silence).
static func footstep(gait: Gait, at: Vector3, tuning: Tuning) -> PiggyNoise:
	var radius := 0.0
	match gait:
		Gait.CREEP:
			radius = tuning.creep_noise_radius
		Gait.WALK:
			radius = tuning.walk_noise_radius
		Gait.TROT:
			radius = tuning.trot_noise_radius
	if radius <= 0.0:
		return null
	return PiggyNoise.new(&"footsteps", at, radius)


## How far this noise carries through `barriers` closed doors and walls, each cutting it
## by `cut_per_barrier` (a fraction).
func reach_through(barriers: int, cut_per_barrier: float) -> float:
	return loudness * pow(1.0 - cut_per_barrier, barriers)


## Whether a listener at `listener` hears this noise: null if not, else how it reached them.
func heard_at(listener: Vector3, distances: DistanceProvider, cut_per_barrier: float) -> HeardNoise:
	var path := distances.sound_path(position, listener)
	if path.distance > reach_through(path.barriers, cut_per_barrier):
		return null
	return HeardNoise.new(self, path)
