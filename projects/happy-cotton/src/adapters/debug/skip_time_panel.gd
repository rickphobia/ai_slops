class_name SkipTimePanel
extends CanvasLayer
## Debug mode's Skip time control: buttons that ask to jump ahead by a set time. It only asks;
## the entrypoint feeds the time through the same offline resume as a real absence.

signal skip_requested(seconds: float)

## Button label to seconds skipped.
const CHOICES: Dictionary[String, float] = {
	"Skip +1 hour": 3600.0,
	"Skip +8 hours": 28800.0,
}
const MARGIN := 16
const TOP_OFFSET := 96
const FONT_SIZE := 24


func _ready() -> void:
	# Above The App, so its buttons stay tappable.
	layer = 20
	var column := VBoxContainer.new()
	column.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT, Control.PRESET_MODE_MINSIZE)
	column.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	column.offset_right = -MARGIN
	column.offset_top = TOP_OFFSET
	for label: String in CHOICES:
		var button := Button.new()
		button.text = label
		button.add_theme_font_size_override("font_size", FONT_SIZE)
		button.pressed.connect(skip_requested.emit.bind(CHOICES[label]))
		column.add_child(button)
	add_child(column)
