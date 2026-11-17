// Browser smoke test. Loads index.html in Chrome with a simulated data feed
// (no network needed) and checks the main flows end to end.
//
//   npm install && npm test
//
// Uses the Chrome already installed on the machine. Set CHROME_PATH to point
// at a specific binary if it is not found automatically.
const path = require("path");
const { chromium } = require("playwright-core");

const PAGE = "file://" + path.join(__dirname, "..", "index.html");
const etDay = (d) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(d).replace(/-/g, "");
const day = (n) => etDay(new Date(Date.now() + n * 864e5));
const soon = (h) => new Date(Date.now() + h * 3600e3).toISOString();

// One event in the shape the public scoreboard feed uses.
function event(id, date, state, home, away, hs, as, moneylines) {
  const side = (homeAway, [abbreviation, summary], score) => ({
    homeAway, score: String(score), team: { abbreviation }, records: [{ type: "total", summary }],
  });
  const comp = { competitors: [side("home", home, hs), side("away", away, as)], venue: { fullName: "Test Arena " + home[0], address: { city: "Testville", state: "ON" } }, neutralSite: false };
  if (moneylines) comp.odds = [{ provider: { name: "TestBook" }, homeTeamOdds: { moneyLine: moneylines[0] }, awayTeamOdds: { moneyLine: moneylines[1] } }];
  return { id, date, status: { type: { state, completed: state === "post", name: state === "post" ? "STATUS_FINAL" : "STATUS_SCHEDULED" } }, competitions: [comp] };
}

function boards(mode) {
  if (mode === "allfinal") {
    return {
      [day(0)]: [event("t1", soon(-5), "post", ["BOS", "12-2"], ["ORL", "5-8"], 120, 100)],
      [day(1)]: [event("n1", soon(24), "pre", ["MIA", "7-6"], ["HOU", "11-3"], 0, 0)],
    };
  }
  if (mode === "before") {
    return { [day(0)]: [event("t1", soon(2), "pre", ["BOS", "12-2"], ["ORL", "5-8"], 0, 0, [-400, 310])], [day(1)]: [event("n1", soon(24), "pre", ["MIA", "7-6"], ["HOU", "11-3"], 0, 0)] };
  }
  if (mode === "late") {
    return {
      [day(-1)]: [event("l1", soon(-3), "in", ["LAL", "12-2"], ["CHA", "4-9"], 88, 80), event("l2", soon(-6), "post", ["TOR", "5-9"], ["NY", "8-6"], 101, 110)],
      [day(0)]: [event("t9", soon(18), "pre", ["MIA", "7-6"], ["HOU", "11-3"], 0, 0)],
    };
  }
  return {
    [day(0)]: [
      event("t1", soon(1), "pre", ["GS", "8-5"], ["NY", "7-6"], 0, 0, [-180, 150]),
      event("t2", soon(0), "in", ["UTAH", "1-13"], ["SA", "12-2"], 50, 60),
      event("t3", soon(-3), "post", ["WSH", "4-11"], ["NO", "5-10"], 99, 110),
      event("t4", soon(2), "pre", ["LAL", "12-2"], ["<img src=x onerror=alert(1)>", "1-1"], 0, 0),
      event("t5", soon(2), "pre", ["DEN", "7-4"], ["PHX", "5-7"], 0, 0, [-300, 240]),
      event("t6", soon(3), "pre", ["constructor", "1-1"], ["BOS", "11-2"], 0, 0),
    ],
    [day(-1)]: [event("y1", soon(-24), "post", ["SAC", "2-12"], ["MIL", "1-14"], 111, 104)],
  };
}
const standings = {
  children: [{ standings: { entries: [
    { team: { abbreviation: "BOS" }, stats: [{ name: "wins", value: 11 }, { name: "losses", value: 2 }] },
    { team: { abbreviation: "WSH" }, stats: [{ name: "wins", value: 4 }, { name: "losses", value: 10 }] },
    { team: { abbreviation: "toString" }, stats: [] },
  ] } }],
};

let failures = 0;
const check = (ok, name, detail) => {
  if (!ok) failures++;
  console.log((ok ? "ok    " : "FAIL  ") + name + (ok || detail === undefined ? "" : "  ->  " + JSON.stringify(detail)));
};

