class_name AppOverlay
extends CanvasLayer
## The App: the bright, state-issued overlay over the grim field. A top bar with the Quota bar,
## the Shift's time left and Labour Points; the Mascot with a speech bubble at the bottom; and
## confetti for a met Quota. It shows what it is given and never decides anything. Nothing here
## catches taps, so the field underneath still gets them.

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
var _speech: Label
var _bubble: PanelContainer
var _confetti: CPUParticles2D


func _ready() -> void:
	layer = 10
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	root.add_child(_build_top_bar())
	root.add_child(_build_mascot_corner())
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


## The Mascot says this until it has something else to say.
func say(text: String) -> void:
	_speech.text = text
	_bubble.visible = not text.is_empty()


func celebrate() -> void:
	_confetti.position = Vector2(get_viewport().get_visible_rect().size.x / 2.0, -20.0)
	_confetti.emission_rect_extents = Vector2(get_viewport().get_visible_rect().size.x / 2.0, 1)
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
	_points_label = _label(TEXT_ON_BAR)
	row.add_child(_points_label)
	return bar


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
