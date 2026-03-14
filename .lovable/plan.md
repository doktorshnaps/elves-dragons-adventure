

## Fix: Miniboss badge not showing in Grimoire

### Problem
In `createBalancedGenerator.ts`, when generating opponents for custom level monsters (line 181), the code sets `isBoss: type !== 'normal'`, which means minibosses get `isBoss: true` and show the "Босс" badge instead of "Мини-босс". The `isMiniboss` property is never set for custom monsters.

The miniboss wave logic (line 274) correctly sets `isMiniboss: true`, but the custom monster path does not.

### Fix

**File: `src/dungeons/createBalancedGenerator.ts`**

Change line 181 from:
```typescript
isBoss: type !== 'normal',
```
to:
```typescript
isBoss: type === 'boss50' || type === 'boss100',
isMiniboss: type === 'miniboss',
```

This ensures:
- Bosses (`boss50`/`boss100`) get the orange "Босс" badge
- Minibosses get the yellow "Мини-босс" badge
- Normal monsters get no badge

One-line change, no other files affected. The `MonsterCardDisplay` already handles `isMiniboss` rendering correctly.

