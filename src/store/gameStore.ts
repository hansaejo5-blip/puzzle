import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { levels } from "../data/levels";
import { restorePoints } from "../data/cafe";
import { createSession, selectTile, tickSession, useBooster } from "../game/engine";
import {
  AttendanceState,
  BoosterType,
  DailyChallengeState,
  LevelResult,
  MissionProgress,
  RewardSummary,
  ScreenName,
  SessionState,
  SettingsState
} from "../types/game";
import { getDailyKey, getWeeklyKey } from "../utils/date";
import { calculateVictoryReward } from "../utils/rewards";
import { syncCloudSave, syncDailyLeaderboard } from "../services/firebase";

type StoreState = {
  initialized: boolean;
  currentScreen: ScreenName;
  nickname: string;
  hasSeenIntro: boolean;
  onboardingComplete: boolean;
  currentLevel: number;
  highestUnlockedLevel: number;
  coins: number;
  totalStars: number;
  boosters: Record<BoosterType, number>;
  levelResults: Record<number, LevelResult>;
  cafeSelections: Record<string, string>;
  attendance: AttendanceState;
  dailyChallenge: DailyChallengeState;
  dailyMissions: MissionProgress[];
  weeklyMissions: MissionProgress[];
  settings: SettingsState;
  currentSession: SessionState | null;
  lastReward: RewardSummary | null;
  chapterCompleteId: number | null;
  initialize: () => Promise<void>;
  goTo: (screen: ScreenName) => void;
  setNickname: (nickname: string) => void;
  completeIntro: () => void;
  startLevel: (levelId: number) => void;
  startDailyChallenge: () => void;
  selectInSession: (tileId: string) => void;
  useBoosterInSession: (type: BoosterType) => void;
  tick: () => void;
  finishVictoryFlow: () => void;
  retryLevel: () => void;
  applyRestoreChoice: (pointId: string, optionId: string) => void;
  buyBooster: (type: BoosterType) => void;
  claimAttendance: () => void;
  claimMission: (id: string, kind: "daily" | "weekly") => void;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetProgress: () => void;
};

const defaultMissions = () => {
  const daily: MissionProgress[] = [
    { id: "d-clear-3", label: "레벨 3회 클리어", goal: 3, progress: 0, rewardCoins: 120, rewardStars: 1, kind: "daily", type: "clear", claimed: false },
    { id: "d-donut-9", label: "도넛 9회 매치", goal: 9, progress: 0, rewardCoins: 100, rewardStars: 1, kind: "daily", type: "match", targetItem: "donut", claimed: false },
    { id: "d-boost-2", label: "부스터 2회 사용", goal: 2, progress: 0, rewardCoins: 90, rewardStars: 1, kind: "daily", type: "boost", claimed: false }
  ];
  const weekly: MissionProgress[] = [
    { id: "w-clear-15", label: "레벨 15회 클리어", goal: 15, progress: 0, rewardCoins: 420, rewardStars: 4, kind: "weekly", type: "clear", claimed: false },
    { id: "w-login-4", label: "4일 출석", goal: 4, progress: 0, rewardCoins: 350, rewardStars: 3, kind: "weekly", type: "login", claimed: false },
    { id: "w-combo-8", label: "콤보 8회 달성", goal: 8, progress: 0, rewardCoins: 380, rewardStars: 3, kind: "weekly", type: "combo", claimed: false }
  ];
  return { daily, weekly };
};

const getInitialState = (): Omit<
  StoreState,
  | "initialize"
  | "goTo"
  | "setNickname"
  | "completeIntro"
  | "startLevel"
  | "startDailyChallenge"
  | "selectInSession"
  | "useBoosterInSession"
  | "tick"
  | "finishVictoryFlow"
  | "retryLevel"
  | "applyRestoreChoice"
  | "buyBooster"
  | "claimAttendance"
  | "claimMission"
  | "updateSetting"
  | "resetProgress"
> => {
  const today = getDailyKey();
  const week = getWeeklyKey();
  const missions = defaultMissions();
  return {
    initialized: false,
    currentScreen: "splash" as ScreenName,
    nickname: "",
    hasSeenIntro: false,
    onboardingComplete: false,
    currentLevel: 1,
    highestUnlockedLevel: 1,
    coins: 250,
    totalStars: 0,
    boosters: {
      undo: 3,
      shuffle: 2,
      extraSlot: 1,
      hint: 3
    },
    levelResults: {},
    cafeSelections: {},
    attendance: {
      weekKey: week,
      claimedDays: [],
      streak: 0
    },
    dailyChallenge: {
      dateKey: today,
      completed: false,
      bestScore: 0,
      claimed: false,
      leaderboardSynced: false
    },
    dailyMissions: missions.daily,
    weeklyMissions: missions.weekly,
    settings: {
      musicOn: true,
      sfxOn: true,
      vibrationOn: true,
      language: "ko" as const
    },
    currentSession: null,
    lastReward: null,
    chapterCompleteId: null
  };
};

