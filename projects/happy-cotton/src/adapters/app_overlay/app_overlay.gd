class_name AppOverlay
extends CanvasLayer
## The App: the bright, state-issued overlay over the grim field. A top bar with the Quota bar,
## the Shift's time left, the Worker's Exhaustion and Labour Points; the Mascot with a speech
## bubble at the bottom; the rest hour button with its price at the bottom right; and confetti
## for a met Quota. During a Study Session the plain room covers the field, under the bar and
## the Mascot. It shows what it is given and never decides anything. Only the rest hour button
## catches taps, so the field underneath still gets the rest (the rules refuse them in a Study
## Session).

## The rest hour button was pressed; the rules decide whether he gets it.
signal rest_hour_pressed

const BAR_COLOUR := Color(1.0, 0.42, 0.62)
const BUBBLE_COLOUR := Color(1.0, 0.98, 0.9)
const QUOTA_EMPTY := Color(1.0, 0.8, 0.88)
const QUOTA_FILL := Color(0.98, 0.84, 0.2)
const TEXT_ON_BAR := Color(1.0, 1.0, 1.0)
const TEXT_IN_BUBBLE := Color(0.3, 0.12, 0.22)
const CONFETTI_COLOURS: Array[Color] = [
	Color(1.0, 0.3, 0.4),
	Color(1.0, 0.85, 0.2),
	Color(0.3, 0.8, 0.5),
	Color(0.3, 0.6, 1.0),
	Color(1.0, 0.5, 0.9),
]
const FONT_SIZE := 28
const MARGIN := 16

var _quota_bar: ProgressBar
var _quota_label: Label
var _shift_label: Label
var _points_label: Label
var _exhaustion_label: Label
var _rest_hour_button: Button
var _speech: Label
var _bubble: PanelContainer
var _confetti: CPUParticles2D
var _study_room: StudyRoom


func _ready() -> void:
	layer = 10
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	_study_room = StudyRoom.new()
	_study_room.visible = false
	root.add_child(_study_room)
	root.add_child(_build_top_bar())
	root.add_child(_build_mascot_corner())
	_rest_hour_button = _build_rest_hour_button()
	root.add_child(_rest_hour_button)
	_confetti = _build_confetti()
	add_child(_confetti)


## Shows the Shift's Quota progress and time left, and the Worker's Labour Points.
func show_shift(shift: ShiftView, labour_points: int) -> void:
	_quota_bar.max_value = shift.quota
	_quota_bar.value = mini(shift.picked, shift.quota)
	_quota_label.text = AppText.QUOTA_BAR.format({"picked": shift.picked, "quota": shift.quota})
	_shift_label.text = AppText.SHIFT_TIMER.format(
		{"shift": shift.number, "time": clock_text(shift.seconds_left)}
	)
	_points_label.text = AppText.LABOUR_POINTS.format({"points": labour_points})


## Shows the Worker's Exhaustion, from 0 to Exhaustion.MOST, as a whole percentage.
func show_exhaustion(level: float) -> void:
	_exhaustion_label.text = AppText.EXHAUSTION.format({"level": roundi(level)})


## Shows the rest hour's price, how long the rest has left while he rests, or that a missed
## Quota has taken it away.
func show_rest_hour(price: int, rest_seconds_left: float, taken_away := false) -> void:
	if taken_away:
		_rest_hour_button.text = AppText.REST_HOUR_TAKEN_AWAY
	elif rest_seconds_left > 0.0:
		_rest_hour_button.text = AppText.RESTING.format({"time": clock_text(rest_seconds_left)})
	else:
		_rest_hour_button.text = AppText.REST_HOUR_BUTTON.format({"price": price})


func rest_hour_button() -> Button:
	return _rest_hour_button


## Shows the Study Session room with the time left while there is any; hides it at 0.
func show_study_session(seconds_left: float) -> void:
	_study_room.visible = seconds_left > 0.0
	_study_room.show_time_left(
		AppText.STUDY_SESSION_TIMER.format({"time": clock_text(seconds_left)})
	)


func in_study_room() -> bool:
	return _study_room.visible


## The Mascot says this until it has something else to say.
func say(text: String) -> void:
	_speech.text = text
	_bubble.visible = not text.is_empty()


## Confetti falls from the whole width of the screen, which can change while playing.
func celebrate() -> void:
	var half_width := get_viewport().get_visible_rect().size.x / 2.0
	_confetti.position = Vector2(half_width, -20.0)
	_confetti.emission_rect_extents = Vector2(half_width, 1)
	_confetti.restart()


func speech() -> String:
	return _speech.text


## Whole seconds left as m:ss, rounded up so the timer reads 0:00 only when time is up.
static func clock_text(seconds_left: float) -> String:
	var whole := maxi(ceili(seconds_left), 0)
	return "%d:%02d" % [floori(whole / 60.0), whole % 60]


