# So'ztop

An Uzbek word-guessing game (Palabrilla / Wordle-style): guess a 5-letter Uzbek word in 6 tries.

## Rules implemented

- Board is 5 tiles × 6 guesses.
- **Oʻ** and **Gʻ** each count as a single tile (they use the modifier-letter apostrophe ʻ).
- **SH, CH, NG** are typed and scored as two ordinary letters (e.g. "S" then "H"), not merged — confirmed with product owner.
- Two modes: **Kunlik so'z** (daily word, same for everyone each day, seeded deterministically by date) and **Mashq** (practice, random word each time).
- Stats (played / wins / streak) are stored in the browser's `localStorage` — per-device only, nothing synced yet.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/page.js` — top-level layout, assembles all components.
- `lib/words.js` — tokenizer (handles Oʻ/Gʻ as single tiles) + the Wordle-style scoring algorithm.
- `lib/wordlist.js` — loads and indexes `data/words5.json`.
- `lib/useGame.js` — all game state (guesses, keyboard status, daily index, stats, localStorage) as one hook.
- `components/` — UI pieces (board, keyboard, header, cards, modals).
- `data/words5.json` — the word list (see Word list below).

## Word list

`data/words5.json` contains **5,448 five-tile Uzbek words**, filtered and deduplicated from the
[u2b3k/uz-hunspell](https://github.com/u2b3k/uz-hunspell) Uzbek Hunspell dictionary (95,108 lemmas total).
That dictionary is licensed **GPLv3** — see `ATTRIBUTION.md`.

Right now every 5-tile word in the dictionary is used as both a valid guess *and* a possible daily
solution. That means some daily words can be obscure/dialectal (the source is a full spell-check
dictionary, not a "common words" list) — e.g. today's test run picked "dodla". A natural next step
is to split this into two lists like real Wordle does: a large "valid guesses" list (keep all 5,448)
and a smaller, hand-reviewed "solutions" list of words an average player would recognize.

## Known placeholder

`components/SidebarCards.js` references `/city.png` for the right-hand card's background image —
drop your image at `public/city.png` and it'll pick it up automatically.

## Not yet done (per the plan)

- Push to GitHub
- Deploy to Vercel
- Connect a custom domain
- Decide on curating the daily-solution word list (see above)
