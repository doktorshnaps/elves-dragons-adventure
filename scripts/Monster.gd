
extends Node2D

signal died(reward: int, experience: int)
signal damaged(amount: float)

var data = {
	"id": 0,
	"name": "",
	"type": "normal",
	"health": 0.0,
	"max_health": 0.0,
	"power": 0,
	"reward": 0,
	"experience_reward": 0
}

@onready var health_bar = $HealthBar
@onready var sprite = $Sprite2D
@onready var animation_player = $AnimationPlayer

func _ready():
	update_health_bar()

func initialize(monster_data: Dictionary) -> void:
	data = monster_data
	update_health_bar()
	update_appearance()

func take_damage(amount: float) -> void:
	data.health = max(0.0, data.health - amount)
	emit_signal("damaged", amount)
	update_health_bar()
	
	if data.health <= 0:
		die()

func die() -> void:
	emit_signal("died", data.reward, data.experience_reward)
	animation_player.play("die")
	await animation_player.animation_finished
	queue_free()

func attack() -> float:
	var damage = data.power * (0.8 + randf() * 0.4)
	animation_player.play("attack")
	return damage

func update_health_bar() -> void:
	if health_bar:
		health_bar.value = (data.health / data.max_health) * 100

func update_appearance() -> void:
	match data.type:
		"normal":
			sprite.modulate = Color.WHITE
		"elite":
			sprite.modulate = Color.YELLOW
		"boss":
			sprite.modulate = Color.RED
			sprite.scale = Vector2(1.5, 1.5)
