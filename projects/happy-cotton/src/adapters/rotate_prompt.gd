class_name RotatePrompt
extends CanvasLayer
## Covers the game with "turn your phone sideways" while the window is taller than it is wide.
## The game is landscape only; the cover also stops taps reaching the field underneath.

const MESSAGE := "Turn your phone sideways to play"
const BACKDROP_COLOUR := Color(0.12, 0.1, 0.08, 0.96)

var _cover: ColorRect


func _ready() -> void:
	layer = 100
	_cover = ColorRect.new()
	_cover.color = BACKDROP_COLOUR
	_cover.mouse_filter = Control.MOUSE_FILTER_STOP
	_cover.set_anchors_preset(Control.PRESET_FULL_RECT)
	var label := Label.new()
	label.text = MESSAGE
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", 48)
	label.set_anchors_preset(Control.PRESET_FULL_RECT)
	_cover.add_child(label)
	add_child(_cover)
	get_tree().root.size_changed.connect(_show_if_portrait)
	_show_if_portrait()


static func is_portrait(window_size: Vector2i) -> bool:
	return window_size.y > window_size.x


func _show_if_portrait() -> void:
	_cover.visible = is_portrait(get_tree().root.size)
