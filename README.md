# So'ztop

Two Uzbek word/number-guessing games (Wordle/Mastermind-style), switchable from one page:

- **So'ztop** — guess a 5-letter Uzbek word in 6 tries.
- **Kod buzuvchi** (Code Breaker) — guess a secret 4- or 6-digit code; green = right digit, right spot, amber/yellow = right digit, wrong spot.

## Rules implemented

### So'ztop
- Board is 5 tiles × 6 guesses.
- **Oʻ** and **Gʻ** each count as a single tile (they use the modifier-letter apostrophe ʻ).
- **SH, CH, NG** are typed and scored as two ordinary letters (e.g. "S" then "H"), not merged — confirmed with product owner.
- Two modes: **Kunlik so'z** (daily word, same for everyone each day, seeded deterministically by date) and **Mashq** (practice, random word each time).
- Stats (played / wins / streak) are stored in the browser's `localStorage` — per-device only, nothing synced yet.

### Kod buzuvchi (Code Breaker)
- Player picks a **4-digit** (8 tries) or **6-digit** (10 tries) secret code length.
- Digits can repeat in the secret.
- Same two-pass correct/present scoring as the word game, reused as-is (see `lib/words.js`'s `evaluateGuess`, which is generic over any token array/length).
- Stats stored the same way, under a separate `localStorage` key.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/page.js` — thin shell: shared `Header`, `GameSwitcher`, and renders either `WordGame` or `CodeBreakerGame`.
- `components/WordGame.js` / `components/CodeBreakerGame.js` — each game's full UI (board, keys, sidebar, modals), driven by its own hook.
- `lib/words.js` — tokenizer (handles Oʻ/Gʻ as single tiles) + the generic Wordle-style scoring algorithm (`evaluateGuess`), shared by both games.
- `lib/wordlist.js` — loads `data/words5.json` (valid guesses) and `data/solutions5.json` (curated daily/practice solutions).
- `lib/useGame.js` / `lib/useCodeBreaker.js` — all state for each game (guesses, key status, stats, localStorage) as one `useReducer`-based hook each — this is what makes rapid/overlapping keystrokes race-free.
- `lib/codebreaker.js` — Code Breaker constants (digit lengths, max guesses) + secret generation.
- `components/` — shared and per-game UI pieces (board, keyboards, header, cards, modals).
- `data/words5.json` — full word dictionary (valid guesses). `data/solutions5.json` — curated common-word subset (solutions).

## Word lists

`data/words5.json` contains **5,448 five-tile Uzbek words**, filtered and deduplicated from the
[u2b3k/uz-hunspell](https://github.com/u2b3k/uz-hunspell) Uzbek Hunspell dictionary (95,108 lemmas total).
That dictionary is licensed **GPLv3** — see `ATTRIBUTION.md`. Every word in it is accepted as a
**valid guess**.

`data/solutions5.json` is a curated subset of **1,500 everyday words** used only as the
daily/practice **answer** — so the dictionary's rarer or archaic entries (e.g. "getto") never get
picked as a puzzle, while players can still type them as guesses. It was built by cross-referencing
the dictionary against a real Uzbek word-frequency list ([kaharjan/uzb-frequent-words](https://github.com/kaharjan/uzb-frequent-words),
GPLv3, frequency-ranked from books and websites, transliterated from Cyrillic to Latin) and keeping
the ~1,500 most frequent matches. See `lib/wordlist.js` for how the two lists are used.

## Known placeholder

`components/SidebarCards.js` references `/city.png` for the word game's right-hand card background —
drop your image at `public/city.png` and it'll pick it up automatically.

## Not yet done

- Connect a custom domain (site is already deployed on Vercel via GitHub)
