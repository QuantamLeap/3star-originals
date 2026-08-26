import { activeGames, categories, featuredGameIds, paceOptions, memberStates, getCategoryLabel, getPaceLabel, getGame } from "./games.js";
import { initPreviews } from "./previews.js";
import { createFinder } from "./finder.js";
import { createRewards } from "./rewards.js";

const developmentMode = location.hostname === "localhost" || location.hostname === "127.0.0.1" || new URLSearchParams(location.search).has("demo");
let catalogueExpanded = false;
let selectedCategory = "all";
let selectedPace = "all";
let searchTerm = "";
let currentState = memberStates.active;
let lastFocusedElement = null;

export function track(eventName, properties = {}) {
  const payload = { event: eventName, ...properties, timestamp: new Date().toISOString() };
  if (developmentMode) console.info("[3STAR analytics]", payload);
  window._3starAnalytics = window._3starAnalytics || [];
  window._3starAnalytics.push(payload);
  window.dispatchEvent(new CustomEvent("3star:analytics", { detail: payload }));
  // Future Matomo adapter: window._paq?.push(["trackEvent", "Originals", eventName, JSON.stringify(properties)]);
}

function toast(message) {
  const region = document.querySelector("#toast-region");
  region.innerHTML = `<div class="toast">${message}</div>`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { region.innerHTML = ""; }, 3500);
}

function openModal(title, content) {
  const modal = document.querySelector("#app-modal");
  lastFocusedElement = document.activeElement;
  document.querySelector("#modal-title").textContent = title;
  document.querySelector("#modal-body").innerHTML = content;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.querySelector(".modal-panel").focus();
}

function closeModal() {
  const modal = document.querySelector("#app-modal");
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  lastFocusedElement?.focus();
}

function focusableElements() {
  return [...document.querySelector("#app-modal").querySelectorAll("button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex='-1'])")].filter((element) => element.offsetParent !== null);
}

function handleModalKeys(event) {
  const modal = document.querySelector("#app-modal");
  if (modal.hidden) return;
  if (event.key === "Escape") closeModal();
  if (event.key !== "Tab") return;
  const elements = focusableElements();
  if (!elements.length) { event.preventDefault(); return; }
  const first = elements[0];
  const last = elements.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function artworkStyle(game) {
  return `--art-accent:${game.accent};--art-bg:color-mix(in srgb, ${game.accent} 14%, #160b0f)`;
}

function gameCard(game, badge = null) {
  const status = badge || game.status || (game.featured ? "Featured" : null);
  return `<article class="game-card" tabindex="0" data-game-id="${game.id}" aria-label="View ${game.name} details">
    <div class="game-art" style="${artworkStyle(game)}">
      ${status ? `<span class="status-badge">${status}</span>` : ""}
      <span class="art-glyph" aria-hidden="true">${game.glyph}</span>
      <button class="card-play" type="button" data-quick-play="${game.id}" aria-label="Play ${game.name}">▶</button>
    </div>
    <div class="game-meta"><h3>${game.name}</h3><p>${getCategoryLabel(game.category)}</p></div>
  </article>`;
}

function bindGameCards(container = document) {
  container.querySelectorAll(".game-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-quick-play]")) return;
      openGame(card.dataset.gameId);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openGame(card.dataset.gameId); }
    });
  });
  container.querySelectorAll("[data-quick-play]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    startGame(button.dataset.quickPlay);
  }));
}

function startGame(id) {
  const game = getGame(id);
  track("game_started", { game_id: id, prototype: true });
  closeModal();
  toast(`${game.name} launch simulated for this prototype.`);
}

