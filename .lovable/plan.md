

## Fix: Shop owned item count showing wrong values

### Root Cause

Two bugs in `src/components/Shop.tsx` line 268:

1. **Card packs show `totalCardsOwned` (1287)** — this is `cardInstances.length`, i.e. ALL cards (heroes + dragons + workers). Should show count of unopened card packs from `item_instances` with `template_id` matching the card pack template.

2. **Workers show 0** — code looks in `ownedCountByTemplateId` which counts `item_instances` by `template_id`. But workers are stored in `card_instances` with `card_type: 'workers'`, not in `item_instances`. So the count is always 0.

### Fix (single file: `src/components/Shop.tsx`)

1. **Remove the special `cardPack` branch** — card packs are items in `item_instances`, so `ownedCountByTemplateId[displayItem.id]` already works for them (template_id=1 for card_pack). No special case needed.

2. **Add worker count from `cardInstances`** — compute `workerCountByTemplateId` from the cached `cardInstances` data:
   - Filter `card_type === 'workers'`
   - Extract the template number from `card_template_id` (format: `worker_2_timestamp_random_0` → template id `2`)
   - Count by extracted template id

3. **Update display logic** — for worker-type items, use `workerCountByTemplateId[displayItem.id]`; for everything else use `ownedCountByTemplateId[displayItem.id]`.

### Changes

**`src/components/Shop.tsx`**:
- Add `workerCountByTemplateId` useMemo that parses `cardInstances` where `card_type === 'workers'`
- Remove `totalCardsOwned` variable
- Change line 268 display: use a helper that picks the right count source based on item type (`worker` → workerCount, everything else → itemInstanceCount)

