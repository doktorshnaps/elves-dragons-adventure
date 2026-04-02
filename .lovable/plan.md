

## Убрать чёрные рамки у изображений предметов в инвентаре

### Проблема
Контейнер изображения имеет фиксированную высоту (`h-32 sm:h-40`) и тёмный фон (`bg-gradient-to-br from-black/40 to-black/20` + `border border-white/10`). Изображение внутри — `object-contain`, поэтому если пропорции не совпадают, по бокам остаётся видимый тёмный фон — «чёрные рамки».

### Решение
Убрать фиксированную высоту, фон и рамку у контейнера изображения. Сделать контейнер адаптивным под размер картинки:

**Файл: `src/components/game/inventory/InventoryGrid.tsx`**, строка 117:

Заменить:
```
<div className="w-full h-32 sm:h-40 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-black/40 to-black/20 border border-white/10 relative">
  <img ... className="w-full h-full object-contain" />
```

На:
```
<div className="w-full mb-2 rounded-lg overflow-hidden flex items-center justify-center relative">
  <img ... className="w-full h-auto object-contain rounded-lg" />
```

- Убрана фиксированная высота (`h-32 sm:h-40`) — контейнер подстраивается под картинку.
- Убран тёмный фон и border — нет видимых «рамок».
- Изображение: `h-full` → `h-auto` — сохраняет пропорции без растяжения.

