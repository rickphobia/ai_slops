extends GutTest
## The Settings screen saves each change at once and applies the volume and mute to the Master
## bus, which every sound reaches; the settings file gives defaults for anything bad in it.

const FOLDER := "user://test_settings_panel"
const FILE := FOLDER + "/settings.json"

var _store := SettingsStore.new(FILE)
var _panel: SettingsPanel


func before_each() -> void:
	DirAccess.make_dir_recursive_absolute(FOLDER)
	_store.discard()
	_panel = SettingsPanel.new()
	_panel.store = _store
	add_child_autofree(_panel)


func after_all() -> void:
	_store.discard()
	SettingsEffects.apply_volume(PlayerSettings.new())


func _master() -> int:
	return AudioServer.get_bus_index(&"Master")


func test_it_opens_on_the_defaults_without_a_settings_file() -> void:
	assert_eq(_panel.settings().to_save(), PlayerSettings.new().to_save())


func test_the_volume_is_applied_to_every_sound_and_remembered() -> void:
	_panel.set_volume(0.5)

	assert_almost_eq(AudioServer.get_bus_volume_db(_master()), linear_to_db(0.5), 0.01)
	assert_false(AudioServer.is_bus_mute(_master()))
	assert_eq(_store.read().volume, 0.5)


func test_mute_silences_every_sound_and_is_remembered() -> void:
	_panel.set_muted(true)

	assert_true(AudioServer.is_bus_mute(_master()))
	assert_true(_store.read().muted)
	_panel.set_muted(false)
	assert_false(AudioServer.is_bus_mute(_master()))


func test_reduced_motion_is_remembered_and_announced() -> void:
	watch_signals(_panel)
	_panel.set_reduced_motion(true)

	assert_true(_store.read().reduced_motion)
	assert_signal_emitted(_panel, "changed")


func test_a_settings_file_that_is_not_json_gives_the_defaults() -> void:
	var file := FileAccess.open(FILE, FileAccess.WRITE)
	file.store_string("{not json")
	file.close()

	assert_eq(_store.read().to_save(), PlayerSettings.new().to_save())


func test_the_settings_file_is_apart_from_the_game_save() -> void:
	assert_ne(SettingsStore.DEFAULT_PATH, SaveStore.DEFAULT_PATH)
