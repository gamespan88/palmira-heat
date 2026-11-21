# Palmira Heat

An original open-world crime game for the make.fun **gta6-01** ("Make GTA 6") bounty. Everything in Palmira is invented for this entry — the city, characters, vehicles, names, story, art and synthesized sound. No Rockstar Games material is used.

**Story.** Rico Marín, a smiling courier in the sun-soaked beach city of Palmira, takes one favor too many from fixer Marisol Vega and courier boss Dario Sol. A sealed case, a pier owned by rival Vince Corallo, and every Palmira PD cruiser in between: four story missions carry Rico from first favor to the Neon Pier showdown.

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

- **Procedural 3D city** — road grid with intersections and lane markings, varied window-lit buildings, shop signs, palms, lamps, crates, a beach, animated ocean and a wooden pier, all in golden-hour light with fog and shadows.
- **On foot and by car** — third-person character control, sprinting, arcade vehicle physics, chase cameras, collision and damage smoke.
- **Traffic and pedestrians** — lane-following traffic that pauses and turns at intersections, sidewalk crowds that flee gunfire and danger.
- **Stealing** — take parked cars or pull up beside traffic and take the wheel; the driver jumps out and calls Palmira PD.
- **Wanted system and police** — one to five stars for theft, collisions, pedestrian hits and gunfire; interceptors spawn, pursue and ram; break line of sight to cool down; get **BUSTED** if boxed in at low speed, **WASTED** if your health runs out.
- **Combat** — hitscan pistol with magazine and reserve ammo, reloads, muzzle flash, hit reactions and rival return fire in the finale.
- **Missions and story** — four sequential missions with beacons, objective text, named dialogue, cash rewards and mission-complete screens, plus repeatable taxi fares that pay by distance.
- **HUD and minimap** — health, cash, weapon, wanted stars, objective and prompts, and a live circular radar with roads, the coast, police, enemies, parked cars and the objective blip.
- **Start, pause and save** — title screen with the story premise and controls, New Game / Continue, pause menu, and localStorage saves of cash, story progress and position.
- **Sound** — fully synthesized WebAudio: engine hum tied to speed, police sirens, gunshots, crashes, UI clicks and a warm ambient music loop. No audio files.

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to the output and writes `dossier.json` with the vendored make.fun library.
- `serve.ts` — a tiny local static server for `game/`.
- `game/src/` — one module per system: `city`, `vehicles`, `traffic`, `pedestrians`, `police`, `wanted`, `player`, `combat`, `missions`, `hud`, `minimap` logic inside `hud`, `audio`, `effects`, `savegame`, `input`, `shots` and the `main` orchestration.
- `screenshots/` — four real renders of the game staged by its own `?shot=` scenes.

## License

MIT — see `LICENSE`. three.js is MIT-licensed; its vendored build keeps its own license header.
