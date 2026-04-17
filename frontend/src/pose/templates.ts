import { Pose } from './keypoints';

// Helper to construct a pose from a compact array [x0,y0, x1,y1, ...] of 17 points in 0..1 space.
// x goes right, y goes down. Scores default to 1.
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
  tag: string; // mood/category
  hint: string;
  emoji?: string; // not rendered — reference only
  pose: Pose;
};

// All coordinates are in a 0..1 virtual frame (portrait).
// Body height roughly spans y ~= 0.12 (head) to 0.95 (ankles).

export const POSE_TEMPLATES: PoseTemplate[] = [
  {
    id: 'casual_stand',
    name: 'Casual Stand',
    tag: 'Everyday',
    hint: 'Relax shoulders, weight on one leg',
    pose: pose([
      0.50, 0.14,  0.48, 0.13,  0.52, 0.13,  0.46, 0.14,  0.54, 0.14,
      0.43, 0.22,  0.57, 0.22,  0.40, 0.34,  0.60, 0.34,  0.38, 0.46,  0.62, 0.46,
      0.45, 0.48,  0.55, 0.48,  0.44, 0.68,  0.56, 0.68,  0.44, 0.92,  0.56, 0.92,
    ]),
  },
  {
    id: 'hands_in_pockets',
    name: 'Hands in Pockets',
    tag: 'Effortless',
    hint: 'Tuck hands, chin slightly down',
    pose: pose([
      0.50, 0.14,  0.48, 0.13,  0.52, 0.13,  0.46, 0.14,  0.54, 0.14,
      0.43, 0.22,  0.57, 0.22,  0.41, 0.36,  0.59, 0.36,  0.44, 0.50,  0.56, 0.50,
      0.45, 0.50,  0.55, 0.50,  0.44, 0.70,  0.56, 0.70,  0.44, 0.93,  0.56, 0.93,
    ]),
  },
  {
    id: 'arms_wide',
    name: 'Arms Wide',
    tag: 'Travel',
    hint: 'Open arms like catching the view',
    pose: pose([
      0.50, 0.13,  0.48, 0.12,  0.52, 0.12,  0.46, 0.13,  0.54, 0.13,
      0.42, 0.22,  0.58, 0.22,  0.28, 0.22,  0.72, 0.22,  0.15, 0.22,  0.85, 0.22,
      0.45, 0.48,  0.55, 0.48,  0.44, 0.70,  0.56, 0.70,  0.43, 0.93,  0.57, 0.93,
    ]),
  },
  {
    id: 'leaning',
    name: 'Leaning',
    tag: 'Confident',
    hint: 'Shoulder against wall, hip out',
    pose: pose([
      0.46, 0.16,  0.44, 0.15,  0.48, 0.15,  0.42, 0.16,  0.50, 0.16,
      0.40, 0.24,  0.54, 0.24,  0.37, 0.36,  0.57, 0.36,  0.36, 0.48,  0.60, 0.48,
      0.43, 0.50,  0.55, 0.50,  0.42, 0.70,  0.58, 0.72,  0.40, 0.92,  0.62, 0.94,
    ]),
  },
  {
    id: 'walking_shot',
    name: 'Walking Shot',
    tag: 'Dynamic',
    hint: 'Step forward, swing arm',
    pose: pose([
      0.50, 0.14,  0.48, 0.13,  0.52, 0.13,  0.46, 0.14,  0.54, 0.14,
      0.43, 0.22,  0.57, 0.22,  0.36, 0.30,  0.64, 0.34,  0.32, 0.44,  0.66, 0.48,
      0.46, 0.48,  0.56, 0.48,  0.40, 0.66,  0.60, 0.70,  0.36, 0.90,  0.64, 0.92,
    ]),
  },
  {
    id: 'sitting_cafe',
    name: 'Sitting Cafe',
    tag: 'Relaxed',
    hint: 'Lean on elbow, soft smile',
    pose: pose([
      0.50, 0.22,  0.48, 0.21,  0.52, 0.21,  0.46, 0.22,  0.54, 0.22,
      0.43, 0.30,  0.57, 0.30,  0.38, 0.42,  0.62, 0.42,  0.40, 0.28,  0.64, 0.55,
      0.45, 0.58,  0.55, 0.58,  0.40, 0.76,  0.60, 0.76,  0.30, 0.88,  0.70, 0.88,
    ]),
  },
  {
    id: 'back_shot',
    name: 'Back Shot',
    tag: 'Scenic',
    hint: 'Face away, look over shoulder',
    pose: pose([
      0.50, 0.16,  0.49, 0.15,  0.51, 0.15,  0.47, 0.16,  0.53, 0.16,
      0.44, 0.24,  0.56, 0.24,  0.42, 0.36,  0.58, 0.36,  0.40, 0.48,  0.60, 0.48,
      0.46, 0.50,  0.54, 0.50,  0.45, 0.70,  0.55, 0.70,  0.45, 0.93,  0.55, 0.93,
    ]),
  },
  {
    id: 'hand_on_chin',
    name: 'Hand on Chin',
    tag: 'Thoughtful',
    hint: 'Gentle hand to jawline',
    pose: pose([
      0.50, 0.14,  0.48, 0.13,  0.52, 0.13,  0.46, 0.14,  0.54, 0.14,
      0.43, 0.22,  0.57, 0.22,  0.40, 0.26,  0.60, 0.34,  0.48, 0.18,  0.64, 0.46,
      0.45, 0.48,  0.55, 0.48,  0.44, 0.68,  0.56, 0.68,  0.44, 0.92,  0.56, 0.92,
    ]),
  },
  {
    id: 'hand_through_hair',
    name: 'Hand Through Hair',
    tag: 'Editorial',
    hint: 'Sweep hair, elbow up',
    pose: pose([
      0.50, 0.16,  0.48, 0.15,  0.52, 0.15,  0.46, 0.16,  0.54, 0.16,
      0.43, 0.24,  0.57, 0.24,  0.36, 0.20,  0.60, 0.36,  0.46, 0.10,  0.62, 0.48,
      0.45, 0.50,  0.55, 0.50,  0.44, 0.70,  0.56, 0.70,  0.44, 0.93,  0.56, 0.93,
    ]),
  },
  {
    id: 'power_pose',
    name: 'Power Pose',
    tag: 'Bold',
    hint: 'Hands on hips, chin up',
    pose: pose([
      0.50, 0.12,  0.48, 0.11,  0.52, 0.11,  0.46, 0.12,  0.54, 0.12,
      0.42, 0.22,  0.58, 0.22,  0.34, 0.32,  0.66, 0.32,  0.40, 0.46,  0.60, 0.46,
      0.44, 0.48,  0.56, 0.48,  0.43, 0.70,  0.57, 0.70,  0.42, 0.93,  0.58, 0.93,
    ]),
  },
];

export function getTemplateById(id: string): PoseTemplate {
  return POSE_TEMPLATES.find(p => p.id === id) ?? POSE_TEMPLATES[0];
}
