
extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -400.0
var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")
var is_mining = false
var mining_power = 5.0

@onready var animation_player = $AnimationPlayer
@onready var sprite = $Sprite2D
@onready var mining_ray = $MiningRay

func _physics_process(delta):
	# Гравитация
	if not is_on_floor():
		velocity.y += gravity * delta

	# Прыжок
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY

	# Движение
	var direction = Input.get_axis("move_left", "move_right")
	if direction:
		velocity.x = direction * SPEED
		sprite.flip_h = direction < 0
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)

	move_and_slide()
	
	# Добыча блоков
	if Input.is_action_pressed("mine"):
		mine()
	else:
		is_mining = false

func mine():
	is_mining = true
	animation_player.play("mine")
	
	if mining_ray.is_colliding():
		var collision_point = mining_ray.get_collision_point()
		var tile_pos = collision_point.snapped(Vector2(32, 32))
		get_parent().damage_tile(tile_pos, mining_power * get_physics_process_delta_time())
