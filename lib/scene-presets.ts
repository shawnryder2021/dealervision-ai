/**
 * Vehicle scene / location presets.
 * Each entry describes exactly where the car is placed in the image —
 * fed into buildPrompt() to produce clean, photorealistic automotive shots.
 */

export interface ScenePreset {
  id: string;
  label: string;
  emoji: string;
  category: "Studio" | "Urban" | "Nature" | "Lifestyle" | "Local";
  description: string; // shown in UI
  /**
   * Detailed photography-direction language injected into the prompt.
   * Written to get the best results from image-generation models.
   */
  promptBlock: string;
}

export const SCENE_PRESETS: ScenePreset[] = [
  // ── Studio ──────────────────────────────────────────────────────────────────
  {
    id: "studio-white",
    label: "White Studio",
    emoji: "⚪",
    category: "Studio",
    description: "Clean infinite white background, professional lighting",
    promptBlock:
      "Set against a pure white seamless infinity cove studio background. Three-point studio lighting: a large softbox key light from 45° camera-left, fill light from camera-right, and a rim light behind the vehicle catching the roofline and rear panels. Subtle shadow beneath the vehicle. Glossy studio floor with a faint soft reflection of the underside of the car. Crisp, clean, commercial automotive photography.",
  },
  {
    id: "studio-dark",
    label: "Dark Drama",
    emoji: "⚫",
    category: "Studio",
    description: "Moody black studio, dramatic spot lighting",
    promptBlock:
      "Dark charcoal/black studio environment. Dramatic cinematic lighting: strong rim/edge lights from both rear corners that trace the vehicle's silhouette and catch chrome trim and door edges. A single key spot from overhead-front casts a dramatic shadow. Deep reflective dark floor shows a mirror reflection of the underside. Smoke/haze in background for depth. Luxury automotive editorial photography.",
  },
  {
    id: "studio-gradient",
    label: "Gradient Backdrop",
    emoji: "🎨",
    category: "Studio",
    description: "Smooth studio gradient, versatile for any brand color",
    promptBlock:
      "Smooth studio gradient backdrop fading from charcoal grey at the top to light silver at the horizon line. Softbox lighting from both sides with a gentle overhead fill. Clean studio floor with a soft blurred reflection beneath the vehicle. Professional 3/4 front angle. Modern automotive commercial photography.",
  },

  // ── Urban ───────────────────────────────────────────────────────────────────
  {
    id: "city-golden-hour",
    label: "City — Golden Hour",
    emoji: "🌆",
    category: "Urban",
    description: "Downtown street at warm sunset",
    promptBlock:
      "Parked on a wide downtown boulevard at golden hour, 60 minutes before sunset. Warm amber and orange light rakes across the side panels at a low angle, creating long soft shadows. Glass-fronted office towers in the background, slightly blurred (f/2.8 bokeh). Smooth asphalt with warm light reflections. Shot from a low 3/4 front angle, slightly above hood height. Cinematic automotive lifestyle photography.",
  },
  {
    id: "city-rooftop",
    label: "Rooftop at Dusk",
    emoji: "🌇",
    category: "Urban",
    description: "Rooftop parking deck with city skyline",
    promptBlock:
      "Positioned on an open rooftop parking deck at blue-hour dusk. The city skyline glows with thousands of building lights and streaks of traffic on highways below, all softly blurred. Sky transitioning from deep blue to purple. Overhead LED parking lights create clean top lighting. The rooftop surface shows faint light reflections. Dramatic urban setting, wide-angle perspective at car door height.",
  },
  {
    id: "city-night-rain",
    label: "Rainy Night Street",
    emoji: "🌧️",
    category: "Urban",
    description: "Wet city street at night with neon reflections",
    promptBlock:
      "Rain-soaked city street at night. The wet asphalt creates vivid neon reflections — reds, blues, and yellows from storefronts and traffic lights mirror off the road surface. The vehicle's paint shows wet-sheen specular highlights. Bokeh city lights in the background. Misty atmosphere from light rain still falling. Low camera angle, dynamic 3/4 front shot. Cinematic, moody automotive photography.",
  },
  {
    id: "parking-garage",
    label: "Parking Garage",
    emoji: "🏗️",
    category: "Urban",
    description: "Architectural concrete structure, cinematic feel",
    promptBlock:
      "Multi-level concrete parking structure — raw architectural setting with exposed beams, yellow painted curbs, and evenly-spaced fluorescent strip lighting overhead. The vehicle is alone on a clean, empty level. Long exposure-style light trails visible in the background. Cool blue-grey tones with warm incandescent highlights on the car. Low perspective, wide-angle shot for dramatic scale.",
  },

  // ── Nature ──────────────────────────────────────────────────────────────────
  {
    id: "mountain-summit",
    label: "Mountain Summit",
    emoji: "⛰️",
    category: "Nature",
    description: "Dramatic mountain peaks, clear crisp sky",
    promptBlock:
      "Parked at a mountain overlook with a sweeping vista of jagged snow-capped peaks behind. The sky is electric blue with a few dramatic white cumulus clouds. Rocky terrain in the foreground with sparse alpine vegetation. The vehicle faces 3/4 toward camera from a low angle, making it appear powerful against the peaks. Natural sunlight from a high angle, crisp shadows. Adventure automotive photography.",
  },
  {
    id: "desert-highway",
    label: "Desert Highway",
    emoji: "🌵",
    category: "Nature",
    description: "Open Southwest desert, dramatic sky and road",
    promptBlock:
      "Stopped on a long straight desert highway stretching to the horizon through a red sandstone landscape. Heat shimmer visible on the asphalt ahead. Dramatic cloudscape with dark storm cells building in the distance. Warm golden-red desert light from camera-right. Sagebrush and joshua trees in the middle distance. Shot from a low dynamic angle behind and to the side. Southwest USA road-trip aesthetic.",
  },
  {
    id: "coastal-cliff",
    label: "Coastal Cliffside",
    emoji: "🌊",
    category: "Nature",
    description: "Pacific Coast Highway style, ocean backdrop",
    promptBlock:
      "Parked on a coastal cliff overlooking a dramatic rocky shoreline. Deep blue-green Pacific Ocean fills the horizon, white surf breaking on rocks far below. Late afternoon sunlight from a low westward angle creates warm sidelighting. Sea breeze atmosphere with subtle lens haze. Winding coastal road visible in the background. Camera angle at hood height, wide-angle 3/4 front shot. Pacific Coast Highway lifestyle photography.",
  },
  {
    id: "forest-road",
    label: "Forest Road",
    emoji: "🌲",
    category: "Nature",
    description: "Dappled light through tall trees",
    promptBlock:
      "Parked on a winding two-lane road through a dense old-growth forest. Tall Douglas fir or redwood trees form a cathedral canopy overhead. Dappled golden sunlight filters through the leaves, creating mottled light patterns on the vehicle's hood and roof. Ferns and undergrowth line the road edges. Soft morning mist visible between the trees. Low angle shot from a slight elevation, 3/4 front. Pacific Northwest or Appalachian forest feel.",
  },
  {
    id: "snow-mountain",
    label: "Snowy Mountain Pass",
    emoji: "❄️",
    category: "Nature",
    description: "Winter mountain pass, crisp snow and ice",
    promptBlock:
      "Pulled over at a mountain pass surrounded by deep snow. Pine trees laden with fresh snow line the road. The vehicle's paint contrasts against the white snowpack. Overcast winter sky with soft diffused light — no harsh shadows, even illumination ideal for showing colour. Tyre tracks visible in packed snow. Mountains visible through gaps in the trees. Winter automotive photography, crisp and clean.",
  },
  {
    id: "rolling-hills",
    label: "Green Rolling Hills",
    emoji: "🌄",
    category: "Nature",
    description: "Countryside meadows, golden light",
    promptBlock:
      "Parked on a country lane with sweeping green rolling hills in the background. Late afternoon golden-hour light casts long warm shadows across the grass. Wildflowers dot the roadside. The sky is wide and dramatic with layered clouds catching warm sunset tones. Low camera angle, slightly off-axis 3/4 front shot. European countryside or California wine country aesthetic. Aspirational lifestyle automotive photography.",
  },

  // ── Lifestyle ────────────────────────────────────────────────────────────────
  {
    id: "beach-boardwalk",
    label: "Beach Boardwalk",
    emoji: "🏖️",
    category: "Lifestyle",
    description: "Sunny beachside, laid-back lifestyle",
    promptBlock:
      "Parked on a wide beach boardwalk promenade with the ocean in the background. White sand beach visible to one side, palm trees lining the walk. Bright midday summer sun, clear blue sky. The vehicle's paint shows full saturation in the direct sunlight. People and beach activity softly blurred in the background. Camera at a slightly elevated 3/4 angle. California beach town or Florida coastal aesthetic. Bright, vibrant, aspirational lifestyle photography.",
  },
  {
    id: "canyon-road",
    label: "Canyon Switchbacks",
    emoji: "🏔️",
    category: "Lifestyle",
    description: "Winding mountain canyon road",
    promptBlock:
      "Parked on the edge of a dramatic winding canyon road carved into red-orange rock walls. Switchbacks visible winding up the canyon face in the background. Late afternoon light casts warm amber tones on the rock and vehicle. Canyon depth visible below. Shot from a helicopter/elevated angle looking down at 45°, with the winding road as a compositional element. Adventure driving lifestyle photography.",
  },
  {
    id: "lake-reflection",
    label: "Lake Reflection",
    emoji: "🏞️",
    category: "Lifestyle",
    description: "Still lake with perfect mirror reflection",
    promptBlock:
      "Parked on a narrow dirt path at the edge of a perfectly still mountain lake at dawn. The entire vehicle is reflected in the glassy water surface, mountains and sky mirrored below. Soft pinkish-purple dawn sky. Morning mist drifts across the water surface. Absolute stillness. Camera angle low to the ground (nearly water level) to maximize the reflection effect. Ethereal, serene automotive photography.",
  },
  {
    id: "sunrise-highway",
    label: "Sunrise Highway",
    emoji: "🌅",
    category: "Lifestyle",
    description: "Open road at sunrise, wide open skies",
    promptBlock:
      "Positioned on a wide straight highway at sunrise, facing directly into the rising sun on the horizon. The sky is an explosion of orange, pink, and gold fading to deep blue above. The wet highway surface reflects the sunrise colours. Long shadows stretch directly behind the vehicle. Shot from a very low angle directly in front, making the car the hero against the sunrise. Epic, aspirational, freedom-of-the-road automotive photography.",
  },
  {
    id: "racetrack",
    label: "Racetrack / Track Day",
    emoji: "🏁",
    category: "Lifestyle",
    description: "Circuit or track setting, performance vibe",
    promptBlock:
      "Staged on the straight of a professional motorsport circuit. Tyre barriers and armco in the background, pit lane lane entrance visible. Camera panning effect (slight motion blur on background, car sharp) suggesting speed. Low camera angle showing circuit markings. Overcast diffused light ideal for showing body lines. Track day atmosphere. Performance automotive photography, dynamic and exciting.",
  },

  // ── Local / Landmark ─────────────────────────────────────────────────────────
  {
    id: "local-landmark",
    label: "Local Landmark",
    emoji: "📍",
    category: "Local",
    description: "Incorporate your dealership's local landmarks",
    promptBlock:
      "", // filled dynamically from dealership.local_context.landmarks
  },
  {
    id: "dealership-lot",
    label: "Dealership Lot",
    emoji: "🏢",
    category: "Local",
    description: "Professional dealership forecourt photography",
    promptBlock:
      "Parked on a clean, freshly-detailed dealership forecourt. The dealer's showroom building visible in the soft background (slightly blurred). Perfect lot-prep condition — tyres dressed, paint polished, windows gleaming. Midday sunlight from a slight overhead angle showing the vehicle's full colour depth. Shot from a 3/4 front angle at hood height. Professional new-car delivery photography.",
  },
];

/** Returns the scene preset by ID, or undefined if not found */
export function getScenePreset(id: string): ScenePreset | undefined {
  return SCENE_PRESETS.find((s) => s.id === id);
}

/**
 * Builds the scene/location block to inject into a prompt.
 * If the preset is "local-landmark", injects the dealership's landmark text instead.
 */
export function buildSceneBlock(
  sceneId: string | undefined,
  landmarkText?: string
): string {
  if (!sceneId) return "";

  if (sceneId === "local-landmark") {
    if (!landmarkText) return "";
    return ` SCENE/LOCATION: Position the vehicle with the following local landmark or environment as the backdrop: "${landmarkText}". Make the landmark recognizable but ensure the vehicle is the clear hero of the image. Blend naturally with the local environment and lighting conditions.`;
  }

  const preset = getScenePreset(sceneId);
  if (!preset) return "";

  return ` SCENE/LOCATION: ${preset.promptBlock}`;
}

/** Category order for display */
export const SCENE_CATEGORIES: ScenePreset["category"][] = [
  "Studio",
  "Urban",
  "Nature",
  "Lifestyle",
  "Local",
];
