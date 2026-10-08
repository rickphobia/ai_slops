extends GutTest
## The save store's one slot, in a test folder of its own: what it reads back, and how it
## handles a file it can't read.

const FOLDER := "user://test_save_store"
const SLOT := FOLDER + "/save.json"

var _store: SaveStore


func before_each() -> void:
	_empty_folder()
	_store = SaveStore.new(SLOT)


func after_all() -> void:
	_empty_folder()


func _empty_folder() -> void:
	DirAccess.make_dir_recursive_absolute(FOLDER)
	for file in DirAccess.get_files_at(FOLDER):
		DirAccess.remove_absolute(FOLDER.path_join(file))


func _put(path: String, text: String) -> void:
	var file := FileAccess.open(path, FileAccess.WRITE)
	file.store_string(text)
	file.close()


func test_an_empty_slot_has_no_save() -> void:
	assert_false(_store.has_save())
	assert_eq(_store.read().status, StoredSave.Status.NONE)


func test_a_written_save_reads_back_with_its_time() -> void:
	var farm_save := {"version": 1.0, "plots": [0.5, -1.0], "rest_taken_away": true}

	var problem := _store.write(farm_save, 1760000000.25)

	assert_eq(problem, "")
	var stored := _store.read()
	assert_eq(stored.status, StoredSave.Status.FOUND)
	assert_eq(stored.farm, farm_save)
	assert_eq(stored.saved_at, 1760000000.25)
	assert_eq(DirAccess.get_files_at(FOLDER), PackedStringArray(["save.json"]), "no temp file")


func test_a_new_save_replaces_the_last() -> void:
	_store.write({"shift_number": 1.0}, 10.0)

	_store.write({"shift_number": 2.0}, 20.0)

	assert_eq(_store.read().farm, {"shift_number": 2.0})


func test_a_file_that_is_not_json_is_damaged() -> void:
	_put(SLOT, "{ this is not")

	var stored := _store.read()

	assert_eq(stored.status, StoredSave.Status.DAMAGED)
	assert_string_contains(stored.problem, "not JSON")


func test_json_that_is_not_a_save_is_damaged() -> void:
	for text: String in ["[1, 2]", '{"farm": {}}', '{"saved_at": 5, "farm": 3}', ""]:
		_put(SLOT, text)

		assert_eq(_store.read().status, StoredSave.Status.DAMAGED, text)


func test_a_damaged_save_kept_aside_is_untouched_and_never_overwritten() -> void:
	_put(SLOT, "first damaged")
	var first := _store.keep_aside()
	_put(SLOT, "second damaged")

	var second := _store.keep_aside()

	assert_eq(first, FOLDER + "/save.damaged-1.json")
	assert_eq(second, FOLDER + "/save.damaged-2.json")
	assert_eq(FileAccess.get_file_as_string(first), "first damaged")
	assert_eq(FileAccess.get_file_as_string(second), "second damaged")
	assert_false(_store.has_save())


func test_discard_empties_the_slot() -> void:
	_store.write({}, 1.0)

	assert_true(_store.discard())

	assert_false(_store.has_save())
	assert_true(_store.discard(), "an empty slot stays empty")
