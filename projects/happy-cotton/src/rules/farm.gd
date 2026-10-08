class_name Farm
extends RefCounted
## The Farm rules: the plots and the cotton growing in them. No scene tree, clock or file
## access: time only moves when advance() or resume_offline() is called, so tests play hours
## in milliseconds.
## It also runs the Shift: online play counts it down, and at its end the Quota is checked and
## the next Shift starts at once with a higher Quota. What The App should say comes out as
## AppMessages through take_messages(). A missed Quota starts a Study Session: the Worker can't
## plant or pick until it ends, and the next Shift's clock waits for it.
## The Worker is either in the field or on the Generator (see Toil). Crops grow only while he
## runs on it; after a set number of laps he stops to breathe and growth halts until the
## Overseer whistles, then whips, and he runs again (advance() returns these events).
## Planting or picking brings him back to the field, and so does a Study Session.
## Offline time (the game closed or its tab hidden) grows crops at a slower rate with no
## Generator and serves the Study Session, but the Shift waits. Ripe cotton left unpicked too
## long, counted outside Study Sessions, Withers; each Withered plot is Negligence, which docks
## Labour Points and starts a Study Session longer than a missed Quota's.
## Work wears the Worker down (see Exhaustion): above one threshold his field work is slow,
## above a higher one a pick can drop its cotton, and he runs fewer laps before he stops to
## breathe. Labour Points buy a rest hour, which takes him off the Generator and lowers
## Exhaustion towards a floor that rises every Shift. A missed Quota takes the rest hour away
## for the next Shift. Offline time recovers Exhaustion slowly, never below the floor.
## to_save() gives the whole Farm as plain data and restore() takes it back, so a restored Farm
## plays on exactly as the saved one would have.

const NO_SUCH_PLOT := &"no_such_plot"
const NOT_EMPTY := &"not_empty"
const NOT_RIPE := &"not_ripe"
const NOTHING_PLANTED := &"nothing_planted"
const IN_STUDY_SESSION := &"in_study_session"
const WITHERED := &"withered"
const NOT_WITHERED := &"not_withered"
## He is still at a slow plant, pick or clear (Exhaustion above the slow threshold).
const WORKER_BUSY := &"worker_busy"
const RESTING := &"resting"
const REST_HOUR_TAKEN_AWAY := &"rest_hour_taken_away"
const NOT_ENOUGH_LABOUR_POINTS := &"not_enough_labour_points"
## Every reason buy_rest_hour() can refuse with; the App text table explains each.
const REST_HOUR_REFUSALS: Array[StringName] = [
	IN_STUDY_SESSION,
	REST_HOUR_TAKEN_AWAY,
	RESTING,
	NOT_ENOUGH_LABOUR_POINTS,
]

## The save format to_save() writes and restore() reads. Raise it when the format changes.
const SAVE_VERSION := 1

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
## away), study_minutes (Study Session served while away, rounded up), exhaustion_recovered
## (rounded).
const AWAY_SUMMARY := &"away_summary"
## A rest hour was bought: values price, minutes (rounded up).
const REST_STARTED := &"rest_started"
## A rest hour ran its course. A Study Session cuts one short without this.
const REST_ENDED := &"rest_ended"
## An exhausted pick dropped its cotton: nothing counted, nothing earned.
const COTTON_DROPPED := &"cotton_dropped"
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
	REST_STARTED,
	REST_ENDED,
	COTTON_DROPPED,
]
## Overseer events, for the field and its sounds; never App text. He blew his whistle at the
## Worker stopped to breathe.
const OVERSEER_WHISTLE := Toil.WHISTLE
## He used the whip, and the Worker runs again. It changes no numbers.
const OVERSEER_WHIP := Toil.WHIP
## The Quota-missed key for the first, second and every later miss in a row.
const MISSED_KEYS: Array[StringName] = [QUOTA_MISSED, QUOTA_MISSED_AGAIN, QUOTA_MISSED_REPEATEDLY]

var _tuning: Tuning
var _crops: Crops
var _exhaustion: Exhaustion
var _toil: Toil
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
## Seconds left of a slow field action; he can do no other field work until it is 0.
var _busy_left := 0.0
## Seconds left of a rest hour; 0 when he isn't resting.
var _rest_left := 0.0
## Set by a missed Quota for the whole of the next Shift.
var _rest_taken_away := false
## Returns a number from 0 to 1 each call; a pick drops its cotton when it comes up under the
## tuning's chance.
var _roll: Callable
## Kept here for the default roll, as a Callable doesn't keep its object alive.
var _random: RandomNumberGenerator


