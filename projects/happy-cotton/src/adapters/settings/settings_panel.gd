class_name SettingsPanel
extends Control
## The Settings screen, opened from the title screen and from The App: text size, reduced
## motion, master volume and mute. Each change is saved at once, the volume applied, and
## `changed` emitted so the screen that opened it can rescale its text or tone down motion.
## It covers the whole screen and catches every tap under it while open.

signal changed(settings: PlayerSettings)
signal closed

const BACKGROUND := Color(0.72, 0.69, 0.6)
const INK := Color(0.16, 0.14, 0.12)
const FONT_SIZE := 36
const BUTTON_SIZE := Vector2(200, 80)

## The settings file. Set before adding the panel; tests use their own.
var store := SettingsStore.new()

var _settings: PlayerSettings
var _size_buttons: Array[Button] = []
var _reduced_motion: CheckButton
var _volume: HSlider
var _muted: CheckButton


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var background := ColorRect.new()
	background.color = BACKGROUND
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)
	var centre := CenterContainer.new()
	centre.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(centre)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 28)
	centre.add_child(column)
	column.add_child(_label("Settings", 56, "SettingsHeading"))
	column.add_child(_text_size_row())
	_reduced_motion = _check("Reduced motion", "ReducedMotion")
	column.add_child(_reduced_motion)
	column.add_child(_volume_row())
	_muted = _check("Mute", "Mute")
	column.add_child(_muted)
	var back := Button.new()
	back.name = "SettingsBackButton"
	back.text = "Back"
	back.custom_minimum_size = BUTTON_SIZE
	back.add_theme_font_size_override("font_size", FONT_SIZE)
	back.pressed.connect(_close)
	column.add_child(back)
	_show(store.read())
	_reduced_motion.toggled.connect(_on_reduced_motion_toggled)
	_volume.value_changed.connect(_on_volume_changed)
	_muted.toggled.connect(_on_muted_toggled)


func settings() -> PlayerSettings:
	return _settings


## Shows the stored settings each time it opens.
func open() -> void:
	_show(store.read())
	visible = true


func set_text_scale(scale: float) -> void:
	_settings.text_scale = scale
	_save()


func set_reduced_motion(on: bool) -> void:
	_reduced_motion.button_pressed = on


func set_volume(level: float) -> void:
	_volume.value = level


func set_muted(on: bool) -> void:
	_muted.button_pressed = on


func _show(settings: PlayerSettings) -> void:
	_settings = settings
	for index in _size_buttons.size():
		_size_buttons[index].button_pressed = (
			PlayerSettings.TEXT_SCALES[index] == settings.text_scale
		)
	_reduced_motion.set_pressed_no_signal(settings.reduced_motion)
	_volume.set_value_no_signal(settings.volume)
	_muted.set_pressed_no_signal(settings.muted)
	SettingsEffects.scale_text(self, settings.text_scale)


func _on_reduced_motion_toggled(on: bool) -> void:
	_settings.reduced_motion = on
	_save()


func _on_volume_changed(level: float) -> void:
	_settings.volume = level
	_save()


func _on_muted_toggled(on: bool) -> void:
	_settings.muted = on
	_save()


func _save() -> void:
	var problem := store.write(_settings)
	if problem.is_empty():
		GameLog.info("settings changed", _settings.to_save())
	else:
		GameLog.error("settings not saved", {"problem": problem})
	_show(_settings)
	SettingsEffects.apply_volume(_settings)
	changed.emit(_settings)


func _close() -> void:
	visible = false
	closed.emit()


func _text_size_row() -> Control:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 24)
	row.add_child(_label("Text size", FONT_SIZE, "TextSizeLabel"))
	var group := ButtonGroup.new()
	for scale in PlayerSettings.TEXT_SCALES:
		var button := Button.new()
		button.name = "TextSize%d" % roundi(scale * 100)
		button.text = "%d%%" % roundi(scale * 100)
		button.toggle_mode = true
		button.button_group = group
		button.custom_minimum_size = BUTTON_SIZE
		button.add_theme_font_size_override("font_size", FONT_SIZE)
		button.pressed.connect(set_text_scale.bind(scale))
		_size_buttons.append(button)
		row.add_child(button)
	return row


func _volume_row() -> Control:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 24)
	row.add_child(_label("Volume", FONT_SIZE, "VolumeLabel"))
	_volume = HSlider.new()
	_volume.name = "Volume"
	_volume.min_value = 0.0
	_volume.max_value = 1.0
	_volume.step = 0.05
	_volume.custom_minimum_size = Vector2(480, 64)
	_volume.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	row.add_child(_volume)
	return row


func _check(text: String, node_name: String) -> CheckButton:
	var check := CheckButton.new()
	check.name = node_name
	check.text = text
	check.add_theme_font_size_override("font_size", FONT_SIZE)
	for state: String in [
		"font_color", "font_pressed_color", "font_hover_color", "font_focus_color"
	]:
		check.add_theme_color_override(state, INK)
	check.add_theme_color_override("font_hover_pressed_color", INK)
	return check


func _label(text: String, font_size: int, node_name: String) -> Label:
	var label := Label.new()
	label.name = node_name
	label.text = text
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", INK)
	return label
