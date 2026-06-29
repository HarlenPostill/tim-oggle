import confetti from 'canvas-confetti';

const PARTY_COLORS = ['#2b95f0', '#18bcd4', '#6c8cff', '#ffb02e', '#2bbd6e'];

/** A full-screen confetti celebration for the winner reveal: a big central
 *  burst plus a couple of seconds of streamers from both bottom corners. */
export function celebrate(): void {
  confetti({
    particleCount: 160,
    spread: 100,
    startVelocity: 45,
    origin: { y: 0.6 },
    colors: PARTY_COLORS,
    scalar: 1.1,
  });

  const end = Date.now() + 2000;
  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 75,
      origin: { x: 0, y: 0.7 },
      colors: PARTY_COLORS,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 75,
      origin: { x: 1, y: 0.7 },
      colors: PARTY_COLORS,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
