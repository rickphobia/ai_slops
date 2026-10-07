class_name AppLine
extends RefCounted
## One line The App can say: English text with {named} slots for the message's values, and
## the ids of the sources it draws on (empty for a line that claims nothing).

var text: String
var source_ids: Array[String]


func _init(line_text: String, line_source_ids: Array[String] = []) -> void:
	text = line_text
	source_ids = line_source_ids
