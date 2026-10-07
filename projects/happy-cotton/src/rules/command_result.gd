class_name CommandResult
extends RefCounted
## What a Farm command did: whether it happened and, if not, why, as a reason key
## (one of Farm's reason constants) that The App can turn into text later.

## True when the command changed the Farm.
var happened: bool:
	get:
		return _happened
## Why the command was refused; empty when it happened.
var reason: StringName:
	get:
		return _reason

var _happened: bool
var _reason: StringName


func _init(did_happen: bool, why_not: StringName) -> void:
	_happened = did_happen
	_reason = why_not


static func done() -> CommandResult:
	return CommandResult.new(true, &"")


static func refused(why_not: StringName) -> CommandResult:
	return CommandResult.new(false, why_not)
