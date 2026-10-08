extends Control
## The first screen: names the game, carries the content note, and offers Start and Sources.
## With a save in the slot it offers Continue and Start over instead of Start; Start over asks
## for confirmation before it deletes the save. The Sources page is built from the sources
## register. Sizes are set for the 1280x720 base
## viewport, which a phone in landscape scales down to about half, so text and buttons stay
## readable and tappable there.

signal start_pressed

## Exact wording agreed in the spec ("Content rules"); change it only with the owner.
const CONTENT_NOTE := (
	"Happy Cotton depicts the forced labour of Uyghurs in Xinjiang and the separation of their"
	+ " families, based on documented reporting. Sources are listed in the game."
)
const START_OVER_QUESTION := "Start over? Your saved game will be deleted for good."
const MAIN_SCENE_PATH := "res://src/main.tscn"
const BACKGROUND := Color(0.72, 0.69, 0.6)
const INK := Color(0.16, 0.14, 0.12)
const BUTTON_SIZE := Vector2(320, 96)

## How Start leaves this screen: func(scene_path: String). Tests swap it so pressing Start
## doesn't replace the test runner's scene.
var open_scene: Callable = _change_scene
## The save slot Continue and Start over act on. Tests set their own before adding the screen.
var save_store := SaveStore.new()

var _title_page: Control
var _sources_page: Control
var _confirm_page: Control
var _start_button: Button
var _continue_button: Button
var _start_over_button: Button


func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	var background := ColorRect.new()
	background.color = BACKGROUND
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)
	_title_page = _build_title_page()
	_sources_page = _build_sources_page()
	_confirm_page = _build_confirm_page()
	add_child(_title_page)
	add_child(_sources_page)
	add_child(_confirm_page)
	start_pressed.connect(_go_to_main_scene)
	show_title()
	GameLog.info("title shown", {"has_save": save_store.has_save()})


func show_title() -> void:
	var has_save := save_store.has_save()
	_start_button.visible = not has_save
	_continue_button.visible = has_save
	_start_over_button.visible = has_save
	_show_page(_title_page)


func show_sources() -> void:
	_show_page(_sources_page)
	GameLog.info("sources opened")


func is_showing_sources() -> bool:
	return _sources_page.visible


func is_confirming_start_over() -> bool:
	return _confirm_page.visible


func _show_page(page: Control) -> void:
	for each_page: Control in [_title_page, _sources_page, _confirm_page]:
		each_page.visible = each_page == page


func _go_to_main_scene() -> void:
	GameLog.info("start pressed")
	_open_main_scene()


func _open_main_scene() -> void:
	open_scene.call(MAIN_SCENE_PATH)


func _continue() -> void:
	GameLog.info("continue pressed")
	_open_main_scene()


func _ask_to_start_over() -> void:
	_show_page(_confirm_page)


func _cancel_start_over() -> void:
	GameLog.info("start over cancelled")
	show_title()


## Only a confirmed Start over empties the slot (a save that can't be read is kept aside). If
## it can't, the game must not open on the old save as if it had, so the title stays.
func _start_over() -> void:
	if not save_store.discard():
		GameLog.error("start over failed", {"problem": save_store.last_problem()})
		show_title()
		return
	GameLog.info("start over confirmed")
	_open_main_scene()


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
	_start_button = _button("Start", "StartButton", start_pressed.emit)
	_continue_button = _button("Continue", "ContinueButton", _continue)
	_start_over_button = _button("Start over", "StartOverButton", _ask_to_start_over)
	for button: Button in [_start_button, _continue_button, _start_over_button]:
		buttons.add_child(button)
	buttons.add_child(_button("Sources", "SourcesButton", show_sources))
	page.add_child(buttons)
	return _wrap_centred(page)


func _build_confirm_page() -> Control:
	var page := _centred_column(32)
	var question := _label(START_OVER_QUESTION, 40, "StartOverQuestion")
	question.custom_minimum_size = Vector2(1000, 0)
	page.add_child(question)
	var buttons := HBoxContainer.new()
	buttons.alignment = BoxContainer.ALIGNMENT_CENTER
	buttons.add_theme_constant_override("separation", 48)
	buttons.add_child(_button("Keep my game", "KeepGameButton", _cancel_start_over))
	buttons.add_child(_button("Start over", "ConfirmStartOverButton", _start_over))
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
