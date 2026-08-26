# 3STAR Originals

A responsive, accessible static prototype for the 3STAR Originals landing experience. It uses semantic HTML, modern CSS, modular vanilla JavaScript, Canvas preview animations and configuration-driven game/member/reward data.

## Run locally

Node.js 18 or newer is recommended.

```powershell
cd "3star-originals"
node serve.mjs
```

Open `http://localhost:4173`. No install, build step or backend is required.

To inspect prototype member states, open `http://localhost:4173/?demo=1`. The compact panel can switch among guest, new, active, returning, incomplete, near-milestone, claimable, recently played and suppressed scenarios. It is never shown without the query parameter.

## Configuration

- `assets/js/games.js`: active games, categories, paces, Featured 10 IDs, preview IDs, reward milestones and demo member states.
- `assets/js/previews.js`: Plinko, Crash and Mines conceptual Canvas animations, autoplay timing and lifecycle controls.
- `assets/js/finder.js`: two-question matching logic across the complete active game data.
- `assets/js/rewards.js`: milestone presentation, next-best-action priority, claim state and floating access.
- `assets/js/app.js`: catalogue, modals, analytics wrapper, navigation and application orchestration.

The analytics wrapper stores events in `window._3starAnalytics`, dispatches `3star:analytics`, and logs in local/demo mode. A Matomo adapter can replace or extend the wrapper without changing event call sites.

## Files created

```text
3star-originals/
|-- index.html
|-- README.md
|-- serve.mjs
`-- assets/
    |-- css/styles.css
    |-- js/app.js
    |-- js/finder.js
    |-- js/games.js
    |-- js/previews.js
    |-- js/rewards.js
    `-- media/previews/
        |-- crash-poster.svg
        |-- mines-poster.svg
        `-- plinko-poster.svg
```

## Assets requiring provider approval

- Final 3STAR brand mark, wordmark, usage rules and approved font files.
- Approved game thumbnails/key art for every active provider-supplied title. Current cards use clearly conceptual generated artwork.
- Approved Plinko, Crash and Mines MP4/WebM footage and matching poster frames. Replacement paths are already configured under `assets/media/previews/`.
- Final game names, descriptions, categories, pace labels, how-to-play copy and launch URLs.
- Final responsible-play, eligibility, minimum-age, territory, promotion terms and legal copyright copy.
- Commercial approval for reward amounts, qualifying turnover requirements, milestone ladder and weekly reset timing. All current values are labelled illustrative.

## Prototype boundaries

Game launches, account controls, terms and reward claims are simulated front-end interactions. Finder use, previews, tutorials, game-detail views and opening a game do not alter reward progress. Only future backend-confirmed qualifying turnover should update the reward journey.