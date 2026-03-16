import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  async save(key: string, value: unknown) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async load<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  }
};
