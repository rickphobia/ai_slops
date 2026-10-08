class_name GeneratorTier
extends Resource
## One tier of the Generator Upgrade in the tuning table. Every field starts as NAN, so a tier
## that leaves one out is caught as "missing". Tuning.problems() checks the tiers.

## Labour Points this tier costs. A whole number above 0.
@export var price: float = NAN
## How much faster crops grow per second of running with this tier, against no Upgrade (1).
## It never falls from one tier to the next.
@export var growth_multiplier: float = NAN
## How many more picks the Quota demands from the Shift after this tier is bought. A whole
## number of at least 1, so an Upgrade always raises the Quota.
@export var quota_rise: float = NAN


static func make(tier_price: float, multiplier: float, rise: float) -> GeneratorTier:
	var tier := GeneratorTier.new()
	tier.price = tier_price
	tier.growth_multiplier = multiplier
	tier.quota_rise = rise
	return tier
