class_name ToolsTier
extends Resource
## One tier of the tools Upgrade in the tuning table. Every field starts as NAN, so a tier that
## leaves one out is caught as "missing". Tuning.problems() checks the tiers.

## Labour Points this tier costs. A whole number above 0.
@export var price: float = NAN
## The share left with this tier, against no Upgrade (1), of both a slow pick's time and the
## chance an exhausted pick drops its cotton. Above 0 and at most 1; it never rises from one
## tier to the next.
@export var work_share: float = NAN
## How many more picks the Quota demands from the Shift after this tier is bought. A whole
## number of at least 1, so an Upgrade always raises the Quota.
@export var quota_rise: float = NAN


static func make(tier_price: float, share: float, rise: float) -> ToolsTier:
	var tier := ToolsTier.new()
	tier.price = tier_price
	tier.work_share = share
	tier.quota_rise = rise
	return tier
