class_name Crops
extends RefCounted
## The plots and the cotton in them: how far each crop has grown, how long it has sat ripe,
## and whether it has Withered. Farm owns this and decides when time passes and at what
## growth rate; this only keeps the plots' arithmetic, so Farm stays about the Worker, the
## Shift and the punishments. Tested through Farm, not on its own.

## Marks a plot with nothing planted in _grown.
const EMPTY := -1.0
## The stages a crop passes through before it is ripe, each an equal share of the grow time.
const GROWING: Array[PlotView.Stage] = [
	PlotView.Stage.SEEDLING,
	PlotView.Stage.FLOWERING,
	PlotView.Stage.BOLL,
]

var _grow_seconds: float
var _wither_seconds: float
## Seconds of growth per plot, capped at the grow time; EMPTY when nothing is planted.
var _grown: Array[float] = []
## Seconds each ripe plot has sat unpicked outside Study Sessions; 0 until it is ripe.
var _ripe_for: Array[float] = []
var _withered: Array[bool] = []


func _init(grow_seconds: float, wither_seconds: float, plot_count: int) -> void:
	_grow_seconds = grow_seconds
	_wither_seconds = wither_seconds
	_grown.resize(plot_count)
	_grown.fill(EMPTY)
	_ripe_for.resize(plot_count)
	_ripe_for.fill(0.0)
	_withered.resize(plot_count)
	_withered.fill(false)


func count() -> int:
	return _grown.size()


func exists(index: int) -> bool:
	return index >= 0 and index < _grown.size()


func is_empty(index: int) -> bool:
	return _grown[index] == EMPTY


func is_ripe(index: int) -> bool:
	return _grown[index] >= _grow_seconds and not _withered[index]


func is_withered(index: int) -> bool:
	return _withered[index]


func plant(index: int) -> void:
	_grown[index] = 0.0
	_ripe_for[index] = 0.0
	_withered[index] = false


## Empties a plot, whether its cotton was picked or it had Withered and is cleared.
func empty(index: int) -> void:
	_grown[index] = EMPTY
	_ripe_for[index] = 0.0
	_withered[index] = false


## Seconds until the next crop Withers if time passes at this growth rate outside a Study
## Session; INF when none would.
func seconds_until_wither(growth_rate: float) -> float:
	var soonest := INF
	for index in _grown.size():
		if _grown[index] == EMPTY or _withered[index]:
			continue
		var until_ripe := _seconds_until_ripe(index, growth_rate)
		soonest = minf(soonest, until_ripe + _wither_seconds - _ripe_for[index])
	return soonest


## Grows every crop by `seconds` at `growth_rate`. When `ripe_ages` (time outside a Study
## Session), ripe cotton also ages towards Withering. Returns the plots that Withered.
func pass_time(seconds: float, growth_rate: float, ripe_ages: bool) -> Array[int]:
	var withered: Array[int] = []
	for index in _grown.size():
		if _grown[index] == EMPTY or _withered[index]:
			continue
		var until_ripe := _seconds_until_ripe(index, growth_rate)
		if seconds < until_ripe:
			_grown[index] += seconds * growth_rate
			continue
		_grown[index] = _grow_seconds
		if not ripe_ages:
			continue
		var aged := seconds - until_ripe
		if aged >= _wither_seconds - _ripe_for[index]:
			_withered[index] = true
			withered.append(index)
		else:
			_ripe_for[index] += aged
	return withered


func ripe_count() -> int:
	var ripe := 0
	for index in _grown.size():
		if is_ripe(index):
			ripe += 1
	return ripe


func view(index: int) -> PlotView:
	var grown := _grown[index]
	if grown == EMPTY:
		return PlotView.new(PlotView.Stage.EMPTY, 0.0)
	if _withered[index]:
		return PlotView.new(PlotView.Stage.WITHERED, 0.0)
	if grown >= _grow_seconds:
		return PlotView.new(PlotView.Stage.RIPE, 0.0)
	var stage_index := floori(grown * GROWING.size() / _grow_seconds)
	return PlotView.new(GROWING[stage_index], _grow_seconds - grown)


## 0 when ripe; INF when the crop isn't growing at this rate.
func _seconds_until_ripe(index: int, growth_rate: float) -> float:
	var left := _grow_seconds - _grown[index]
	if left <= 0.0:
		return 0.0
	if growth_rate <= 0.0:
		return INF
	return left / growth_rate
