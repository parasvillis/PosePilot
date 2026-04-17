// MoveNet 17-keypoint indices
export const KP = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
} as const;

export const KP_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
];

// Skeleton edges for drawing the stick figure
export const SKELETON: [number, number][] = [
  [KP.LEFT_SHOULDER, KP.RIGHT_SHOULDER],
  [KP.LEFT_SHOULDER, KP.LEFT_ELBOW],
  [KP.LEFT_ELBOW, KP.LEFT_WRIST],
  [KP.RIGHT_SHOULDER, KP.RIGHT_ELBOW],
  [KP.RIGHT_ELBOW, KP.RIGHT_WRIST],
  [KP.LEFT_SHOULDER, KP.LEFT_HIP],
  [KP.RIGHT_SHOULDER, KP.RIGHT_HIP],
  [KP.LEFT_HIP, KP.RIGHT_HIP],
  [KP.LEFT_HIP, KP.LEFT_KNEE],
  [KP.LEFT_KNEE, KP.LEFT_ANKLE],
  [KP.RIGHT_HIP, KP.RIGHT_KNEE],
  [KP.RIGHT_KNEE, KP.RIGHT_ANKLE],
];

// Face polyline (for ghost head)
export const FACE_EDGES: [number, number][] = [
  [KP.LEFT_EAR, KP.LEFT_EYE],
  [KP.LEFT_EYE, KP.NOSE],
  [KP.NOSE, KP.RIGHT_EYE],
  [KP.RIGHT_EYE, KP.RIGHT_EAR],
];

export type Keypoint = { x: number; y: number; score: number };
export type Pose = { keypoints: Keypoint[] };

// Angle triplets (joint, p1, p2) used for angle-based matching.
// Angle at 'joint' formed by vectors joint->p1 and joint->p2.
export const ANGLE_JOINTS: { name: string; joint: number; p1: number; p2: number; weight: number }[] = [
  { name: 'left_elbow', joint: KP.LEFT_ELBOW, p1: KP.LEFT_SHOULDER, p2: KP.LEFT_WRIST, weight: 1.0 },
  { name: 'right_elbow', joint: KP.RIGHT_ELBOW, p1: KP.RIGHT_SHOULDER, p2: KP.RIGHT_WRIST, weight: 1.0 },
  { name: 'left_shoulder', joint: KP.LEFT_SHOULDER, p1: KP.LEFT_ELBOW, p2: KP.LEFT_HIP, weight: 1.2 },
  { name: 'right_shoulder', joint: KP.RIGHT_SHOULDER, p1: KP.RIGHT_ELBOW, p2: KP.RIGHT_HIP, weight: 1.2 },
  { name: 'left_hip', joint: KP.LEFT_HIP, p1: KP.LEFT_SHOULDER, p2: KP.LEFT_KNEE, weight: 1.0 },
  { name: 'right_hip', joint: KP.RIGHT_HIP, p1: KP.RIGHT_SHOULDER, p2: KP.RIGHT_KNEE, weight: 1.0 },
  { name: 'left_knee', joint: KP.LEFT_KNEE, p1: KP.LEFT_HIP, p2: KP.LEFT_ANKLE, weight: 0.8 },
  { name: 'right_knee', joint: KP.RIGHT_KNEE, p1: KP.RIGHT_HIP, p2: KP.RIGHT_ANKLE, weight: 0.8 },
  { name: 'neck', joint: KP.NOSE, p1: KP.LEFT_SHOULDER, p2: KP.RIGHT_SHOULDER, weight: 0.6 },
];