## `roll` is the source of chance, returning a number from 0 to 1; tests pass their own.
## Without one the Farm uses a randomly seeded generator.
func _init(tuning: Tuning, plot_count: int, roll: Callable = Callable()) -> void:
	_tuning = tuning
	_crops = Crops.new(tuning.grow_seconds, tuning.wither_seconds, plot_count)
	_exhaustion = Exhaustion.new(tuning)
	_toil = Toil.new(tuning, _exhaustion)
	if roll.is_valid():
		_roll = roll
	else:
		_random = RandomNumberGenerator.new()
		_random.randomize()
		_roll = _random.randf
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
	var unable := _unable_to_work()
	if unable != &"":
		return CommandResult.refused(unable)
	_start_field_work(_tuning.exhaustion_per_plant)
	_crops.plant(index)
	return CommandResult.done()


## Picks ripe cotton. Exhausted past the mistake threshold, he can drop it: the plot is
## emptied, but nothing counts towards the Quota and nothing is earned.
func pick(index: int) -> CommandResult:
	var refusal := _pick_refusal(index)
	if refusal != &"":
		return CommandResult.refused(refusal)
	# How tired he was as he reached for it decides whether he drops it.
	var roll: float = _roll.call()
	var drops := _exhaustion.can_drop_cotton() and roll < _tuning.dropped_cotton_chance
	_start_field_work(_tuning.exhaustion_per_pick)
	_crops.empty(index)
	if drops:
		_messages.append(AppMessage.new(COTTON_DROPPED, {}))
	else:
		_picked += 1
		_labour_points += roundi(_tuning.labour_points_per_pick)
	return CommandResult.done()


## Empties a Withered plot so it can be planted again. Like planting, it is field work.
func clear(index: int) -> CommandResult:
	if in_study_session():
		return CommandResult.refused(IN_STUDY_SESSION)
	if not _crops.exists(index):
		return CommandResult.refused(NO_SUCH_PLOT)
	if not _crops.is_withered(index):
		return CommandResult.refused(NOT_WITHERED)
	var unable := _unable_to_work()
	if unable != &"":
		return CommandResult.refused(unable)
	_start_field_work(0.0)
	_crops.empty(index)
	return CommandResult.done()


## Sends the Worker to run on the Generator. Sending him while he is on it changes nothing.
func run_generator() -> CommandResult:
	if in_study_session():
		return CommandResult.refused(IN_STUDY_SESSION)
	if _resting():
		return CommandResult.refused(RESTING)
	_toil.send()
	return CommandResult.done()


## The rest hour, the first Privilege: it costs Labour Points and takes the Worker off the
## Generator, lowering his Exhaustion towards its floor while the Shift counts on.
func buy_rest_hour() -> CommandResult:
	if in_study_session():
		return CommandResult.refused(IN_STUDY_SESSION)
	if _rest_taken_away:
		return CommandResult.refused(REST_HOUR_TAKEN_AWAY)
	if _resting():
		return CommandResult.refused(RESTING)
	var price := _rest_hour_price()
	if _labour_points < price:
		return CommandResult.refused(NOT_ENOUGH_LABOUR_POINTS)
	_labour_points -= price
	_rest_left = _tuning.rest_hour_seconds
	_toil.bring_back()
	var values := {"price": price, "minutes": ceili(_rest_left / 60.0)}
	_messages.append(AppMessage.new(REST_STARTED, values))
	return CommandResult.done()


