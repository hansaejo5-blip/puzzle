import { LevelData, RewardSummary, SessionState } from "../types/game";

export function calculateStars(level: LevelData, session: SessionState) {
  const score = session.score;
  if (score >= level.starThresholds[2]) {
    return 3;
  }
  if (score >= level.starThresholds[1]) {
    return 2;
  }
  return 1;
}

export function calculateVictoryReward(level: LevelData, session: SessionState): RewardSummary {
  const stars = calculateStars(level, session);
  const comboBonus = session.comboChain * 8;
  const timeBonus = Math.max(0, Math.floor(session.timeLeft / 4));
  return {
    coins: level.rewardCoins + comboBonus + timeBonus,
    stars,
    score: session.score
  };
}
