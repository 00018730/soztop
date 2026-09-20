export default function MessageBanner({ message }) {
  return (
    <div
      className={`mx-auto w-fit text-xs font-bold px-3 py-1 rounded-md bg-text text-bg transition-all ${
        message ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
      }`}
    >
      {message || " "}
    </div>
  );
}
