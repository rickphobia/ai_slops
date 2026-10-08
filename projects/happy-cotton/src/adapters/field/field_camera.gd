class_name FieldCamera
extends RefCounted
## Where the field's camera looks and how far back it sits, kept within limits: the point it
## looks at stays over the field and the track around it, so neither can leave the screen,
## and the zoom stays between a near and a far distance. The camera's angle is not stored
## here and never changes; the camera only slides along it.

## The closest the camera may get to the ground point it looks at, in metres.
const NEAR_DISTANCE := 5.0
## The furthest the camera may pull back, in metres; the haze swallows much more.
const FAR_DISTANCE := 12.0
## One mouse-wheel notch zooms by this factor.
const WHEEL_ZOOM_STEP := 1.1

## The ground point (x, z) at the centre of the screen.
var focus: Vector2
## How far the camera sits from the focus, along its fixed angle, in metres.
var distance: float
## How far the focus may go from the field's centre, across (x) and front to back (y).
var half_size: Vector2


func _init(start_focus: Vector2, start_distance: float, field_half_size: Vector2) -> void:
	half_size = field_half_size
	focus = _clamp_focus(start_focus)
	distance = clampf(start_distance, NEAR_DISTANCE, FAR_DISTANCE)


## Moves the focus by a distance on the ground, stopping at the field's edge.
func pan(ground_offset: Vector2) -> void:
	focus = _clamp_focus(focus + ground_offset)


## Multiplies the distance: below 1 zooms in, above 1 zooms out.
func zoom_by(factor: float) -> void:
	distance = clampf(distance * factor, NEAR_DISTANCE, FAR_DISTANCE)


## Where the camera goes, given the unit vector pointing back from the ground to the camera.
func position_along(back: Vector3) -> Vector3:
	return Vector3(focus.x, 0.0, focus.y) + back * distance


func _clamp_focus(point: Vector2) -> Vector2:
	return point.clamp(-half_size, half_size)
