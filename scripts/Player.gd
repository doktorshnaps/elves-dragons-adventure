
extends Node2D

signal health_changed(new_health: float)
signal experience_gained(exp_amount: int)
signal level_up(new_level: int)

var stats = {
	"health": 100.0,
	"max_health": 100.0,
	"power": 10,
	"defense": 5,
	"level": 1,
	"experience": 0,
	"required_experience": 100
}

var balance: int = 100

func _ready():
	load_player_data()

func take_damage(amount: float) -> void:
	stats.health = max(0.0, stats.health - amount)
	emit_signal("health_changed", stats.health)
	
	if stats.health <= 0:
		die()

func heal(amount: float) -> void:
	stats.health = min(stats.max_health, stats.health + amount)
	emit_signal("health_changed", stats.health)

func gain_experience(amount: int) -> void:
	stats.experience += amount
	emit_signal("experience_gained", amount)
	
	while stats.experience >= stats.required_experience:
		level_up()

func level_up() -> void:
	stats.level += 1
	stats.experience -= stats.required_experience
	stats.required_experience = int(stats.required_experience * 1.5)
	
	# Увеличение характеристик
	stats.max_health += 10
	stats.health = stats.max_health
	stats.power += 2
	stats.defense += 1
	
	emit_signal("level_up", stats.level)

func die() -> void:
	# Логика смерти персонажа
	await get_tree().create_timer(3.0).timeout
	respawn()

func respawn() -> void:
	stats.health = stats.max_health
	emit_signal("health_changed", stats.health)

func save_player_data() -> void:
	var save_data = {
		"stats": stats,
		"balance": balance
	}
	var save_game = FileAccess.open("user://player.save", FileAccess.WRITE)
	save_game.store_line(JSON.stringify(save_data))

func load_player_data() -> void:
	if FileAccess.file_exists("user://player.save"):
		var save_game = FileAccess.open("user://player.save", FileAccess.READ)
		var json_string = save_game.get_line()
		var data = JSON.parse_string(json_string)
		
		if data:
			stats = data.stats
			balance = data.balance
