import { BoosterType, ItemType, LevelData } from "../types/game";

const allItems: ItemType[] = [
  "coffee",
  "donut",
  "croissant",
  "cake",
  "macaron",
  "sandwich",
  "cookie",
  "berry",
  "waffle",
  "icecream"
];

function pickItems(count: number): ItemType[] {
  return allItems.slice(0, count);
}

function recommended(levelId: number): BoosterType[] {
  if (levelId < 4) {
    return ["hint"];
  }
  if (levelId < 12) {
    return ["undo", "hint"];
  }
  if (levelId < 30) {
    return ["undo", "shuffle", "hint"];
  }
  return ["undo", "shuffle", "extraSlot", "hint"];
}

export const levels: LevelData[] = Array.from({ length: 60 }, (_, index) => {
  const levelId = index + 1;
  const chapter = (Math.floor(index / 20) + 1) as 1 | 2 | 3;
  const tutorialText =
    levelId === 1
      ? ["보이는 디저트를 눌러 트레이에 담아보세요.", "같은 아이템 3개가 모이면 자동으로 서빙됩니다."]
      : levelId === 2
        ? ["트레이는 기본 7칸입니다.", "막히기 전에 같은 아이템을 모아 비워야 합니다."]
        : levelId === 3
          ? ["연속으로 매치하면 콤보 점수가 붙습니다.", "클리어 후 별로 카페를 복구하세요."]
          : levelId === 4
            ? ["막힐 것 같다면 Undo와 Hint를 써보세요."]
            : undefined;
  const itemCount = Math.min(10, 4 + Math.floor(levelId / 6));
  const tileCountBase = 18 + Math.floor(levelId / 2) * 3;
  const tileCount = tileCountBase + (tileCountBase % 3 === 0 ? 0 : 3 - (tileCountBase % 3));
  const locked = levelId > 10 ? Math.min(10, Math.floor((levelId - 8) / 4)) : 0;
  const ice = levelId > 14 ? Math.min(12, Math.floor((levelId - 10) / 4)) : 0;
  const box = levelId > 18 ? Math.min(10, Math.floor((levelId - 14) / 5)) : 0;
  const layers = levelId < 10 ? 2 : levelId < 30 ? 3 : 4;
  const timeLimitSec = Math.max(75, 135 - levelId);
  const rewardCoins = 50 + levelId * 7;
  const targetScore = tileCount * 12 + locked * 10 + ice * 14 + box * 16;
  return {
    levelId,
    chapter,
    title: chapter === 1 ? `입구 정리 ${levelId}` : chapter === 2 ? `홀 서비스 ${levelId}` : `테라스 피크 ${levelId}`,
    availableItemTypes: pickItems(itemCount),
    tileCount,
    layers,
    traySize: 7,
    timeLimitSec,
    obstacleConfig: {
      locked,
      ice,
      box
    },
    targetScore,
    rewardCoins,
    firstClearBonus: 30 + levelId * 2,
    recommendedBoosters: recommended(levelId),
    starThresholds: [Math.floor(targetScore * 0.7), targetScore, Math.floor(targetScore * 1.22)],
    tutorial: tutorialText
  };
});
