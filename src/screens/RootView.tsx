import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { levels } from "../data/levels";
import { restorePoints } from "../data/cafe";
import { itemCatalog } from "../data/items";
import { strings } from "../data/strings";
import { getProgressText, getSelectableTiles, getTileBadge, isTileSelectable } from "../game/engine";
import { useGameStore } from "../store/gameStore";
import { palette, spacing } from "../theme";
import { BoosterType, MissionProgress, TileData } from "../types/game";
import { getDailyKey } from "../utils/date";
import { triggerWarningFeedback, triggerWinFeedback } from "../services/feedback";

function useLocale() {
  const language = useGameStore((state) => state.settings.language);
  return strings[language];
}

function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function PrimaryButton({
  label,
  onPress,
  secondary,
  disabled
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary ? styles.buttonSecondary : styles.buttonPrimary,
        disabled && styles.buttonDisabled,
        pressed && !disabled ? { transform: [{ scale: 0.98 }] } : null
      ]}
    >
      <Text style={[styles.buttonText, secondary ? styles.buttonTextSecondary : null]}>{label}</Text>
    </Pressable>
  );
}

function HeaderStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.headerStat}>
      <Text style={styles.headerStatLabel}>{label}</Text>
      <Text style={styles.headerStatValue}>{value}</Text>
    </View>
  );
}

function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.delay(450),
      Animated.timing(fade, { toValue: 0.85, duration: 350, useNativeDriver: true })
    ]).start();
  }, [fade]);
  return (
    <LinearGradient colors={["#fff8ef", "#f6d8cb", "#efd9ab"]} style={styles.splash}>
      <Animated.View style={{ opacity: fade, alignItems: "center" }}>
        <View style={styles.logoCup}>
          <View style={styles.logoSteam} />
          <View style={[styles.logoSteam, { left: 34, height: 20 }]} />
          <View style={[styles.logoSteam, { left: 54, height: 26 }]} />
        </View>
        <Text style={styles.splashTitle}>Sweet Cafe Story</Text>
        <Text style={styles.splashSub}>정리하고, 서빙하고, 다시 빛나는 카페로</Text>
      </Animated.View>
    </LinearGradient>
  );
}

function LoadingScreen() {
  return (
    <Screen>
      <View style={styles.centerWrap}>
        <Text style={styles.loadingText}>저장 데이터를 불러오는 중...</Text>
      </View>
    </Screen>
  );
}

function IntroStoryScreen() {
  const locale = useLocale();
  const completeIntro = useGameStore((state) => state.completeIntro);
  const [slide, setSlide] = useState(0);
  return (
    <Screen>
      <LinearGradient colors={["#fff9ef", "#fbe2d7"]} style={styles.storyHero}>
        <Text style={styles.storyEmoji}>{slide === 0 ? "☕" : slide === 1 ? "🧁" : "✨"}</Text>
      </LinearGradient>
      <View style={styles.storyFooter}>
        <Text style={styles.storyTitle}>오래된 카페를 다시 열어볼까요?</Text>
        <Text style={styles.storyBody}>{locale.introSlides[slide]}</Text>
        <View style={styles.dots}>
          {locale.introSlides.map((entry, index) => (
            <View key={entry} style={[styles.dot, slide === index && styles.dotActive]} />
          ))}
        </View>
        {slide < locale.introSlides.length - 1 ? (
          <PrimaryButton label="다음" onPress={() => setSlide((value) => value + 1)} />
        ) : (
          <PrimaryButton label="카페 열기" onPress={completeIntro} />
        )}
        <PrimaryButton label={locale.skip} onPress={completeIntro} secondary />
      </View>
    </Screen>
  );
}

function NicknameScreen() {
  const locale = useLocale();
  const setNickname = useGameStore((state) => state.setNickname);
  const [nickname, setLocalNickname] = useState("");
  return (
    <Screen>
      <View style={styles.centerWrap}>
        <Card style={{ width: "100%" }}>
          <Text style={styles.title}>카페 이름표를 정해 주세요</Text>
          <Text style={styles.body}>나중에 Firebase 랭킹을 연결하면 이 이름이 표시됩니다.</Text>
          <TextInput
            value={nickname}
            onChangeText={setLocalNickname}
            placeholder="예: 별빛카페"
            style={styles.input}
            maxLength={12}
          />
          <PrimaryButton
            label="시작하기"
            onPress={() => setNickname(nickname.trim() || "별빛손님")}
          />
          <PrimaryButton label={`${locale.guest}로 시작`} onPress={() => setNickname("게스트")} secondary />
        </Card>
      </View>
    </Screen>
  );
}

