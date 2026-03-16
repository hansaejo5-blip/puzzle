import { itemCatalog } from "../data/items";
import { BoosterType, ItemType, LevelData, PuzzleSnapshot, SessionState, TileData, TrayEntry } from "../types/game";

function shuffleArray<T>(values: T[]) {
  const next = [...values];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function createTilePool(level: LevelData): ItemType[] {
  const pool: ItemType[] = [];
  const available = level.availableItemTypes;
  for (let i = 0; i < level.tileCount; i += 3) {
    const type = available[(i / 3 + level.levelId) % available.length];
    pool.push(type, type, type);
  }
  return shuffleArray(pool);
}

function topBlockingMap(tiles: TileData[]) {
  const map = new Map<string, number>();
  tiles.forEach((tile) => {
    if (tile.removed) {
      return;
    }
    const key = `${tile.x}-${tile.y}`;
    const current = map.get(key);
    if (current === undefined || tile.layer > current) {
      map.set(key, tile.layer);
    }
  });
  return map;
}

export function isTileSelectable(tiles: TileData[], tile: TileData, matchedCounts: Partial<Record<ItemType, number>>) {
  if (tile.removed) {
    return false;
  }
  const topMap = topBlockingMap(tiles);
  const key = `${tile.x}-${tile.y}`;
  const topLayer = topMap.get(key);
  if (topLayer !== tile.layer) {
    return false;
  }
  if (tile.locked && !matchedCounts[tile.type]) {
    return false;
  }
  return true;
}

function buildObstacles(level: LevelData, tiles: TileData[]) {
  const shuffledIds = shuffleArray(tiles.map((tile) => tile.id));
  let pointer = 0;
  const apply = (count: number | undefined, mutator: (tile: TileData) => void) => {
    for (let i = 0; i < (count ?? 0); i += 1) {
      const targetId = shuffledIds[pointer];
      pointer += 1;
      const tile = tiles.find((entry) => entry.id === targetId);
      if (tile && !tile.removed) {
        mutator(tile);
      }
    }
  };

  apply(level.obstacleConfig.locked, (tile) => {
    tile.locked = true;
  });
  apply(level.obstacleConfig.ice, (tile) => {
    tile.iceHp = 2;
  });
  apply(level.obstacleConfig.box, (tile) => {
    tile.boxed = true;
  });
}

export function createSession(level: LevelData): SessionState {
  const pool = createTilePool(level);
  const columns = 5;
  const rows = Math.ceil(level.tileCount / columns);
  const tiles: TileData[] = pool.map((type, index) => ({
    id: `${level.levelId}-${index}`,
    type,
    x: index % columns,
    y: Math.floor(index / columns) % rows,
    layer: index % level.layers,
    removed: false,
    locked: false,
    iceHp: 0,
    boxed: false
  }));
  buildObstacles(level, tiles);
  return {
    levelId: level.levelId,
    tiles,
    tray: [],
    score: 0,
    combo: 0,
    comboChain: 0,
    timeLeft: level.timeLimitSec,
    moveCount: 0,
    matchedCounts: {},
    removedCount: 0,
    traySize: level.traySize,
    history: [],
    status: "playing",
    usedBoosters: {}
  };
}

function snapshotOf(session: SessionState): PuzzleSnapshot {
  return {
    tiles: session.tiles.map((tile) => ({ ...tile })),
    tray: session.tray.map((entry) => ({ ...entry })),
    score: session.score,
    combo: session.combo,
    timeLeft: session.timeLeft,
    moveCount: session.moveCount,
    matchedCounts: { ...session.matchedCounts },
    removedCount: session.removedCount,
    traySize: session.traySize
  };
}

function withHistory(session: SessionState) {
  session.history = [...session.history.slice(-14), snapshotOf(session)];
}

function removeMatch(session: SessionState, type: ItemType) {
  const matched = session.tray.filter((entry) => entry.type === type).slice(0, 3);
  if (matched.length < 3) {
    return false;
  }
  const removeIds = new Set(matched.map((entry) => entry.id));
  session.tray = session.tray.filter((entry) => !removeIds.has(entry.id));
  session.score += 90 + session.combo * 18;
  session.combo += 1;
  session.comboChain += 1;
  session.matchedCounts[type] = (session.matchedCounts[type] ?? 0) + 1;
  return true;
}

function finalizeState(session: SessionState) {
  const remaining = session.tiles.filter((tile) => !tile.removed);
  if (remaining.length === 0 && session.tray.length === 0) {
    session.status = "won";
    return session;
  }
  if (session.timeLeft <= 0) {
    session.status = "lost";
    session.failReason = "시간이 모두 지났어요.";
    return session;
  }
  if (session.tray.length >= session.traySize) {
    const groups = session.tray.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.type] = (acc[entry.type] ?? 0) + 1;
      return acc;
    }, {});
    const hasPotential = Object.values(groups).some((count) => count >= 3);
    if (!hasPotential) {
      session.status = "lost";
      session.failReason = "트레이가 가득 찼어요.";
    }
  }
  return session;
}

