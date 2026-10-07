class_name AppMessage
extends RefCounted
## Something The App should say, as data: a message key (one of Farm.MESSAGE_KEYS) and the
## values to fill in. The rules never hold text; the App text table turns a key into words.

var key: StringName:
	get:
		return _key
## Named values for the text, such as {"quota": 12}.
var values: Dictionary:
	get:
		return _values.duplicate()

var _key: StringName
var _values: Dictionary


func _init(message_key: StringName, message_values: Dictionary = {}) -> void:
	_key = message_key
	_values = message_values.duplicate()
