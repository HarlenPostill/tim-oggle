/** Fixed, non-interactive party glow that sits behind every screen. */
export default function PartyBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-sky"
    >
      <div className="animate-float-glow absolute -left-24 -top-24 h-80 w-80 rounded-full bg-magenta/25 blur-3xl" />
      <div className="animate-float-glow absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-cyan/25 blur-3xl [animation-delay:1.5s]" />
      <div className="animate-float-glow absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-gold/20 blur-3xl [animation-delay:3s]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.65)_0%,transparent_62%)]" />
    </div>
  );
}
