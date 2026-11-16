# How the numbers work

Everything here is implemented in `index.html`. The model is deliberately simple so that every number on screen can be checked by hand.

## 1. Team strength

A team with `w` wins and `l` losses gets the strength

```
strength = (w + 3) / (w + l + 6)
```

This is the win rate with three imaginary wins and three imaginary losses added. Early in a season a 3-0 team is not really a 100% team, and this pulls small samples toward 50%. As games accumulate the adjustment fades.

## 2. Record-based win chance

Strengths are turned into odds, compared, and the home side is multiplied by a fixed home-court factor of 1.3:

```
odds(home) = [ s_home / (1 - s_home) ] / [ s_away / (1 - s_away) ] × 1.3
model(home) = odds(home) / (1 + odds(home))
```

With two equal teams this gives the home team about 57%, in line with the long-run home win rate in the NBA.

## 3. Blending with the posted line

When the data feed carries a moneyline for the game, each side's American odds are converted to an implied probability:

```
implied = 100 / (odds + 100)        for positive odds
implied = -odds / (-odds + 100)     for negative odds
```

The two implied probabilities add up to more than 100% because of the bookmaker's margin, so each is divided by their sum. The result is the market's view with the margin removed:

```
market(home) = implied(home) / ( implied(home) + implied(away) )
```

The win chance shown in the app is the plain average of the two estimates, limited to between 3% and 97%:

```
chance(home) = ( model(home) + market(home) ) / 2
```

If no line is posted, the record-based estimate is used on its own.

### Worked example

Home team 8-5, away team 7-6, posted line home -180 / away +150.

| Step | Calculation | Result |
| --- | --- | --- |
| Home strength | (8 + 3) / (13 + 6) | 0.579 |
| Away strength | (7 + 3) / (13 + 6) | 0.526 |
| Home odds | (0.579 / 0.421) / (0.526 / 0.474) × 1.3 | 1.61 |
| Record model | 1.61 / 2.61 | 61.7% |
| Implied, home | 180 / 280 | 64.3% |
| Implied, away | 100 / 250 | 40.0% |
| Market, margin removed | 64.3 / (64.3 + 40.0) | 61.6% |
| **Shown** | (61.7 + 61.6) / 2 | **62%** |

## 4. Parlays

The app allows one pick per game and treats games as independent, so the chance a parlay hits is the product of its legs:

```
chance(parlay) = chance(leg 1) × chance(leg 2) × …
```

**Fair odds** are the American odds that break even at that chance:

```
chance ≥ 50%:   -(chance / (1 - chance)) × 100
chance < 50%:   +((1 - chance) / chance) × 100
```

## 5. Pricing against FanDuel

On the slip you enter the moneyline FanDuel shows for each pick. Each is converted to decimal odds and multiplied, which is how a sportsbook prices a parlay:

```
decimal = 1 + odds / 100        for positive odds
decimal = 1 + 100 / -odds       for negative odds
parlay decimal = product of the leg decimals
```

For a bet of `stake`:

```
winnings        = stake × (parlay decimal - 1)
total back      = stake × parlay decimal
expected return = stake × [ chance × (parlay decimal - 1) - (1 - chance) ]
```

A positive expected return means FanDuel's price is better than the model's fair price. It does not mean the bet will win. A sportsbook may round parlay odds slightly differently, so the payout on your bet slip is the one that counts.

## What the model leaves out

Injuries, rest days, travel, lineup changes, matchups and recent form beyond the record. The posted line captures some of this, which is the main reason it is blended in.
