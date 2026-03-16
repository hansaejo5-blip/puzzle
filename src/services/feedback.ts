import * as Haptics from "expo-haptics";
import { Vibration } from "react-native";

export async function triggerMatchFeedback(enabled: boolean) {
  if (!enabled) {
    return;
  }
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function triggerWinFeedback(enabled: boolean) {
  if (!enabled) {
    return;
  }
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function triggerWarningFeedback(enabled: boolean) {
  if (!enabled) {
    return;
  }
  Vibration.vibrate([0, 100, 60, 100]);
}
