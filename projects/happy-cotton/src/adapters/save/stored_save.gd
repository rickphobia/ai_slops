class_name StoredSave
extends RefCounted
## What the save store found in its slot: nothing, a save, or a file it couldn't read.

enum Status { NONE, FOUND, DAMAGED }

var status: Status
## The Farm's save as written by Farm.to_save(); empty unless FOUND.
var farm: Dictionary
## When the save was written, in seconds since the Unix epoch; 0 unless FOUND.
var saved_at: float
## Why the file couldn't be read; empty unless DAMAGED.
var problem: String


func _init(found: Status, farm_save: Dictionary = {}, saved_time := 0.0, why := "") -> void:
	status = found
	farm = farm_save
	saved_at = saved_time
	problem = why
