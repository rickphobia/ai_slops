class_name PauseMenu
extends Control
## The menu Escape opens: mouse sensitivity, master volume, the controls list and resume.
## Shows and edits a PlayerSettings; main applies and saves the changes. Keeps running
## while the game is paused.

signal resume_clicked
signal settings_changed

const CONTROLS := [
	"W A S D: walk",
	"Ctrl or C (hold): creep",
	"Shift (hold): trot",
	"Mouse: look",
	"Space (hold): hold back an outburst",
	"E: give in, at a bowl or the bin",
	"Escape: pause",
]

var _settings: PlayerSettings
var _sensitivity: HSlider
var _volume: HSlider


## Hands the menu the settings it shows and edits. Call before it enters the scene tree.
func setup(settings: PlayerSettings) -> void:
	_settings = settings


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var shade := ColorRect.new()
	shade.color = Color(0.0, 0.0, 0.0, 0.75)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(shade)

	var rows := VBoxContainer.new()
	rows.custom_minimum_size = Vector2(360, 0)
	rows.add_theme_constant_override("separation", 12)
	var centre := CenterContainer.new()
	centre.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	centre.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(centre)
	centre.add_child(rows)

	rows.add_child(_heading("Paused"))
	rows.add_child(_label("Mouse sensitivity"))
	_sensitivity = _slider(
		PlayerSettings.MIN_SENSITIVITY_SCALE,
		PlayerSettings.MAX_SENSITIVITY_SCALE,
		_settings.sensitivity_scale
	)
	_sensitivity.value_changed.connect(_on_sensitivity_changed)
	rows.add_child(_sensitivity)
	rows.add_child(_label("Volume"))
	_volume = _slider(0.0, 1.0, _settings.volume)
	_volume.value_changed.connect(_on_volume_changed)
	rows.add_child(_volume)
	rows.add_child(_heading("Controls"))
	for line: String in CONTROLS:
		rows.add_child(_label(line))
	var resume := Button.new()
	resume.text = "Resume"
	resume.pressed.connect(resume_clicked.emit)
	rows.add_child(resume)


func _on_sensitivity_changed(value: float) -> void:
	_settings.set_sensitivity_scale(value)
	settings_changed.emit()


func _on_volume_changed(value: float) -> void:
	_settings.set_volume(value)
	settings_changed.emit()


static func _slider(lowest: float, highest: float, value: float) -> HSlider:
	var slider := HSlider.new()
	slider.min_value = lowest
	slider.max_value = highest
	slider.step = 0.01
	slider.value = value
	return slider


static func _heading(text: String) -> Label:
	var label := _label(text)
	label.add_theme_font_size_override("font_size", 28)
	return label


static func _label(text: String) -> Label:
	var label := Label.new()
	label.text = text
	return label
