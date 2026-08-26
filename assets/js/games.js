export const categories = [
  { id: "strategy-decisions", label: "Strategy & Decisions" },
  { id: "simple-predictions", label: "Simple Predictions" },
  { id: "classic-casino", label: "Classic Casino" },
  { id: "casual-visual", label: "Casual & Visual" },
  { id: "suspense-progression", label: "Suspense & Progression" }
];

export const paceOptions = [
  { id: "relaxed", label: "Relaxed" },
  { id: "balanced", label: "Balanced" },
  { id: "fast", label: "Fast" }
];

const gameSeed = [
  ["mines", "Mines", "strategy-decisions", "balanced", "Reveal the tiles and decide how far to go.", "◇", "#63ef9b"],
  ["crash", "Crash", "suspense-progression", "fast", "Watch the multiplier rise and choose your moment.", "↗", "#ff5c9a"],
  ["plinko", "Plinko", "casual-visual", "fast", "Drop the ball and watch where it lands.", "●", "#ffd43b"],
  ["dice", "Dice", "simple-predictions", "fast", "Choose a range, then roll the dice.", "⚄", "#59b7ff"],
  ["blackjack", "Blackjack", "classic-casino", "balanced", "Build a hand and make each decision count.", "21", "#f4eee9"],
  ["limbo", "Limbo", "suspense-progression", "fast", "Set a target and see where the round lands.", "∞", "#ad78ff"],
  ["roulette", "Roulette", "classic-casino", "balanced", "Choose your position before the wheel turns.", "◎", "#ff5c9a"],
  ["dragon-tower", "Dragon Tower", "suspense-progression", "balanced", "Climb one decision at a time.", "△", "#63ef9b"],
  ["wheel", "Wheel", "casual-visual", "balanced", "Pick a segment and set the wheel in motion.", "✦", "#ffd43b"],
  ["hilo", "HiLo", "strategy-decisions", "balanced", "Decide whether the next card goes higher or lower.", "↕", "#59b7ff"],
  ["keno", "Keno", "simple-predictions", "relaxed", "Choose your numbers and watch the board reveal.", "#", "#ad78ff"],
  ["flip", "Flip", "simple-predictions", "fast", "Choose a side before the coin turns.", "◐", "#ffd43b"],
  ["chicken", "Chicken", "casual-visual", "balanced", "Move forward and decide when to stop.", "→", "#ffad1f"],
  ["moles", "Moles", "casual-visual", "fast", "React quickly as targets appear.", "•", "#63ef9b"],
  ["snake", "Snake", "casual-visual", "relaxed", "Guide the path and keep it growing.", "≈", "#59b7ff"]
];

export const featuredGameIds = ["mines", "crash", "plinko", "dice", "blackjack", "limbo", "roulette", "dragon-tower", "wheel", "hilo"];
export const previewGameIds = ["plinko", "crash", "mines"];

export const activeGames = gameSeed.map(([id, name, category, pace, description, glyph, accent]) => ({
  id,
  name,
  category,
  pace,
  description,
  glyph,
  accent,
  featured: featuredGameIds.includes(id),
  previewEnabled: previewGameIds.includes(id),
  status: id === "moles" ? "New" : null,
  image: `assets/images/games/${id}.webp`,
  launchUrl: "#"
}));

export const previewConfig = [
  {
    id: "plinko",
    category: "Casual & Visual",
    description: "Drop. Bounce. Discover where it lands.",
    poster: "assets/media/previews/plinko-poster.svg",
    video: { webm: "assets/media/previews/plinko.webm", mp4: "assets/media/previews/plinko.mp4" }
  },
  {
    id: "crash",
    category: "Suspense & Progression",
    description: "Watch the multiplier rise. Choose your moment.",
    poster: "assets/media/previews/crash-poster.svg",
    video: { webm: "assets/media/previews/crash.webm", mp4: "assets/media/previews/crash.mp4" }
  },
  {
    id: "mines",
    category: "Strategy & Decisions",
    description: "Reveal the tiles. Decide how far to go.",
    poster: "assets/media/previews/mines-poster.svg",
    video: { webm: "assets/media/previews/mines.webm", mp4: "assets/media/previews/mines.mp4" }
  }
];

export const rewardConfig = {
  resetLabel: "2d 13h",
  milestones: [
    { turnover: 50, reward: 2 },
    { turnover: 100, reward: 5 },
    { turnover: 250, reward: 15 },
    { turnover: 500, reward: 35 }
  ]
};

export const memberStates = {
  guest: { label: "Guest", member: false, progress: 0, recentlyPlayed: [], recommendationIds: [], eligible: false },
  new: { label: "New member", member: true, progress: 0, recentlyPlayed: [], recommendationIds: ["plinko", "dice", "blackjack"], eligible: true },
  active: { label: "Active member", member: true, progress: 62, recentlyPlayed: ["mines"], recommendationIds: ["wheel", "hilo", "crash"], eligible: true },
  returning: { label: "Returning member", member: true, progress: 24, recentlyPlayed: ["plinko", "blackjack"], recommendationIds: ["wheel", "roulette"], eligible: true },
  incomplete: { label: "Incomplete progress", member: true, progress: 41, recentlyPlayed: ["dice"], recommendationIds: ["hilo", "keno"], eligible: true },
  near: { label: "Near milestone", member: true, progress: 92, recentlyPlayed: ["crash"], recommendationIds: ["limbo", "dragon-tower"], eligible: true },
  claimable: { label: "Claimable reward", member: true, progress: 100, recentlyPlayed: ["mines"], recommendationIds: ["wheel", "plinko"], eligible: true, claimable: true },
  recent: { label: "Recently played", member: true, progress: 62, recentlyPlayed: ["mines", "plinko", "dice"], recommendationIds: ["wheel"], eligible: true },
  suppressed: { label: "Suppressed / ineligible", member: true, progress: 0, recentlyPlayed: [], recommendationIds: [], eligible: false, suppressed: true }
};

export function getGame(id) {
  return activeGames.find((game) => game.id === id);
}

export function getCategoryLabel(id) {
  return categories.find((category) => category.id === id)?.label || id;
}

export function getPaceLabel(id) {
  return paceOptions.find((pace) => pace.id === id)?.label || id;
}