function HomeScreen() {
  const locale = useLocale();
  const goTo = useGameStore((state) => state.goTo);
  const nickname = useGameStore((state) => state.nickname);
  const coins = useGameStore((state) => state.coins);
  const totalStars = useGameStore((state) => state.totalStars);
  const highestUnlockedLevel = useGameStore((state) => state.highestUnlockedLevel);
  const attendance = useGameStore((state) => state.attendance);
  const claimAttendance = useGameStore((state) => state.claimAttendance);
  const dailyChallenge = useGameStore((state) => state.dailyChallenge);
  const today = getDailyKey();
  const chapter = levels[Math.max(highestUnlockedLevel - 1, 0)].chapter;
  const chapterProgress = levels.filter((level) => level.chapter === chapter && level.levelId <= highestUnlockedLevel).length;
  const todaysAttendanceReady = !attendance.claimedDays.includes(today);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={["#fff6eb", "#f8dfd1"]} style={styles.hero}>
          <Text style={styles.welcome}>{nickname || "게스트"}님, 카페가 다시 숨을 쉬고 있어요.</Text>
          <View style={styles.heroStats}>
            <HeaderStat label="코인" value={coins} />
            <HeaderStat label="별" value={totalStars} />
            <HeaderStat label="진행" value={`${highestUnlockedLevel}/60`} />
          </View>
          <View style={styles.chapterBar}>
            <Text style={styles.chapterBarLabel}>{locale.chapterNames[chapter]}</Text>
            <Text style={styles.chapterBarValue}>{chapterProgress}/20 레벨</Text>
          </View>
        </LinearGradient>
        <Card>
          <Text style={styles.sectionTitle}>오늘 할 일</Text>
          <View style={styles.todoRow}>
            <Text style={styles.todoTitle}>출석 보상</Text>
            <PrimaryButton label={todaysAttendanceReady ? "받기" : "완료"} onPress={claimAttendance} secondary={!todaysAttendanceReady} />
          </View>
          <View style={styles.todoRow}>
            <Text style={styles.todoTitle}>데일리 챌린지</Text>
            <Text style={styles.body}>{dailyChallenge.completed ? "오늘 점수 기록 완료" : "특수 스테이지가 열려 있어요"}</Text>
          </View>
        </Card>
        <Card>
          <PrimaryButton label={locale.play} onPress={() => goTo("map")} />
          <PrimaryButton label={locale.restore} onPress={() => goTo("restore")} secondary />
          <View style={styles.gridButtons}>
            <SmallMenuButton label={locale.daily} onPress={() => goTo("daily")} />
            <SmallMenuButton label={locale.missions} onPress={() => goTo("missions")} />
            <SmallMenuButton label={locale.shop} onPress={() => goTo("shop")} />
            <SmallMenuButton label={locale.settings} onPress={() => goTo("settings")} />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function SmallMenuButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.smallMenu, pressed && { opacity: 0.8 }]}>
      <Text style={styles.smallMenuText}>{label}</Text>
    </Pressable>
  );
}

