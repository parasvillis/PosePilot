import { Pose } from './keypoints';
import { SceneId } from './scenes';

function pose(arr: number[]): Pose {
  const kps = [];
  for (let i = 0; i < 17; i++) {
    kps.push({ x: arr[i * 2], y: arr[i * 2 + 1], score: 1 });
  }
  return { keypoints: kps };
}

export type PoseTemplate = {
  id: string;
  name: string;
  tag: string;
  hint: string;
  scenes: SceneId[];
  subjects: 1 | 2 | 3;
  mood: 'candid' | 'confident' | 'editorial' | 'playful' | 'serene' | 'bold';
  pose: Pose;
};

// All coords normalized 0..1, portrait frame. Body roughly y=0.12..0.95.
export const POSE_TEMPLATES: PoseTemplate[] = [
  // === EVERYDAY OUTDOOR / PORTRAIT (6) ===
  {
    id: 'casual_stand',
    name: 'Casual Stand',
    tag: 'Everyday', mood: 'candid', subjects: 1,
    scenes: ['outdoor_portrait', 'street', 'generic'],
    hint: 'Relax shoulders, weight on one leg',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.43,0.22, 0.57,0.22, 0.40,0.34, 0.60,0.34, 0.38,0.46, 0.62,0.46, 0.45,0.48, 0.55,0.48, 0.44,0.68, 0.56,0.68, 0.44,0.92, 0.56,0.92]),
  },
  {
    id: 'hands_in_pockets',
    name: 'Hands in Pockets',
    tag: 'Effortless', mood: 'candid', subjects: 1,
    scenes: ['outdoor_portrait', 'street', 'indoor_portrait'],
    hint: 'Tuck hands, chin slightly down',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.43,0.22, 0.57,0.22, 0.41,0.36, 0.59,0.36, 0.44,0.50, 0.56,0.50, 0.45,0.50, 0.55,0.50, 0.44,0.70, 0.56,0.70, 0.44,0.93, 0.56,0.93]),
  },
  {
    id: 'leaning_wall',
    name: 'Leaning',
    tag: 'Confident', mood: 'confident', subjects: 1,
    scenes: ['street', 'outdoor_portrait', 'indoor_portrait'],
    hint: 'Shoulder against wall, hip out',
    pose: pose([0.46,0.16, 0.44,0.15, 0.48,0.15, 0.42,0.16, 0.50,0.16, 0.40,0.24, 0.54,0.24, 0.37,0.36, 0.57,0.36, 0.36,0.48, 0.60,0.48, 0.43,0.50, 0.55,0.50, 0.42,0.70, 0.58,0.72, 0.40,0.92, 0.62,0.94]),
  },
  {
    id: 'walking_shot',
    name: 'Walking Shot',
    tag: 'Dynamic', mood: 'candid', subjects: 1,
    scenes: ['street', 'outdoor_portrait', 'travel'],
    hint: 'Step forward, swing arm',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.43,0.22, 0.57,0.22, 0.36,0.30, 0.64,0.34, 0.32,0.44, 0.66,0.48, 0.46,0.48, 0.56,0.48, 0.40,0.66, 0.60,0.70, 0.36,0.90, 0.64,0.92]),
  },
  {
    id: 'profile_shot',
    name: 'Profile Turn',
    tag: 'Editorial', mood: 'editorial', subjects: 1,
    scenes: ['outdoor_portrait', 'indoor_portrait', 'street'],
    hint: 'Turn 45°, look past shoulder',
    pose: pose([0.52,0.15, 0.50,0.14, 0.54,0.14, 0.48,0.15, 0.56,0.15, 0.44,0.24, 0.58,0.24, 0.42,0.38, 0.58,0.38, 0.42,0.52, 0.60,0.52, 0.46,0.50, 0.54,0.50, 0.46,0.70, 0.54,0.70, 0.46,0.93, 0.54,0.93]),
  },
  {
    id: 'back_shot_scenic',
    name: 'Back Shot',
    tag: 'Scenic', mood: 'serene', subjects: 1,
    scenes: ['outdoor_portrait', 'beach', 'mountain', 'travel'],
    hint: 'Face away, look over shoulder',
    pose: pose([0.50,0.16, 0.49,0.15, 0.51,0.15, 0.47,0.16, 0.53,0.16, 0.44,0.24, 0.56,0.24, 0.42,0.36, 0.58,0.36, 0.40,0.48, 0.60,0.48, 0.46,0.50, 0.54,0.50, 0.45,0.70, 0.55,0.70, 0.45,0.93, 0.55,0.93]),
  },

  // === CAFE / INDOOR (4) ===
  {
    id: 'sitting_cafe',
    name: 'Sitting Cafe',
    tag: 'Relaxed', mood: 'candid', subjects: 1,
    scenes: ['cafe', 'indoor_portrait'],
    hint: 'Lean on elbow, soft smile',
    pose: pose([0.50,0.22, 0.48,0.21, 0.52,0.21, 0.46,0.22, 0.54,0.22, 0.43,0.30, 0.57,0.30, 0.38,0.42, 0.62,0.42, 0.40,0.28, 0.64,0.55, 0.45,0.58, 0.55,0.58, 0.40,0.76, 0.60,0.76, 0.30,0.88, 0.70,0.88]),
  },
  {
    id: 'hand_on_chin',
    name: 'Hand on Chin',
    tag: 'Thoughtful', mood: 'editorial', subjects: 1,
    scenes: ['cafe', 'indoor_portrait', 'outdoor_portrait'],
    hint: 'Gentle hand to jawline',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.43,0.22, 0.57,0.22, 0.40,0.26, 0.60,0.34, 0.48,0.18, 0.64,0.46, 0.45,0.48, 0.55,0.48, 0.44,0.68, 0.56,0.68, 0.44,0.92, 0.56,0.92]),
  },
  {
    id: 'hand_through_hair',
    name: 'Through Hair',
    tag: 'Editorial', mood: 'editorial', subjects: 1,
    scenes: ['cafe', 'indoor_portrait', 'outdoor_portrait', 'party'],
    hint: 'Sweep hair, elbow up',
    pose: pose([0.50,0.16, 0.48,0.15, 0.52,0.15, 0.46,0.16, 0.54,0.16, 0.43,0.24, 0.57,0.24, 0.36,0.20, 0.60,0.36, 0.46,0.10, 0.62,0.48, 0.45,0.50, 0.55,0.50, 0.44,0.70, 0.56,0.70, 0.44,0.93, 0.56,0.93]),
  },
  {
    id: 'window_gaze',
    name: 'Window Gaze',
    tag: 'Serene', mood: 'serene', subjects: 1,
    scenes: ['cafe', 'indoor_portrait'],
    hint: 'Look past camera, soft posture',
    pose: pose([0.48,0.18, 0.46,0.17, 0.50,0.17, 0.44,0.18, 0.52,0.18, 0.42,0.26, 0.56,0.26, 0.40,0.40, 0.58,0.40, 0.42,0.54, 0.60,0.54, 0.45,0.52, 0.55,0.52, 0.45,0.72, 0.55,0.72, 0.45,0.93, 0.55,0.93]),
  },

  // === BEACH (4) ===
  {
    id: 'arms_wide_beach',
    name: 'Arms Wide',
    tag: 'Travel', mood: 'playful', subjects: 1,
    scenes: ['beach', 'mountain', 'travel', 'outdoor_portrait'],
    hint: 'Open arms like catching the view',
    pose: pose([0.50,0.13, 0.48,0.12, 0.52,0.12, 0.46,0.13, 0.54,0.13, 0.42,0.22, 0.58,0.22, 0.28,0.22, 0.72,0.22, 0.15,0.22, 0.85,0.22, 0.45,0.48, 0.55,0.48, 0.44,0.70, 0.56,0.70, 0.43,0.93, 0.57,0.93]),
  },
  {
    id: 'sunset_silhouette',
    name: 'Sunset Stand',
    tag: 'Golden Hour', mood: 'serene', subjects: 1,
    scenes: ['beach', 'mountain', 'travel'],
    hint: 'Profile against light, hands down',
    pose: pose([0.52,0.15, 0.50,0.14, 0.54,0.14, 0.48,0.15, 0.56,0.15, 0.44,0.24, 0.58,0.24, 0.44,0.38, 0.58,0.38, 0.45,0.54, 0.58,0.54, 0.46,0.50, 0.54,0.50, 0.46,0.70, 0.54,0.70, 0.46,0.93, 0.54,0.93]),
  },
  {
    id: 'running_waves',
    name: 'Running Shot',
    tag: 'Dynamic', mood: 'playful', subjects: 1,
    scenes: ['beach', 'travel', 'fitness'],
    hint: 'Mid-stride, arms alive',
    pose: pose([0.50,0.12, 0.48,0.11, 0.52,0.11, 0.46,0.12, 0.54,0.12, 0.42,0.22, 0.58,0.22, 0.30,0.26, 0.66,0.26, 0.22,0.34, 0.74,0.34, 0.44,0.48, 0.56,0.48, 0.36,0.64, 0.64,0.62, 0.30,0.88, 0.70,0.90]),
  },
  {
    id: 'sitting_sand',
    name: 'Sitting on Sand',
    tag: 'Relaxed', mood: 'serene', subjects: 1,
    scenes: ['beach'],
    hint: 'Arms behind, knees up',
    pose: pose([0.50,0.28, 0.48,0.27, 0.52,0.27, 0.46,0.28, 0.54,0.28, 0.44,0.36, 0.56,0.36, 0.40,0.48, 0.60,0.48, 0.36,0.56, 0.64,0.56, 0.45,0.58, 0.55,0.58, 0.38,0.72, 0.62,0.72, 0.30,0.90, 0.70,0.90]),
  },

  // === MOUNTAIN / TRAVEL (3) ===
  {
    id: 'summit_pose',
    name: 'Summit Stand',
    tag: 'Triumphant', mood: 'bold', subjects: 1,
    scenes: ['mountain', 'travel'],
    hint: 'Chest high, arms slightly back',
    pose: pose([0.50,0.12, 0.48,0.11, 0.52,0.11, 0.46,0.12, 0.54,0.12, 0.42,0.22, 0.58,0.22, 0.36,0.32, 0.64,0.32, 0.34,0.46, 0.66,0.46, 0.44,0.48, 0.56,0.48, 0.43,0.70, 0.57,0.70, 0.42,0.93, 0.58,0.93]),
  },
  {
    id: 'hiking_shot',
    name: 'Mid-Hike',
    tag: 'Adventure', mood: 'candid', subjects: 1,
    scenes: ['mountain', 'outdoor_portrait', 'travel'],
    hint: 'Step up, look out',
    pose: pose([0.50,0.16, 0.48,0.15, 0.52,0.15, 0.46,0.16, 0.54,0.16, 0.44,0.24, 0.58,0.24, 0.40,0.34, 0.62,0.34, 0.38,0.46, 0.64,0.46, 0.46,0.50, 0.56,0.50, 0.40,0.64, 0.60,0.70, 0.36,0.86, 0.64,0.92]),
  },
  {
    id: 'pointing_distance',
    name: 'Pointing Ahead',
    tag: 'Adventure', mood: 'bold', subjects: 1,
    scenes: ['mountain', 'travel', 'beach'],
    hint: 'One arm out, point forward',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.44,0.22, 0.56,0.22, 0.32,0.24, 0.58,0.34, 0.20,0.26, 0.60,0.48, 0.46,0.48, 0.54,0.48, 0.45,0.70, 0.55,0.70, 0.45,0.93, 0.55,0.93]),
  },

  // === GRADUATION (3) ===
  {
    id: 'grad_diploma',
    name: 'Diploma Hold',
    tag: 'Graduation', mood: 'bold', subjects: 1,
    scenes: ['graduation'],
    hint: 'Hold diploma at chest, head high',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.42,0.24, 0.58,0.24, 0.40,0.36, 0.60,0.36, 0.44,0.40, 0.56,0.40, 0.45,0.50, 0.55,0.50, 0.44,0.70, 0.56,0.70, 0.44,0.93, 0.56,0.93]),
  },
  {
    id: 'grad_cap_toss',
    name: 'Cap Toss',
    tag: 'Graduation', mood: 'playful', subjects: 1,
    scenes: ['graduation'],
    hint: 'Arm up mid-throw',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.42,0.22, 0.58,0.22, 0.38,0.14, 0.62,0.30, 0.32,0.06, 0.66,0.40, 0.46,0.48, 0.54,0.48, 0.45,0.70, 0.55,0.70, 0.45,0.93, 0.55,0.93]),
  },
  {
    id: 'grad_portrait',
    name: 'Grad Portrait',
    tag: 'Graduation', mood: 'confident', subjects: 1,
    scenes: ['graduation'],
    hint: 'Straight, hands clasped front',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.44,0.22, 0.56,0.22, 0.42,0.34, 0.58,0.34, 0.46,0.46, 0.54,0.46, 0.45,0.50, 0.55,0.50, 0.45,0.70, 0.55,0.70, 0.45,0.93, 0.55,0.93]),
  },

  // === PARTY / NIGHT (3) ===
  {
    id: 'toast_glass',
    name: 'Toast',
    tag: 'Party', mood: 'playful', subjects: 1,
    scenes: ['party', 'indoor_portrait'],
    hint: 'Raise glass, tilt head',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.42,0.22, 0.58,0.22, 0.36,0.22, 0.60,0.30, 0.32,0.12, 0.62,0.42, 0.46,0.48, 0.54,0.48, 0.45,0.70, 0.55,0.70, 0.45,0.93, 0.55,0.93]),
  },
  {
    id: 'dance_move',
    name: 'Dance',
    tag: 'Party', mood: 'playful', subjects: 1,
    scenes: ['party'],
    hint: 'Both arms up, hip out',
    pose: pose([0.48,0.14, 0.46,0.13, 0.50,0.13, 0.44,0.14, 0.52,0.14, 0.40,0.22, 0.56,0.22, 0.32,0.14, 0.62,0.14, 0.24,0.06, 0.70,0.06, 0.42,0.48, 0.56,0.48, 0.42,0.70, 0.58,0.72, 0.40,0.93, 0.60,0.93]),
  },
  {
    id: 'laughing_candid',
    name: 'Candid Laugh',
    tag: 'Party', mood: 'candid', subjects: 1,
    scenes: ['party', 'indoor_portrait', 'cafe'],
    hint: 'Head back, shoulders loose',
    pose: pose([0.50,0.18, 0.48,0.17, 0.52,0.17, 0.46,0.18, 0.54,0.18, 0.42,0.26, 0.58,0.26, 0.38,0.36, 0.62,0.36, 0.34,0.46, 0.66,0.46, 0.45,0.50, 0.55,0.50, 0.44,0.70, 0.56,0.70, 0.44,0.93, 0.56,0.93]),
  },

  // === FITNESS / ACTIVE (3) ===
  {
    id: 'power_pose_gym',
    name: 'Power Pose',
    tag: 'Bold', mood: 'bold', subjects: 1,
    scenes: ['fitness', 'outdoor_portrait', 'indoor_portrait'],
    hint: 'Hands on hips, chin up',
    pose: pose([0.50,0.12, 0.48,0.11, 0.52,0.11, 0.46,0.12, 0.54,0.12, 0.42,0.22, 0.58,0.22, 0.34,0.32, 0.66,0.32, 0.40,0.46, 0.60,0.46, 0.44,0.48, 0.56,0.48, 0.43,0.70, 0.57,0.70, 0.42,0.93, 0.58,0.93]),
  },
  {
    id: 'stretching',
    name: 'Stretch Up',
    tag: 'Active', mood: 'editorial', subjects: 1,
    scenes: ['fitness'],
    hint: 'Both arms overhead, lean slightly',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.42,0.22, 0.58,0.22, 0.40,0.10, 0.60,0.10, 0.42,0.00, 0.58,0.00, 0.45,0.48, 0.55,0.48, 0.44,0.70, 0.56,0.70, 0.44,0.93, 0.56,0.93]),
  },
  {
    id: 'jumping_shot',
    name: 'Jump Shot',
    tag: 'Active', mood: 'playful', subjects: 1,
    scenes: ['fitness', 'beach', 'party'],
    hint: 'Both feet off ground',
    pose: pose([0.50,0.18, 0.48,0.17, 0.52,0.17, 0.46,0.18, 0.54,0.18, 0.42,0.26, 0.58,0.26, 0.32,0.20, 0.68,0.20, 0.22,0.14, 0.78,0.14, 0.44,0.52, 0.56,0.52, 0.40,0.68, 0.60,0.68, 0.38,0.82, 0.62,0.82]),
  },

  // === CLASSIC PORTRAITURE (2) ===
  {
    id: 'crossed_arms',
    name: 'Crossed Arms',
    tag: 'Confident', mood: 'bold', subjects: 1,
    scenes: ['indoor_portrait', 'outdoor_portrait', 'street', 'fitness'],
    hint: 'Arms crossed, chin slightly down',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.42,0.22, 0.58,0.22, 0.40,0.32, 0.60,0.32, 0.52,0.38, 0.48,0.38, 0.45,0.48, 0.55,0.48, 0.44,0.70, 0.56,0.70, 0.44,0.93, 0.56,0.93]),
  },
  {
    id: 'hip_out',
    name: 'Hip Out',
    tag: 'Editorial', mood: 'editorial', subjects: 1,
    scenes: ['outdoor_portrait', 'indoor_portrait', 'party', 'street'],
    hint: 'One hip to side, weight shift',
    pose: pose([0.50,0.14, 0.48,0.13, 0.52,0.13, 0.46,0.14, 0.54,0.14, 0.42,0.22, 0.56,0.22, 0.38,0.34, 0.58,0.34, 0.36,0.46, 0.60,0.46, 0.40,0.50, 0.58,0.48, 0.40,0.70, 0.60,0.68, 0.38,0.93, 0.62,0.91]),
  },
];

export function getTemplateById(id: string): PoseTemplate {
  return POSE_TEMPLATES.find(p => p.id === id) ?? POSE_TEMPLATES[0];
}

/** Rank poses for a scene. Higher score = better fit. */
export function recommendPoses(scene: SceneId, limit = 8): PoseTemplate[] {
  if (scene === 'generic') return POSE_TEMPLATES.slice(0, limit);
  const matches = POSE_TEMPLATES.map(t => ({
    t,
    score: t.scenes.includes(scene) ? 2 : t.scenes.includes('generic') ? 0.3 : 0,
  }));
  matches.sort((a, b) => b.score - a.score);
  return matches.filter(m => m.score > 0).slice(0, limit).map(m => m.t);
}
