class_name BuildVersion
extends RefCounted
## Which build this is, for the title screen. The build scripts write it to version.txt before
## exporting (deploy: "main <commit> · <date>", PR previews: "PR #<N> · <commit>"); a build
## without the file (the editor, CI) is a "dev build".

const PATH := "res://version.txt"
const DEV := "dev build"


static func read(path: String = PATH) -> String:
	if not FileAccess.file_exists(path):
		return DEV
	var text := FileAccess.get_file_as_string(path).strip_edges()
	return text if not text.is_empty() else DEV