function LevelMapScreen() {
  const goTo = useGameStore((state) => state.goTo);
  const startLevel = useGameStore((state) => state.startLevel);
  const levelResults = useGameStore((state) => state.levelResults);
  const highestUnlockedLevel = useGameStore((state) => state.highestUnlockedLevel);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.mapContent}>
        <View style={styles.topRow}>
          <Text style={styles.title}>레벨 맵</Text>
          <Pressable onPress={() => goTo("home")}>
            <Text style={styles.link}>홈으로</Text>
          </Pressable>
        </View>
        {([1, 2, 3] as const).map((chapter) => (
          <Card key={chapter} style={{ backgroundColor: chapter === 1 ? "#fff6ed" : chapter === 2 ? "#eef8f1" : "#f4f6ff" }}>
            <Text style={styles.sectionTitle}>챕터 {chapter}</Text>
            <Text style={styles.body}>{strings.ko.chapterNames[chapter]}</Text>
            <View style={styles.levelGrid}>
              {levels
                .filter((level) => level.chapter === chapter)
                .map((level) => {
                  const result = levelResults[level.levelId];
                  const locked = level.levelId > highestUnlockedLevel;
                  return (
                    <Pressable
                      key={level.levelId}
                      onPress={() => !locked && startLevel(level.levelId)}
                      style={[
                        styles.levelNode,
                        locked ? styles.levelNodeLocked : result?.cleared ? styles.levelNodeCleared : styles.levelNodeOpen
                      ]}
                    >
                      <Text style={styles.levelNodeText}>{level.levelId}</Text>
                      <Text style={styles.levelNodeStars}>{result?.stars ? `★${result.stars}` : locked ? "잠김" : "도전"}</Text>
                    </Pressable>
                  );
                })}
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

function GameplayScreen() {
  const goTo = useGameStore((state) => state.goTo);
  const selectInSession = useGameStore((state) => state.selectInSession);
  const useBoosterInSession = useGameStore((state) => state.useBoosterInSession);
  const tick = useGameStore((state) => state.tick);
  const currentSession = useGameStore((state) => state.currentSession);
  const boosters = useGameStore((state) => state.boosters);
  const settings = useGameStore((state) => state.settings);
  const level = currentSession ? levels[currentSession.levelId - 1] : null;
  const lastTrayCount = useRef(currentSession?.tray.length ?? 0);

  useEffect(() => {
    if (!currentSession || currentSession.status !== "playing") {
      return;
    }
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [currentSession, tick]);

  useEffect(() => {
    if (!currentSession) {
      return;
    }
    if (currentSession.tray.length >= currentSession.traySize - 1 && currentSession.tray.length > lastTrayCount.current) {
      triggerWarningFeedback(settings.vibrationOn);
    }
    lastTrayCount.current = currentSession.tray.length;
  }, [currentSession, settings.vibrationOn]);

  if (!currentSession || !level) {
    return <LoadingScreen />;
  }

  const selectableIds = new Set(getSelectableTiles(currentSession).map((tile) => tile.id));
  const columns = 5;
  const rows = Math.max(...currentSession.tiles.map((tile) => tile.y)) + 1;

  return (
    <Screen>
      <View style={styles.gameHeader}>
        <HeaderStat label="레벨" value={level.levelId} />
        <HeaderStat label="점수" value={currentSession.score} />
        <HeaderStat label="시간" value={`${currentSession.timeLeft}s`} />
        <Pressable onPress={() => goTo("home")}>
          <Text style={styles.link}>나가기</Text>
        </Pressable>
      </View>
      <Card style={{ marginBottom: spacing.sm }}>
        <Text style={styles.sectionTitle}>{level.title}</Text>
        <Text style={styles.body}>{getProgressText(currentSession)} · 목표 점수 {level.targetScore}</Text>
        {level.tutorial?.map((line) => (
          <Text key={line} style={styles.tutorialText}>
            {line}
          </Text>
        ))}
      </Card>
      <View style={styles.boostersRow}>
        {(["undo", "shuffle", "extraSlot", "hint"] as BoosterType[]).map((type) => (
          <Pressable key={type} style={styles.boosterChip} onPress={() => useBoosterInSession(type)}>
            <Text style={styles.boosterChipText}>
              {type === "undo" ? "Undo" : type === "shuffle" ? "Shuffle" : type === "extraSlot" ? "Slot+" : "Hint"} {boosters[type]}
            </Text>
          </Pressable>
        ))}
      </View>
      <Card style={{ flex: 1 }}>
        <View style={[styles.board, { height: rows * 72 + 24 }]}>
          {currentSession.tiles.map((tile) => (
            <TileButton
              key={tile.id}
              tile={tile}
              selectable={selectableIds.has(tile.id)}
              hinted={currentSession.selectedHintTileId === tile.id}
              onPress={() => selectInSession(tile.id)}
              columns={columns}
            />
          ))}
        </View>
      </Card>
      <Card>
        <Text style={styles.sectionTitle}>트레이 {currentSession.tray.length}/{currentSession.traySize}</Text>
        <View style={styles.trayRow}>
          {Array.from({ length: currentSession.traySize }, (_, index) => {
            const entry = currentSession.tray[index];
            return (
              <View key={`${entry?.id ?? "empty"}-${index}`} style={styles.traySlot}>
                {entry ? <MiniFood type={entry.type} /> : <Text style={styles.trayEmpty}>+</Text>}
              </View>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}

function TileButton({
  tile,
  selectable,
  hinted,
  onPress,
  columns
}: {
  tile: TileData;
  selectable: boolean;
  hinted: boolean;
  onPress: () => void;
  columns: number;
}) {
  if (tile.removed) {
    return null;
  }
  const item = itemCatalog[tile.type];
  const left = 10 + tile.x * ((100 / columns) * 3.45);
  const top = 10 + tile.y * 66 + tile.layer * 4;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tile,
        {
          left,
          top,
          backgroundColor: item.color,
          borderColor: item.accent,
          opacity: selectable ? 1 : 0.4,
          transform: [{ scale: selectable ? 1 : 0.96 }]
        },
        hinted && styles.tileHint
      ]}
    >
      <Text style={styles.tileBadge}>{getTileBadge(tile)}</Text>
      <Text style={styles.tileLabel}>{item.label}</Text>
      <Text style={styles.tileShort}>{item.short}</Text>
    </Pressable>
  );
}

function MiniFood({ type }: { type: keyof typeof itemCatalog }) {
  const item = itemCatalog[type];
  return (
    <View style={[styles.miniFood, { backgroundColor: item.color, borderColor: item.accent }]}>
      <Text style={styles.miniFoodText}>{item.short}</Text>
    </View>
  );
}

function VictoryScreen() {
  const reward = useGameStore((state) => state.lastReward);
  const finishVictoryFlow = useGameStore((state) => state.finishVictoryFlow);
  const startLevel = useGameStore((state) => state.startLevel);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const scale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    triggerWinFeedback(useGameStore.getState().settings.vibrationOn);
  }, [scale]);
  return (
    <Screen>
      <View style={styles.centerWrap}>
        <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
          <Card style={{ alignItems: "center" }}>
            <Text style={styles.bigTitle}>주문 정리 완료</Text>
            <Text style={styles.starBurst}>{"★".repeat(reward?.stars ?? 1)}</Text>
            <Text style={styles.body}>점수 {reward?.score ?? 0}</Text>
            <Text style={styles.body}>코인 +{reward?.coins ?? 0} · 별 +{reward?.stars ?? 0}</Text>
            <PrimaryButton label="다음 레벨" onPress={() => startLevel(Math.min(60, currentLevel + 1))} />
            <PrimaryButton label="카페 꾸미기" onPress={finishVictoryFlow} secondary />
            <PrimaryButton label="보상 2배 보기" onPress={finishVictoryFlow} secondary />
          </Card>
        </Animated.View>
      </View>
    </Screen>
  );
}

function FailScreen() {
  const retryLevel = useGameStore((state) => state.retryLevel);
  const goTo = useGameStore((state) => state.goTo);
  const currentSession = useGameStore((state) => state.currentSession);
  return (
    <Screen>
      <View style={styles.centerWrap}>
        <Card style={{ width: "100%" }}>
          <Text style={styles.bigTitle}>조금만 더 정리하면 돼요</Text>
          <Text style={styles.body}>{currentSession?.failReason ?? "트레이가 가득 찼어요."}</Text>
          <PrimaryButton label="다시 도전" onPress={retryLevel} />
          <PrimaryButton label="Hint 사용 후 이어하기" onPress={retryLevel} secondary />
          <PrimaryButton label="홈으로" onPress={() => goTo("home")} secondary />
        </Card>
      </View>
    </Screen>
  );
}

function CafeRestoreScreen() {
  const goTo = useGameStore((state) => state.goTo);
  const totalStars = useGameStore((state) => state.totalStars);
  const cafeSelections = useGameStore((state) => state.cafeSelections);
  const applyRestoreChoice = useGameStore((state) => state.applyRestoreChoice);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const chapter = levels[Math.max(currentLevel - 1, 0)].chapter;
  const chapterPoints = restorePoints.filter((point) => point.chapter === chapter);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <Text style={styles.title}>카페 복구</Text>
          <Text style={styles.body}>보유 별 {totalStars}</Text>
        </View>
        <Card style={{ backgroundColor: "#fff8ef" }}>
          <Text style={styles.sectionTitle}>챕터 {chapter} 진행</Text>
          <Text style={styles.body}>
            {chapterPoints.filter((point) => cafeSelections[point.id]).length}/{chapterPoints.length} 완료
          </Text>
          <View style={styles.restorePreview}>
            {chapterPoints.map((point) => {
              const optionId = cafeSelections[point.id];
              const option = point.options.find((entry) => entry.id === optionId) ?? point.options[0];
              return (
                <View key={point.id} style={[styles.previewTile, { backgroundColor: option.palette[0], borderColor: option.accent }]}>
                  <Text style={styles.previewTileTitle}>{point.name}</Text>
                  <Text style={styles.previewTileValue}>{optionId ? option.label : "미복구"}</Text>
                </View>
              );
            })}
          </View>
        </Card>
        {chapterPoints.map((point) => (
          <Card key={point.id}>
            <Text style={styles.sectionTitle}>{point.name}</Text>
            <Text style={styles.body}>{point.description}</Text>
            <Text style={styles.body}>필요 별 {point.starCost}</Text>
            <View style={styles.restoreOptions}>
              {point.options.map((option) => {
                const selected = cafeSelections[point.id] === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => applyRestoreChoice(point.id, option.id)}
                    style={[
                      styles.restoreOption,
                      {
                        backgroundColor: option.palette[0],
                        borderColor: selected ? option.accent : "#ffffff"
                      }
                    ]}
                  >
                    <Text style={styles.restoreOptionTitle}>{option.label}</Text>
                    <Text style={styles.restoreOptionState}>{selected ? "적용됨" : "선택"}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        ))}
        <PrimaryButton label="홈으로" onPress={() => goTo("home")} secondary />
      </ScrollView>
    </Screen>
  );
}

function DailyChallengeScreen() {
  const goTo = useGameStore((state) => state.goTo);
  const startDailyChallenge = useGameStore((state) => state.startDailyChallenge);
  const dailyChallenge = useGameStore((state) => state.dailyChallenge);
  const nickname = useGameStore((state) => state.nickname);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={{ backgroundColor: "#fef4ef" }}>
          <Text style={styles.title}>오늘의 특수 주문</Text>
          <Text style={styles.body}>날짜 기준: Asia/Seoul ({dailyChallenge.dateKey})</Text>
          <Text style={styles.body}>완료 여부: {dailyChallenge.completed ? "완료" : "도전 가능"}</Text>
          <Text style={styles.body}>최고 점수: {dailyChallenge.bestScore}</Text>
          <PrimaryButton label="도전 시작" onPress={startDailyChallenge} />
        </Card>
        <Card>
          <Text style={styles.sectionTitle}>리더보드</Text>
          <Text style={styles.body}>{nickname || "게스트"} · {dailyChallenge.bestScore}점</Text>
          <Text style={styles.body}>Firebase가 연결되면 익명 로그인 후 같은 날짜의 글로벌 점수와 동기화됩니다.</Text>
        </Card>
        <PrimaryButton label="홈으로" onPress={() => goTo("home")} secondary />
      </ScrollView>
    </Screen>
  );
}

function MissionCard({ mission, onClaim }: { mission: MissionProgress; onClaim: () => void }) {
  const ratio = Math.min(1, mission.progress / mission.goal);
  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <Text style={styles.sectionTitle}>{mission.label}</Text>
      <View style={styles.missionBar}>
        <View style={[styles.missionFill, { width: `${ratio * 100}%` }]} />
      </View>
      <Text style={styles.body}>
        {mission.progress}/{mission.goal} · 보상 {mission.rewardCoins} 코인 / {mission.rewardStars} 별
      </Text>
      <PrimaryButton label={mission.claimed ? "수령 완료" : mission.progress >= mission.goal ? "보상 받기" : "진행 중"} onPress={onClaim} secondary={mission.progress < mission.goal || mission.claimed} />
    </Card>
  );
}

function MissionsScreen() {
  const goTo = useGameStore((state) => state.goTo);
  const dailyMissions = useGameStore((state) => state.dailyMissions);
  const weeklyMissions = useGameStore((state) => state.weeklyMissions);
  const claimMission = useGameStore((state) => state.claimMission);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>미션</Text>
        <Text style={styles.sectionTitle}>일일 미션</Text>
        {dailyMissions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} onClaim={() => claimMission(mission.id, "daily")} />
        ))}
        <Text style={styles.sectionTitle}>주간 미션</Text>
        {weeklyMissions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} onClaim={() => claimMission(mission.id, "weekly")} />
        ))}
        <PrimaryButton label="홈으로" onPress={() => goTo("home")} secondary />
      </ScrollView>
    </Screen>
  );
}

