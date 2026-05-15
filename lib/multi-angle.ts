/**
 * Multi-angle gallery generation.
 * Given a hero photo of a vehicle and a target showroom preset, fans out 8
 * parallel /api/edit-image tasks (one per angle) to produce a complete VDP
 * photo set. Each angle keeps the same vehicle in the same showroom.
 */

import { getScenePreset } from "@/lib/scene-presets";

export interface AnglePrompt {
  /** Stable id stored on the generated_assets row in `gallery_angle`. */
  id: string;
  /** UI label shown in the angle grid. */
  label: string;
  /** Photography direction injected into the edit prompt. */
  promptBlock: string;
}

/** The 8 angles produced per gallery, in display order. */
export const ANGLE_PROMPTS: AnglePrompt[] = [
  {
    id: "front-3-4",
    label: "Front ¾",
    promptBlock:
      "Show the vehicle from a front 3/4 angle, with the hood and grille prominent. Camera at headlight height, slightly to the driver side. Front and driver-side panels both clearly visible.",
  },
  {
    id: "rear-3-4",
    label: "Rear ¾",
    promptBlock:
      "Show the vehicle from a rear 3/4 angle, with the taillights and rear quarter panel prominent. Camera at taillight height, slightly to the driver side. Rear and driver-side panels both clearly visible.",
  },
  {
    id: "front",
    label: "Front",
    promptBlock:
      "Show the vehicle from a direct front view, head-on, dead-center, perfectly symmetrical composition. The full grille, headlights, and front bumper are visible.",
  },
  {
    id: "rear",
    label: "Rear",
    promptBlock:
      "Show the vehicle from a direct rear view, head-on, with the rear badge centered. Full rear bumper and both taillights visible.",
  },
  {
    id: "side-driver",
    label: "Driver-side profile",
    promptBlock:
      "Show the vehicle in a driver-side profile, full side view, camera perpendicular to the car. Both wheels are equally spaced and fully visible in the frame.",
  },
  {
    id: "side-passenger",
    label: "Passenger-side profile",
    promptBlock:
      "Show the vehicle in a passenger-side profile, full side view, camera perpendicular to the car. Both wheels are equally spaced and fully visible in the frame.",
  },
  {
    id: "wheel-closeup",
    label: "Wheel close-up",
    promptBlock:
      "Show a close-up of a single front wheel filling most of the frame. Brake caliper, tire sidewall, and rim spokes are sharply detailed. The front fender arch is visible above.",
  },
  {
    id: "badge-closeup",
    label: "Badge close-up",
    promptBlock:
      "Show a close-up of the manufacturer badge or emblem on the vehicle, with surrounding panel detail and paint texture visible. The badge fills roughly 1/3 of the frame.",
  },
];

interface BuildPromptArgs {
  angle: AnglePrompt;
  showroomPresetId?: string;
}

/** Build the full edit prompt for a given angle + showroom backdrop. */
export function buildAnglePrompt({ angle, showroomPresetId }: BuildPromptArgs): string {
  const lines: string[] = [
    `Re-render the vehicle from the source image at a new camera angle: ${angle.promptBlock}`,
    "Preserve the exact vehicle from the source image — same color, trim, wheels, badging, and all distinguishing features.",
    "Photorealistic, professional automotive photography quality. Clean composition with the vehicle as the hero.",
  ];

  if (showroomPresetId) {
    const preset = getScenePreset(showroomPresetId);
    if (preset) {
      lines.push(`SCENE/LOCATION: ${preset.promptBlock}`);
    }
  }

  return lines.join(" ");
}

export interface AngleJob {
  angle: AnglePrompt;
  taskId: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  imageUrl: string | null;
  error: string | null;
}

export function makeEmptyAngleJobs(): AngleJob[] {
  return ANGLE_PROMPTS.map((angle) => ({
    angle,
    taskId: null,
    status: "pending",
    imageUrl: null,
    error: null,
  }));
}
