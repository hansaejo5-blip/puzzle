import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { RootView } from "./src/screens/RootView";
import { useGameStore } from "./src/store/gameStore";

type BoundaryState = {
  errorMessage: string | null;
};

class AppErrorBoundary extends React.Component<React.PropsWithChildren, BoundaryState> {
  state: BoundaryState = {
    errorMessage: null
  };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return {
      errorMessage: error.message
    };
  }

  componentDidCatch(error: Error) {
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#f7efe5",
            justifyContent: "center",
            padding: 24
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#493224", marginBottom: 12 }}>
            앱 실행 오류
          </Text>
          <Text style={{ fontSize: 16, lineHeight: 22, color: "#6f5848" }}>
            {this.state.errorMessage}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const initialize = useGameStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <AppErrorBoundary>
      <StatusBar style="dark" />
      <View style={{ flex: 1, minHeight: "100%", backgroundColor: "#f7efe5" }}>
        <RootView />
      </View>
    </AppErrorBoundary>
  );
}
