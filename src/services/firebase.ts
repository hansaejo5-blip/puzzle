import Constants from "expo-constants";
import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const extra = Constants.expoConfig?.extra ?? {};

function getFirebaseConfig() {
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? extra.firebaseApiKey,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? extra.firebaseAuthDomain,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? extra.firebaseProjectId,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? extra.firebaseStorageBucket,
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? extra.firebaseMessagingSenderId,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? extra.firebaseAppId
  };
}

function isConfigured(config: ReturnType<typeof getFirebaseConfig>) {
  return Object.values(config).every(Boolean);
}

let app: FirebaseApp | null = null;

export async function ensureFirebaseUser() {
  const config = getFirebaseConfig();
  if (!isConfigured(config)) {
    return null;
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
  }
  const auth = getAuth(app);
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser;
}

export async function syncCloudSave(payload: unknown) {
  const user = await ensureFirebaseUser();
  if (!user || !app) {
    return false;
  }
  const db = getFirestore(app);
  await setDoc(doc(db, "saves", user.uid), { payload, updatedAt: Date.now() }, { merge: true });
  return true;
}

export async function syncDailyLeaderboard(nickname: string, score: number, dateKey: string) {
  const user = await ensureFirebaseUser();
  if (!user || !app) {
    return false;
  }
  const db = getFirestore(app);
  await setDoc(
    doc(db, "leaderboards", dateKey, "entries", user.uid),
    { nickname, score, updatedAt: Date.now() },
    { merge: true }
  );
  return true;
}
