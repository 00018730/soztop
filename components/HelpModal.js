export default function HelpModal({ open, onClose, wordLength = 5, maxGuesses = 6 }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/55 transition-opacity ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-surface rounded-2xl max-w-sm w-full max-h-[86vh] overflow-y-auto shadow-2xl transition-transform ${
          open ? "translate-y-0" : "translate-y-2"
        }`}
      >
        <div className="h-2 rounded-t-2xl bg-gradient-to-r from-accent via-amber to-accent" />
        <div className="p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-sm"
          >
            ✕
          </button>
          <h2 className="font-display font-bold text-lg mb-3">Qanday oʻynash kerak</h2>
          <p className="text-sm text-text-dim leading-relaxed mb-4">
            Yashirin <b className="text-text">{wordLength} harfli</b> oʻzbekcha soʻzni{" "}
            <b className="text-text">{maxGuesses} ta urinishda</b> toping.
          </p>
          <div className="flex flex-col gap-2 mb-4">
            <LegendRow status="correct" label="Harf toʻgʻri va oʻrni ham toʻgʻri." />
            <LegendRow status="present" label="Harf soʻzda bor, lekin oʻrni boshqa." />
            <LegendRow status="absent" label="Bu harf soʻzda umuman yoʻq." />
          </div>
          <p className="text-sm text-text-dim leading-relaxed">
            <b className="text-text">Diqqat:</b> oʻzbek alifbosidagi{" "}
            <b className="text-text">Oʻ</b> va <b className="text-text">Gʻ</b> harflari
            bitta belgi hisoblanadi va klaviaturada alohida tugma sifatida beriladi. SH, CH, NG
            esa oddiy harflar kabi ketma-ket yoziladi (masalan S soʻng H).
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full bg-accent text-accent-ink font-extrabold text-sm rounded-xl py-3"
          >
            Tushunarli
          </button>
        </div>
      </div>
    </div>
  );
}

function LegendRow({ status, label }) {
  const styles = {
    correct: "bg-accent text-accent-ink",
    present: "bg-amber text-amber-ink",
    absent: "bg-absent text-absent-text",
  };
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-md flex items-center justify-center font-extrabold text-sm ${styles[status]}`}
      >
        Q
      </div>
      <span className="text-xs text-text-dim">{label}</span>
    </div>
  );
}
