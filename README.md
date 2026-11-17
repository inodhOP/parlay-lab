<p align="center"><img src="assets/cover.svg" alt="Parlay Lab: NBA moneyline parlays, priced honestly" width="100%"></p>

# Parlay Lab

[![Tests](https://github.com/inodhOP/parlay-lab/actions/workflows/test.yml/badge.svg)](https://github.com/inodhOP/parlay-lab/actions/workflows/test.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-7c5cff.svg)](LICENSE)

A small web app for building NBA moneyline parlays, made to sit beside FanDuel Sportsbook. It shows every game on the slate with a win chance for each team, lets you pick winners, and checks the price you are being offered against fair odds before you bet.

**Open the app: https://inodhop.github.io/parlay-lab/**

It runs entirely in the browser. There is no server, no account and nothing to maintain: the schedule, scores and records load from public data each time the page is open.

## Contents

- [What it does](#what-it-does)
- [How to use it](#how-to-use-it)
- [How the numbers work](#how-the-numbers-work)
- [Where the data comes from](#where-the-data-comes-from)
- [Privacy](#privacy)
- [Project layout](#project-layout)
- [Development](#development)
- [Limitations](#limitations)
- [Disclaimer](#disclaimer)
- [License](#license)

## What it does

| Screen | What you get |
| --- | --- |
| **Games** | Every game on the current slate with each team's record, last five results, win chance, and the moneyline posted in the data feed. |
| **Best bets** | The same games sorted by the strongest favourite. |
| **Following** | Only the games involving teams you follow. |
| **Auto-build** | The most likely winners, one per game, for a 2 to 6 leg parlay above a minimum win chance you set. |
| **Slip** | The chance all your picks hit, the fair odds, FanDuel's parlay odds from the lines you enter, how much your bet would win, and the expected return. |
| **Teams** | All 30 teams ranked by strength, with search and follow. |

## How to use it

1. Open the app and tap **Pick** on the team you think wins each game, or tap the plus button to auto-build a parlay.
2. Open the **Slip**. For each pick, type the moneyline FanDuel shows (for example `-150` or `+240`). The grey number in each box is the line from the data feed, as a guide.
3. Enter the amount you want to bet. The slip shows FanDuel's parlay odds, what you would win, and the total you would get back.
4. Compare **Fair odds** with **FanDuel parlay odds**. If FanDuel pays more than the fair odds, the expected return is positive by this model.

Games that have started show their status and cannot be added to a slip.

## How the numbers work

The short version:

1. Each team's win-loss record becomes a strength rating, pulled toward 50% so a short season does not overreact.
2. The two ratings are compared and the home team gets a small boost.
3. If the data feed lists a moneyline for the game, it is converted to a win chance with the bookmaker's margin removed, and averaged with the record-based estimate.
4. A parlay's chance is its leg chances multiplied together. Fair odds are the odds that would break even at that chance.

The formulas, a worked example and the reasoning behind each choice are in [docs/MODEL.md](docs/MODEL.md).

## Where the data comes from

Schedules, scores, records and posted moneylines come from ESPN's public scoreboard and standings data, requested directly by your browser. The app refreshes every five minutes while it is open, keeps a saved copy for when the feed cannot be reached, and rolls to the next day once a day's games are finished.

Details, including the fallback order and what is validated, are in [docs/DATA.md](docs/DATA.md).

FanDuel's own odds are not loaded automatically, because there is no free public source for them. You type them in.

## Privacy

Nothing you do in the app leaves your device. Picks, followed teams, the odds you type and the last data update are stored in your browser's local storage only. The app has no analytics, no cookies and no account. The only network requests are to ESPN, for data and team logo images. A content security policy in the page enforces this: the browser blocks requests to anywhere else and refuses outside scripts.

## Project layout

```
index.html              The whole app: markup, styles and script in one file
assets/                 Logo, cover art and icons
docs/MODEL.md           How win chances, fair odds and expected return are calculated
docs/DATA.md            Data source, refresh, caching and validation
tests/smoke.js          Browser test that drives the app against a simulated feed
.github/workflows/      Runs the test on every push
CHANGELOG.md            What changed in each version
```

## Development

There is no build step. Open `index.html` in a browser, or serve the folder with any static file server.

To run the browser test (needs Node 18+ and Google Chrome installed):

```sh
npm install
npm test
```

The test loads the app in Chrome, feeds it simulated scoreboard data, and checks picking, auto-build, slip pricing, offline fallback and day rollover. Set `CHROME_PATH` if Chrome is not found automatically.

The site is served by GitHub Pages from the `gh-pages` branch, which mirrors `main`:

```sh
git push origin main
git push origin main:gh-pages
```

## Limitations

- The model only knows records, home court and the posted line. It knows nothing about injuries, rest, travel or matchups.
- Early in a season records are noisy, so the estimates are rough.
- Parlay legs are treated as independent. That is reasonable across different games, which is why the app allows one pick per game.
- ESPN's data feed is unofficial and undocumented. It can change or stop working without notice, and the app would then fall back to its saved copy.
- The moneyline shown in the feed usually comes from a different sportsbook than FanDuel.

## Disclaimer

Parlay Lab is an independent hobby project. It is not affiliated with, endorsed by or connected to FanDuel, ESPN, the NBA or any team. Team names and logos belong to their owners; logos are loaded from ESPN and are not stored in this repository.

This is not betting advice. No model makes parlays safe, and every extra leg lowers the chance of a win. Bet only where it is legal for you, only if you are of legal age, and only what you can afford to lose. If gambling stops being fun, contact your local problem gambling helpline.

## License

[MIT](LICENSE)