function openGame(id, launch = false) {
  if (launch) { startGame(id); return; }
  const game = getGame(id);
  if (!game) return;
  track("game_detail_view", { game_id: id });
  openModal(game.name, `
    <div class="detail-art" style="--detail-accent:${game.accent}" role="img" aria-label="Concept artwork for ${game.name}">${game.glyph}</div>
    <div class="detail-meta"><span>${getCategoryLabel(game.category)}</span><span>${getPaceLabel(game.pace)} pace</span>${game.featured ? "<span>Curated Featured Game</span>" : ""}</div>
    <p>${game.description}</p>
    <div class="detail-how"><strong>How it works</strong><p>Choose your settings, confirm your selection and follow the on-screen round. This conceptual guide does not suggest an outcome or strategy.</p></div>
    <button class="button button-primary" id="detail-play">Play Game <span class="sr-only">(prototype)</span></button>
    <p class="prototype-note">Prototype launch only. Opening a game alone does not generate reward progress. Play responsibly.</p>
  `);
  document.querySelector("#detail-play").addEventListener("click", () => startGame(id));
}

function renderFeatured() {
  const games = featuredGameIds.map(getGame).filter(Boolean);
  const container = document.querySelector("#featured-games");
  container.innerHTML = games.slice(0, 6).map((game) => gameCard(game, "Featured")).join("");
  bindGameCards(container);
  container.querySelectorAll(".game-card").forEach((card) => new IntersectionObserver(([entry], observer) => {
    if (entry.isIntersecting) { track("featured_game_view", { game_id: card.dataset.gameId }); observer.disconnect(); }
  }, { threshold: .55 }).observe(card));
}

function showAllFeatured() {
  const games = featuredGameIds.map(getGame).filter(Boolean);
  openModal("Featured Games", `
    <p>These games are curated to make discovery easier. They are not ranked and do not earn reward progress faster.</p>
    <div class="game-grid">${games.map((game) => gameCard(game, "Featured")).join("")}</div>
  `);
  bindGameCards(document.querySelector("#modal-body"));
}

function filteredGames() {
  return activeGames.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
    const matchesPace = selectedPace === "all" || game.pace === selectedPace;
    return matchesSearch && matchesCategory && matchesPace;
  });
}

function renderCatalogue() {
  const games = filteredGames();
  const visibleGames = catalogueExpanded ? games : games.slice(0, 8);
  const container = document.querySelector("#catalogue-games");
  container.innerHTML = visibleGames.map((game) => gameCard(game)).join("");
  bindGameCards(container);
  document.querySelector("#result-count").textContent = `${games.length} ${games.length === 1 ? "game" : "games"}`;
  document.querySelector("#catalogue-empty").hidden = games.length !== 0;
  document.querySelector("#catalogue-toggle").hidden = games.length <= 8;
  document.querySelector("#catalogue-toggle").textContent = catalogueExpanded ? "Hide" : "View All Originals";
}

function clearFilters() {
  searchTerm = "";
  selectedCategory = "all";
  selectedPace = "all";
  catalogueExpanded = false;
  document.querySelector("#catalogue-search").value = "";
  document.querySelector("#pace-filter").value = "all";
  document.querySelectorAll(".filter-chip").forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.category === "all")));
  renderCatalogue();
}

function renderRecommendations() {
  const section = document.querySelector("#for-you");
  const ids = [...(currentState.recentlyPlayed || []), ...(currentState.recommendationIds || [])].filter((id, index, list) => list.indexOf(id) === index).slice(0, 4);
  section.hidden = !currentState.member || ids.length === 0 || currentState.suppressed;
  if (section.hidden) return;
  const recentlyPlayed = new Set(currentState.recentlyPlayed);
  const container = document.querySelector("#member-games");
  container.innerHTML = ids.map((id) => gameCard(getGame(id), recentlyPlayed.has(id) ? "Recently Played" : "Recommended")).join("");
  bindGameCards(container);
  track("recommendation_viewed", { source: "for_you", game_ids: ids });
}

function setMemberState(key, rewards) {
  currentState = memberStates[key] || memberStates.active;
  document.querySelector("#account-button").textContent = currentState.member ? "AK" : "Log";
  document.querySelector("#account-button").setAttribute("aria-label", currentState.member ? `${currentState.label} profile` : "Log in");
  renderRecommendations();
  rewards.setState(currentState);
}

