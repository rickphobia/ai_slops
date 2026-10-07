class_name Mascot
extends Control
## The smiling cotton boll that speaks for The App, drawn as a placeholder: a puff of white
## lobes on a brown husk, with a fixed grin. It only draws itself; its words go in the speech
## bubble AppOverlay places beside it.

const COTTON := Color(1.0, 1.0, 0.98)
const HUSK := Color(0.55, 0.36, 0.2)
const FACE := Color(0.2, 0.15, 0.15)
const CHEEK := Color(1.0, 0.6, 0.7)


func _init() -> void:
	custom_minimum_size = Vector2(120, 120)
	mouse_filter = Control.MOUSE_FILTER_IGNORE


func _draw() -> void:
	var centre := size / 2.0
	var radius := minf(size.x, size.y) * 0.3
	draw_circle(centre + Vector2(0, radius * 1.1), radius * 0.7, HUSK)
	for lobe: Vector2 in [Vector2(-0.7, 0.1), Vector2(0.7, 0.1), Vector2(0, -0.55)]:
		draw_circle(centre + lobe * radius, radius * 0.75, COTTON)
	draw_circle(centre, radius, COTTON)
	var eye := radius * 0.12
	draw_circle(centre + Vector2(-0.35, -0.15) * radius, eye, FACE)
	draw_circle(centre + Vector2(0.35, -0.15) * radius, eye, FACE)
	draw_circle(centre + Vector2(-0.6, 0.2) * radius, eye * 1.4, CHEEK)
	draw_circle(centre + Vector2(0.6, 0.2) * radius, eye * 1.4, CHEEK)
	draw_arc(centre + Vector2(0, 0.1) * radius, radius * 0.4, 0.2, PI - 0.2, 16, FACE, 3.0)
