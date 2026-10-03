class_name RouteSpot
extends RefCounted
## A place on a family member's route: where they stand, which way they face and which
## route point they walk to next. Picks where Mum starts again after the Piggy is caught:
## on her route, at least mum_restart_distance away on foot and not seeing the Piggy, so
## a restart is never an instant second catch. Pure rules: distances and the view are
## asked of the DistanceProvider. Read-only once made.

## How finely the route is searched for a spot, in metres. Precision, not a game number.
const SEARCH_STEP_METRES := 0.5

var position: Vector3
## Flat on the floor, along the route toward next_point.
var facing: Vector3
## The index of the route point they walk to from here.
var next_point: int


func _init(at: Vector3, toward: Vector3, next: int) -> void:
	position = at
	facing = toward
	next_point = next


## The first spot along `route` (points in walking order, a loop) from which the Piggy at
## `piggy_at` is at least mum_restart_distance away on foot and outside the torch beam.
## If no spot is that far, the farthest one out of sight; if every spot sees the Piggy,
## the route's first point. `route` must not be empty.
static func out_of_sight(
	route: Array[Vector3], piggy_at: Vector3, tuning: Tuning, distances: DistanceProvider
) -> RouteSpot:
	var spots := _spots_along(route)
	var farthest: RouteSpot = null
	var farthest_away := -INF
	for spot in spots:
		if TorchSight.sees(spot.position, spot.facing, piggy_at, tuning, distances):
			continue
		var away := distances.walking_distance(spot.position, piggy_at)
		if away >= tuning.mum_restart_distance:
			return spot
		if away > farthest_away:
			farthest_away = away
			farthest = spot
	if farthest == null:
		return spots[0]
	return farthest


## Every SEARCH_STEP_METRES along each leg of the route, in walking order.
static func _spots_along(route: Array[Vector3]) -> Array[RouteSpot]:
	var spots: Array[RouteSpot] = []
	for index in route.size():
		var next := (index + 1) % route.size()
		var leg := route[next] - route[index]
		leg.y = 0.0
		var toward := leg.normalized() if leg.length() > 0.01 else Vector3.FORWARD
		var steps := maxi(1, ceili(leg.length() / SEARCH_STEP_METRES))
		for step in steps:
			var at := route[index].lerp(route[next], float(step) / steps)
			spots.append(RouteSpot.new(at, toward, next))
	return spots