function ShopScreen() {
  const goTo = useGameStore((state) => state.goTo);
  const buyBooster = useGameStore((state) => state.buyBooster);
  const coins = useGameStore((state) => state.coins);
  const prices: Record<BoosterType, number> = { undo: 120, shuffle: 150, extraSlot: 180, hint: 100 };
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>상점</Text>
        <Text style={styles.body}>보유 코인 {coins}</Text>
        {(["undo", "shuffle", "extraSlot", "hint"] as BoosterType[]).map((type) => (
          <Card key={type}>
            <Text style={styles.sectionTitle}>{type === "undo" ? "Undo" : type === "shuffle" ? "Shuffle" : type === "extraSlot" ? "Extra Slot" : "Hint"}</Text>
            <Text style={styles.body}>가격 {prices[type]} 코인</Text>
            <PrimaryButton label="구매" onPress={() => buyBooster(type)} />
          </Card>
        ))}
        <Card>
          <Text style={styles.sectionTitle}>광고 제거 패키지</Text>
          <Text style={styles.body}>결제 SDK 없이 위치와 설명만 준비해 둔 확장 슬롯입니다.</Text>
        </Card>
        <PrimaryButton label="홈으로" onPress={() => goTo("home")} secondary />
      </ScrollView>
    </Screen>
  );
}

