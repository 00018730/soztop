// The player's pinned home-screen default — distinct from "last played"
// (which app/page.js already restores on its own): once a favorite is set,
// the app opens there every time, even after playing something else,
// until the player changes or clears it.

const KEY = "soztop-favorite-game";

export function readFavoriteGame() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// Passing the currently-favorited id again clears it (a toggle).
export function toggleFavoriteGame(id) {
  try {
    const current = localStorage.getItem(KEY);
    if (current === id) {
      localStorage.removeItem(KEY);
      return null;
    }
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return null;
  }
}
