[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/gamespan88/palmira-heat/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/gamespan88/palmira-heat/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# Palmira Heat

An original open-world crime game for the make.fun **gta6-01** ("Make GTA 6") bounty. Everything in Palmira is invented for this entry — the city, characters, vehicles, names, story, art and synthesized sound. No Rockstar Games material is used.

**Story.** Rico Marín, a smiling courier in the sun-soaked beach city of Palmira, takes one favor too many from fixer Marisol Vega and courier boss Dario Sol. A sealed case, a pier owned by rival Vince Corallo, a harbor strongbox that customs never stamped, a street-racing crown, and a last ferry out: eight story missions carry Rico from first favor to the Neon Pier finale — and a two-mission second chapter (a rush crate off the harbor, then one final convoy run through roadblocks under the helicopter) brings him home again, ten missions in all.

## Play it

```sh
node serve.ts          # serves game/ at http://localhost:8080
```

Open the page in a desktop browser. The game is static files only and makes no network requests; three.js is vendored at `game/vendor/three.module.min.js`.

## Controls

| Input | Action |
| --- | --- |
| W A S D / arrows | Walk or drive |
| Mouse (pointer lock) | Look and aim |
| Shift | Sprint |
| F | Enter, steal or exit a car |
| Mouse click | Fire the pistol |
| R | Reload |
| E | Offer a taxi fare to a nearby pedestrian |
| Esc / P | Pause, save, restart |

## Systems

- **Procedural 3D city** — a 7×7 road grid with intersections and lane markings across three named districts (Downtown Palmira's glass towers, the Mercado old town's terracotta lanes, the Marina & Pier quarter), varied window-lit buildings, 18 shop signs, palms, lamps, crates, a beach, animated ocean, a wooden pier and the Palmira ferry, all in golden-hour light with fog and shadows. A banner names each district as you enter it.
- **On foot and by car** — third-person character control, sprinting, arcade vehicle physics, chase cameras, collision and damage smoke. Eight vehicle types: sedan, taxi, truck, coupe, wagon, pickup, convertible and the nimble Vela Moto motorbike, rider figure and all.
- **Traffic and pedestrians** — 28 lane-following traffic cars that pause and turn at intersections, 55 sidewalk pedestrians who flee gunfire and danger.
- **Stealing** — take parked cars or pull up beside traffic and take the wheel; the driver jumps out and calls Palmira PD.
- **Wanted system and police** — one to five stars for theft, collisions, pedestrian hits and gunfire; interceptors spawn, pursue and ram; at three stars dispatch stages **roadblocks** across your road; at four stars a **police helicopter** joins with a searchlight that keeps eyes on you from the sky; break line of sight — ground and air — to cool down; get **BUSTED** if boxed in at low speed, **WASTED** if your health runs out.
- **Combat** — hitscan pistol with magazine and reserve ammo, reloads, muzzle flash, hit reactions and rival return fire in the showdown.
- **Missions and story** — ten sequential missions (favors, a hot package, a cool-down, a pier showdown, a clean getaway, a harbor heist, a street-racing crown, a ferry finale, a back-on-the-sand reunion and a final convoy run) with beacons, objective text, named dialogue, cash rewards and mission-complete screens, plus repeatable taxi fares that pay by distance.
- **Street races** — the Marina Loop: a repeatable checkpoint race through the whole city grid, started from the gold ring at the marina junction, with cyan checkpoint beacons, a live timer, cash prizes scaled by time and a best time kept in your save.
- **HUD and minimap** — health, cash, weapon, wanted stars, objective and prompts, district banners, race timer, and a live circular radar with roads, the coast, the three district names lettered on the map, police, the helicopter, enemies, parked cars and the objective blip.
- **Start, pause and save** — title screen with the story premise and controls, New Game / Continue, pause menu, and localStorage saves of cash, story progress and position.
- **Sound** — fully synthesized WebAudio: engine hum tied to speed, police sirens, gunshots, crashes, UI clicks and a warm ambient music loop. No audio files.

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to the output and writes `dossier.json` with the vendored make.fun library.
- `serve.ts` — a tiny local static server for `game/`.
- `game/src/` — one module per system: `city`, `vehicles`, `traffic`, `pedestrians`, `police` (interceptors and roadblocks), `airunit` (the police helicopter), `wanted`, `player`, `combat`, `missions`, `races`, `hud` (with the minimap), `audio`, `effects`, `savegame`, `input`, `shots` and the `main` orchestration.
- `screenshots/` — four real renders of the game staged by its own `?shot=` scenes.

## License

MIT — see `LICENSE`. three.js is MIT-licensed; its vendored build keeps its own license header.
