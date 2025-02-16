
extends Node

signal inventory_changed

var inventory = {}
const MAX_STACK = 99

func add_item(item_type: String, amount: int) -> bool:
	if inventory.has(item_type):
		var new_amount = inventory[item_type] + amount
		if new_amount <= MAX_STACK:
			inventory[item_type] = new_amount
			emit_signal("inventory_changed")
			return true
	else:
		inventory[item_type] = amount
		emit_signal("inventory_changed")
		return true
	return false

func remove_item(item_type: String, amount: int) -> bool:
	if inventory.has(item_type):
		if inventory[item_type] >= amount:
			inventory[item_type] -= amount
			if inventory[item_type] <= 0:
				inventory.erase(item_type)
			emit_signal("inventory_changed")
			return true
	return false

func get_item_count(item_type: String) -> int:
	return inventory.get(item_type, 0)