async function open(browser, mode, context) {
  const ctx = context || (await browser.newContext({ viewport: { width: 390, height: 844 } }));
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => { errors.push("dialog: " + d.message()); d.dismiss(); });
  await page.route("**/a.espncdn.com/**", (r) => r.abort());
  await page.route("**/site.api.espn.com/**", (r) => {
    if (mode.current === "offline") return r.abort();
    const url = r.request().url();
    if (url.includes("standings")) return r.fulfill({ json: standings });
    if (url.includes("injuries")) return r.fulfill({ json: { injuries: [{ displayName: "Golden State Warriors", injuries: [{ status: "Out", athlete: { displayName: "Test Guard" } }, { status: "Day-To-Day", athlete: { displayName: "<b>Bad</b> Name" } }] }] } });
    if (url.includes("summary")) return r.fulfill({ json: { predictor: { homeTeam: { gameProjection: "61.0" }, awayTeam: { gameProjection: "39.0" } } } });
    const d = (url.match(/dates=(\d+)/) || [])[1];
    return r.fulfill({ json: { events: boards(mode.current)[d] || [] } });
  });
  await page.goto(PAGE);
  await page.waitForTimeout(900);
  return { page, ctx, errors };
}
const text = (page) => page.evaluate(() => document.querySelector("#main").innerText);

