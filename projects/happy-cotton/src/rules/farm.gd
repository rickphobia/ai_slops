class_name Farm
extends RefCounted
## The Farm rules: the plots and the cotton growing in them. No scene tree, clock or file
## access: time only moves when advance() or resume_offline() is called, so tests play hours
## in milliseconds.
## It also runs the Shift: online play counts it down, and at its end the Quota is checked and
## the next Shift starts at once with a higher Quota. What The App should say comes out as
## AppMessages through take_messages(). A missed Quota starts a Study Session: the Worker can't
## plant or pick until it ends, and the next Shift's clock waits for it.
## The Worker is either in the field or on the Generator. Crops grow only while he runs on it;
## after a set number of laps he stops to breathe and growth halts until he runs again.
## Planting or picking brings him back to the field, and so does a Study Session. Offline
## time (the game closed or its tab hidden) grows crops at a slower rate with no Generator and
## serves the Study Session, but the Shift waits. Later tickets add Exhaustion here.

const NO_SUCH_PLOT := &"no_such_plot"
const NOT_EMPTY := &"not_empty"
const NOT_RIPE := &"not_ripe"
const NOTHING_PLANTED := &"nothing_planted"
const IN_STUDY_SESSION := &"in_study_session"

## Why resume_offline() didn't use the clock's time as given (AwayReport.clock_problem).
const NEGATIVE_OFFLINE_TIME := &"negative_offline_time"
const OFFLINE_TIME_CAPPED := &"offline_time_capped"

## App message keys. A Shift began: values shift, quota.
const SHIFT_STARTED := &"shift_started"
## The Quota was met (or beaten) at the end of a Shift: values shift, picked, quota.
const QUOTA_MET := &"quota_met"
## The Quota was missed at the end of a Shift: values shift, picked, quota. The key grows
## colder with each miss in a row: the first, the second, then every one after.
const QUOTA_MISSED := &"quota_missed"
const QUOTA_MISSED_AGAIN := &"quota_missed_again"
const QUOTA_MISSED_REPEATEDLY := &"quota_missed_repeatedly"
## A Study Session began: values seconds, minutes (rounded up), in_a_row (1 for the first
## since the last met Quota).
const STUDY_SESSION_STARTED := &"study_session_started"
## A Study Session ended: values in_a_row.
const STUDY_SESSION_ENDED := &"study_session_ended"
## The Worker came back from offline time: values minutes (away, rounded up), ripened (plots
## that ripened while away), study_minutes (Study Session served while away, rounded up).
const AWAY_SUMMARY := &"away_summary"
## Every key the rules can emit; the App text table must have text for each.
const MESSAGE_KEYS: Array[StringName] = [
	SHIFT_STARTED,
	QUOTA_MET,
	QUOTA_MISSED,
	QUOTA_MISSED_AGAIN,
	QUOTA_MISSED_REPEATEDLY,
	STUDY_SESSION_STARTED,
	STUDY_SESSION_ENDED,
	AWAY_SUMMARY,
]
## The Quota-missed key for the first, second and every later miss in a row.
const MISSED_KEYS: Array[StringName] = [QUOTA_MISSED, QUOTA_MISSED_AGAIN, QUOTA_MISSED_REPEATEDLY]

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
## Seconds left in the current Study Session; 0 when the Worker is on the field.
var _study_left := 0.0
## Quotas missed since the last met one; it sets the next Study Session's length.
var _misses_in_a_row := 0
var _messages: Array[AppMessage] = []
var _on_generator := false
## Seconds run on the Generator since his last breath. Leaving it doesn't reset this.
var _run_since_breath := 0.0
## Seconds left of his breath; while above 0 on the Generator, he stands and crops halt.
var _breath_left := 0.0


func _init(tuning: Tuning, plot_count: int) -> void:
	_tuning = tuning
	_grown.resize(plot_count)
	_grown.fill(EMPTY)
	_start_shift()


func plant(index: int) -> CommandResult:
	if in_study_session():
		return CommandResult.refused(IN_STUDY_SESSION)
	if not _exists(index):
		return CommandResult.refused(NO_SUCH_PLOT)
	if _grown[index] != EMPTY:
		return CommandResult.refused(NOT_EMPTY)
	_grown[index] = 0.0
	_on_generator = false
	return CommandResult.done()


func pick(index: int) -> CommandResult:
	if in_study_session():
		return CommandResult.refused(IN_STUDY_SESSION)
	if not _exists(index):
		return CommandResult.refused(NO_SUCH_PLOT)
	if _grown[index] == EMPTY:
		return CommandResult.refused(NOTHING_PLANTED)
	if _grown[index] < _tuning.grow_seconds:
		return CommandResult.refused(NOT_RIPE)
	_grown[index] = EMPTY
	_picked += 1
	_labour_points += roundi(_tuning.labour_points_per_pick)
	_on_generator = false
	return CommandResult.done()


## Sends the Worker to run on the Generator. Sending him while he is on it changes nothing.
func run_generator() -> CommandResult:
	if in_study_session():
		return CommandResult.refused(IN_STUDY_SESSION)
	_on_generator = true
	return CommandResult.done()


