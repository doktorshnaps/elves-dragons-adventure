
extends Node2D

const MONSTER_TYPES = [
	{
		"type": "normal",
		"power": 10,
		"health": 50,
		"reward": 20,
		"exp_reward": 30
	},
	{
		"type": "elite",
		"power": 15,
		"health": 75,
		"reward": 35,
		"exp_reward": 60
	},
	{
		"type": "boss",
		"power": 25,
		"health": 100,
		"reward": 50,
		"exp_reward": 100
	}
]

@onready var player = $Player
@onready var monster_container = $MonsterContainer
@onready var ui = $BattleUI

var current_monster = null
var monster_scene = preload("res://scenes/Monster.tscn")

func _ready():
	ui.connect("attack_pressed", Callable(self, "_on_attack_pressed"))
	ui.connect("generate_monster_pressed", Callable(self, "_on_generate_monster_pressed"))

func generate_monster() -> void:
	var roll = randf()
	var type_data
	
	if roll < 0.7:
		type_data = MONSTER_TYPES[0]
	elif roll < 0.95:
		type_data = MONSTER_TYPES[1]
	else:
		type_data = MONSTER_TYPES[2]
	
	var monster_instance = monster_scene.instantiate()
	monster_container.add_child(monster_instance)
	
	var monster_data = {
		"id": Time.get_unix_time_from_system(),
		"name": _get_monster_name(type_data.type),
		"type": type_data.type,
		"health": type_data.health,
		"max_health": type_data.health,
		"power": type_data.power,
		"reward": type_data.reward,
		"experience_reward": type_data.exp_reward
	}
	
	monster_instance.initialize(monster_data)
	monster_instance.connect("died", Callable(self, "_on_monster_died"))
	current_monster = monster_instance

func _get_monster_name(type: String) -> String:
	var prefix = ""
	match type:
		"boss":
			prefix = "Босс: "
		"elite":
			prefix = "Элитный: "
	return prefix + "Монстр"

func _on_attack_pressed() -> void:
	if not current_monster or player.stats.health <= 0:
		return
	
	# Атака игрока
	var player_damage = player.stats.power * (0.8 + randf() * 0.4)
	current_monster.take_damage(player_damage)
	
	# Контратака монстра
	if current_monster and current_monster.data.health > 0:
		var monster_damage = current_monster.attack()
		player.take_damage(monster_damage)

func _on_monster_died(reward: int, experience: int) -> void:
	player.balance += reward
	player.gain_experience(experience)
	current_monster = null

func _on_generate_monster_pressed() -> void:
	if not current_monster and player.stats.health > 0:
		generate_monster()
