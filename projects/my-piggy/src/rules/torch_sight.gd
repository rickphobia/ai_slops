class_name TorchSight
extends RefCounted
## Whether a family member's torch shows them the Piggy: inside the beam's cone and range,
## with nothing in the way. Outside the beam the house is too dark to see anything. The
## cone is measured flat on the floor, so the low Piggy is not missed under a raised torch.
## Positions are where each stands on the floor. Pure rules: whether the view is clear is
## asked of the DistanceProvider.


## True when a torch held by someone at `standing_at` pointing along `facing` shows `piggy_at`.
static func sees(
	standing_at: Vector3,
	facing: Vector3,
	piggy_at: Vector3,
	tuning: Tuning,
	distances: DistanceProvider,
) -> bool:
	var toward := piggy_at - standing_at
	toward.y = 0.0
	if toward.length() > tuning.mum_torch_range:
		return false
	var flat_facing := Vector3(facing.x, 0.0, facing.z)
	# Standing right on top of the Piggy, any direction is "in the beam".
	if toward.length() > 0.01 and flat_facing.length() > 0.0:
		var half_cone := deg_to_rad(tuning.mum_torch_cone_degrees) / 2.0
		if flat_facing.angle_to(toward) > half_cone:
			return false
	return distances.has_clear_view(standing_at, piggy_at)
