extends Control
## The first screen: names the game, carries the content note, and offers Start and Sources.
## The Sources page is built from the sources register. Sizes are set for the 1280x720 base
## viewport, which a phone in landscape scales down to about half, so text and buttons stay
## readable and tappable there.

signal start_pressed

## Exact wording agreed in the spec ("Content rules"); change it only with the owner.
const CONTENT_NOTE := (
	"Happy Cotton depicts the forced labour of Uyghurs in Xinjiang and the separation of their"
	+ " families, based on documented reporting. Sources are listed in the game."
)
const MAIN_SCENE_PATH := "res://src/main.tscn"
const BACKGROUND := Color(0.72, 0.69, 0.6)
const INK := Color(0.16, 0.14, 0.12)
const BUTTON_SIZE := Vector2(320, 96)

## How Start leaves this screen: func(scene_path: String). Tests swap it so pressing Start
## doesn't replace the test runner's scene.
var open_scene: Callable = _change_scene

var _title_page: Control
var _sources_page: Control


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	var background := ColorRect.new()
	background.color = BACKGROUND
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)
	_title_page = _build_title_page()
	_sources_page = _build_sources_page()
	add_child(_title_page)
	add_child(_sources_page)
	show_title()
	start_pressed.connect(_go_to_main_scene)
	GameLog.info("title shown")


func show_title() -> void:
	_title_page.visible = true
	_sources_page.visible = false


func show_sources() -> void:
	_title_page.visible = false
	_sources_page.visible = true
	GameLog.info("sources opened")


func is_showing_sources() -> bool:
	return _sources_page.visible


func _go_to_main_scene() -> void:
	GameLog.info("start pressed")
	open_scene.call(MAIN_SCENE_PATH)


func _change_scene(scene_path: String) -> void:
	get_tree().change_scene_to_file(scene_path)


func _build_title_page() -> Control:
	var page := _centred_column(32)
	page.add_child(_label("Happy Cotton", 88, "TitleLabel"))
	var note := _label(CONTENT_NOTE, 32, "ContentNote")
	note.custom_minimum_size = Vector2(1000, 0)
	page.add_child(note)
	var buttons := HBoxContainer.new()
	buttons.alignment = BoxContainer.ALIGNMENT_CENTER
	buttons.add_theme_constant_override("separation", 48)
	buttons.add_child(_button("Start", "StartButton", start_pressed.emit))
	buttons.add_child(_button("Sources", "SourcesButton", show_sources))
	page.add_child(buttons)
	return _wrap_centred(page)


func _build_sources_page() -> Control:
	var page := VBoxContainer.new()
	page.set_anchors_preset(Control.PRESET_FULL_RECT)
	page.add_theme_constant_override("separation", 16)
	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 32)
	header.add_child(_button("Back", "BackButton", show_title))
	header.add_child(_label("Sources", 56, "SourcesHeading"))
	page.add_child(_padded(header))

	var scroll := ScrollContainer.new()
	scroll.name = "SourcesScroll"
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var list := VBoxContainer.new()
	list.name = "SourcesList"
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	list.add_theme_constant_override("separation", 36)
	for source in SourcesRegister.entries():
		list.add_child(_source_entry(source))
	scroll.add_child(_padded(list))
	page.add_child(scroll)
	return page


func _source_entry(source: Source) -> Control:
	var entry := VBoxContainer.new()
	entry.name = source.id
	var title := _label(source.title, 32, "Title")
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	entry.add_child(title)
	var credit := _label("%s, %s" % [source.author, source.date], 28, "Credit")
	credit.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	entry.add_child(credit)
	var used_for := _label("Used for: %s" % source.used_for, 26, "UsedFor")
	used_for.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	entry.add_child(used_for)
	# LinkButton opens its uri with OS.shell_open, which the web export opens in a new tab.
	var link := LinkButton.new()
	link.name = "Link"
	link.text = "Open source"
	link.uri = source.link
	link.tooltip_text = source.link
	link.add_theme_font_size_override("font_size", 30)
	entry.add_child(link)
	return entry


func _centred_column(separation: int) -> VBoxContainer:
	var column := VBoxContainer.new()
	column.alignment = BoxContainer.ALIGNMENT_CENTER
	column.add_theme_constant_override("separation", separation)
	return column


func _wrap_centred(child: Control) -> Control:
	var centre := CenterContainer.new()
	centre.set_anchors_preset(Control.PRESET_FULL_RECT)
	centre.add_child(child)
	return centre


func _padded(child: Control) -> MarginContainer:
	var margin := MarginContainer.new()
	margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	for side: String in ["margin_left", "margin_right", "margin_top", "margin_bottom"]:
		margin.add_theme_constant_override(side, 32)
	margin.add_child(child)
	return margin


func _label(text: String, font_size: int, node_name: String) -> Label:
	var label := Label.new()
	label.name = node_name
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", INK)
	return label


func _button(text: String, node_name: String, on_pressed: Callable) -> Button:
	var button := Button.new()
	button.name = node_name
	button.text = text
	button.custom_minimum_size = BUTTON_SIZE
	button.add_theme_font_size_override("font_size", 40)
	button.pressed.connect(on_pressed)
	return button
