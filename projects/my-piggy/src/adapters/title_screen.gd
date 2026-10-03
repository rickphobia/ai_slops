class_name TitleScreen
extends Control
## The first thing a player sees: the name, a headphones note, a content note and
## "click to start". Says when it was clicked and nothing else; main decides what follows.
## The click is also the browser's "user gesture", which lets the game play sound and
## capture the mouse.

signal start_clicked

const NAME_SIZE := 64
const TEXT_COLOUR := Color(0.85, 0.8, 0.78)
const NOTE_COLOUR := Color(0.6, 0.55, 0.55)


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var background := ColorRect.new()
	background.color = Color.BLACK
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	var lines := VBoxContainer.new()
	lines.add_theme_constant_override("separation", 24)
	lines.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var centre := CenterContainer.new()
	centre.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	centre.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(centre)
	centre.add_child(lines)
	lines.add_child(_line("My Piggy", NAME_SIZE, TEXT_COLOUR))
	lines.add_child(_line("Headphones recommended.", 20, TEXT_COLOUR))
	lines.add_child(_line("Content note: body horror and implied violence.", 16, NOTE_COLOUR))
	lines.add_child(_line("Click to start", 24, TEXT_COLOUR))


func _gui_input(event: InputEvent) -> void:
	var click := event as InputEventMouseButton
	if click != null and click.pressed and click.button_index == MOUSE_BUTTON_LEFT:
		accept_event()
		start_clicked.emit()


static func _line(text: String, size: int, colour: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", colour)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return label
