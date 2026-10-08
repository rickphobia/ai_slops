class_name PaySlipCard
extends PanelContainer
## The App's pay slip: a bright card in the middle of the screen at the end of each Shift, with
## what the Worker earned, each Bill, and what is left, or the Debt in red. It catches taps only
## on itself, and its button puts it away. It shows what it is given and decides nothing.

const CARD_COLOUR := Color(1.0, 0.98, 0.9)
const TITLE_COLOUR := Color(1.0, 0.42, 0.62)
const ROW_COLOUR := Color(0.3, 0.12, 0.22)
const DEBT_COLOUR := BalanceBadge.DEBT_COLOUR
const BUTTON_COLOUR := Color(1.0, 0.42, 0.62)
const TITLE_FONT_SIZE := 32
const FONT_SIZE := 26
const MARGIN := 24
const WIDTH := 720.0

var _title: Label
var _rows: VBoxContainer


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	set_anchors_and_offsets_preset(Control.PRESET_CENTER, Control.PRESET_MODE_MINSIZE)
	grow_horizontal = Control.GROW_DIRECTION_BOTH
	grow_vertical = Control.GROW_DIRECTION_BOTH
	custom_minimum_size = Vector2(WIDTH, 0)
	add_theme_stylebox_override("panel", _rounded(CARD_COLOUR, 28, MARGIN))
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 10)
	add_child(column)
	_title = _label(TITLE_COLOUR, TITLE_FONT_SIZE)
	_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(_title)
	_rows = VBoxContainer.new()
	column.add_child(_rows)
	var close := Button.new()
	close.name = "PaySlipClose"
	close.text = AppText.PAY_SLIP_CLOSE
	close.add_theme_font_size_override("font_size", FONT_SIZE)
	for state: String in ["normal", "hover", "pressed", "focus"]:
		close.add_theme_stylebox_override(state, _rounded(BUTTON_COLOUR, 20, MARGIN / 2.0))
	close.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	close.pressed.connect(hide)
	column.add_child(close)


## Shows the pay slip from a Farm.PAY_SLIP message's values.
func show_slip(values: Dictionary) -> void:
	var shift: int = values.get("shift", 0)
	_title.text = AppText.PAY_SLIP_TITLE.format({"shift": shift})
	for row in _rows.get_children():
		_rows.remove_child(row)
		row.queue_free()
	var texts := rows(values)
	for index in texts.size():
		var last := index == texts.size() - 1
		var colour := DEBT_COLOUR if last and in_debt(values) else ROW_COLOUR
		var row := _label(colour, FONT_SIZE)
		row.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		row.text = texts[index]
		_rows.add_child(row)
	visible = true


func row_texts() -> Array[String]:
	var texts: Array[String] = []
	for row in _rows.get_children():
		texts.append((row as Label).text)
	return texts


## The slip's lines under its title: earned, each Bill in the order charged, then what is left,
## or the Debt when the balance is below zero.
static func rows(values: Dictionary) -> Array[String]:
	var balance: int = values.get("balance", 0)
	var last := AppText.PAY_SLIP_LEFT.format({"points": balance})
	if balance < 0:
		last = AppText.PAY_SLIP_DEBT.format({"debt": -balance})
	return [
		AppText.PAY_SLIP_EARNED.format(values),
		AppText.PAY_SLIP_ELECTRICITY.format(values),
		AppText.PAY_SLIP_RENT.format(values),
		last,
	]


static func in_debt(values: Dictionary) -> bool:
	var balance: int = values.get("balance", 0)
	return balance < 0


func _label(colour: Color, font_size: int) -> Label:
	var label := Label.new()
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", colour)
	return label


func _rounded(colour: Color, corner_radius: int, margin: float) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = colour
	style.set_corner_radius_all(corner_radius)
	style.set_content_margin_all(margin)
	return style