function SettingsScreen() {
  const goTo = useGameStore((state) => state.goTo);
  const settings = useGameStore((state) => state.settings);
  const updateSetting = useGameStore((state) => state.updateSetting);
  const resetProgress = useGameStore((state) => state.resetProgress);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>설정</Text>
        <SettingRow label="배경음" value={settings.musicOn} onValueChange={(value) => updateSetting("musicOn", value)} />
        <SettingRow label="효과음" value={settings.sfxOn} onValueChange={(value) => updateSetting("sfxOn", value)} />
        <SettingRow label="진동" value={settings.vibrationOn} onValueChange={(value) => updateSetting("vibrationOn", value)} />
        <Card>
          <Text style={styles.sectionTitle}>언어</Text>
          <View style={styles.langRow}>
            <PrimaryButton label="한국어" onPress={() => updateSetting("language", "ko")} secondary={settings.language !== "ko"} />
            <PrimaryButton label="English" onPress={() => updateSetting("language", "en")} secondary={settings.language !== "en"} />
          </View>
        </Card>
        <Card>
          <Text style={styles.sectionTitle}>저장 초기화</Text>
          <Text style={styles.body}>현재 진행, 복구, 미션, 설정을 모두 삭제합니다.</Text>
          <PrimaryButton label="초기화" onPress={resetProgress} secondary />
        </Card>
        <Card>
          <Text style={styles.sectionTitle}>정보</Text>
          <Text style={styles.body}>버전 1.0.0</Text>
          <Text style={styles.body}>개인정보/약관 자리 제공</Text>
        </Card>
        <PrimaryButton label="홈으로" onPress={() => goTo("home")} secondary />
      </ScrollView>
    </Screen>
  );
}

