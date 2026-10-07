class_name Farm
extends RefCounted
## The Farm rules: the plots and the cotton growing in them. No scene tree, clock or file
## access: time only moves when advance() is called, so tests play hours in milliseconds.
## It also runs the Shift: online play counts it down, and at its end the Quota is checked and
## the next Shift starts at once with a higher Quota. What The App should say comes out as
## AppMessages through take_messages(). Later tickets add Exhaustion and Study Sessions here.

const NO_SUCH_PLOT := &"no_such_plot"
const NOT_EMPTY := &"not_empty"
const NOT_RIPE := &"not_ripe"
const NOTHING_PLANTED := &"nothing_planted"

## App message keys. A Shift began: values shift, quota.
const SHIFT_STARTED := &"shift_started"
## The Quota was met (or beaten) at the end of a Shift: values shift, picked, quota.
const QUOTA_MET := &"quota_met"
## The Quota was missed at the end of a Shift: values shift, picked, quota.
const QUOTA_MISSED := &"quota_missed"
## Every key the rules can emit; the App text table must have text for each.
const MESSAGE_KEYS: Array[StringName] = [SHIFT_STARTED, QUOTA_MET, QUOTA_MISSED]

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
var _shift_number := 1
## Seconds of online play into the current Shift.
var _shift_elapsed := 0.0
## Cotton picked this Shift. Starts from zero each Shift: a surplus carries no credit.
var _picked := 0
var _labour_points := 0
var _messages: Array[AppMessage] = []


func _init(tuning: Tuning, plot_count: int) -> void:
	_tuning = tuning
	_grown.resize(plot_count)
	_grown.fill(EMPTY)
	_start_shift()


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
	_picked += 1
	_labour_points += roundi(_tuning.labour_points_per_pick)
	return CommandResult.done()


## Moves the Farm on by some seconds of online play. Time never runs backwards, so a
## negative step does nothing.
func advance(seconds: float) -> void:
	if seconds <= 0.0:
		return
	for index in _grown.size():
		if _grown[index] != EMPTY:
			_grown[index] = minf(_grown[index] + seconds, _tuning.grow_seconds)
	_shift_elapsed += seconds
	# One long step can cover several Shifts; each one ends and is checked in turn.
	while _shift_elapsed >= _tuning.shift_seconds:
		_shift_elapsed -= _tuning.shift_seconds
		_end_shift()


## The plot at index; it must exist.
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


func shift() -> ShiftView:
	return ShiftView.new(_shift_number, _quota(), _picked, _tuning.shift_seconds - _shift_elapsed)


func labour_points() -> int:
	return _labour_points


## What The App should say since the last call, oldest first. Empties the queue.
func take_messages() -> Array[AppMessage]:
	var taken := _messages
	_messages = []
	return taken


## The Quota only ever rises: a fixed step every Shift, met or missed.
func _quota() -> int:
	return roundi(_tuning.first_quota + (_shift_number - 1) * _tuning.quota_rise)


func _start_shift() -> void:
	_picked = 0
	_messages.append(AppMessage.new(SHIFT_STARTED, {"shift": _shift_number, "quota": _quota()}))


func _end_shift() -> void:
	var met := _picked >= _quota()
	var values := {"shift": _shift_number, "picked": _picked, "quota": _quota()}
	_messages.append(AppMessage.new(QUOTA_MET if met else QUOTA_MISSED, values))
	_shift_number += 1
	_start_shift()


func _exists(index: int) -> bool:
	return index >= 0 and index < _grown.size()
