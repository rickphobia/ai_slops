extends GutTest
## The pay slip card's rows, from a Farm.PAY_SLIP message's values.


func test_school_fees_appear_after_rent_only_when_charged() -> void:
	var slip := {"shift": 3, "earned": 20, "laps": 12, "electricity": 6, "rent": 6}
	slip["school_fees"] = 30
	slip["balance"] = -22

	var rows := PaySlipCard.rows(slip)

	assert_eq(rows.size(), 5)
	assert_eq(rows[2], "Dormitory rent: −6. A warm bed, kindly provided!")
	assert_eq(rows[3], "School fees: −30. An investment in your Children!")
	slip["school_fees"] = 0
	assert_eq(PaySlipCard.rows(slip).size(), 4)
