class_name Ledger
extends RefCounted
## The Worker's Labour Points and Debt as one signed balance: a negative balance is Debt, so
## earnings pay Debt down before anything is left to spend. At the end of a Shift it charges
## the Bills in a fixed order (electricity, then rent, then school fees every few Shifts) and
## builds the pay slip. A school-fees Bill that leaves a shortfall marks the fees unpaid until
## the Debt is cleared, and counts towards the unpaid-in-a-row count. Negligence docks
## the balance but never below zero, so docking can never create Debt. Farm owns this and
## decides when; tested through Farm, not on its own.

var _balance := 0
## Labour Points earned by work this Shift, for the pay slip.
var _earned := 0
## The Shift whose end charges the next school fees.
var _next_fees_shift := 0
## Set by a school-fees Bill that left a shortfall; cleared when the Debt reaches zero.
var _fees_unpaid := false
## School-fees Bills in a row that left a shortfall; a covered one resets it.
var _fees_unpaid_in_a_row := 0


func _init(
	balance := 0, earned := 0, next_fees_shift := 0, fees_unpaid := false, fees_unpaid_in_a_row := 0
) -> void:
	_balance = balance
	_earned = earned
	_next_fees_shift = next_fees_shift
	_fees_unpaid = fees_unpaid
	_fees_unpaid_in_a_row = fees_unpaid_in_a_row


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


func next_fees_shift() -> int:
	return _next_fees_shift


func fees_unpaid() -> bool:
	return _fees_unpaid


func fees_unpaid_in_a_row() -> int:
	return _fees_unpaid_in_a_row


## Wages for work: they count on the pay slip. Returns true when they cleared the Debt.
func earn(points: int) -> bool:
	_earned += points
	return credit(points)


## Labour Points that are not wages, such as the debug command's. Returns true when they
## cleared the Debt.
func credit(points: int) -> bool:
	var was_in_debt := in_debt()
	_balance += points
	var cleared := was_in_debt and not in_debt()
	if cleared:
		_fees_unpaid = false
	return cleared


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


## Charges the Bills for Shift `shift`: electricity for the `laps` run in it, then rent, then the
## school fees when they are due, and starts the next Shift's earnings from zero. A Bill the
## balance can't cover is charged anyway: the shortfall is Debt. Returns the pay slip: shift,
## earned, laps, electricity, electricity_covered, rent, rent_covered, school_fees (0 when none
## are due), school_fees_covered and balance (negative for Debt).
func settle_shift(shift: int, laps: int, tuning: Tuning) -> Dictionary:
	var electricity := roundi(laps * tuning.electricity_per_lap)
	var rent := roundi(tuning.rent_per_shift)
	var slip := {"shift": shift, "earned": _earned, "laps": laps, "electricity": electricity}
	slip["electricity_covered"] = _charge(electricity)
	slip["rent"] = rent
	slip["rent_covered"] = _charge(rent)
	slip["school_fees"] = 0
	slip["school_fees_covered"] = true
	if shift >= _next_fees_shift:
		var fees := roundi(tuning.school_fees)
		var covered := _charge(fees)
		slip["school_fees"] = fees
		slip["school_fees_covered"] = covered
		_fees_unpaid_in_a_row = 0 if covered else _fees_unpaid_in_a_row + 1
		_fees_unpaid = _fees_unpaid or not covered
		_next_fees_shift = shift + roundi(tuning.school_fees_every_shifts)
	slip["balance"] = _balance
	_earned = 0
	return slip


## Returns whether the balance covered the whole Bill.
func _charge(bill: int) -> bool:
	var covered := _balance >= bill
	_balance -= bill
	return covered
