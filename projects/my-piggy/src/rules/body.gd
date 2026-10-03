class_name Body
extends RefCounted
## The pig body that fights the player. Holds the urge and the hidden humanity.
## Each step it takes the time passed and what the player is doing (trotting, holding
## suppress) and returns what the body did as BodyEvents.
## Pure rules: no scene tree, nodes, physics, rendering or audio.

## The urge scale: an outburst is due when it reaches the peak.
const URGE_PEAK: float = 100.0
## Humanity scale: the Piggy wakes fully themselves and it only goes down from there.
const HUMANITY_FULL: float = 100.0

var urge: float = 0.0
var humanity: float = HUMANITY_FULL

var _tuning: Tuning
var _rng: RandomNumberGenerator
var _rise_multiplier: float = 1.0
## Seconds suppress has held back the outburst that is due; 0 when none is held back.
var _suppressed_seconds: float = 0.0
var _is_holding_back: bool = false
var _give_in_seconds_left: float = 0.0
var _used_spots: Array[StringName] = []


## The rng picks which outburst comes (snort, squeal or lunge). Tests pass a seeded one.
func _init(tuning: Tuning, rng: RandomNumberGenerator) -> void:
	_tuning = tuning
	_rng = rng


## True while the warning signs show: the urge is past the warning threshold.
func is_warning() -> bool:
	return urge >= _tuning.urge_warning and not is_giving_in()


## True while suppress is holding back an outburst that is due.
func is_suppressing() -> bool:
	return _is_holding_back


func is_giving_in() -> bool:
	return _give_in_seconds_left > 0.0


## How fast the Piggy may move, as a fraction of their normal speed.
func speed_factor() -> float:
	if is_giving_in():
		return 0.0
	if is_suppressing():
		return _tuning.suppress_speed_factor
	return 1.0


## How far the outburst that is due would be heard, as a multiple of its normal loudness.
func loudness_multiplier() -> float:
	return 1.0 + _tuning.suppress_loudness_per_second * _suppressed_seconds


## Moves the body on by `delta` seconds. `at` is where the Piggy is, for the events.
func advance(delta: float, trotting: bool, suppress_held: bool, at: Vector3) -> Array[BodyEvent]:
	var events: Array[BodyEvent] = []
	if is_giving_in():
		_advance_give_in(delta, at, events)
		return events
	var was_warning := is_warning()
	var rise := _tuning.urge_rise_trotting if trotting else _tuning.urge_rise_at_rest
	urge = minf(urge + rise * _rise_multiplier * delta, URGE_PEAK)
	if is_warning() and not was_warning:
		events.append(BodyEvent.new(BodyEvent.Kind.WARNING, at))
	if urge < URGE_PEAK:
		return events
	if suppress_held:
		_hold_back(delta, at, events)
	else:
		events.append(_outburst(at))
	return events


## Starts giving in at a give-in spot. Returns null, and does nothing, if the spot was
## already used since the last checkpoint or the Piggy is already giving in.
func give_in(spot: StringName, at: Vector3) -> BodyEvent:
	if is_giving_in() or _used_spots.has(spot):
		return null
	_used_spots.append(spot)
	_is_holding_back = false
	_suppressed_seconds = 0.0
	_give_in_seconds_left = _tuning.give_in_seconds
	return BodyEvent.new(BodyEvent.Kind.GIVE_IN_STARTED, at)


## A new space starts with the body's normal urge rise rate.
func reset_rise_rate() -> void:
	_rise_multiplier = 1.0


func state() -> BodyState:
	return BodyState.new(urge, humanity, _rise_multiplier, _used_spots)


func restore(saved: BodyState) -> void:
	urge = saved.urge
	humanity = saved.humanity
	_rise_multiplier = saved.rise_multiplier
	_used_spots = saved.used_spots.duplicate()
	_is_holding_back = false
	_suppressed_seconds = 0.0
	_give_in_seconds_left = 0.0


func _hold_back(delta: float, at: Vector3, events: Array[BodyEvent]) -> void:
	if not _is_holding_back:
		_is_holding_back = true
		_rise_multiplier *= 1.0 + _tuning.suppressed_rise_increase
		events.append(BodyEvent.new(BodyEvent.Kind.SUPPRESS_STARTED, at))
	_suppressed_seconds = minf(_suppressed_seconds + delta, _tuning.suppress_limit_seconds)
	if _suppressed_seconds >= _tuning.suppress_limit_seconds:
		events.append(_outburst(at))


func _outburst(at: Vector3) -> BodyEvent:
	var which: BodyEvent.Outburst = [
		BodyEvent.Outburst.SNORT, BodyEvent.Outburst.SQUEAL, BodyEvent.Outburst.LUNGE
	][_rng.randi_range(0, 2)]
	var event := BodyEvent.new(
		BodyEvent.Kind.OUTBURST, at, outburst_radius(which) * loudness_multiplier(), which
	)
	urge = _tuning.urge_after_outburst
	_is_holding_back = false
	_suppressed_seconds = 0.0
	return event


## How far an outburst of this kind is heard when nothing made it louder.
func outburst_radius(which: BodyEvent.Outburst) -> float:
	match which:
		BodyEvent.Outburst.SNORT:
			return _tuning.snort_radius
		BodyEvent.Outburst.SQUEAL:
			return _tuning.squeal_radius
		BodyEvent.Outburst.LUNGE:
			return _tuning.lunge_radius
	return 0.0


func _advance_give_in(delta: float, at: Vector3, events: Array[BodyEvent]) -> void:
	_give_in_seconds_left -= delta
	if _give_in_seconds_left > 0.0:
		return
	_give_in_seconds_left = 0.0
	urge = 0.0
	humanity = maxf(humanity - _tuning.give_in_humanity_cost, 0.0)
	events.append(BodyEvent.new(BodyEvent.Kind.GAVE_IN, at, _tuning.give_in_noise_radius))
