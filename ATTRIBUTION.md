# Word list attribution

The word lists in `data/words5.json` and `data/solutions5.json` were derived from two sources:

**uz-hunspell** — Uzbek Hunspell spell-check dictionary
Repository: https://github.com/u2b3k/uz-hunspell
Authors: Alisher "U2B3K" Jalolov (2019), Bilolbek "itsbilolbek" Normoʻminov (2025)
License: **GNU General Public License v3.0 (GPLv3)**

**uzb-frequent-words** — Uzbek word-frequency list (419,999 words, Cyrillic, ranked most- to least-used, sourced from books and websites)
Repository: https://github.com/kaharjan/uzb-frequent-words
Author: kaharjan
License: **GNU General Public License v3.0 (GPLv3)**

## What was done

The original `uz_UZ.dic` file (95,108 lemmas with Hunspell affix flags) was filtered down to
`data/words5.json` (the full **valid-guess** list):

- lowercase, common-noun-style entries only (proper nouns/names dropped),
- entries that tokenize to exactly 5 tiles under this app's rule (Oʻ/Gʻ = 1 tile each; SH/CH/NG = 2 tiles),
- deduplicated.

No affix expansion was performed — only the base dictionary lemmas were used.

`data/solutions5.json` (the curated **daily/practice-answer** list) was built by transliterating the
frequency list from Cyrillic to Latin, matching each entry against `words5.json`, and keeping the
~1,500 most frequent matches — so puzzle answers skew toward words an average player would
recognize, while the full dictionary above still stays valid as guesses.

## License implications

GPLv3 is a strong copyleft license. Its exact reach over *data* (as opposed to *code*) bundled
with an application is a genuinely unsettled question and this file is not legal advice. If this
project is going to be a closed-source commercial product, get a real legal read on this before
shipping — options if it turns out to be a problem include: relicensing this app's own code under
GPLv3-compatible terms, isolating the word list as a clearly-separated, independently-licensed data
file, or swapping in a differently-licensed word list.
