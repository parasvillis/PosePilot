/**
 * Scene catalog. Each scene defines a context under which certain poses shine.
 * The scene detector maps camera frames to one of these tags; the recommender
 * uses the tag to filter + rank the pose library.
 */

export type SceneId =
  | 'outdoor_portrait'
  | 'indoor_portrait'
  | 'cafe'
  | 'street'
  | 'beach'
  | 'mountain'
  | 'graduation'
  | 'party'
  | 'fitness'
  | 'travel'
  | 'generic';

export type Scene = {
  id: SceneId;
  label: string;
  icon: string; // @expo/vector-icons (Ionicons) name
  kicker: string;
};

export const SCENES: Record<SceneId, Scene> = {
  outdoor_portrait: { id: 'outdoor_portrait', label: 'Outdoor', icon: 'leaf-outline', kicker: 'OUTDOOR PORTRAIT' },
  indoor_portrait:  { id: 'indoor_portrait',  label: 'Indoor',  icon: 'home-outline', kicker: 'INDOOR PORTRAIT' },
  cafe:             { id: 'cafe',             label: 'Cafe',    icon: 'cafe-outline', kicker: 'CAFE · WINDOW' },
  street:           { id: 'street',           label: 'Street',  icon: 'walk-outline', kicker: 'URBAN · STREET' },
  beach:            { id: 'beach',            label: 'Beach',   icon: 'sunny-outline', kicker: 'BEACH · COAST' },
  mountain:         { id: 'mountain',         label: 'Peak',    icon: 'triangle-outline', kicker: 'MOUNTAIN · TRAIL' },
  graduation:       { id: 'graduation',       label: 'Grad',    icon: 'school-outline', kicker: 'GRADUATION' },
  party:            { id: 'party',            label: 'Party',   icon: 'wine-outline', kicker: 'PARTY · NIGHT' },
  fitness:          { id: 'fitness',          label: 'Fitness', icon: 'barbell-outline', kicker: 'FITNESS · ACTIVE' },
  travel:           { id: 'travel',           label: 'Travel',  icon: 'airplane-outline', kicker: 'TRAVEL · EXPLORE' },
  generic:          { id: 'generic',          label: 'All',     icon: 'sparkles-outline', kicker: 'ALL POSES' },
};

/**
 * MobileNet (ImageNet) class names → our scene taxonomy.
 * MobileNet returns labels like "mortarboard", "gown", "restaurant", "bakery",
 * "seashore", "mountain", "sandbar", "alp", "gymnasium", "barbell".
 * We keep the table small and practical — a direct substring match is fine.
 */
const CLASS_TO_SCENE: { match: RegExp; scene: SceneId; weight: number }[] = [
  // Graduation
  { match: /\b(mortarboard|academic gown|diploma)\b/i, scene: 'graduation', weight: 3 },
  // Cafe / restaurant / window
  { match: /\b(restaurant|bakery|confectionery|espresso|cafeteria|plate|cup|dining)\b/i, scene: 'cafe', weight: 2 },
  // Beach
  { match: /\b(seashore|sandbar|beach|lakeside|promontory|sea|wreck|bikini)\b/i, scene: 'beach', weight: 3 },
  // Mountain
  { match: /\b(alp|valley|volcano|mountain|cliff|glacier|geyser|ski)\b/i, scene: 'mountain', weight: 3 },
  // Street / urban
  { match: /\b(street sign|parking meter|traffic light|crosswalk|sidewalk|taxi|alp|city|skyscraper|bus)\b/i, scene: 'street', weight: 2 },
  // Fitness
  { match: /\b(gymnasium|barbell|dumbbell|sneaker|tennis|jersey|weight)\b/i, scene: 'fitness', weight: 2 },
  // Party
  { match: /\b(wine|cocktail|disco|nightclub|stage|microphone|martini)\b/i, scene: 'party', weight: 2 },
  // Indoor fallbacks
  { match: /\b(library|bookshop|studio|bedroom|office|monitor|laptop|desk)\b/i, scene: 'indoor_portrait', weight: 1 },
  // Outdoor fallbacks
  { match: /\b(park|lakeshore|garden|field|meadow|pier|forest|lawn|trail)\b/i, scene: 'outdoor_portrait', weight: 1 },
  // Travel
  { match: /\b(airliner|airport|passport|suitcase|map|compass|palace|pagoda)\b/i, scene: 'travel', weight: 2 },
];

/** Map a list of MobileNet predictions {className, probability} → best scene + confidence. */
export function classifyScene(
  predictions: { className: string; probability: number }[],
): { scene: SceneId; confidence: number } {
  const scores: Partial<Record<SceneId, number>> = {};
  for (const p of predictions.slice(0, 5)) {
    for (const rule of CLASS_TO_SCENE) {
      if (rule.match.test(p.className)) {
        scores[rule.scene] = (scores[rule.scene] ?? 0) + p.probability * rule.weight;
      }
    }
  }
  let best: SceneId = 'generic';
  let bestScore = 0;
  for (const [id, s] of Object.entries(scores) as [SceneId, number][]) {
    if (s > bestScore) {
      bestScore = s;
      best = id;
    }
  }
  return { scene: best, confidence: Math.min(1, bestScore) };
}
