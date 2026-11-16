# Data

The app has no backend. The browser requests public data directly and keeps a copy in local storage.

## Sources

| What | Request |
| --- | --- |
| Schedule, scores, records, posted moneylines | `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD` |
| League standings | `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings` |
| Team logos | `https://a.espncdn.com/i/teamlogos/nba/500-dark/scoreboard/<team>.png` |

These are the same public endpoints ESPN's own pages use. They need no key, and they are unofficial: the shape can change without notice.

## Refresh cycle

On load, every five minutes while the tab is visible, and when the tab becomes visible again after more than two minutes:

1. **Slate.** Starting from today in US Eastern time, the first day that still has a game to play becomes the slate. Up to five days ahead are checked.
2. **Results.** The previous seven days are requested. A day is remembered as complete once all its games are final, and is not requested again.
3. **Records.** Standings are read, then overridden by any newer record printed on the scoreboard, since the standings table can lag.
4. **Save.** The slate, records, results and update time are written to local storage.

Each request times out after twelve seconds.

## Fallback order

1. Live data from the feed.
2. The copy saved from the last successful update, labelled as offline.
3. A small built-in sample, labelled as a sample, used only on a first visit with no connection.

## Validation

Feed data is treated as untrusted:

- Team codes are mapped to a fixed list of 30 teams and anything else is dropped.
- Scores, records and odds must be finite numbers in a sensible range.
- Postponed and cancelled games are ignored.
- All text from the feed is escaped before it is shown.

## Local storage keys

| Key | Holds |
| --- | --- |
| `pl2_slip` | Your picks |
| `pl2_follow` | Teams you follow |
| `pl2_banner` | Whether the parlay banner is dismissed |
| `pl3_odds` | The odds you typed for each pick |
| `pl3_cache` | Last slate, records, results and update time |
| `pl3_days` | Past days already fully loaded |

Clearing site data for the page resets everything.
