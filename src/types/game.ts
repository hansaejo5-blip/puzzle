export type ScreenName =
  | "splash"
  | "loading"
  | "intro"
  | "nickname"
  | "home"
  | "map"
  | "gameplay"
  | "victory"
  | "fail"
  | "restore"
  | "daily"
  | "missions"
  | "shop"
  | "settings"
  | "chapterComplete"
  | "ending";

export type ItemType =
  | "coffee"
  | "donut"
  | "croissant"
  | "cake"
  | "macaron"
  | "sandwich"
  | "cookie"
  | "berry"
  | "waffle"
  | "icecream";

export type BoosterType = "undo" | "shuffle" | "extraSlot" | "hint";

export type TileObstacle = {
  lockBy?: ItemType;
  iceHp?: number;
  boxed?: boolean;
};

export type TileData = {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  layer: number;
  removed: boolean;
  locked: boolean;
  iceHp: number;
  boxed: boolean;
};

export type TrayEntry = {
  id: string;
  type: ItemType;
};

export type LevelData = {
  levelId: number;
  chapter: 1 | 2 | 3;
  title: string;
  availableItemTypes: ItemType[];
  tileCount: number;
  layers: number;
  traySize: number;
  timeLimitSec: number;
  obstacleConfig: {
    locked?: number;
    ice?: number;
    box?: number;
  };
  targetScore: number;
  rewardCoins: number;
  firstClearBonus: number;
  recommendedBoosters: BoosterType[];
  starThresholds: [number, number, number];
  tutorial?: string[];
};

export type ChapterId = 1 | 2 | 3;

export type RestorePoint = {
  id: string;
  chapter: ChapterId;
  name: string;
  description: string;
  starCost: number;
  options: {
    id: string;
    label: string;
    palette: [string, string];
    accent: string;
  }[];
};

export type MissionProgress = {
  id: string;
  label: string;
  goal: number;
  progress: number;
  rewardCoins: number;
  rewardStars: number;
  kind: "daily" | "weekly";
  type: "clear" | "match" | "boost" | "login" | "combo";
  targetItem?: ItemType;
  claimed: boolean;
};

export type LevelResult = {
  levelId: number;
  stars: number;
  bestScore: number;
  cleared: boolean;
  firstClearClaimed: boolean;
};

export type DailyChallengeState = {
  dateKey: string;
  completed: boolean;
  bestScore: number;
  claimed: boolean;
  leaderboardSynced: boolean;
};

export type AttendanceState = {
  weekKey: string;
  claimedDays: string[];
  streak: number;
};

export type SettingsState = {
  musicOn: boolean;
  sfxOn: boolean;
  vibrationOn: boolean;
  language: "ko" | "en";
};

export type CafeSelectionState = Record<string, string>;

export type PuzzleSnapshot = {
  tiles: TileData[];
  tray: TrayEntry[];
  score: number;
  combo: number;
  timeLeft: number;
  moveCount: number;
  matchedCounts: Partial<Record<ItemType, number>>;
  removedCount: number;
  traySize: number;
};

export type SessionState = PuzzleSnapshot & {
  levelId: number;
  selectedHintTileId?: string;
  history: PuzzleSnapshot[];
  status: "playing" | "won" | "lost";
  failReason?: string;
  usedBoosters: Partial<Record<BoosterType, number>>;
  comboChain: number;
};

export type RewardSummary = {
  coins: number;
  stars: number;
  score: number;
};
