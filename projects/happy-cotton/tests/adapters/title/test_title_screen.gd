extends GutTest
## The title screen: its text, Start, Continue and Start over with a save, and the Sources
## page built from the register. Each test's save slot is in a test folder of its own.

const TITLE_SCENE := preload("res://src/adapters/title/title_screen.tscn")
const FOLDER := "user://test_title_screen"
const SLOT := FOLDER + "/save.json"

var _opened_scenes: Array[String] = []
var _store := SaveStore.new(SLOT)


func before_each() -> void:
	_opened_scenes = []
	DirAccess.make_dir_recursive_absolute(FOLDER)
	_store.discard()


func after_all() -> void:
	_store.discard()


func _title_screen() -> Control:
	var screen: Control = TITLE_SCENE.instantiate()
	screen.set("open_scene", func(path: String) -> void: _opened_scenes.append(path))
	screen.set("save_store", _store)
	add_child_autofree(screen)
	return screen


func _shown(screen: Control, button_name: String) -> bool:
	var button := screen.find_child(button_name, true, false) as Button
	return button.is_visible_in_tree()


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


func test_without_a_save_the_title_offers_start_and_not_continue() -> void:
	var screen := _title_screen()

	assert_true(_shown(screen, "StartButton"))
	assert_false(_shown(screen, "ContinueButton"))
	assert_false(_shown(screen, "StartOverButton"))


func test_with_a_save_the_title_offers_continue_and_start_over_instead_of_start() -> void:
	_store.write({}, 1.0)
	var screen := _title_screen()

	assert_false(_shown(screen, "StartButton"))
	assert_true(_shown(screen, "ContinueButton"))
	assert_true(_shown(screen, "StartOverButton"))


func test_continue_opens_the_main_scene_and_keeps_the_save() -> void:
	_store.write({}, 1.0)
	var screen := _title_screen()

	_press(screen, "ContinueButton")

	assert_eq(_opened_scenes, ["res://src/main.tscn"] as Array[String])
	assert_true(_store.has_save())


func test_start_over_asks_first_and_keeping_the_game_keeps_the_save() -> void:
	_store.write({}, 1.0)
	var screen := _title_screen()

	_press(screen, "StartOverButton")
	var confirming: bool = screen.call("is_confirming_start_over")
	assert_true(confirming)
	assert_true(_store.has_save(), "nothing deleted before the answer")

	_press(screen, "KeepGameButton")

	confirming = screen.call("is_confirming_start_over")
	assert_false(confirming)
	assert_true(_shown(screen, "ContinueButton"))
	assert_true(_store.has_save())
	assert_eq(_opened_scenes, [] as Array[String])


func test_a_confirmed_start_over_deletes_the_save_and_opens_the_main_scene() -> void:
	_store.write({}, 1.0)
	var screen := _title_screen()
	_press(screen, "StartOverButton")

	_press(screen, "ConfirmStartOverButton")

	assert_false(_store.has_save())
	assert_eq(_opened_scenes, ["res://src/main.tscn"] as Array[String])


func test_starting_over_from_a_damaged_save_keeps_it_aside() -> void:
	var file := FileAccess.open(SLOT, FileAccess.WRITE)
	file.store_string("{ damaged")
	file.close()
	var screen := _title_screen()
	_press(screen, "StartOverButton")

	_press(screen, "ConfirmStartOverButton")

	assert_false(_store.has_save())
	assert_eq(FileAccess.get_file_as_string(FOLDER + "/save.damaged-1.json"), "{ damaged")
	DirAccess.remove_absolute(FOLDER + "/save.damaged-1.json")