function initFilters() {
  const categoryContainer = document.querySelector("#category-filters");
  categoryContainer.innerHTML = [{ id: "all", label: "All" }, ...categories].map((category) => `<button class="filter-chip" data-category="${category.id}" aria-pressed="${category.id === "all"}">${category.label}</button>`).join("");
  categoryContainer.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-category]");
    if (!chip) return;
    selectedCategory = chip.dataset.category;
    categoryContainer.querySelectorAll(".filter-chip").forEach((item) => item.setAttribute("aria-pressed", String(item === chip)));
    track("catalogue_filter", { type: "category", value: selectedCategory });
    renderCatalogue();
  });
  const paceSelect = document.querySelector("#pace-filter");
  paceSelect.insertAdjacentHTML("beforeend", paceOptions.map((pace) => `<option value="${pace.id}">${pace.label}</option>`).join(""));
  paceSelect.addEventListener("change", () => {
    selectedPace = paceSelect.value;
    track("catalogue_filter", { type: "pace", value: selectedPace });
    renderCatalogue();
  });
  let searchTimer;
  document.querySelector("#catalogue-search").addEventListener("input", (event) => {
    searchTerm = event.target.value.trim().toLowerCase();
    renderCatalogue();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => track("catalogue_search", { query: searchTerm, result_count: filteredGames().length }), 350);
  });
}

function initNavigation() {
  const drawer = document.querySelector("#mobile-drawer");
  const scrim = document.querySelector(".drawer-scrim");
  const toggle = document.querySelector("#menu-toggle");
  function setDrawer(open) {
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    scrim.hidden = !open;
  }
  toggle.addEventListener("click", () => setDrawer(!drawer.classList.contains("open")));
  document.querySelectorAll("[data-close-drawer], .mobile-drawer a").forEach((element) => element.addEventListener("click", () => setDrawer(false)));
  document.querySelector("#search-toggle").addEventListener("click", () => {
    document.querySelector("#catalogue").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => document.querySelector("#catalogue-search").focus(), 500);
  });
}

function initDemo(rewards) {
  const parameters = new URLSearchParams(location.search);
  if (!parameters.has("demo")) return;
  const panel = document.querySelector("#demo-panel");
  const select = document.querySelector("#demo-state");
  panel.hidden = false;
  select.innerHTML = Object.entries(memberStates).map(([key, state]) => `<option value="${key}">${state.label}</option>`).join("");
  select.value = "active";
  if (matchMedia("(max-width: 520px)").matches) {
    panel.classList.add("minimised");
    document.querySelector("#demo-minimise").textContent = "+";
  }
  select.addEventListener("change", () => setMemberState(select.value, rewards));
  document.querySelector("#demo-minimise").addEventListener("click", (event) => {
    const minimised = panel.classList.toggle("minimised");
    event.currentTarget.textContent = minimised ? "+" : "−";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  track("originals_landing_view", { active_game_count: activeGames.length });
  renderFeatured();
  initFilters();
  renderCatalogue();
  initNavigation();

  const finder = createFinder({ openModal, closeModal, openGame, track });
  const rewards = createRewards({ openModal, closeModal, openGame, track, toast });
  initPreviews({ track, openGame });
  setMemberState("active", rewards);
  initDemo(rewards);

  document.querySelector("#explore-games").addEventListener("click", () => track("hero_explore_games_click"));
  document.querySelector("#open-finder").addEventListener("click", () => { track("hero_help_me_choose_click"); finder.start(); });
  document.querySelector("#view-featured").addEventListener("click", showAllFeatured);
  document.querySelector("#catalogue-toggle").addEventListener("click", () => { catalogueExpanded = !catalogueExpanded; renderCatalogue(); });
  document.querySelector("#clear-filters").addEventListener("click", clearFilters);
  document.querySelectorAll("[data-clear-filters]").forEach((button) => button.addEventListener("click", clearFilters));
  document.querySelectorAll("[data-close-modal]").forEach((element) => element.addEventListener("click", closeModal));
  document.querySelectorAll("[data-prototype-link]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); toast("Promotion terms placeholder for prototype review."); }));
  document.addEventListener("keydown", handleModalKeys);
});