(async () => {
  const browser = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args: ["--no-sandbox"] } : { channel: "chrome", args: ["--no-sandbox"] }
  );

  // --- live data ---------------------------------------------------------
  let mode = { current: "live" };
  let { page, ctx, errors } = await open(browser, mode);
  let t = await text(page);
  check((await page.locator("[data-a=pick]").count()) === 4, "only games that have not started can be picked", await page.locator("[data-a=pick]").count());
  check(["Warriors", "Knicks", "Jazz", "Spurs", "Wizards", "Pelicans"].every((n) => t.includes(n)), "feed team codes are mapped to teams");
  check(!t.includes("<img") && (await page.locator("#main img[src='x']").count()) === 0, "unknown or hostile team codes are dropped");
  check(/Live · SAS 60, UTA 50/.test(t) && /Final · NOP 110, WAS 99/.test(t), "live and final games show their status");
  check(/updated/i.test(t), "status line reports a successful update");
  check(/4-11/.test(t), "newer record on the scoreboard beats the standings table");
  check(/Warriors home game · Test Arena GS, Testville/.test(t), "each game says whose home game it is and where");
  check(/(Today|Tomorrow) · \w{3} \w{3} \d{1,2}/.test(t) && /\d{1,2}:\d{2} [AP]M ET/.test(t), "the slate shows its date and each game its Toronto time", t.slice(0, 300));
  check(/For adults 19 and over/.test(t) && /ConnexOntario/.test(t), "19+ notice and help line are shown");
  check(/Injuries: Warriors 1 out, 1 may sit/.test(t), "injury counts show on the game card");
  await page.locator("[data-a=adult]").click();
  await page.locator(".card.tap .more").first().click();
  await page.waitForTimeout(400);
  const sh = await page.evaluate(() => document.querySelector("#sheetwrap").innerText);
  check(/Knicks at Warriors/.test(sh) && /Test Guard/.test(sh) && /testbook/i.test(sh) && /NYK|Knicks \+150/.test(sh) && /ESPN's own estimate: Knicks 39%, Warriors 61%/.test(sh), "game details sheet shows injuries, lines and ESPN's estimate", sh);
  check((await page.locator("#sheetwrap b").count()) === 0, "injury names from the feed are escaped");
  await page.locator(".sheet [data-a=closesheet]").click();
  check((await page.locator(".sheet").count()) === 0, "details sheet closes");
  check(!/For adults 19 and over/.test(await text(page)), "19+ notice goes away once confirmed");

  // GSW at home: strength 11/19 vs NYK 10/19, home edge 1.3, blended with the de-vigged line.
  const model = (() => { const sh = 11 / 19, sa = 10 / 19, o = (sh / (1 - sh)) / (sa / (1 - sa)) * 1.3; return o / (1 + o); })();
  const market = (180 / 280) / (180 / 280 + 100 / 250);
  const blended = Math.round(((model + market) / 2) * 100);
  check(t.includes(blended + "%") && t.includes(100 - blended + "%"), "win chance matches the documented formula", blended);

  await page.locator("[data-a=pick]").first().click();
  check((await page.locator("#slipCnt").innerText()) === "1", "picking a team adds it to the slip");
  await page.locator("[data-a=pick]").nth(1).click();
  check((await page.locator("#slipCnt").innerText()) === "1", "picking the other side switches the pick");

  await page.locator("#fab").click();
  t = await text(page);
  check(!/Utah|Spurs|Wizards|Pelicans/.test(t), "auto-build skips games that have started");
  await page.locator("[data-a=usebuilt]").click();
  await page.waitForTimeout(1700);
  const boxes = page.locator("[data-odds]");
  const n = await boxes.count();
  check(n >= 2, "auto-build fills the slip", n);
  check(/Enter BetGuard's moneyline for each pick/.test(await text(page)), "slip asks for odds before pricing, worded for the default sportsbook");
  for (let i = 0; i < n; i++) await boxes.nth(i).fill(i === 0 ? "−200" : "-150");
  await page.locator("#stake").fill("25");
  t = await text(page);
  const d = (1 + 100 / 200) * Math.pow(1 + 100 / 150, n - 1);
  check(t.includes("$" + (25 * (d - 1)).toFixed(2)) && t.includes("$" + (25 * d).toFixed(2)), "winnings and total back match the parlay odds", (25 * d).toFixed(2));
  check(!/NaN|undefined|Infinity/.test(t), "no broken numbers on the slip");
  await boxes.first().fill("abc");
  check(/Use American odds/.test(await text(page)), "invalid odds show a hint");
  await boxes.first().fill("200");
  check(/Include the \+ or -/.test(await text(page)), "odds without a sign are not guessed");
  await boxes.first().fill("-200");
  await page.locator("#stake").fill("0");
  t = await text(page);
  check(/Enter a bet amount/.test(t) && !/\$0\.00 wins/.test(t), "a zero bet asks for an amount");
  await page.locator("#stake").fill("25");
  check((await page.locator('a[href="https://sportsbook.fanduel.com/"]').count()) === 0, "no sportsbook link when BetGuard is chosen");

  for (const view of ["teams", "me", "home"]) await page.locator(`[data-nav=${view}]`).click();
  check(errors.length === 0, "no script errors with live data", errors);

  // --- reload with the feed down: saved data is used -----------------------
  mode.current = "offline";
  await page.reload();
  await page.waitForTimeout(700);
  t = await text(page);
  check(/offline, showing saved data/i.test(t) && t.includes("Warriors"), "falls back to saved data when the feed is down");
  check((await page.locator("#slipCnt").innerText()) === String(n), "picks survive a reload");
  await page.locator("[data-a=refresh]").click();
  await page.waitForTimeout(400);
  check(errors.length === 0, "no script errors offline", errors);
  await ctx.close();

  // --- first visit with the feed down: built-in sample ---------------------
  mode = { current: "offline" };
  ({ page, ctx, errors } = await open(browser, mode));
  check(/built-in sample/i.test(await text(page)), "first visit offline shows the built-in sample");
  check(errors.length === 0, "no script errors on a cold offline start", errors);
  await ctx.close();

  // --- today is finished: the slate rolls forward --------------------------
  mode = { current: "allfinal" };
  ({ page, ctx, errors } = await open(browser, mode));
  t = await text(page);
  check(t.indexOf("Heat") > -1 && t.indexOf("Heat") < t.indexOf("Celtics"), "slate rolls to the next day once today's games have all started");
  check(/live and final/.test(t) && /Final · ORL 100, BOS 120/.test(t), "today's finished games stay visible underneath");
  check((await page.locator("[data-a=pick]").count()) === 2, "only the upcoming game can be picked", await page.locator("[data-a=pick]").count());
  check(errors.length === 0, "no script errors on rollover", errors);
  await ctx.close();

  // --- a pick is kept, and settled, after its game finishes -----------------
  mode = { current: "before" };
  ({ page, ctx, errors } = await open(browser, mode));
  await page.locator('[data-a=pick][data-t="BOS"]').click();
  mode.current = "allfinal";
  await page.reload();
  await page.waitForTimeout(900);
  check((await page.locator("#slipCnt").innerText()) === "1", "a pick stays on the slip after its game ends");
  await page.locator("[data-nav=slip]").click();
  t = await text(page);
  check(/Celtics to win/.test(t) && /Won/.test(t) && /7\d%|8\d%/.test(t), "the finished pick shows its result and keeps its pre-game chance", t.slice(0, 160));
  await page.locator("[data-nav=home]").click();
  await page.locator('[data-a=pick][data-t="HOU"]').click();
  check((await page.locator("#slipCnt").innerText()) === "2", "new picks can be added alongside it");
  check(errors.length === 0, "no script errors across a finished game", errors);
  await ctx.close();

  // --- after midnight with a late game still going: last night's slate stays -
  mode = { current: "late" };
  ({ page, ctx, errors } = await open(browser, mode));
  t = await text(page);
  check(t.indexOf("Heat") > -1 && t.indexOf("Heat") < t.indexOf("Lakers") && /Live · CHA 80, LAL 88/.test(t), "a late game from last night stays visible under today's slate");
  check(errors.length === 0, "no script errors with a late game", errors);
  await ctx.close();

  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