## Moves the Farm on by some seconds of online play. Time never runs backwards, so a
## negative step does nothing. The clock that runs is the Study Session's while the Worker is
## in one, and the Shift's otherwise; crops grow only while he runs on the Generator.
## Returns what the Overseer did in that time (OVERSEER_WHISTLE, OVERSEER_WHIP), oldest first,
## for the scene to show as it happens; they are not saved.
func advance(seconds: float) -> Array[StringName]:
	var overseer_events: Array[StringName] = []
	_busy_left = maxf(0.0, _busy_left - maxf(seconds, 0.0))
	var remaining := seconds
	# One long step can cover several Shifts, Study Sessions, runs, breaths, rests and
	# Witherings; each ends in turn.
	while remaining > 0.0:
		if in_study_session():
			remaining -= _serve_study_session(remaining)
		else:
			var shift_left := _tuning.shift_seconds - _shift_elapsed
			var growth_rate := 1.0 if _toil.is_running() else 0.0
			var worked := minf(minf(remaining, shift_left), _toil.seconds_until_turn())
			worked = minf(worked, _crops.seconds_until_wither(growth_rate))
			worked = minf(worked, _rest_left if _resting() else INF)
			var overseer_event := _toil.pass_time(worked)
			if overseer_event != Toil.NO_EVENT:
				overseer_events.append(overseer_event)
			_rest(worked)
			var withered := _crops.tend(worked, growth_rate)
			remaining -= worked
			if worked >= shift_left:
				_shift_elapsed = 0.0
				_end_shift()
			else:
				_shift_elapsed += worked
			# After the Shift's end, so a missed Quota's shorter Study Session can't replace it.
			_log_negligence(withered)
	return overseer_events


## Moves the Farm on by some seconds offline: crops grow at the offline rate whatever the
## Worker was doing, and a Study Session counts down, but the Shift waits and the Worker stays
## where he was: a rest hour waits for his return, like the Shift. Exhaustion recovers at the
## offline rate, never below its floor. A wrong clock can't break the Farm: negative time
## counts as zero and a long absence is cut to the tuning's cap; the report says which.
func resume_offline(seconds: float) -> AwayReport:
	var counted := clampf(seconds, 0.0, _tuning.offline_cap_seconds)
	var problem := &""
	if seconds < 0.0:
		problem = NEGATIVE_OFFLINE_TIME
	elif seconds > _tuning.offline_cap_seconds:
		problem = OFFLINE_TIME_CAPPED
	_busy_left = maxf(0.0, _busy_left - counted)
	var recovered := _exhaustion.recover(_tuning.offline_recovery_per_hour * counted / 3600.0)
	var rate := _tuning.offline_growth_rate
	var ripe_before := _crops.ripe_count()
	var study_served := 0.0
	var withered := 0
	var remaining := counted
	# The Study Session comes first; ripe cotton ages towards Withering only after it.
	while remaining > 0.0:
		if in_study_session():
			var served := _serve_study_session(remaining)
			_crops.grow(served, rate)
			study_served += served
			remaining -= served
		else:
			var step := minf(remaining, _crops.seconds_until_wither(rate))
			var withered_plots := _crops.tend(step, rate)
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
			"exhaustion_recovered": roundi(recovered),
		}
		_messages.append(AppMessage.new(AWAY_SUMMARY, values))
	return AwayReport.new(seconds, counted, problem, ripened, withered, study_served, recovered)


## The whole Farm as plain data (numbers, true or false, lists and dictionaries), with the save
## format version. Pending App messages and the source of chance are not part of it.
func to_save() -> Dictionary:
	return {
		"version": SAVE_VERSION,
		"shift_number": _shift_number,
		"shift_elapsed": _shift_elapsed,
		"picked": _picked,
		"labour_points": _labour_points,
		"study_left": _study_left,
		"misses_in_a_row": _misses_in_a_row,
		"busy_left": _busy_left,
		"rest_left": _rest_left,
		"rest_taken_away": _rest_taken_away,
		"crops": _crops.to_save(),
		"exhaustion": _exhaustion.to_save(),
		"toil": _toil.to_save(),
	}


