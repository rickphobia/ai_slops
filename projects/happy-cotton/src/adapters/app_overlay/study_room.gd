class_name StudyRoom
extends Control
## The Study Session screen: a bare room with a loudspeaker high on the wall and the time left.
## No people, no harm: the punishment is shown as absence from the field and time taken
## (spec content rules). Muted and still, unlike The App's bright bar drawn over it.

const WALL := Color(0.72, 0.73, 0.68)
const FLOOR := Color(0.44, 0.43, 0.4)
const SKIRTING := Color(0.36, 0.36, 0.34)
const LIGHT := Color(0.93, 0.95, 0.9)
const SPEAKER := Color(0.25, 0.26, 0.26)
const SPEAKER_MOUTH := Color(0.12, 0.12, 0.12)
const TEXT := Color(0.2, 0.2, 0.2)
const FONT_SIZE := 36
## Where the floor meets the wall, as a share of the height.
const FLOOR_LINE := 0.72

var _time_left: Label


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_time_left = Label.new()
	_time_left.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_time_left.add_theme_font_size_override("font_size", FONT_SIZE)
	_time_left.add_theme_color_override("font_color", TEXT)
	_time_left.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_time_left.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_time_left.anchor_right = 1.0
	_time_left.anchor_top = 0.5
	_time_left.anchor_bottom = 0.5
	add_child(_time_left)
	resized.connect(queue_redraw)


func show_time_left(text: String) -> void:
	_time_left.text = text


func time_left_text() -> String:
	return _time_left.text


func _draw() -> void:
	var floor_y := size.y * FLOOR_LINE
	draw_rect(Rect2(0, 0, size.x, floor_y), WALL)
	draw_rect(Rect2(0, floor_y, size.x, size.y - floor_y), FLOOR)
	draw_rect(Rect2(0, floor_y - 8, size.x, 8), SKIRTING)
	# A strip light near the ceiling, and the loudspeaker on its bracket below it.
	var middle := size.x / 2.0
	draw_rect(Rect2(middle - 120, size.y * 0.12, 240, 10), LIGHT)
	_draw_loudspeaker(Vector2(middle + size.x * 0.25, size.y * 0.24), size.y * 0.06)


## A horn loudspeaker facing down and to the left, mounted on a short bracket at `mount`.
func _draw_loudspeaker(mount: Vector2, scale_size: float) -> void:
	draw_rect(Rect2(mount - Vector2(4, 0), Vector2(8, scale_size)), SPEAKER)
	var throat := mount + Vector2(0, scale_size)
	var bell := PackedVector2Array(
		[
			throat + Vector2(-scale_size * 0.25, -scale_size * 0.2),
			throat + Vector2(scale_size * 0.25, scale_size * 0.2),
			throat + Vector2(-scale_size * 1.2, scale_size * 1.4),
			throat + Vector2(-scale_size * 1.9, scale_size * 0.6),
		]
	)
	draw_colored_polygon(bell, SPEAKER)
	draw_line(bell[2], bell[3], SPEAKER_MOUTH, 6.0)
