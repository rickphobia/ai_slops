extends GutTest
## The log says which build is running, and a build without a version file says so.

const TEST_FILE := "user://test_version.txt"


func after_each() -> void:
	DirAccess.remove_absolute(TEST_FILE)


func test_a_build_without_a_version_file_is_a_dev_build() -> void:
	assert_eq(BuildVersion.read("user://no_such_version.txt"), BuildVersion.DEV)


func test_the_version_file_names_the_build() -> void:
	var file := FileAccess.open(TEST_FILE, FileAccess.WRITE)
	file.store_string("main d09681d · 2026-10-07\n")
	file.close()

	assert_eq(BuildVersion.read(TEST_FILE), "main d09681d · 2026-10-07")


func test_an_empty_version_file_is_a_dev_build() -> void:
	FileAccess.open(TEST_FILE, FileAccess.WRITE).close()

	assert_eq(BuildVersion.read(TEST_FILE), BuildVersion.DEV)
