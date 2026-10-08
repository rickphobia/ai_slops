class_name Ledger
extends RefCounted
## The Worker's Labour Points and Debt as one signed balance: a negative balance is Debt, so
## earnings pay Debt down before anything is left to spend. At the end of a Shift it charges
## the Bills in a fixed order (electricity, then rent) and builds the pay slip. Negligence docks
## the balance but never below zero, so docking can never create Debt. Farm owns this and
## decides when; tested through Farm, not on its own.

var _balance := 0
## Labour Points earned by work this Shift, for the pay slip.
var _earned := 0


func _init(balance := 0, earned := 0) -> void:
	_balance = balance
	_earned = earned


## Labour Points and Debt as one number: negative when in Debt.
func balance() -> int:
	return _balance


func labour_points() -> int:
	return maxi(_balance, 0)


func debt() -> int:
	return maxi(-_balance, 0)


func in_debt() -> bool:
	return _balance < 0


func earned() -> int:
	return _earned


## Wages for work: they count on the pay slip. Returns true when they cleared the Debt.
func earn(points: int) -> bool:
	_earned += points
	return credit(points)


## Labour Points that are not wages, such as the debug command's. Returns true when they
## cleared the Debt.
func credit(points: int) -> bool:
	var was_in_debt := in_debt()
	_balance += points
	return was_in_debt and not in_debt()


func can_afford(price: int) -> bool:
	return _balance >= price


## Takes the price off the balance. Callers check can_afford() first.
func spend(price: int) -> void:
	_balance -= price


## Docks up to the given points, never taking the balance below zero. Returns what was docked.
func dock(points: int) -> int:
	var docked := clampi(points, 0, maxi(_balance, 0))
	_balance -= docked
	return docked


## Charges the Bills for Shift `shift`, electricity for the `laps` run in it and then rent, and
## starts the next Shift's earnings from zero. A Bill the balance can't cover is charged anyway:
## the shortfall is Debt. Returns the pay slip: shift, earned, laps, electricity,
## electricity_covered, rent, rent_covered and balance (negative for Debt).
func settle_shift(shift: int, laps: int, tuning: Tuning) -> Dictionary:
	var electricity := roundi(laps * tuning.electricity_per_lap)
	var rent := roundi(tuning.rent_per_shift)
	var slip := {"shift": shift, "earned": _earned, "laps": laps, "electricity": electricity}
	slip["electricity_covered"] = _charge(electricity)
	slip["rent"] = rent
	slip["rent_covered"] = _charge(rent)
	slip["balance"] = _balance
	_earned = 0
	return slip


## Returns whether the balance covered the whole Bill.
func _charge(bill: int) -> bool:
	var covered := _balance >= bill
	_balance -= bill
	return covered
