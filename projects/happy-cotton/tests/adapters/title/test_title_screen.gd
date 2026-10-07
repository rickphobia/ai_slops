extends GutTest
## The title screen: its text, Start, and the Sources page built from the register.

const TITLE_SCENE := preload("res://src/adapters/title/title_screen.tscn")

var _opened_scenes: Array[String] = []


func before_each() -> void:
	_opened_scenes = []


func _title_screen() -> Control:
	var screen: Control = TITLE_SCENE.instantiate()
	screen.set("open_scene", func(path: String) -> void: _opened_scenes.append(path))
	add_child_autofree(screen)
	return screen


func _text_of(screen: Control, node_name: String) -> String:
	var label := screen.find_child(node_name, true, false) as Label
	return label.text


func _press(screen: Control, button_name: String) -> void:
	var button := screen.find_child(button_name, true, false) as Button
	button.pressed.emit()


func test_the_title_screen_names_the_game_and_shows_the_exact_content_note() -> void:
	var screen := _title_screen()

	assert_eq(_text_of(screen, "TitleLabel"), "Happy Cotton")
	assert_eq(
		_text_of(screen, "ContentNote"),
		(
			"Happy Cotton depicts the forced labour of Uyghurs in Xinjiang and the separation"
			+ " of their families, based on documented reporting. Sources are listed in the game."
		)
	)


func test_start_opens_the_main_scene_with_one_press() -> void:
	var screen := _title_screen()

	_press(screen, "StartButton")

	assert_eq(_opened_scenes, ["res://src/main.tscn"] as Array[String])


func test_sources_opens_the_sources_page_and_back_returns_to_the_title() -> void:
	var screen := _title_screen()

	_press(screen, "SourcesButton")
	var showing: bool = screen.call("is_showing_sources")
	assert_true(showing)

	_press(screen, "BackButton")
	showing = screen.call("is_showing_sources")
	assert_false(showing)


func test_the_sources_page_lists_every_register_entry_with_its_link() -> void:
	var screen := _title_screen()
	var list := screen.find_child("SourcesList", true, false)

	for source in SourcesRegister.entries():
		var entry := list.find_child(source.id, false, false)
		assert_not_null(entry, "entry for %s" % source.id)
		var link := entry.find_child("Link", false, false) as LinkButton
		assert_eq(link.uri, source.link)
		var credit := entry.find_child("Credit", false, false) as Label
		assert_eq(credit.text, "%s, %s" % [source.author, source.date])