function refreshCycles(state: StoreState) {
  const today = getDailyKey();
  const week = getWeeklyKey();
  if (state.dailyChallenge.dateKey !== today) {
    state.dailyChallenge = {
      dateKey: today,
      completed: false,
      bestScore: 0,
      claimed: false,
      leaderboardSynced: false
    };
    state.dailyMissions = defaultMissions().daily;
  }
  if (state.attendance.weekKey !== week) {
    state.attendance = {
      weekKey: week,
      claimedDays: [],
      streak: 0
    };
    state.weeklyMissions = defaultMissions().weekly;
  }
}

function updateMission(state: StoreState, type: MissionProgress["type"], amount = 1, targetItem?: string) {
  const update = (mission: MissionProgress) => {
    if (mission.type !== type || mission.claimed) {
      return mission;
    }
    if (mission.targetItem && mission.targetItem !== targetItem) {
      return mission;
    }
    return { ...mission, progress: Math.min(mission.goal, mission.progress + amount) };
  };
  state.dailyMissions = state.dailyMissions.map(update);
  state.weeklyMissions = state.weeklyMissions.map(update);
}

function getChapterRestoreCount(chapter: 1 | 2 | 3, selections: Record<string, string>) {
  return restorePoints.filter((point) => point.chapter === chapter && selections[point.id]).length;
}

