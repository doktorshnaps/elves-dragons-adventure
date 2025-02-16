
extends Node2D

const CHUNK_SIZE = 16
const TILE_SIZE = 32
var world_data = {}

func _ready():
	generate_world()

func generate_world():
	# Генерация мира по чанкам
	for x in range(-5, 5):
		for y in range(-5, 5):
			generate_chunk(Vector2(x, y))

func generate_chunk(chunk_pos: Vector2):
	var chunk_data = {}
	
	for x in range(CHUNK_SIZE):
		for y in range(CHUNK_SIZE):
			var world_x = chunk_pos.x * CHUNK_SIZE + x
			var world_y = chunk_pos.y * CHUNK_SIZE + y
			
			# Базовая генерация terrain с использованием шума Перлина
			var noise_value = noise.get_noise_2d(world_x * 0.1, world_y * 0.1)
			
			if world_y > noise_value * 10:
				if world_y > 0:
					chunk_data[Vector2(x, y)] = {
						"type": "dirt",
						"durability": 10.0
					}
				else:
					chunk_data[Vector2(x, y)] = {
						"type": "stone",
						"durability": 20.0
					}
	
	world_data[chunk_pos] = chunk_data
	update_chunk_visuals(chunk_pos)

func update_chunk_visuals(chunk_pos: Vector2):
	var chunk_node = get_or_create_chunk_node(chunk_pos)
	var chunk_data = world_data[chunk_pos]
	
	for tile_pos in chunk_data:
		var tile_data = chunk_data[tile_pos]
		var world_pos = chunk_pos * CHUNK_SIZE * TILE_SIZE + tile_pos * TILE_SIZE
		update_tile_visual(chunk_node, world_pos, tile_data)

func get_or_create_chunk_node(chunk_pos: Vector2) -> Node2D:
	var chunk_name = "Chunk_%d_%d" % [chunk_pos.x, chunk_pos.y]
	
	if has_node(chunk_name):
		return get_node(chunk_name)
	
	var chunk_node = Node2D.new()
	chunk_node.name = chunk_name
	add_child(chunk_node)
	return chunk_node

func update_tile_visual(chunk_node: Node2D, world_pos: Vector2, tile_data: Dictionary):
	var tile_name = "Tile_%d_%d" % [world_pos.x, world_pos.y]
	var tile_sprite: Sprite2D
	
	if chunk_node.has_node(tile_name):
		tile_sprite = chunk_node.get_node(tile_name)
	else:
		tile_sprite = Sprite2D.new()
		tile_sprite.name = tile_name
		chunk_node.add_child(tile_sprite)
	
	tile_sprite.texture = load("res://assets/tiles/" + tile_data.type + ".png")
	tile_sprite.position = world_pos

func damage_tile(world_pos: Vector2, damage: float):
	var chunk_pos = (world_pos / (CHUNK_SIZE * TILE_SIZE)).floor()
	var local_pos = (world_pos / TILE_SIZE).floor() - chunk_pos * CHUNK_SIZE
	
	if world_data.has(chunk_pos) and world_data[chunk_pos].has(local_pos):
		var tile_data = world_data[chunk_pos][local_pos]
		tile_data.durability -= damage
		
		if tile_data.durability <= 0:
			destroy_tile(chunk_pos, local_pos)
		else:
			# Обновляем визуал поврежденного блока
			update_chunk_visuals(chunk_pos)

func destroy_tile(chunk_pos: Vector2, local_pos: Vector2):
	if world_data.has(chunk_pos):
		world_data[chunk_pos].erase(local_pos)
		update_chunk_visuals(chunk_pos)
		
		# Создаем выпадающий предмет
		spawn_item(chunk_pos * CHUNK_SIZE * TILE_SIZE + local_pos * TILE_SIZE)

func spawn_item(pos: Vector2):
	var item = preload("res://scenes/DroppedItem.tscn").instantiate()
	item.position = pos
	add_child(item)
