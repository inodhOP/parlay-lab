# Changelog

## 1.0.1 (2026-11-16)

Fixes from a full code review.

- Last night's slate, and any picks on it, now stay up after midnight Eastern while a late game is still being played.
- Odds you type belong to one pick on one day, so they no longer carry over when you switch sides or the same matchup appears again.
- Odds must include a plus or minus sign, so `150` is no longer guessed to be `+150`.
- A zero or empty bet amount asks for an amount, and comma decimals such as `12,50` are accepted.
- The pre-game moneyline is kept once a game tips off, so win chances do not jump at tip-off.
- Team records reset correctly when a new season starts.
- Tip-off times show their time zone.
- The five-minute refresh no longer closes an open dropdown or clears copied slip text.
- An even-money line is read correctly.
- The Teams screen shows live and final games as such.

## 1.0.0 (2026-11-16)

First public version.

- Slate of NBA games with a win chance for each team, built from records, home court and the posted moneyline.
- Pick winners, one per game, with a running parlay chance and fair odds.
- Auto-build for 2 to 6 leg parlays above a chosen minimum win chance.
- Slip priced against FanDuel: enter each moneyline and a bet amount to see parlay odds, winnings, total back and expected return.
- Teams list with search and follow.
- Data loads in the browser from ESPN's public feed, refreshes every five minutes, and falls back to a saved copy when offline.
- Team logos, app icon and link preview image.
- Browser smoke test and documentation of the model and data handling.
