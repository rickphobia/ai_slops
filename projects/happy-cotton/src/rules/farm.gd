class_name Farm
extends RefCounted
## The Farm rules: the plots and the cotton growing in them. No scene tree, clock or file
## access: time only moves when advance() is called, so tests play hours in milliseconds.
## Later tickets add the Shift and Quota, Exhaustion and Study Sessions here.

const NO_SUCH_PLOT := &"no_such_plot"
const NOT_EMPTY := &"not_empty"
const NOT_RIPE := &"not_ripe"
const NOTHING_PLANTED := &"nothing_planted"

## The stages a crop passes through before it is ripe, each an equal share of the grow time.
const GROWING: Array[PlotView.Stage] = [
	PlotView.Stage.SEEDLING,
	PlotView.Stage.FLOWERING,
	PlotView.Stage.BOLL,
]
## Marks a plot with nothing planted in _grown.
const EMPTY := -1.0

var _tuning: Tuning
## Seconds of growth per plot, capped at the grow time; EMPTY when nothing is planted.
var _grown: Array[float] = []


func _init(tuning: Tuning, plot_count: int) -> void:
	_tuning = tuning
	_grown.resize(plot_count)
	_grown.fill(EMPTY)


func plot_count() -> int:
	return _grown.size()


func plant(index: int) -> CommandResult:
	if not _exists(index):
		return CommandResult.refused(NO_SUCH_PLOT)
	if _grown[index] != EMPTY:
		return CommandResult.refused(NOT_EMPTY)
	_grown[index] = 0.0
	return CommandResult.done()


func pick(index: int) -> CommandResult:
	if not _exists(index):
		return CommandResult.refused(NO_SUCH_PLOT)
	if _grown[index] == EMPTY:
		return CommandResult.refused(NOTHING_PLANTED)
	if _grown[index] < _tuning.grow_seconds:
		return CommandResult.refused(NOT_RIPE)
	_grown[index] = EMPTY
	return CommandResult.done()


## Moves the Farm on by some seconds of online play. Time never runs backwards, so a
## negative step does nothing.
func advance(seconds: float) -> void:
	if seconds <= 0.0:
		return
	for index in _grown.size():
		if _grown[index] != EMPTY:
			_grown[index] = minf(_grown[index] + seconds, _tuning.grow_seconds)


## The plot at index; it must exist (see plot_count).
func plot(index: int) -> PlotView:
	var grown := _grown[index]
	if grown == EMPTY:
		return PlotView.new(PlotView.Stage.EMPTY, 0.0)
	var grow_seconds := _tuning.grow_seconds
	if grown >= grow_seconds:
		return PlotView.new(PlotView.Stage.RIPE, 0.0)
	var stage_index := floori(grown * GROWING.size() / grow_seconds)
	return PlotView.new(GROWING[stage_index], grow_seconds - grown)


func plots() -> Array[PlotView]:
	var views: Array[PlotView] = []
	for index in _grown.size():
		views.append(plot(index))
	return views


func _exists(index: int) -> bool:
	return index >= 0 and index < _grown.size()
