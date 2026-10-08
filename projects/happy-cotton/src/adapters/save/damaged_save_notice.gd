class_name DamagedSaveNotice
extends CanvasLayer
## Covers the game when the save couldn't be read: says so plainly, says the file was kept
## aside rather than deleted, and offers Start over. Nothing is lost by starting over, so it
## doesn't ask for confirmation. It catches every tap until then.

signal start_over_pressed

const MESSAGE := (
	"Your saved game couldn't be read, so it can't continue. The file has been kept aside,"
	+ " not deleted. Start over to begin a new game."
)
const BACKGROUND := Color(0.72, 0.69, 0.6)
const INK := Color(0.16, 0.14, 0.12)
## Above The App overlay and the debug panel, below the rotate prompt.
const LAYER := 50


func _ready() -> void:
	layer = LAYER
	var background := ColorRect.new()
	background.color = BACKGROUND
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)
	var column := VBoxContainer.new()
	column.alignment = BoxContainer.ALIGNMENT_CENTER
	column.add_theme_constant_override("separation", 32)
	var label := Label.new()
	label.name = "Message"
	label.text = MESSAGE
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.custom_minimum_size = Vector2(1000, 0)
	label.add_theme_font_size_override("font_size", 36)
	label.add_theme_color_override("font_color", INK)
	column.add_child(label)
	var button := Button.new()
	button.name = "StartOverButton"
	button.text = "Start over"
	button.custom_minimum_size = Vector2(320, 96)
	button.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	button.add_theme_font_size_override("font_size", 40)
	button.pressed.connect(_on_start_over)
	column.add_child(button)
	var centre := CenterContainer.new()
	centre.set_anchors_preset(Control.PRESET_FULL_RECT)
	centre.add_child(column)
	background.add_child(centre)


func _on_start_over() -> void:
	start_over_pressed.emit()
	queue_free()
