extends GutTest
## The Worker's tools on their rack: each tools Upgrade tier changes the hoe's blade and hangs
## one more sickle.

var _rack: ToolRack


func before_each() -> void:
	_rack = ToolRack.new()
	add_child_autofree(_rack)


func _sickles() -> int:
	return _rack.find_children("Sickle*", "MeshInstance3D", false, false).size()


func test_with_no_upgrade_the_tools_are_worn_wood_and_there_are_no_sickles() -> void:
	assert_eq(_rack.tier(), 0)
	assert_eq(_rack.blade_colour(), ToolRack.BLADE_COLOURS[0])
	assert_eq(_sickles(), 0)


func test_each_tier_changes_the_blade_and_hangs_a_sickle() -> void:
	_rack.show_tier(1)
	var first_colour := _rack.blade_colour()
	assert_ne(first_colour, ToolRack.BLADE_COLOURS[0])
	assert_eq(_sickles(), 1)

	_rack.show_tier(2)

	assert_ne(_rack.blade_colour(), first_colour)
	assert_eq(_sickles(), 2)


func test_a_tier_past_the_colour_list_keeps_the_last_colour() -> void:
	_rack.show_tier(ToolRack.BLADE_COLOURS.size() + 2)

	assert_eq(_rack.blade_colour(), ToolRack.BLADE_COLOURS[-1])
