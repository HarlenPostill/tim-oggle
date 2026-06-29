/** Fixed, non-interactive party glow that sits behind every screen. */
export default function PartyBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink"
    >
      <div className="animate-float-glow absolute -left-24 -top-24 h-80 w-80 rounded-full bg-magenta/30 blur-3xl" />
      <div className="animate-float-glow absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-grape/30 blur-3xl [animation-delay:1.5s]" />
      <div className="animate-float-glow absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-cyan/20 blur-3xl [animation-delay:3s]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(11,6,20,0.55)_72%)]" />
    </div>
  );
}