function SettingRow({
  label,
  value,
  onValueChange
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Card>
      <View style={styles.settingRow}>
        <Text style={styles.sectionTitle}>{label}</Text>
        <Switch value={value} onValueChange={onValueChange} />
      </View>
    </Card>
  );
}

function ChapterCompleteScreen() {
  const chapterCompleteId = useGameStore((state) => state.chapterCompleteId);
  const goTo = useGameStore((state) => state.goTo);
  const chapter = chapterCompleteId ?? 1;
  return (
    <Screen>
      <View style={styles.centerWrap}>
        <Card style={{ width: "100%", alignItems: "center" }}>
          <Text style={styles.bigTitle}>챕터 {chapter} 완료</Text>
          <Text style={styles.body}>{strings.ko.chapterNames[chapter as 1 | 2 | 3]} 복구가 마무리되었어요.</Text>
          <Text style={styles.body}>전보다 훨씬 환하고 손님을 맞이할 준비가 되었습니다.</Text>
          <PrimaryButton label="다음 챕터로" onPress={() => goTo("home")} />
        </Card>
      </View>
    </Screen>
  );
}

function EndingScreen() {
  const goTo = useGameStore((state) => state.goTo);
  return (
    <Screen>
      <LinearGradient colors={["#fff5ec", "#f7dfcf", "#f0e5a9"]} style={styles.endingWrap}>
        <Text style={styles.bigTitle}>카페 완성</Text>
        <Text style={styles.bodyCenter}>낡은 카페가 다시 사람들로 가득한 공간이 되었습니다.</Text>
        <Text style={styles.bodyCenter}>이제 매일 도전과 꾸미기로 당신만의 카페를 더 다듬어 보세요.</Text>
        <PrimaryButton label="홈으로 돌아가기" onPress={() => goTo("home")} />
        <PrimaryButton label="데일리 챌린지" onPress={() => goTo("daily")} secondary />
      </LinearGradient>
    </Screen>
  );
}