## Moves the Farm on by some seconds of online play. Time never runs backwards, so a
## negative step does nothing. The clock that runs is the Study Session's while the Worker is
## in one, and the Shift's otherwise; crops grow only while he runs on the Generator.
func advance(seconds: float) -> void:
	var remaining := seconds
	# One long step can cover several Shifts, Study Sessions, runs and breaths; each ends in
	# turn.
	while remaining > 0.0:
		if in_study_session():
			var served := minf(remaining, _study_left)
			remaining -= served
			if served >= _study_left:
				_end_study_session()
			else:
				_study_left -= served
		else:
			var shift_left := _tuning.shift_seconds - _shift_elapsed
			var worked := minf(minf(remaining, shift_left), _seconds_until_toil_turns())
			_toil(worked)
			remaining -= worked
			if worked >= shift_left:
				_shift_elapsed = 0.0
				_end_shift()
			else:
				_shift_elapsed += worked


## Moves the Farm on by some seconds offline: crops grow at the offline rate whatever the
## Worker was doing, and a Study Session counts down, but the Shift waits and the Worker stays
## where he was. A wrong clock can't break the Farm: negative time counts as zero and a long
## absence is cut to the tuning's cap; the report says which.
func resume_offline(seconds: float) -> AwayReport:
	var counted := clampf(seconds, 0.0, _tuning.offline_cap_seconds)
	var problem := &""
	if seconds < 0.0:
		problem = NEGATIVE_OFFLINE_TIME
	elif seconds > _tuning.offline_cap_seconds:
		problem = OFFLINE_TIME_CAPPED
	var ripe_before := _ripe_count()
	_grow(counted * _tuning.offline_growth_rate)
	var study_served := minf(counted, _study_left)
	if study_served > 0.0:
		if study_served >= _study_left:
			_end_study_session()
		else:
			_study_left -= study_served
	var ripened := _ripe_count() - ripe_before
	if counted > 0.0:
		var values := {
			"minutes": ceili(counted / 60.0),
			"ripened": ripened,
			"study_minutes": ceili(study_served / 60.0),
		}
		_messages.append(AppMessage.new(AWAY_SUMMARY, values))
	return AwayReport.new(seconds, counted, problem, ripened, study_served)


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


func in_study_session() -> bool:
	return _study_left > 0.0


## Seconds until the Worker is back on the field; 0 when they are on it.
func study_session_seconds_left() -> float:
	return _study_left


func worker() -> WorkerView:
	if not _on_generator:
		return WorkerView.new(WorkerView.Activity.IN_FIELD, _laps_left())
	if _breath_left > 0.0:
		return WorkerView.new(WorkerView.Activity.BREATHING, _laps_left())
	return WorkerView.new(WorkerView.Activity.RUNNING, _laps_left())


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
	var values := {"shift": _shift_number, "picked": _picked, "quota": _quota()}
	if _picked >= _quota():
		_misses_in_a_row = 0
		_messages.append(AppMessage.new(QUOTA_MET, values))
	else:
		_misses_in_a_row += 1
		var key := MISSED_KEYS[mini(_misses_in_a_row, MISSED_KEYS.size()) - 1]
		_messages.append(AppMessage.new(key, values))
		_start_study_session()
		_on_generator = false
	_shift_number += 1
	_start_shift()


## Doubles for each miss in a row, up to the cap.
func _start_study_session() -> void:
	var doublings := _misses_in_a_row - 1
	_study_left = minf(
		_tuning.study_session_seconds * pow(2.0, doublings), _tuning.study_session_cap_seconds
	)
	var values := {
		"seconds": _study_left,
		"minutes": ceili(_study_left / 60.0),
		"in_a_row": _misses_in_a_row,
	}
	_messages.append(AppMessage.new(STUDY_SESSION_STARTED, values))


func _end_study_session() -> void:
	_study_left = 0.0
	_messages.append(AppMessage.new(STUDY_SESSION_ENDED, {"in_a_row": _misses_in_a_row}))


func _run_seconds() -> float:
	return _tuning.lap_seconds * roundi(_tuning.laps_before_breath)


func _laps_left() -> int:
	return roundi(_tuning.laps_before_breath) - floori(_run_since_breath / _tuning.lap_seconds)


## Seconds until he stops to breathe or starts running again; INF while he is in the field.
func _seconds_until_toil_turns() -> float:
	if not _on_generator:
		return INF
	if _breath_left > 0.0:
		return _breath_left
	return _run_seconds() - _run_since_breath


## Some seconds of the Worker's time outside a Study Session, never past the next turn.
func _toil(seconds: float) -> void:
	if not _on_generator:
		return
	if _breath_left > 0.0:
		_breath_left = 0.0 if seconds >= _breath_left else _breath_left - seconds
		return
	_grow(seconds)
	if seconds >= _run_seconds() - _run_since_breath:
		_run_since_breath = 0.0
		_breath_left = _tuning.breath_seconds
	else:
		_run_since_breath += seconds


func _grow(seconds: float) -> void:
	for index in _grown.size():
		if _grown[index] != EMPTY:
			_grown[index] = minf(_grown[index] + seconds, _tuning.grow_seconds)


func _ripe_count() -> int:
	return _grown.count(_tuning.grow_seconds)


func _exists(index: int) -> bool:
	return index >= 0 and index < _grown.size()
