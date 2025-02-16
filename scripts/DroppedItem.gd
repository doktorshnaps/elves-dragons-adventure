
extends RigidBody2D

var item_type = "none"
var amount = 1

func _ready():
	# Настройка физики
	gravity_scale = 1.0
	contact_monitor = true
	max_contacts_reported = 4
	
	# Добавление коллизии
	var collision_shape = CollisionShape2D.new()
	var shape = CircleShape2D.new()
	shape.radius = 8
	collision_shape.shape = shape
	add_child(collision_shape)
	
	# Настройка спрайта
	var sprite = Sprite2D.new()
	sprite.texture = load("res://assets/items/" + item_type + ".png")
	add_child(sprite)

func collect():
	# Добавление предмета в инвентарь игрока
	queue_free()
