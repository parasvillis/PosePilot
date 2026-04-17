import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_CAPTURES = 'pp:captures';
const KEY_ONBOARDED = 'pp:onboarded';
const KEY_SETTINGS = 'pp:settings';

export type Capture = {
  id: string;
  poseId: string;
  poseName: string;
  /** data:image/jpeg;base64,... or http(s) url on native if saved to media lib */
  uri: string;
  /** JSON-stringified detected user pose at capture time */
  userPose: string;
  createdAt: number;
  score: number;
};

export async function getCaptures(): Promise<Capture[]> {
  const raw = await AsyncStorage.getItem(KEY_CAPTURES);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Capture[];
  } catch {
    return [];
  }
}

export async function addCapture(c: Capture): Promise<void> {
  const list = await getCaptures();
  list.unshift(c);
  // keep most recent 60
  await AsyncStorage.setItem(KEY_CAPTURES, JSON.stringify(list.slice(0, 60)));
}

export async function removeCapture(id: string): Promise<void> {
  const list = await getCaptures();
  await AsyncStorage.setItem(
    KEY_CAPTURES,
    JSON.stringify(list.filter(c => c.id !== id)),
  );
}

export async function getCapture(id: string): Promise<Capture | null> {
  const list = await getCaptures();
  return list.find(c => c.id === id) ?? null;
}

export async function setOnboarded(v: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_ONBOARDED, v ? '1' : '0');
}
export async function isOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY_ONBOARDED)) === '1';
}

export type Settings = {
  autoCapture: boolean;
  haptics: boolean;
  grid: boolean;
  overlayOpacity: number;
  timer: 0 | 3 | 5;
};

export const DEFAULT_SETTINGS: Settings = {
  autoCapture: true,
  haptics: true,
  grid: false,
  overlayOpacity: 0.55,
  timer: 0,
};

export async function getSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(KEY_SETTINGS);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
export async function setSettings(s: Settings): Promise<void> {
  await AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
}
