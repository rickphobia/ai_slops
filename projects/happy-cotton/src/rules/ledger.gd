class_name Ledger
extends RefCounted
## The Worker's Labour Points as one signed balance. It is never below zero yet; a negative
## balance will be Debt. Earnings add to it, purchases spend from it, and Negligence docks it
## but never below zero, so docking can never create Debt. Farm owns this and decides when;
## tested through Farm, not on its own.

var _balance := 0


func _init(balance := 0) -> void:
	_balance = balance


func balance() -> int:
	return _balance


func earn(points: int) -> void:
	_balance += points


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
