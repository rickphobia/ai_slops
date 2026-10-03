class_name EndCard
extends Control
## Shown when the Piggy reaches the back door: the night is over. Its first lines change
## with the ending Hallucinations picked by humanity: what the Piggy saw of itself in the
## back-door glass on the way out.

const HEADING_SIZE := 40
const TEXT_COLOUR := Color(0.85, 0.8, 0.78)
const NOTE_COLOUR := Color(0.6, 0.55, 0.55)
const HEADINGS: Dictionary[Hallucinations.Ending, String] = {
	Hallucinations.Ending.HUMAN: "You got out.",
	Hallucinations.Ending.PIG: "Something got out.",
}
const GLASS_LINES: Dictionary[Hallucinations.Ending, String] = {
	Hallucinations.Ending.HUMAN: "In the glass, just for a moment, you looked like yourself.",
	Hallucinations.Ending.PIG: "The glass showed you what you are now. You didn't mind.",
}
const FEEDBACK := (
	"Thank you for playing. Please tell whoever sent you the link\n"
	+ "what scared you, what didn't, and where you got stuck."
)

var ending: Hallucinations.Ending = Hallucinations.Ending.HUMAN


func _init(night_ending: Hallucinations.Ending = Hallucinations.Ending.HUMAN) -> void:
	ending = night_ending


func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var background := ColorRect.new()
	background.color = Color.BLACK
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	var lines := VBoxContainer.new()
	lines.add_theme_constant_override("separation", 20)
	lines.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var centre := CenterContainer.new()
	centre.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	centre.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(centre)
	centre.add_child(lines)
	lines.add_child(_line(HEADINGS[ending], HEADING_SIZE, TEXT_COLOUR))
	lines.add_child(_line(GLASS_LINES[ending], 22, TEXT_COLOUR))
	lines.add_child(
		_line("This is a first playable of My Piggy: one night, three rooms.", 20, TEXT_COLOUR)
	)
	lines.add_child(_line(FEEDBACK, 20, TEXT_COLOUR))
	lines.add_child(_line("Reload the page to play again.", 16, NOTE_COLOUR))


static func _line(text: String, size: int, colour: Color) -> Label:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", colour)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return label
