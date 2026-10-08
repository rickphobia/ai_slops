class_name BalanceBadge
extends PanelContainer
## The Worker's Labour Points on The App's top bar, or his Debt in their place on red while he
## owes any. It shows what it is given and catches no taps.

const TEXT_COLOUR := Color(1.0, 1.0, 1.0)
const DEBT_COLOUR := Color(0.78, 0.05, 0.1)
const FONT_SIZE := 28
const MARGIN := 16

var _label: Label


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label = Label.new()
	_label.add_theme_font_size_override("font_size", FONT_SIZE)
	_label.add_theme_color_override("font_color", TEXT_COLOUR)
	add_child(_label)
	_paint(Color.TRANSPARENT)


## Labour Points and Debt are never both above zero, so it shows whichever is.
func show_balance(labour_points: int, debt: int) -> void:
	if debt > 0:
		_label.text = AppText.DEBT.format({"debt": debt})
		_paint(DEBT_COLOUR)
	else:
		_label.text = AppText.LABOUR_POINTS.format({"points": labour_points})
		_paint(Color.TRANSPARENT)


func shows_debt() -> bool:
	var style := get_theme_stylebox("panel") as StyleBoxFlat
	return style != null and style.bg_color == DEBT_COLOUR


func _paint(colour: Color) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = colour
	style.set_corner_radius_all(18)
	style.content_margin_left = MARGIN
	style.content_margin_right = MARGIN
	style.content_margin_top = MARGIN / 2.0
	style.content_margin_bottom = MARGIN / 2.0
	add_theme_stylebox_override("panel", style)
