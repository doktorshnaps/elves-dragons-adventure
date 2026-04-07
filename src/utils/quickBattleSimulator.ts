import { TeamPair } from '@/types/teamBattle';
import { Opponent } from '@/types/battle';
import { getDiceMultiplier } from '@/utils/diceFormula';

/**
 * Instant battle simulator for Golden Ticket holders.
 * Uses the same dice formula as normal battles but runs synchronously.
 */

const rollD6 = () => Math.floor(Math.random() * 6) + 1;

interface QuickBattleResult {
  resultPairs: TeamPair[];
  resultOpponents: Opponent[];
  isVictory: boolean;
  monstersKilled: number;
}

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/**
 * Apply damage to a pair: dragon absorbs first, then hero.
 * Returns updated pair (pure, no side effects).
 */
const applyDamageToPairSync = (pair: TeamPair, damage: number): TeamPair => {
  let remainingDamage = damage;
  let updatedHero = pair.hero ? { ...pair.hero } : null;
  let updatedDragon = pair.dragon ? { ...pair.dragon } : null;
  let wasDragonAlive = false;

  // Dragon absorbs first
  if (updatedDragon) {
    const dragonHP = updatedDragon.currentHealth ?? updatedDragon.health;
    wasDragonAlive = dragonHP > 0;
    if (dragonHP > 0) {
      const dragonDmg = Math.min(remainingDamage, dragonHP);
      updatedDragon.currentHealth = dragonHP - dragonDmg;
      remainingDamage -= dragonDmg;
    }
  }

  // Remaining goes to hero
  if (remainingDamage > 0 && updatedHero) {
    const heroHP = updatedHero.currentHealth ?? updatedHero.health;
    updatedHero.currentHealth = Math.max(0, heroHP - remainingDamage);
  }

  const newHeroHP = updatedHero ? (updatedHero.currentHealth ?? 0) : 0;
  const newDragonHP = updatedDragon ? (updatedDragon.currentHealth ?? 0) : 0;

  const isDragonNowDead = updatedDragon ? newDragonHP <= 0 : false;
  const dragonJustDied = wasDragonAlive && isDragonNowDead;

  let newPower = pair.power;
  if (dragonJustDied && pair.dragon) {
    newPower -= pair.dragon.power;
  }

  return {
    ...pair,
    hero: updatedHero,
    dragon: updatedDragon,
    health: newHeroHP + newDragonHP,
    power: newPower,
  };
};

/**
 * Calculate damage for a single attack using the unified dice formula.
 */
const calcAttackDamage = (attackerPower: number, defenderDefense: number): number => {
  const roll = rollD6();
  const multiplier = getDiceMultiplier(roll);
  if (multiplier === 0) return 0; // miss / counterattack ignored for speed
  const raw = Math.floor(attackerPower * multiplier);
  return Math.max(1, raw - defenderDefense);
};

export const simulateQuickBattle = (
  playerPairs: TeamPair[],
  opponents: Opponent[],
  attackOrder: string[]
): QuickBattleResult => {
  let pairs = deepClone(playerPairs);
  let opps = deepClone(opponents);
  let monstersKilled = 0;

  // Build ordered attacker list from attackOrder
  const getOrderedAlivePairs = () => {
    const alive = pairs.filter(p => p.health > 0);
    // Sort by attackOrder index
    return alive.sort((a, b) => {
      const idxA = attackOrder.indexOf(a.id);
      const idxB = attackOrder.indexOf(b.id);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  };

  const getAliveOpponents = () => opps.filter(o => o.health > 0);
  const getAlivePairs = () => pairs.filter(p => p.health > 0);

  // Safety: max 200 rounds to prevent infinite loops
  let rounds = 0;
  const MAX_ROUNDS = 200;

  while (rounds < MAX_ROUNDS) {
    rounds++;
    const alivePairs = getOrderedAlivePairs();
    const aliveOpps = getAliveOpponents();

    if (alivePairs.length === 0 || aliveOpps.length === 0) break;

    // --- Player turn: each alive pair attacks (focus-fire first alive opponent) ---
    for (const pair of alivePairs) {
      const target = getAliveOpponents()[0]; // focus-fire
      if (!target) break;

      const damage = calcAttackDamage(pair.power, target.armor || 0);
      if (damage > 0) {
        target.health = Math.max(0, target.health - damage);
        if (target.health <= 0) {
          monstersKilled++;
        }
      }
    }

    // Check if all opponents dead
    if (getAliveOpponents().length === 0) break;

    // --- Enemy turn: each alive opponent attacks a random alive pair ---
    for (const opp of getAliveOpponents()) {
      const alivePairsNow = getAlivePairs();
      if (alivePairsNow.length === 0) break;

      const targetIdx = Math.floor(Math.random() * alivePairsNow.length);
      const targetPair = alivePairsNow[targetIdx];

      const damage = calcAttackDamage(opp.power, targetPair.currentDefense || targetPair.defense || 0);
      if (damage > 0) {
        const pairIndex = pairs.findIndex(p => p.id === targetPair.id);
        if (pairIndex !== -1) {
          pairs[pairIndex] = applyDamageToPairSync(pairs[pairIndex], damage);
        }
      }
    }

    // Check if all pairs dead
    if (getAlivePairs().length === 0) break;
  }

  const isVictory = getAliveOpponents().length === 0;

  return {
    resultPairs: pairs,
    resultOpponents: opps,
    isVictory,
    monstersKilled,
  };
};