export function RootView() {
  const initialized = useGameStore((state) => state.initialized);
  const currentScreen = useGameStore((state) => state.currentScreen);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  const content = useMemo(() => {
    if (!initialized) {
      return <LoadingScreen />;
    }
    switch (currentScreen) {
      case "intro":
        return <IntroStoryScreen />;
      case "nickname":
        return <NicknameScreen />;
      case "home":
        return <HomeScreen />;
      case "map":
        return <LevelMapScreen />;
      case "gameplay":
        return <GameplayScreen />;
      case "victory":
        return <VictoryScreen />;
      case "fail":
        return <FailScreen />;
      case "restore":
        return <CafeRestoreScreen />;
      case "daily":
        return <DailyChallengeScreen />;
      case "missions":
        return <MissionsScreen />;
      case "shop":
        return <ShopScreen />;
      case "settings":
        return <SettingsScreen />;
      case "chapterComplete":
        return <ChapterCompleteScreen />;
      case "ending":
        return <EndingScreen />;
      default:
        return <HomeScreen />;
    }
  }, [currentScreen, initialized]);

  if (!splashDone) {
    return <SplashScreen />;
  }
  return content;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingHorizontal: spacing.md
  },
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  logoCup: {
    width: 94,
    height: 70,
    backgroundColor: "#ffffff",
    borderColor: palette.coral,
    borderWidth: 5,
    borderRadius: 22,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    position: "relative",
    marginBottom: spacing.lg
  },
  logoSteam: {
    position: "absolute",
    width: 10,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f0b287",
    top: -28,
    left: 16
  },
  splashTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: palette.brown
  },
  splashSub: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: palette.dim
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center"
  },
  loadingText: {
    textAlign: "center",
    fontSize: 18,
    color: palette.latte
  },
  storyHero: {
    flex: 0.55,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: -spacing.md
  },
  storyEmoji: {
    fontSize: 92
  },
  storyFooter: {
    flex: 0.45,
    paddingVertical: spacing.xl,
    gap: spacing.md
  },
  storyTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: palette.text
  },
  storyBody: {
    fontSize: 17,
    lineHeight: 24,
    color: palette.latte
  },
  dots: {
    flexDirection: "row",
    gap: spacing.xs
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e6cbbf"
  },
  dotActive: {
    width: 24,
    backgroundColor: palette.coral
  },
  card: {
    backgroundColor: palette.cream,
    borderRadius: 24,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: palette.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  button: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.sm
  },
  buttonPrimary: {
    backgroundColor: palette.coral
  },
  buttonSecondary: {
    backgroundColor: "#fff2ea",
    borderWidth: 1,
    borderColor: "#f3c5b6"
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16
  },
  buttonTextSecondary: {
    color: palette.coral
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: palette.text,
    marginBottom: spacing.sm
  },
  bigTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: palette.text,
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.text,
    marginBottom: 6
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.dim
  },
  bodyCenter: {
    fontSize: 16,
    lineHeight: 22,
    color: palette.dim,
    textAlign: "center",
    marginBottom: spacing.md
  },
  input: {
    borderWidth: 1,
    borderColor: "#f1d4c2",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginVertical: spacing.md
  },
  hero: {
    borderRadius: 28,
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  welcome: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.text,
    lineHeight: 30
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  headerStat: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderRadius: 18,
    padding: 12
  },
  headerStatLabel: {
    color: palette.dim,
    fontSize: 12,
    marginBottom: 4
  },
  headerStatValue: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800"
  },
  chapterBar: {
    marginTop: spacing.md,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  chapterBarLabel: {
    color: palette.text,
    fontWeight: "700"
  },
  chapterBarValue: {
    color: palette.latte,
    fontWeight: "700"
  },
  todoRow: {
    marginTop: spacing.sm
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.text
  },
  gridButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  smallMenu: {
    width: "48%",
    backgroundColor: "#fff2ea",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center"
  },
  smallMenuText: {
    color: palette.text,
    fontWeight: "800"
  },
  scrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: 60
  },
  mapContent: {
    paddingVertical: spacing.md,
    paddingBottom: 80
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: spacing.sm
  },
  link: {
    color: palette.coral,
    fontWeight: "800"
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: spacing.sm
  },
  levelNode: {
    width: "17.5%",
    minWidth: 58,
    aspectRatio: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 4
  },
  levelNodeOpen: {
    backgroundColor: "#ffe4d8"
  },
  levelNodeCleared: {
    backgroundColor: "#d6efd9"
  },
  levelNodeLocked: {
    backgroundColor: "#e6ddd7"
  },
  levelNodeText: {
    fontSize: 16,
    fontWeight: "900",
    color: palette.text
  },
  levelNodeStars: {
    fontSize: 11,
    color: palette.dim
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm
  },
  tutorialText: {
    color: palette.coral,
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600"
  },
  boostersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  boosterChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#fff2ea"
  },
  boosterChipText: {
    color: palette.text,
    fontWeight: "700",
    fontSize: 13
  },
  board: {
    position: "relative"
  },
  tile: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  tileHint: {
    shadowColor: "#f1cb5d",
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8
  },
  tileBadge: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ffffff"
  },
  tileLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff"
  },
  tileShort: {
    fontSize: 11,
    color: "#ffffff"
  },
  trayRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap"
  },
  traySlot: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f5e4d7",
    alignItems: "center",
    justifyContent: "center"
  },
  trayEmpty: {
    color: "#caa792",
    fontWeight: "800"
  },
  miniFood: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  miniFoodText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 11
  },
  starBurst: {
    fontSize: 42,
    color: palette.gold,
    marginVertical: spacing.sm
  },
  restorePreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  previewTile: {
    width: "48%",
    borderRadius: 18,
    borderWidth: 2,
    padding: 12
  },
  previewTileTitle: {
    color: palette.text,
    fontWeight: "800",
    fontSize: 14
  },
  previewTileValue: {
    marginTop: 4,
    color: palette.latte
  },
  restoreOptions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  restoreOption: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    padding: 12
  },
  restoreOptionTitle: {
    color: palette.text,
    fontWeight: "800",
    fontSize: 14
  },
  restoreOptionState: {
    marginTop: 8,
    color: palette.latte
  },
  missionBar: {
    height: 10,
    borderRadius: 6,
    backgroundColor: "#f3dfd2",
    overflow: "hidden",
    marginVertical: spacing.sm
  },
  missionFill: {
    height: "100%",
    backgroundColor: palette.coral
  },
  langRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  endingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  }
});
