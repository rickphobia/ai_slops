class_name DoorCreak
extends RefCounted
## How loud a door creaks when the Piggy pushes it: the faster the push, the louder.
## Loudness is a noise radius in metres (how far it is heard before muffling), the unit
## the Noise rules (ticket 06) use.


## The creak's noise radius for a push at this speed (metres per second along the swing).
static func noise_radius(push_speed: float, tuning: Tuning) -> float:
	var strength := clampf(push_speed / tuning.door_creak_loudest_speed, 0.0, 1.0)
	return lerpf(tuning.door_creak_quietest_radius, tuning.door_creak_loudest_radius, strength)
