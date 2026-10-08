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
## serves the Study Session, but the Shift waits. Ripe cotton left unpicked too long, counted
## outside Study Sessions, Withers; each Withered plot is Negligence, which docks Labour Points
## and starts a Study Session longer than a missed Quota's. Later tickets add Exhaustion here.

const NO_SUCH_PLOT := &"no_such_plot"
const NOT_EMPTY := &"not_empty"
const NOT_RIPE := &"not_ripe"
const NOTHING_PLANTED := &"nothing_planted"
const IN_STUDY_SESSION := &"in_study_session"
const WITHERED := &"withered"
const NOT_WITHERED := &"not_withered"

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
## A Study Session began: values seconds, minutes (rounded up), in_a_row (Quotas missed in a
## row so far: 1 for the first since the last met Quota, unchanged by Negligence).
const STUDY_SESSION_STARTED := &"study_session_started"
## A Study Session ended: values in_a_row.
const STUDY_SESSION_ENDED := &"study_session_ended"
## Plots Withered at the same moment: values plots (how many), points (Labour Points docked).
## A Study Session for the Negligence follows at once.
const NEGLIGENCE_LOGGED := &"negligence_logged"
## The Worker came back from offline time: values minutes (away, rounded up), ripened (plots
## that ripened while away, even if they then Withered), withered (plots that Withered while
## away), study_minutes (Study Session served while away, rounded up).
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
	NEGLIGENCE_LOGGED,
	AWAY_SUMMARY,
]
## The Quota-missed key for the first, second and every later miss in a row.
const MISSED_KEYS: Array[StringName] = [QUOTA_MISSED, QUOTA_MISSED_AGAIN, QUOTA_MISSED_REPEATEDLY]

var _tuning: Tuning
var _crops: Crops
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
	_crops = Crops.new(tuning.grow_seconds, tuning.wither_seconds, plot_count)
	_start_shift()


func plant(index: int) -> CommandResult:
	if in_study_session():
		return CommandResult.refused(IN_STUDY_SESSION)
	if not _crops.exists(index):
		return CommandResult.refused(NO_SUCH_PLOT)
	if _crops.is_withered(index):
		return CommandResult.refused(WITHERED)
	if not _crops.is_empty(index):
		return CommandResult.refused(NOT_EMPTY)
	_crops.plant(index)
	_on_generator = false
	return CommandResult.done()


func pick(index: int) -> CommandResult:
	if in_study_session():
		return CommandResult.refused(IN_STUDY_SESSION)
	if not _crops.exists(index):
		return CommandResult.refused(NO_SUCH_PLOT)
	if _crops.is_empty(index):
		return CommandResult.refused(NOTHING_PLANTED)
	if _crops.is_withered(index):
		return CommandResult.refused(WITHERED)
	if not _crops.is_ripe(index):
		return CommandResult.refused(NOT_RIPE)
	_crops.empty(index)
	_picked += 1
	_labour_points += roundi(_tuning.labour_points_per_pick)
	_on_generator = false
	return CommandResult.done()


## Empties a Withered plot so it can be planted again. Like planting, it is field work.
func clear(index: int) -> CommandResult:
	if in_study_session():
		return CommandResult.refused(IN_STUDY_SESSION)
	if not _crops.exists(index):
		return CommandResult.refused(NO_SUCH_PLOT)
	if not _crops.is_withered(index):
		return CommandResult.refused(NOT_WITHERED)
	_crops.empty(index)
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
	# One long step can cover several Shifts, Study Sessions, runs, breaths and Witherings;
	# each ends in turn.
	while remaining > 0.0:
		if in_study_session():
			remaining -= _serve_study_session(remaining)
		else:
			var shift_left := _tuning.shift_seconds - _shift_elapsed
			var growth_rate := 1.0 if worker().activity == WorkerView.Activity.RUNNING else 0.0
			var worked := minf(minf(remaining, shift_left), _seconds_until_toil_turns())
			worked = minf(worked, _crops.seconds_until_wither(growth_rate))
			_toil(worked)
			var withered := _crops.pass_time(worked, growth_rate, true)
			remaining -= worked
			if worked >= shift_left:
				_shift_elapsed = 0.0
				_end_shift()
			else:
				_shift_elapsed += worked
			# After the Shift's end, so a missed Quota's shorter Study Session can't replace it.
			_log_negligence(withered)


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
	var rate := _tuning.offline_growth_rate
	var ripe_before := _crops.ripe_count()
	var study_served := 0.0
	var withered := 0
	var remaining := counted
	# The Study Session comes first; ripe cotton ages towards Withering only after it.
	while remaining > 0.0:
		if in_study_session():
			var served := _serve_study_session(remaining)
			_crops.pass_time(served, rate, false)
			study_served += served
			remaining -= served
		else:
			var step := minf(remaining, _crops.seconds_until_wither(rate))
			var withered_plots := _crops.pass_time(step, rate, true)
			withered += withered_plots.size()
			_log_negligence(withered_plots)
			remaining -= step
	# Withered plots are no longer ripe, and nothing else stops being ripe while away.
	var ripened := _crops.ripe_count() - ripe_before + withered
	if counted > 0.0:
		var values := {
			"minutes": ceili(counted / 60.0),
			"ripened": ripened,
			"withered": withered,
			"study_minutes": ceili(study_served / 60.0),
		}
		_messages.append(AppMessage.new(AWAY_SUMMARY, values))
	return AwayReport.new(seconds, counted, problem, ripened, withered, study_served)


## The plot at index; it must exist.
func plot(index: int) -> PlotView:
	return _crops.view(index)


func plots() -> Array[PlotView]:
	var views: Array[PlotView] = []
	for index in _crops.count():
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
	_begin_study_session(
		minf(_tuning.study_session_seconds * pow(2.0, doublings), _tuning.study_session_cap_seconds)
	)


## Logs the plots that Withered at one moment as Negligence: docks Labour Points for each, never
## below zero, and starts the Negligence Study Session. Plots Withering together share one.
func _log_negligence(withered_plots: Array[int]) -> void:
	if withered_plots.is_empty():
		return
	var docked := mini(
		_labour_points, withered_plots.size() * roundi(_tuning.negligence_labour_points)
	)
	_labour_points -= docked
	var values := {"plots": withered_plots.size(), "points": docked}
	_messages.append(AppMessage.new(NEGLIGENCE_LOGGED, values))
	_begin_study_session(maxf(_study_left, _tuning.negligence_study_session_seconds))
	_on_generator = false


func _begin_study_session(seconds: float) -> void:
	_study_left = seconds
	var values := {
		"seconds": _study_left,
		"minutes": ceili(_study_left / 60.0),
		"in_a_row": _misses_in_a_row,
	}
	_messages.append(AppMessage.new(STUDY_SESSION_STARTED, values))


## Counts the Study Session down by up to `seconds`, ending it if they cover what is left.
## Returns the seconds served: 0 when there is no Study Session.
func _serve_study_session(seconds: float) -> float:
	var served := minf(seconds, _study_left)
	if served <= 0.0:
		return 0.0
	if served >= _study_left:
		_end_study_session()
	else:
		_study_left -= served
	return served


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


## Some seconds of the Worker's time outside a Study Session, never past the next turn. The
## crops' growth for them is the caller's.
func _toil(seconds: float) -> void:
	if not _on_generator:
		return
	if _breath_left > 0.0:
		_breath_left = 0.0 if seconds >= _breath_left else _breath_left - seconds
		return
	if seconds >= _run_seconds() - _run_since_breath:
		_run_since_breath = 0.0
		_breath_left = _tuning.breath_seconds
	else:
		_run_since_breath += seconds
