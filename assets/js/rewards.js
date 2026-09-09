import { getGame, rewardConfig } from "./games.js";

export function createRewards({ openModal, closeModal, openGame, track, toast }) {
  let state;
  let claimedMilestones = new Set();
  const rewardSection = document.querySelector("#rewards");
  const floating = document.querySelector("#floating-reward");
  const backdrop = document.querySelector("#reward-drawer-backdrop");
  let drawerOpen = false;
  let lastFocusedElement = null;

  function openRewards() {
    if (rewardSection.hidden || drawerOpen) return;
    drawerOpen = true;
    lastFocusedElement = document.activeElement;
    rewardSection.classList.add("open");
    rewardSection.setAttribute("aria-hidden", "false");
    floating.setAttribute("aria-expanded", "true");
    backdrop.hidden = false;
    document.body.classList.add("reward-open");
    document.querySelector("#close-rewards").focus();
    track("reward_progress_viewed");
    track("milestone_list_viewed");
    updateFloating();
  }

  function closeRewards() {
    if (!drawerOpen) return;
    drawerOpen = false;
    rewardSection.classList.remove("open");
    rewardSection.setAttribute("aria-hidden", "true");
    floating.setAttribute("aria-expanded", "false");
    backdrop.hidden = true;
    document.body.classList.remove("reward-open");
    updateFloating();
    lastFocusedElement?.focus();
  }

  function handleDrawerKeys(event) {
    if (!drawerOpen) return;
    if (event.key === "Escape") { closeRewards(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...rewardSection.querySelectorAll("button:not([disabled]), a[href], input, select")].filter((element) => element.offsetParent !== null);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function currentMilestone() {
    return rewardConfig.milestones.find((milestone) => milestone.turnover > state.progress) || rewardConfig.milestones.at(-1);
  }

  function render() {
    const milestone = rewardConfig.milestones.find((item) => state.progress >= item.turnover && !claimedMilestones.has(item.turnover)) || currentMilestone();
    const displayProgress = Math.min(state.progress, milestone.turnover);
    const percent = Math.min(100, Math.round((displayProgress / milestone.turnover) * 100));
    const claimable = rewardConfig.milestones.some((item) => state.progress >= item.turnover && !claimedMilestones.has(item.turnover));

    document.querySelector("#reward-amount").textContent = `RM${milestone.reward}`;
    document.querySelector("#reward-requirement").textContent = `RM${milestone.turnover} qualifying turnover`;
    document.querySelector("#reward-progress-copy").textContent = `RM${displayProgress} / RM${milestone.turnover}`;
    document.querySelector("#reward-percent").textContent = `${percent}%`;
    document.querySelector("#reward-progress-bar").style.width = `${percent}%`;
    const progressBar = document.querySelector(".progress-track");
    progressBar.setAttribute("aria-valuenow", String(percent));
    document.querySelector("#reward-reset").textContent = rewardConfig.resetLabel;
    document.querySelector("#reward-milestones").innerHTML = rewardConfig.milestones.map((item) => {
      const itemProgress = Math.min(state.progress, item.turnover);
      const itemPercent = Math.min(100, Math.round((itemProgress / item.turnover) * 100));
      const isClaimed = claimedMilestones.has(item.turnover);
      const isReady = state.progress >= item.turnover && !isClaimed;
      const isCurrent = state.progress < item.turnover && currentMilestone().turnover === item.turnover;
      const status = isClaimed ? "claimed" : isReady ? "ready" : isCurrent ? "current" : "locked";
      const actionLabel = isClaimed ? "Claimed" : isReady ? `Claim RM${item.reward}` : "Locked";
      return `<article class="milestone ${status}">
        <div class="milestone-head"><div><strong>RM${item.turnover} turnover</strong><span class="milestone-status">${status === "current" ? "in progress" : status}</span></div><strong class="milestone-reward">RM${item.reward}</strong></div>
        <div class="milestone-progress-copy"><span>RM${itemProgress} / RM${item.turnover}</span><span>${itemPercent}%</span></div>
        <div class="progress-track" role="progressbar" aria-label="RM${item.turnover} milestone progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${itemPercent}"><i style="width:${itemPercent}%"></i></div>
        <button class="button ${isReady ? "button-primary" : "button-secondary"} milestone-claim" type="button" data-claim-milestone="${item.turnover}" ${isReady ? "" : "disabled"}>${actionLabel}</button>
      </article>`;
    }).join("");
    const primary = document.querySelector("#reward-primary");
    primary.textContent = "Continue Playing";
    document.querySelector("#floating-reward-copy").textContent = claimable ? "Reward ready" : `RM${displayProgress} / RM${milestone.turnover}`;
    rewardSection.hidden = !state.member || state.suppressed;
    if (rewardSection.hidden) closeRewards();
    renderNextAction(claimable);
    updateFloating();
  }

  function renderNextAction(claimable) {
    const region = document.querySelector("#next-action-region");
    let action;
    if (state.suppressed) action = { title: "Rewards are unavailable for this account.", copy: "Eligibility and responsible-play controls take priority.", label: "Play Responsibly", target: "responsible" };
    else if (!state.member) action = null;
    else if (claimable) action = { title: "Your reward is ready.", copy: "Claim your completed milestone reward now.", label: "View Rewards", target: "claim" };
    else if (state.progress >= 80) action = { title: "You are close to your next milestone.", copy: `Weekly reset in ${rewardConfig.resetLabel}.`, label: "Continue Playing", target: "continue" };
    else if (state.progress > 0) action = { title: "Keep your milestone moving.", copy: `You have completed RM${state.progress} in qualifying turnover.`, label: "View Progress", target: "progress" };
    else if (state.recentlyPlayed?.length) action = { title: `Continue playing ${getGame(state.recentlyPlayed[0]).name}.`, copy: "Pick up with your most recent game.", label: "Continue", target: state.recentlyPlayed[0] };
    else if (state.recommendationIds?.length) action = { title: `Try ${getGame(state.recommendationIds[0]).name}.`, copy: "A different experience selected for this session.", label: "View Game", target: state.recommendationIds[0] };
    else action = { title: "Not sure what to play? Let us help.", copy: "Answer two quick questions in the Game Finder.", label: "Help Me Choose", target: "finder" };

    region.hidden = !action;
    if (!action) return;
    region.innerHTML = `<div class="nba-banner"><span class="nba-icon" aria-hidden="true">→</span><div><strong>${action.title}</strong><p>${action.copy}</p></div><button class="button button-secondary" data-nba-target="${action.target}">${action.label}</button></div>`;
  }

  function claim(turnover) {
    const milestone = rewardConfig.milestones.find((item) => item.turnover === turnover);
    if (!milestone || state.progress < turnover || claimedMilestones.has(turnover)) return;
    claimedMilestones.add(turnover);
    track("reward_claimed", { reward: milestone.reward, turnover });
    toast(`RM${milestone.reward} illustrative reward claimed successfully.`);
    render();
  }

  function updateFloating() {
    if (!state?.member || !state.eligible || state.suppressed) { floating.hidden = true; return; }
    floating.hidden = drawerOpen;
  }

  document.querySelector("#reward-primary").addEventListener("click", () => document.querySelector("#catalogue").scrollIntoView({ behavior: "smooth" }));
  floating.addEventListener("click", openRewards);
  document.querySelector("#close-rewards").addEventListener("click", closeRewards);
  backdrop.addEventListener("click", closeRewards);
  document.querySelectorAll('a[href="#rewards"]').forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    openRewards();
  }));
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-nba-target]");
    if (!button) return;
    const target = button.dataset.nbaTarget;
    track("next_best_action_click", { action: target });
    if (target === "claim") openRewards();
    else if (target === "progress") openRewards();
    else if (target === "continue") document.querySelector("#catalogue").scrollIntoView({ behavior: "smooth" });
    else if (target === "finder") document.querySelector("#open-finder").click();
    else if (target === "responsible") toast("Play responsibly. Account controls remain active.");
    else openGame(target);
  });
  rewardSection.addEventListener("click", (event) => {
    const button = event.target.closest("[data-claim-milestone]");
    if (button) claim(Number(button.dataset.claimMilestone));
  });
  addEventListener("scroll", updateFloating, { passive: true });
  document.addEventListener("keydown", handleDrawerKeys);

  return {
    setState(nextState) { state = { ...nextState }; claimedMilestones = new Set(nextState.claimedMilestones || []); render(); },
    open: openRewards,
    close: closeRewards,
    claim
  };
}