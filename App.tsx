import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native";
import { RootView } from "./src/screens/RootView";
import { useGameStore } from "./src/store/gameStore";

export default function App() {
  const initialize = useGameStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7efe5" }}>
      <StatusBar style="dark" />
      <RootView />
    </SafeAreaView>
  );
}