export function selectTile(session: SessionState, tileId: string) {
  if (session.status !== "playing") {
    return session;
  }
  const tile = session.tiles.find((entry) => entry.id === tileId);
  if (!tile || !isTileSelectable(session.tiles, tile, session.matchedCounts)) {
    return session;
  }
  withHistory(session);
  session.selectedHintTileId = undefined;
  if (tile.boxed) {
    tile.boxed = false;
    session.score += 12;
    session.moveCount += 1;
    session.combo = 0;
    return finalizeState(session);
  }
  if (tile.iceHp > 1) {
    tile.iceHp -= 1;
    session.score += 8;
    session.moveCount += 1;
    session.combo = 0;
    return finalizeState(session);
  }
  tile.removed = true;
  session.tray.push({ id: tile.id, type: tile.type });
  session.score += 18;
  session.moveCount += 1;
  session.removedCount += 1;
  if (!removeMatch(session, tile.type)) {
    session.combo = 0;
  }
  return finalizeState(session);
}

export function tickSession(session: SessionState) {
  if (session.status !== "playing") {
    return session;
  }
  session.timeLeft -= 1;
  return finalizeState(session);
}

export function useBooster(session: SessionState, type: BoosterType) {
  if (session.status !== "playing") {
    return session;
  }
  if (type === "undo") {
    const previous = session.history[session.history.length - 1];
    if (previous) {
      session.tiles = previous.tiles.map((tile) => ({ ...tile }));
      session.tray = previous.tray.map((entry) => ({ ...entry }));
      session.score = previous.score;
      session.combo = previous.combo;
      session.timeLeft = previous.timeLeft;
      session.moveCount = previous.moveCount;
      session.matchedCounts = { ...previous.matchedCounts };
      session.removedCount = previous.removedCount;
      session.traySize = previous.traySize;
      session.history = session.history.slice(0, -1);
    }
  }
  if (type === "shuffle") {
    withHistory(session);
    const remaining = session.tiles.filter((tile) => !tile.removed).map((tile) => tile.type);
    const shuffled = shuffleArray(remaining);
    let pointer = 0;
    session.tiles = session.tiles.map((tile) =>
      tile.removed
        ? tile
        : {
            ...tile,
            type: shuffled[pointer++]
          }
    );
    session.score += 6;
  }
  if (type === "extraSlot") {
    withHistory(session);
    session.traySize += 1;
  }
  if (type === "hint") {
    const trayCounts = session.tray.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.type] = (acc[entry.type] ?? 0) + 1;
      return acc;
    }, {});
    const targetType =
      Object.entries(trayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      session.tiles.find((tile) => !tile.removed)?.type;
    const hinted = session.tiles.find(
      (tile) => tile.type === targetType && isTileSelectable(session.tiles, tile, session.matchedCounts)
    );
    session.selectedHintTileId = hinted?.id;
  }
  session.usedBoosters[type] = (session.usedBoosters[type] ?? 0) + 1;
  return finalizeState(session);
}

export function getSelectableTiles(session: SessionState) {
  return session.tiles.filter((tile) => isTileSelectable(session.tiles, tile, session.matchedCounts));
}

export function getProgressText(session: SessionState) {
  const remaining = session.tiles.filter((tile) => !tile.removed).length;
  return `${remaining}개 남음`;
}

export function getTileBadge(tile: TileData) {
  if (tile.boxed) {
    return "BOX";
  }
  if (tile.iceHp > 1) {
    return "ICE";
  }
  if (tile.locked) {
    return "LOCK";
  }
  return itemCatalog[tile.type].short;
}
