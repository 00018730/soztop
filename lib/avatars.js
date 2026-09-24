// The full set of avatars a player can pick in Sozlamalar. Kept in sync
// with the `profiles_avatar` migration's check constraint — the database
// is the real gatekeeper (a stale client can't write anything outside this
// list), this list just drives the picker UI.
export const AVATARS = [
  "😀", "😎", "🤓", "🥳", "🦄", "🐱", "🐶", "🦊",
  "🐼", "🐸", "🦁", "🐯", "🐨", "🐵", "🦉", "🐧",
  "🐢", "🦋", "🌟", "🔥", "⚡", "🎯", "🎮", "🚀",
];
