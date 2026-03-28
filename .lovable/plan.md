

# Fix: Slow card image loading in Hero/Dragon deck dialogs

## Problem
When opening "Колода героев" or "Колода драконов", card images appear to load slowly — they fade in one by one with visible delay.

## Root Cause
The `OptimizedImage` component has two performance bottlenecks:

1. **WebP check on every mount**: Each card image calls `supportsWebP()` which creates a new `Image()` object and returns a Promise. With 20+ cards in a grid, that's 20+ unnecessary async operations on dialog open.

2. **Opacity animation masking instant loads**: Every image starts at `opacity-0` and transitions to `opacity-100` over 300ms after `onLoad`. Even when images are already cached by the browser, the fade-in animation makes them *appear* slow. Cards load sequentially in visual perception even though they may load near-instantly.

3. **`progressive={true}` passed but unused**: CardImage passes `progressive={true}` but no `lowQualitySrc`, so the progressive code path just sets state redundantly without benefit.

## Plan

### 1. Cache WebP support globally (one-time check)
In `src/utils/imageOptimization.ts`: cache the result of `supportsWebP()` in a module-level variable so it resolves once and all subsequent calls return instantly.

### 2. Simplify OptimizedImage for cached images
In `src/components/ui/optimized-image.tsx`:
- Use the cached WebP result synchronously instead of `useEffect` + `useState`
- Remove the `opacity-0 → opacity-100` transition for images that are in browser cache (detected via `img.complete` on mount)
- Reduce `duration-300` to `duration-150` for images that do need the transition

### 3. Remove unnecessary `progressive={true}` from CardImage
In `src/components/game/cards/CardImage.tsx`: remove `progressive={true}` since no `lowQualitySrc` is provided — the progressive code path adds overhead without benefit.

## Technical Details

**`imageOptimization.ts`** — add cached WebP:
```ts
let webPResult: boolean | null = null;
export const supportsWebP = async (): Promise<boolean> => {
  if (webPResult !== null) return webPResult;
  // ... existing check, then cache
  webPResult = result;
  return result;
};
export const getWebPSupport = () => webPResult; // sync access
```

**`optimized-image.tsx`** — key changes:
- Replace WebP `useEffect` with sync cached value
- Start with `opacity-100` if image src matches browser cache (no fade needed)
- Shorter transition duration

**`CardImage.tsx`** — remove `progressive={true}` prop

