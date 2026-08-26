import { activeGames, categories, paceOptions, getCategoryLabel } from "./games.js";

export function createFinder({ openModal, closeModal, openGame, track }) {
  let chosenCategory = null;

  function start() {
    chosenCategory = null;
    track("finder_started");
    showCategoryQuestion();
  }

  function progress(step) {
    return `<div class="finder-progress" aria-label="Step ${step} of 2"><i class="active"></i><i class="${step === 2 ? "active" : ""}"></i></div>`;
  }

  function showCategoryQuestion() {
    openModal("Help Me Choose", `
      ${progress(1)}
      <h3>What type of experience do you want?</h3>
      <p>Choose the style that sounds right for this session.</p>
      <div class="option-grid">
        ${categories.map((category) => `<button class="option-button" data-finder-category="${category.id}">${category.label}</button>`).join("")}
      </div>
      <p class="prototype-note">Finder activity does not generate qualifying reward turnover.</p>
    `);
    document.querySelectorAll("[data-finder-category]").forEach((button) => button.addEventListener("click", () => {
      chosenCategory = button.dataset.finderCategory;
      showPaceQuestion();
    }));
  }

  function showPaceQuestion() {
    openModal("Help Me Choose", `
      ${progress(2)}
      <h3>What pace do you prefer?</h3>
      <p>How quickly would you like each round to move?</p>
      <div class="option-grid">
        ${paceOptions.map((pace) => `<button class="option-button" data-finder-pace="${pace.id}">${pace.label}</button>`).join("")}
      </div>
      <button class="text-button" id="finder-back">Back</button>
    `);
    document.querySelector("#finder-back").addEventListener("click", showCategoryQuestion);
    document.querySelectorAll("[data-finder-pace]").forEach((button) => button.addEventListener("click", () => showMatch(button.dataset.finderPace)));
  }

  function showMatch(pace) {
    const exact = activeGames.filter((game) => game.category === chosenCategory && game.pace === pace);
    const categoryMatches = activeGames.filter((game) => game.category === chosenCategory && game.pace !== pace);
    const paceMatches = activeGames.filter((game) => game.pace === pace && game.category !== chosenCategory);
    const matches = [...exact, ...categoryMatches, ...paceMatches, ...activeGames].filter((game, index, list) => list.findIndex((item) => item.id === game.id) === index).slice(0, 3);
    const [primary, ...alternatives] = matches;
    track("finder_completed", { category: chosenCategory, pace, game_id: primary.id });
    track("recommendation_viewed", { source: "finder", game_id: primary.id });
    openModal("Your Match", `
      <div class="match-primary">
        <span class="kicker">Best fit</span>
        <h3>${primary.name}</h3>
        <p>${primary.description}</p>
        <p><strong>Why this match:</strong> It combines ${getCategoryLabel(chosenCategory).toLowerCase()} with a ${pace} pace.</p>
        <button class="button button-primary" data-match-play="${primary.id}">Play Game</button>
      </div>
      <h3>Also worth a look</h3>
      <div class="match-alternatives">
        ${alternatives.map((game) => `<button class="match-alt option-button" data-match-play="${game.id}"><strong>${game.name}</strong><br><small>${getCategoryLabel(game.category)}</small></button>`).join("")}
      </div>
      <div class="reward-actions">
        <button class="button button-secondary" id="finder-browse">Browse All Games</button>
        <button class="text-button" id="finder-restart">Restart Finder</button>
      </div>
      <p class="prototype-note">Recommendations draw from every active game. Finder use does not generate qualifying turnover.</p>
    `);
    document.querySelectorAll("[data-match-play]").forEach((button) => button.addEventListener("click", () => openGame(button.dataset.matchPlay, true)));
    document.querySelector("#finder-browse").addEventListener("click", () => {
      closeModal();
      document.querySelector("#catalogue").scrollIntoView({ behavior: "smooth" });
    });
    document.querySelector("#finder-restart").addEventListener("click", start);
  }

  return { start };
}