## Takes the Farm from a save written by to_save(), as it comes back from JSON. Returns what is
## wrong with it, one line per bad field; then the Farm is left as it was. On success the
## pending App messages are dropped: they described the Farm before the restore.
## Timers are held to what the tuning table allows now, in case it shortened them since the
## save was written; the save's other numbers are taken as they are.
func restore(save: Dictionary) -> Array[String]:
	var reader := SaveReader.new(save)
	var version := reader.whole("version")
	if reader.problems().is_empty() and version != SAVE_VERSION:
		return ["version %d is not the version this game reads (%d)" % [version, SAVE_VERSION]]
	var crops := Crops.new(_tuning.grow_seconds, _tuning.wither_seconds, _crops.count())
	crops.restore(reader.section("crops"))
	var exhaustion := Exhaustion.new(_tuning)
	exhaustion.restore(reader.section("exhaustion"))
	var toil := Toil.new(_tuning, exhaustion)
	toil.restore(reader.section("toil"))
	var shift_number := reader.whole("shift_number", 1)
	var shift_elapsed := minf(reader.number("shift_elapsed"), _tuning.shift_seconds)
	var picked := reader.whole("picked")
	var labour_points := reader.whole("labour_points")
	var study_left := reader.number("study_left")
	var misses_in_a_row := reader.whole("misses_in_a_row")
	var busy_left := minf(reader.number("busy_left"), _tuning.slow_action_seconds)
	var rest_left := minf(reader.number("rest_left"), _tuning.rest_hour_seconds)
	var rest_taken_away := reader.flag("rest_taken_away")
	if not reader.problems().is_empty():
		return reader.problems()
	_crops = crops
	_exhaustion = exhaustion
	_toil = toil
	_shift_number = shift_number
	_shift_elapsed = shift_elapsed
	_picked = picked
	_labour_points = labour_points
	_study_left = study_left
	_misses_in_a_row = misses_in_a_row
	_busy_left = busy_left
	_rest_left = rest_left
	_rest_taken_away = rest_taken_away
	_messages = []
	return []


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
	var activity := WorkerView.Activity.IN_FIELD
	if _resting():
		activity = WorkerView.Activity.RESTING
	elif _toil.is_breathing():
		activity = WorkerView.Activity.BREATHING
	elif _toil.is_running():
		activity = WorkerView.Activity.RUNNING
	return WorkerView.new(activity, _toil.laps_left(), _exhaustion.level(), _toil.lap_progress())


## From 0 (rested) to Exhaustion.MOST (spent).
func exhaustion() -> float:
	return _exhaustion.level()


## The least Exhaustion can be; it rises every Shift and never falls.
func exhaustion_floor() -> float:
	return _exhaustion.floor_level()


func _resting() -> bool:
	return _rest_left > 0.0


## Its price, the seconds left of one under way, and whether a missed Quota took it away.
func rest_hour() -> RestHourView:
	return RestHourView.new(_rest_hour_price(), _rest_left, _rest_taken_away)


func _rest_hour_price() -> int:
	return roundi(_tuning.rest_hour_price)


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


## Checks the Quota, raises the Exhaustion floor and starts the next Shift. A missed Quota
## also takes the rest hour away until the next Shift ends.
func _end_shift() -> void:
	var values := {"shift": _shift_number, "picked": _picked, "quota": _quota()}
	if _picked >= _quota():
		_misses_in_a_row = 0
		_rest_taken_away = false
		_messages.append(AppMessage.new(QUOTA_MET, values))
	else:
		_misses_in_a_row += 1
		_rest_taken_away = true
		var key := MISSED_KEYS[mini(_misses_in_a_row, MISSED_KEYS.size()) - 1]
		_messages.append(AppMessage.new(key, values))
		_start_study_session()
	_exhaustion.raise_floor(_tuning.exhaustion_floor_rise)
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


## Takes the Worker off the Generator and cuts any rest hour short.
func _begin_study_session(seconds: float) -> void:
	_study_left = seconds
	_rest_left = 0.0
	_toil.bring_back()
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


## Why plot `index` can't be picked right now, or &"" when it can.
func _pick_refusal(index: int) -> StringName:
	if in_study_session():
		return IN_STUDY_SESSION
	if not _crops.exists(index):
		return NO_SUCH_PLOT
	if _crops.is_empty(index):
		return NOTHING_PLANTED
	if _crops.is_withered(index):
		return WITHERED
	if not _crops.is_ripe(index):
		return NOT_RIPE
	return _unable_to_work()


## Why the Worker can't do field work right now, or &"" when he can.
func _unable_to_work() -> StringName:
	if _resting():
		return RESTING
	if _busy_left > 0.0:
		return WORKER_BUSY
	return &""


## Field work brings him back from the Generator. Exhausted, it is slow, judged by how tired he
## was when he started; then it adds its own Exhaustion.
func _start_field_work(exhaustion_added: float) -> void:
	_toil.bring_back()
	if _exhaustion.slows_work():
		_busy_left = _tuning.slow_action_seconds
	_exhaustion.add(exhaustion_added)


## Some seconds of a rest hour, never past its end: Exhaustion falls a little at a time.
func _rest(seconds: float) -> void:
	if not _resting():
		return
	_exhaustion.recover(_tuning.rest_hour_recovery * seconds / _tuning.rest_hour_seconds)
	if seconds >= _rest_left:
		_rest_left = 0.0
		_toil.rested()
		_messages.append(AppMessage.new(REST_ENDED, {}))
	else:
		_rest_left -= seconds