func _build_top_bar() -> Control:
	var bar := PanelContainer.new()
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.add_theme_stylebox_override("panel", _rounded(BAR_COLOUR, 0))
	bar.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	var row := HBoxContainer.new()
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 24)
	bar.add_child(row)

	var quota := Control.new()
	quota.mouse_filter = Control.MOUSE_FILTER_IGNORE
	quota.custom_minimum_size = Vector2(380, 44)
	_quota_bar = ProgressBar.new()
	_quota_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_quota_bar.show_percentage = false
	_quota_bar.set_anchors_preset(Control.PRESET_FULL_RECT)
	_quota_bar.add_theme_stylebox_override("background", _rounded(QUOTA_EMPTY, 22))
	_quota_bar.add_theme_stylebox_override("fill", _rounded(QUOTA_FILL, 22))
	quota.add_child(_quota_bar)
	_quota_label = _label(TEXT_IN_BUBBLE)
	_quota_label.set_anchors_preset(Control.PRESET_FULL_RECT)
	_quota_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_quota_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	quota.add_child(_quota_label)
	row.add_child(quota)

	_shift_label = _label(TEXT_ON_BAR)
	_shift_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_shift_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	row.add_child(_shift_label)
	_exhaustion_label = _label(TEXT_ON_BAR)
	row.add_child(_exhaustion_label)
	_points_label = _label(TEXT_ON_BAR)
	row.add_child(_points_label)
	return bar


func _build_rest_hour_button() -> Button:
	var button := Button.new()
	button.add_theme_font_size_override("font_size", FONT_SIZE)
	for state: String in ["normal", "hover", "pressed", "focus"]:
		button.add_theme_stylebox_override(state, _rounded(BAR_COLOUR, 20))
	button.add_theme_color_override("font_color", TEXT_ON_BAR)
	button.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT, Control.PRESET_MODE_MINSIZE)
	button.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	button.grow_vertical = Control.GROW_DIRECTION_BEGIN
	button.offset_right = -MARGIN
	button.offset_bottom = -MARGIN
	button.pressed.connect(rest_hour_pressed.emit)
	return button


func _build_mascot_corner() -> Control:
	var corner := HBoxContainer.new()
	corner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	corner.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT, Control.PRESET_MODE_MINSIZE)
	corner.offset_left = MARGIN
	corner.offset_bottom = -MARGIN
	corner.grow_vertical = Control.GROW_DIRECTION_BEGIN
	corner.alignment = BoxContainer.ALIGNMENT_END
	corner.add_child(Mascot.new())
	_bubble = PanelContainer.new()
	_bubble.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_bubble.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	_bubble.add_theme_stylebox_override("panel", _rounded(BUBBLE_COLOUR, 20))
	_speech = _label(TEXT_IN_BUBBLE)
	_speech.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_speech.custom_minimum_size = Vector2(560, 0)
	_bubble.add_child(_speech)
	_bubble.visible = false
	corner.add_child(_bubble)
	return corner


func _build_confetti() -> CPUParticles2D:
	var confetti := CPUParticles2D.new()
	confetti.emitting = false
	confetti.one_shot = true
	confetti.explosiveness = 0.8
	confetti.amount = 160
	confetti.lifetime = 3.0
	confetti.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	confetti.direction = Vector2.DOWN
	confetti.spread = 30.0
	confetti.gravity = Vector2(0, 300)
	confetti.initial_velocity_min = 100.0
	confetti.initial_velocity_max = 300.0
	confetti.angular_velocity_min = -360.0
	confetti.angular_velocity_max = 360.0
	confetti.scale_amount_min = 6.0
	confetti.scale_amount_max = 10.0
	# Each piece picks a random point on this ramp; constant steps keep the colours pure.
	var colours := Gradient.new()
	colours.interpolation_mode = Gradient.GRADIENT_INTERPOLATE_CONSTANT
	var offsets := PackedFloat32Array()
	for index in CONFETTI_COLOURS.size():
		offsets.append(float(index) / CONFETTI_COLOURS.size())
	colours.offsets = offsets
	colours.colors = PackedColorArray(CONFETTI_COLOURS)
	confetti.color_initial_ramp = colours
	return confetti


func _label(colour: Color) -> Label:
	var label := Label.new()
	label.add_theme_font_size_override("font_size", FONT_SIZE)
	label.add_theme_color_override("font_color", colour)
	return label


func _rounded(colour: Color, corner_radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = colour
	style.set_corner_radius_all(corner_radius)
	style.content_margin_left = MARGIN
	style.content_margin_right = MARGIN
	style.content_margin_top = MARGIN / 2.0
	style.content_margin_bottom = MARGIN / 2.0
	return style
