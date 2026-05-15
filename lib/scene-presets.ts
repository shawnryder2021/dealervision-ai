/**
 * Vehicle scene / location presets.
 * Each entry describes exactly where the car is placed in the image —
 * fed into buildPrompt() to produce clean, photorealistic automotive shots.
 */

export interface ScenePreset {
  id: string;
  label: string;
  emoji: string;
  category: "Premium Showroom" | "Studio" | "Urban" | "Nature" | "Lifestyle" | "Local";
  description: string; // shown in UI
  /**
   * Detailed photography-direction language injected into the prompt.
   * Written to get the best results from image-generation models.
   */
  promptBlock: string;
}

export const SCENE_PRESETS: ScenePreset[] = [
  // ── Premium Showroom ────────────────────────────────────────────────────────
  // Curated, branded showroom environments tuned for premium, predictable results.
  {
    id: "showroom-urban-luxury",
    label: "Urban Luxury",
    emoji: "🏙️",
    category: "Premium Showroom",
    description: "Rooftop infinity-glass showroom, dusk skyline",
    promptBlock:
      "Inside a private rooftop showroom with floor-to-ceiling infinity glass walls overlooking a modern city skyline at blue-hour dusk. Polished black mirror-finish floor reflects the vehicle. Recessed warm-white LED cove lighting along the ceiling. The skyline glitters with thousands of building lights, slightly bokeh-blurred. Vehicle is the clear hero, lit by soft cinematic overhead key light and warm rim lights from rear corners. Aspirational, ultra-premium automotive editorial photography.",
  },
  {
    id: "showroom-classic-heritage",
    label: "Classic Heritage",
    emoji: "🖼️",
    category: "Premium Showroom",
    description: "Warm walnut floor, gallery walls with marque prints",
    promptBlock:
      "Inside a heritage marque gallery showroom with warm dark walnut hardwood floors and cream gallery walls hung with framed black-and-white motorsport heritage prints. Brass accent lighting from picture lights along the walls. Vehicle is placed center-stage on the wood floor under a single soft overhead key light. Polished floor shows a faint reflection. Quiet, museum-like atmosphere. Refined, timeless automotive photography.",
  },
  {
    id: "showroom-tech-innovation",
    label: "Tech Innovation Hub",
    emoji: "💎",
    category: "Premium Showroom",
    description: "White lab showroom, ambient blue LED accents",
    promptBlock:
      "Inside a futuristic tech-forward showroom with pure white seamless walls and a satin-finish white floor. Ambient cool-blue LED strip lighting traces the floor-to-wall seam and the ceiling perimeter, casting a subtle blue accent glow. Crisp clean overhead lighting from a grid of recessed daylight-balanced panels. Vehicle is the clear hero, with a faint blue rim light catching the rear quarter. Hyper-clean, modern, innovative automotive photography.",
  },
  {
    id: "showroom-nova-arena",
    label: "Nova Arena",
    emoji: "🎯",
    category: "Premium Showroom",
    description: "Black mirror stage with overhead spotlight ring",
    promptBlock:
      "Inside a black-walled performance showroom with a polished black mirror floor that perfectly reflects the vehicle's underside and lower panels. A circular ring of overhead theatrical spotlights aimed inward casts dramatic crossed beams onto the vehicle. Subtle smoke-haze in the air adds depth to the light beams. Pitch-black background. Single-vehicle stage presentation. High-drama, performance-focused automotive photography.",
  },
  {
    id: "showroom-elise-gallery",
    label: "Elise Gallery",
    emoji: "🏛️",
    category: "Premium Showroom",
    description: "Concrete gallery with skylight, museum lighting",
    promptBlock:
      "Inside a minimalist concrete gallery space with a polished light-grey concrete floor and matte cream walls. A linear skylight overhead floods the scene with soft, even diffuse daylight. Museum-style track lighting provides subtle accent lights on the vehicle. The space feels expansive and quiet. Vehicle is positioned dead-center, beautifully lit, with a faint shadow grounding it. Architectural, sophisticated, art-gallery automotive photography.",
  },
  {
    id: "showroom-origin-loft",
    label: "Origin Loft",
    emoji: "🧱",
    category: "Premium Showroom",
    description: "Industrial loft, exposed brick, factory windows",
    promptBlock:
      "Inside a converted industrial loft showroom. Exposed red brick walls, polished concrete floors, and tall steel-framed factory windows let in warm late-afternoon golden light from the side. Vintage Edison-bulb pendant lights hang from the high ceiling. The vehicle is positioned in the warm light pool, casting a long soft shadow. Rugged-meets-refined aesthetic. Lifestyle, urban-craft automotive photography.",
  },
  {
    id: "showroom-desert-modern",
    label: "Desert Modern",
    emoji: "🌵",
    category: "Premium Showroom",
    description: "Modernist concrete pavilion in a desert landscape",
    promptBlock:
      "Inside an open-air modernist concrete pavilion set within a stark desert landscape. Smooth poured-concrete platform, minimal architectural lines, distant red rock formations visible through the open sides. Bright high-altitude sun creates crisp hard shadows. Vehicle is placed on the concrete platform, lit by direct natural light from above and warm reflected ground bounce. Architectural-meets-natural aesthetic. Premium lifestyle automotive photography.",
  },
  {
    id: "showroom-alpine-glass",
    label: "Alpine Glass",
    emoji: "🏔️",
    category: "Premium Showroom",
    description: "Glass-walled mountain showroom, snow peaks",
    promptBlock:
      "Inside a glass-walled mountain showroom with panoramic floor-to-ceiling windows revealing snow-capped alpine peaks under a crisp blue sky. Light-stained pine floor, white walls, exposed wood-beam ceiling. Crystal-clear high-altitude daylight floods the scene from the windows. Vehicle is positioned center, perfectly lit by the cool natural light with a soft warm fill from concealed interior lighting. Aspirational, premium, mountain-luxury automotive photography.",
  },

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

  // ── Additional Urban & Location Varieties ──────────────────────────────────────
  {
    id: "upscale-neighborhood",
    label: "Upscale Neighborhood",
    emoji: "🏘️",
    category: "Lifestyle",
    description: "Tree-lined residential street with modern homes",
    promptBlock:
      "Parked on a tree-lined upscale residential street. Modern contemporary homes with manicured lawns visible on either side. Mature oak or maple trees creating dappled shade. Clean asphalt, fresh curbs, neighborhood ambiance. Soft afternoon light. Camera angle from a slight elevation showing the vehicle in its neighborhood context. Aspirational suburban lifestyle photography.",
  },
  {
    id: "luxury-shopping-district",
    label: "Luxury Shopping District",
    emoji: "🛍️",
    category: "Urban",
    description: "High-end shopping street with boutiques",
    promptBlock:
      "Parked on an upscale boutique shopping street. Modern storefronts with designer windows and tasteful lighting in the background (blurred). Polished street finishes, planters with flowers. Bright, clean, well-lit environment. Daytime lighting showing the vehicle's premium finish. 3/4 front angle at street level. Luxury automotive in sophisticated urban setting.",
  },
  {
    id: "industrial-brick",
    label: "Industrial Warehouse District",
    emoji: "🏭",
    category: "Urban",
    description: "Modern industrial brick and metal backdrop",
    promptBlock:
      "Positioned in front of a modern industrial brick warehouse or converted loft building. Raw architectural elements — exposed red brick, large arched windows, metal framework. Clean concrete ground with artistic patterns. Cool overhead lighting. The vehicle's sleek lines contrast with the industrial backdrop. Modern, edgy automotive photography.",
  },
  {
    id: "marina-waterfront",
    label: "Marina Waterfront",
    emoji: "⛵",
    category: "Lifestyle",
    description: "Yacht marina with sailboats and calm water",
    promptBlock:
      "Parked on the marina boardwalk overlooking calm waters dotted with sailboats and yachts. Luxury boats visible in the background with gentle reflections in the water. Clean wood docks and nautical finishes. Soft water-reflecting light creates sparkles. Late afternoon golden hour on the water. Premium lifestyle automotive photography.",
  },
  {
    id: "vineyard-estate",
    label: "Vineyard Estate",
    emoji: "🍇",
    category: "Lifestyle",
    description: "Winery grounds with rolling vines",
    promptBlock:
      "Parked on a winding path through a picturesque wine estate. Rolling vineyard rows visible in soft focus on both sides, mountains in the distance. Stone winery building visible as architectural element. Golden afternoon light, warm tones on the vehicle. Harvest-season ambiance. Premium lifestyle automotive in wine country setting.",
  },
  {
    id: "airport-tarmac",
    label: "Airport Tarmac",
    emoji: "✈️",
    category: "Urban",
    description: "Jet-setting lifestyle, aircraft in background",
    promptBlock:
      "Parked on clean airport tarmac with private aircraft visible in the background. Open, minimalist scene with horizon line. Clear sky, excellent visibility. Professional lighting showing the vehicle's premium finish. Shot from a low 3/4 angle emphasizing elegance and high-end lifestyle. Jet-setter, luxury travel aesthetic.",
  },
  {
    id: "mansion-driveway",
    label: "Luxury Estate Driveway",
    emoji: "🏰",
    category: "Lifestyle",
    description: "Grand entrance to high-end residential estate",
    promptBlock:
      "Parked on a circular driveway of a grand luxury estate. Modern or traditional architectural style mansion visible softly in the background. Manicured circular driveway with elegant lighting fixtures. Upscale landscaping with fountain or sculptural elements. Premium finishes and materials. Golden evening light. Exclusive, aspirational lifestyle photography.",
  },
  {
    id: "downtown-high-rise",
    label: "Downtown High-Rise Garage",
    emoji: "🏢",
    category: "Urban",
    description: "Modern downtown parking structure, urban elegance",
    promptBlock:
      "Parked in a contemporary downtown high-rise parking garage. Modern polished concrete, contemporary painted lines, sleek architectural lighting. Floor-to-floor glass windows showing city skyline and traffic below. The vehicle is spotlit by modern LED structure lighting. Urban contemporary aesthetic, premium urban lifestyle.",
  },
  {
    id: "golf-course",
    label: "Golf Course Club House",
    emoji: "⛳",
    category: "Lifestyle",
    description: "Prestigious golf club, manicured fairways",
    promptBlock:
      "Parked at the entrance of an exclusive golf club. Manicured championship fairways visible in the background with flag poles and pristine greens. Club house architecture visible softly. Perfect lawn conditions. Afternoon light catching the vehicle's details. Premium sports and lifestyle aesthetic. Exclusive country club ambiance.",
  },
  {
    id: "historic-downtown",
    label: "Historic Downtown District",
    emoji: "🏛️",
    category: "Urban",
    description: "Classical architecture, heritage district",
    promptBlock:
      "Parked on a historic district street with beautiful period architecture — classical stonework, ornate street lamps, heritage building facades. Character and nostalgia blended with modern luxury. Warm golden light from vintage-style street lighting. 3/4 front angle showing the vehicle in cultural context. Sophisticated urban heritage setting.",
  },
  {
    id: "ski-resort",
    label: "Ski Resort Base",
    emoji: "🎿",
    category: "Nature",
    description: "Alpine ski resort, snowy peaks",
    promptBlock:
      "Parked at a premium alpine ski resort base. Snow-covered mountain peaks towering in the background. Chairlifts visible ascending the slopes. Crisp winter Alpine air, pristine snow on terrain. Clear crisp light from thin mountain air. The vehicle shows full colour contrast against white snow. Adventure sports luxury lifestyle photography.",
  },

  // ── Everyday / Driver-Realistic ─────────────────────────────────────────────
  {
    id: "suburban-driveway",
    label: "Suburban Driveway",
    emoji: "🏡",
    category: "Lifestyle",
    description: "Clean residential driveway with tidy home in background",
    promptBlock:
      "Parked on a clean concrete driveway of a modern suburban home with a well-kept lawn and a tidy garage door behind. Soft late-afternoon sunlight casts a warm glow on the driveway. Family-friendly residential setting, tree-lined street visible to the sides. Approachable, everyday driver context. Natural, friendly automotive lifestyle photography.",
  },
  {
    id: "country-road",
    label: "Quiet Country Road",
    emoji: "🛣️",
    category: "Nature",
    description: "Two-lane rural road with open fields",
    promptBlock:
      "Parked on the shoulder of a quiet two-lane rural country road with open farm fields stretching to the horizon on both sides. A simple wooden fence runs along the roadside. Golden-hour warm light from a low sun. Clean tarmac with a faded yellow centerline. Peaceful, uncluttered setting. Open-road automotive lifestyle photography.",
  },
  {
    id: "cafe-parking",
    label: "Café Curbside",
    emoji: "☕",
    category: "Lifestyle",
    description: "Urban coffee shop with sidewalk seating",
    promptBlock:
      "Parked at the curb in front of a small independent coffee shop with a chalkboard sandwich sign and a few sidewalk tables. Brick storefront, large windows with warm interior lighting. Soft morning light on a clean city street. Approachable everyday urban setting — the kind of place a driver stops on the way to work. Lifestyle automotive photography.",
  },
  {
    id: "park-pathway",
    label: "City Park",
    emoji: "🌳",
    category: "Nature",
    description: "Leafy park-side parking with paths and trees",
    promptBlock:
      "Parked along a tree-lined park-side road. A mature city park stretches behind with paved walking paths, a wooden bench, and tall leafy trees casting dappled shade onto the road. Soft afternoon sunlight filters through the leaves. Calm, family-friendly urban setting. Natural lifestyle automotive photography.",
  },
  {
    id: "mall-parking",
    label: "Modern Retail Plaza",
    emoji: "🛍️",
    category: "Urban",
    description: "Clean outdoor shopping center parking lot",
    promptBlock:
      "Parked in an open outdoor shopping center parking lot. Modern retail storefronts with clean architectural facades in the background, freshly painted parking lines on smooth asphalt. Bright midday daylight, a few decorative trees in planters. Familiar, accessible suburban retail context. Clean everyday automotive photography.",
  },
];

export const SCENE_CATEGORIES: ScenePreset["category"][] = [
  "Premium Showroom",
  "Studio",
  "Urban",
  "Nature",
  "Lifestyle",
  "Local",
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
