"use client";

import { useEffect, useState } from "react";
import GameCardHeader from "@/components/GameCardHeader";
import ConnectFourBoard from "@/components/ConnectFourBoard";
import { checkWinner, flatToBoard } from "@/lib/connectFour";
import { useConnectFourLocal } from "@/lib/useConnectFourLocal";
import { useConnectFourOnline } from "@/lib/useConnectFourOnline";

const MODES = [
  { id: "computer", label: "Kompyuterga qarshi", icon: "🤖" },
  { id: "local", label: "Ikki oʻyinchi", icon: "🧑‍🤝‍🧑" },
  { id: "online", label: "Onlayn", icon: "🌐" },
];

const DIFFICULTIES = [
  { id: "easy", label: "Oson" },
  { id: "hard", label: "Qiyin" },
];

export default function ConnectFourGame({ registerControls }) {
  const [tab, setTab] = useState("computer");
  const local = useConnectFourLocal();
  const online = useConnectFourOnline();

  useEffect(() => {
    if (!registerControls) return;
    registerControls({ streak: 0, showDailyBadge: false });
  }, [registerControls]);

  function selectTab(id) {
    setTab(id);
    if (id === "computer" || id === "local") {
      local.configure(id, local.difficulty);
    }
  }

  function selectDifficulty(difficulty) {
    local.configure("computer", difficulty);
  }

  if (!local.mounted) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <GameCardHeader
        icon="🔴"
        title="Toʻrt ketma-ket"
        subtitle="Ustunga tashlang, toʻrttasini qatorga tering — kompyuterga qarshi, ikkovlashib yoki onlayn."
      />

      <div className="max-w-md mx-auto w-full flex flex-col gap-5 pb-8">
        <div className="flex flex-wrap items-center gap-1 bg-surface-2 border border-border rounded-full p-1 self-center">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => selectTab(m.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                tab === m.id ? "bg-accent text-accent-ink" : "text-text-dim"
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {tab === "computer" && (
          <div className="flex items-center gap-1 bg-surface-2 border border-border rounded-full p-1 self-center">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => selectDifficulty(d.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                  local.difficulty === d.id ? "bg-accent text-accent-ink" : "text-text-dim"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {(tab === "computer" || tab === "local") && <LocalBoard local={local} />}
        {tab === "online" && <OnlineBoard online={online} />}
      </div>
    </>
  );
}

function LocalBoard({ local }) {
  const disabled = local.status !== "playing" || (local.mode === "computer" && local.turn === "o");

  let statusText;
  if (local.status === "over") {
    if (local.result.winner === "draw") {
      statusText = "Durrang!";
    } else if (local.mode === "computer") {
      statusText = local.result.winner === "x" ? "Siz yutdingiz! 🎉" : "Kompyuter yutdi.";
    } else {
      statusText = `${local.result.winner === "x" ? "🔴" : "🟡"} yutdi!`;
    }
  } else if (local.mode === "computer") {
    statusText = local.turn === "x" ? "Sizning navbatingiz (🔴)" : "Kompyuter oʻylamoqda...";
  } else {
    statusText = `${local.turn === "x" ? "🔴" : "🟡"} navbati`;
  }

  return (
    <>
      <p className="text-sm font-bold text-center">{statusText}</p>

      <ConnectFourBoard
        board={local.board}
        winLine={local.result?.line}
        disabled={disabled}
        onPlay={local.play}
      />

      <div className="flex gap-2">
        {local.mode === "computer" ? (
          <>
            <Stat n={local.stats.played} l="OʻYIN" />
            <Stat n={local.stats.wins} l="GʻALABA" />
            <Stat n={local.stats.losses} l="MAGʻLUBIYAT" />
            <Stat n={local.stats.draws} l="DURRANG" />
          </>
        ) : (
          <>
            <Stat n={local.stats.played} l="OʻYIN" />
            <Stat n={local.stats.xWins} l="🔴 GʻALABA" />
            <Stat n={local.stats.oWins} l="🟡 GʻALABA" />
            <Stat n={local.stats.draws} l="DURRANG" />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={local.newGame}
        className="w-full bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-3"
      >
        Yangi oʻyin
      </button>
    </>
  );
}

function OnlineBoard({ online }) {
  if (online.phase === "idle") {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center flex flex-col gap-4">
        <p className="text-sm text-text-dim">
          Tasodifiy raqib bilan jonli oʻynang — navbat bilan ustunga tashlaysiz.
        </p>
        <button
          type="button"
          onClick={online.start}
          className="bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-3"
        >
          Raqib qidirish
        </button>
      </div>
    );
  }

  if (online.phase === "error") {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center flex flex-col gap-4">
        <p className="text-sm text-danger">{online.error}</p>
        <button
          type="button"
          onClick={online.start}
          className="bg-surface-2 text-text font-bold text-sm rounded-xl py-3"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  if (online.phase === "queueing") {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-strong animate-pulse" />
        <p className="text-sm text-text-dim">Raqib qidirilmoqda...</p>
        <button
          type="button"
          onClick={online.cancel}
          className="text-xs font-bold text-text-dim underline"
        >
          Bekor qilish
        </button>
      </div>
    );
  }

  // active | finished
  const { match, mySymbol } = online;
  if (!match) return null;
  const board2d = flatToBoard(match.board);
  const result = checkWinner(board2d);
  const isMyTurn = online.phase === "active" && match.turn === mySymbol;

  let statusText;
  if (online.phase === "finished") {
    if (match.winner === "draw") statusText = "Durrang!";
    else if (match.winner === mySymbol)
      statusText = match.forfeited ? "Siz yutdingiz — raqib chiqib ketdi 🎉" : "Siz yutdingiz! 🎉";
    else statusText = "Yutqazdingiz.";
  } else {
    statusText = isMyTurn ? "Sizning navbatingiz" : "Raqib navbati...";
  }

  return (
    <>
      <p className="text-xs text-text-dim text-center">
        Siz — <b className="text-text">{mySymbol === "x" ? "🔴" : "🟡"}</b>
      </p>
      <p className="text-sm font-bold text-center">{statusText}</p>

      <ConnectFourBoard
        board={board2d}
        winLine={result?.line}
        disabled={!isMyTurn}
        onPlay={online.play}
      />

      {online.error && <p className="text-xs text-danger text-center">{online.error}</p>}

      {online.phase === "active" ? (
        <button
          type="button"
          onClick={online.leaveMatch}
          className="w-full bg-surface-2 text-text font-bold text-sm rounded-xl py-3"
        >
          Taslim boʻlish
        </button>
      ) : (
        <button
          type="button"
          onClick={async () => {
            online.playAgain();
            await online.start();
          }}
          className="w-full bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-3"
        >
          Yana oʻynash
        </button>
      )}
    </>
  );
}

function Stat({ n, l }) {
  return (
    <div className="flex-1 bg-surface-2 rounded-xl py-2.5 text-center">
      <span className="font-display font-extrabold text-xl block">{n}</span>
      <span className="text-[9px] text-text-dim tracking-wide">{l}</span>
    </div>
  );
}
