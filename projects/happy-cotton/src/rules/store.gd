class_name Store
extends RefCounted
## The Upgrades the Worker owns: which Generator tier, what it does, and the Quota rise of
## every tier bought so far. Farm owns this, checks the Worker can pay and decides when the
## Quota rise counts; tested through Farm, not on its own.

var _generator_tiers: Array[GeneratorTier]
## Generator tiers bought, from 0 (none) to the number of tiers.
var _generator_tier := 0


func _init(generator_tiers: Array[GeneratorTier]) -> void:
	_generator_tiers = generator_tiers


func generator_tier() -> int:
	return _generator_tier


func generator_top_tier() -> int:
	return _generator_tiers.size()


## The next Generator tier to buy, or null when the Generator is fully upgraded.
func next_generator_tier() -> GeneratorTier:
	if _generator_tier >= _generator_tiers.size():
		return null
	return _generator_tiers[_generator_tier]


## How much faster crops grow per second of running than with no Upgrade.
func growth_multiplier() -> float:
	if _generator_tier == 0:
		return Tuning.NO_UPGRADE_GROWTH
	return _generator_tiers[_generator_tier - 1].growth_multiplier


## Moves to the next Generator tier. Callers check next_generator_tier() first.
func buy_generator_tier() -> void:
	_generator_tier += 1


## The Quota rise of every Upgrade tier bought so far.
func quota_rise() -> int:
	var rise := 0
	for index in _generator_tier:
		rise += roundi(_generator_tiers[index].quota_rise)
	return rise


func to_save() -> Dictionary:
	return {"generator_tier": _generator_tier}


## Takes the owned tiers from a save, held to the tiers the tuning table has now in case it
## dropped some since the save was written.
func restore(reader: SaveReader) -> void:
	_generator_tier = mini(reader.whole("generator_tier"), _generator_tiers.size())