export const useGameStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...getInitialState(),
      initialize: async () => {
        set((state) => {
          refreshCycles(state);
          state.initialized = true;
          state.currentScreen = state.nickname
            ? state.onboardingComplete
              ? "home"
              : "map"
            : state.hasSeenIntro
              ? "nickname"
              : "intro";
          return { ...state };
        });
      },
      goTo: (screen) => set({ currentScreen: screen }),
      setNickname: (nickname) =>
        set({
          nickname,
          hasSeenIntro: true,
          currentScreen: "map"
        }),
      completeIntro: () =>
        set({
          hasSeenIntro: true,
          currentScreen: "nickname"
        }),
      startLevel: (levelId) =>
        set({
          currentLevel: levelId,
          currentSession: createSession(levels[levelId - 1]),
          currentScreen: "gameplay"
        }),
      startDailyChallenge: () => {
        const level = levels[(Number(getDailyKey().replace(/-/g, "")) % 10) + 49];
        set({
          currentLevel: level.levelId,
          currentSession: createSession({
            ...level,
            title: `오늘의 스페셜 ${level.levelId}`,
            rewardCoins: level.rewardCoins + 100
          }),
          currentScreen: "gameplay"
        });
      },
      selectInSession: (tileId) =>
        set((state) => {
          if (!state.currentSession) {
            return state;
          }
          const beforeScore = state.currentSession.score;
          const beforeMatched = { ...state.currentSession.matchedCounts };
          state.currentSession = selectTile({ ...state.currentSession, tiles: state.currentSession.tiles.map((tile) => ({ ...tile })), tray: state.currentSession.tray.map((entry) => ({ ...entry })), history: [...state.currentSession.history] }, tileId);
          if (state.currentSession.score > beforeScore) {
            const afterMatched = state.currentSession.matchedCounts;
            Object.keys(afterMatched).forEach((key) => {
              const diff = (afterMatched[key as keyof typeof afterMatched] ?? 0) - (beforeMatched[key as keyof typeof beforeMatched] ?? 0);
              if (diff > 0) {
                updateMission(state, "match", diff, key);
              }
            });
          }
          if (state.currentSession.status === "won") {
            const level = levels[state.currentLevel - 1];
            const reward = calculateVictoryReward(level, state.currentSession);
            const existing = state.levelResults[state.currentLevel];
            const firstClear = !existing?.cleared;
            const coins = reward.coins + (firstClear ? level.firstClearBonus : 0);
            state.coins += coins;
            state.totalStars += reward.stars;
            state.lastReward = { ...reward, coins };
            state.levelResults[state.currentLevel] = {
              levelId: state.currentLevel,
              stars: Math.max(existing?.stars ?? 0, reward.stars),
              bestScore: Math.max(existing?.bestScore ?? 0, reward.score),
              cleared: true,
              firstClearClaimed: true
            };
            state.highestUnlockedLevel = Math.min(60, Math.max(state.highestUnlockedLevel, state.currentLevel + 1));
            updateMission(state, "clear", 1);
            updateMission(state, "combo", state.currentSession.comboChain);
            state.onboardingComplete = state.currentLevel >= 3 || state.onboardingComplete;
            const chapter = levels[state.currentLevel - 1].chapter;
            if (state.currentLevel % 20 === 0) {
              state.chapterCompleteId = chapter;
              state.currentScreen = state.currentLevel === 60 ? "ending" : "chapterComplete";
            } else {
              state.currentScreen = "victory";
            }
            if (state.currentLevel >= 50) {
              state.dailyChallenge.bestScore = Math.max(state.dailyChallenge.bestScore, reward.score);
              state.dailyChallenge.completed = true;
              syncDailyLeaderboard(state.nickname || "게스트", reward.score, state.dailyChallenge.dateKey);
            }
            syncCloudSave(state);
          } else if (state.currentSession.status === "lost") {
            state.currentScreen = "fail";
          }
          return { ...state };
        }),
      useBoosterInSession: (type) =>
        set((state) => {
          if (!state.currentSession || state.boosters[type] <= 0) {
            return state;
          }
          state.boosters[type] -= 1;
          state.currentSession = useBooster({ ...state.currentSession, tiles: state.currentSession.tiles.map((tile) => ({ ...tile })), tray: state.currentSession.tray.map((entry) => ({ ...entry })), history: [...state.currentSession.history] }, type);
          updateMission(state, "boost", 1);
          return { ...state };
        }),
      tick: () =>
        set((state) => {
          if (!state.currentSession) {
            return state;
          }
          state.currentSession = tickSession({ ...state.currentSession, tiles: state.currentSession.tiles.map((tile) => ({ ...tile })), tray: state.currentSession.tray.map((entry) => ({ ...entry })), history: [...state.currentSession.history] });
          if (state.currentSession.status === "lost") {
            state.currentScreen = "fail";
          }
          return { ...state };
        }),
      finishVictoryFlow: () =>
        set((state) => {
          state.currentSession = null;
          state.currentScreen =
            getChapterRestoreCount(levels[state.currentLevel - 1].chapter, state.cafeSelections) <
            restorePoints.filter((point) => point.chapter === levels[state.currentLevel - 1].chapter).length
              ? "restore"
              : "home";
          return { ...state };
        }),
      retryLevel: () =>
        set((state) => ({
          currentSession: createSession(levels[state.currentLevel - 1]),
          currentScreen: "gameplay"
        })),
      applyRestoreChoice: (pointId, optionId) =>
        set((state) => {
          const point = restorePoints.find((entry) => entry.id === pointId);
          if (!point || state.totalStars < point.starCost || state.cafeSelections[pointId]) {
            return state;
          }
          state.totalStars -= point.starCost;
          state.cafeSelections[pointId] = optionId;
          const chapterSelections = getChapterRestoreCount(point.chapter, state.cafeSelections);
          const chapterPoints = restorePoints.filter((entry) => entry.chapter === point.chapter).length;
          state.currentScreen = chapterSelections >= chapterPoints ? "home" : "restore";
          return { ...state };
        }),
      buyBooster: (type) =>
        set((state) => {
          const prices: Record<BoosterType, number> = { undo: 120, shuffle: 150, extraSlot: 180, hint: 100 };
          if (state.coins < prices[type]) {
            return state;
          }
          state.coins -= prices[type];
          state.boosters[type] += 1;
          return { ...state };
        }),
      claimAttendance: () =>
        set((state) => {
          const today = getDailyKey();
          if (state.attendance.claimedDays.includes(today)) {
            return state;
          }
          state.attendance.claimedDays.push(today);
          state.attendance.streak += 1;
          state.coins += 70 + state.attendance.streak * 10;
          state.totalStars += state.attendance.streak % 3 === 0 ? 2 : 1;
          updateMission(state, "login", 1);
          return { ...state };
        }),
      claimMission: (id, kind) =>
        set((state) => {
          const key = kind === "daily" ? "dailyMissions" : "weeklyMissions";
          state[key] = state[key].map((mission) => {
            if (mission.id !== id || mission.claimed || mission.progress < mission.goal) {
              return mission;
            }
            state.coins += mission.rewardCoins;
            state.totalStars += mission.rewardStars;
            return { ...mission, claimed: true };
          });
          return { ...state };
        }),
      updateSetting: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value
          }
        })),
      resetProgress: () => set({ ...getInitialState(), initialized: true, currentScreen: "intro" })
    }),
    {
      name: "sweet-cafe-story-save",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        nickname: state.nickname,
        hasSeenIntro: state.hasSeenIntro,
        onboardingComplete: state.onboardingComplete,
        currentLevel: state.currentLevel,
        highestUnlockedLevel: state.highestUnlockedLevel,
        coins: state.coins,
        totalStars: state.totalStars,
        boosters: state.boosters,
        levelResults: state.levelResults,
        cafeSelections: state.cafeSelections,
        attendance: state.attendance,
        dailyChallenge: state.dailyChallenge,
        dailyMissions: state.dailyMissions,
        weeklyMissions: state.weeklyMissions,
        settings: state.settings
      })
    }
  )
);
