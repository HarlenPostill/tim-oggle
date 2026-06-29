import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

// ------------------------------------------------------------------ //
// A tiny Suika ("watermelon game") clone for players to mess with     //
// while they wait in the lobby. Physics via matter-js; rendered to a   //
// canvas by hand so we can draw fruit emoji. Entirely client-side.     //
// ------------------------------------------------------------------ //

interface Fruit {
  emoji: string;
  color: string;
  r: number; // radius at the reference board width
}

const REF_W = 340;
const FRUITS: Fruit[] = [
  { emoji: '🍒', color: '#e23b54', r: 14 },
  { emoji: '🍓', color: '#ff5c7a', r: 19 },
  { emoji: '🍇', color: '#8a5cff', r: 25 },
  { emoji: '🍊', color: '#ff9f43', r: 32 },
  { emoji: '🍎', color: '#ef4444', r: 40 },
  { emoji: '🍑', color: '#fb923c', r: 49 },
  { emoji: '🍐', color: '#a3c930', r: 59 },
  { emoji: '🍍', color: '#f4c430', r: 71 },
  { emoji: '🍉', color: '#22c55e', r: 84 },
];
const SPAWN_MAX = 5; // only the 5 smallest fruits ever drop; bigger come from merges
const DROP_COOLDOWN = 380;
const BEST_KEY = 'tim-oggle:suika-best';

type FruitBody = Matter.Body & { fruitIndex: number; bornAt: number };

export default function SuikaGame() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resetRef = useRef<() => void>(() => {});

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { Engine, Bodies, Composite, Events } = Matter;

    const W = Math.max(260, Math.min(wrap.clientWidth, 420));
    const H = Math.round(W * 1.15);
    const scale = W / REF_W;
    const dropY = Math.round(H * 0.11);
    const lineY = Math.round(H * 0.18);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const engine = Engine.create();
    engine.gravity.y = 1.1;
    const world = engine.world;

    const wallStyle = { isStatic: true, render: { visible: false } };
    Composite.add(world, [
      Bodies.rectangle(W / 2, H + 24, W + 80, 50, wallStyle), // floor
      Bodies.rectangle(-24, H / 2, 50, H * 2, wallStyle), // left wall
      Bodies.rectangle(W + 24, H / 2, 50, H * 2, wallStyle), // right wall
    ]);

    const radiusOf = (idx: number) => FRUITS[idx].r * scale;
    const randSpawn = () => Math.floor(Math.random() * SPAWN_MAX);

    let aimX = W / 2;
    let current = randSpawn();
    let lastDrop = 0;
    let gameOver = false;
    let overTimer = 0;
    let scoreLocal = 0;
    let raf = 0;
    let lastT = performance.now();
    const consumed = new Set<number>();
    const merges: Array<[FruitBody, FruitBody, number]> = [];

    const makeFruit = (x: number, y: number, idx: number): FruitBody => {
      const body = Bodies.circle(x, y, radiusOf(idx), {
        restitution: 0.15,
        friction: 0.5,
        frictionStatic: 0.6,
        density: 0.001,
        label: 'fruit',
      }) as FruitBody;
      body.fruitIndex = idx;
      body.bornAt = performance.now();
      return body;
    };

    const drop = () => {
      if (gameOver) return;
      const now = performance.now();
      if (now - lastDrop < DROP_COOLDOWN) return;
      const r = radiusOf(current);
      const x = Math.max(r + 2, Math.min(aimX, W - r - 2));
      Composite.add(world, makeFruit(x, dropY, current));
      lastDrop = now;
      current = randSpawn();
    };

    Events.on(engine, 'collisionStart', (e) => {
      for (const pair of e.pairs) {
        const a = pair.bodyA as FruitBody;
        const b = pair.bodyB as FruitBody;
        if (a.label !== 'fruit' || b.label !== 'fruit') continue;
        if (a.fruitIndex !== b.fruitIndex) continue;
        if (consumed.has(a.id) || consumed.has(b.id)) continue;
        consumed.add(a.id);
        consumed.add(b.id);
        merges.push([a, b, a.fruitIndex]);
      }
    });

    const updateAim = (clientX: number) => {
      aimX = clientX - canvas.getBoundingClientRect().left;
    };
    const onDown = (e: PointerEvent) => {
      if (gameOver) return;
      canvas.setPointerCapture(e.pointerId);
      updateAim(e.clientX);
    };
    const onMove = (e: PointerEvent) => updateAim(e.clientX);
    const onUp = (e: PointerEvent) => {
      updateAim(e.clientX);
      drop();
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);

    const drawFruit = (x: number, y: number, idx: number, alpha = 1) => {
      const r = radiusOf(idx);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = FRUITS[idx].color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(12,35,64,0.55)';
      ctx.stroke();
      ctx.font = `${Math.round(r * 1.2)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(FRUITS[idx].emoji, x, y + r * 0.06);
      ctx.globalAlpha = 1;
    };

    const triggerOver = () => {
      gameOver = true;
      setOver(true);
      const prevBest = Number(localStorage.getItem(BEST_KEY) || 0);
      if (scoreLocal > prevBest) {
        try {
          localStorage.setItem(BEST_KEY, String(scoreLocal));
        } catch {
          /* ignore */
        }
        setBest(scoreLocal);
      }
    };

    const reset = () => {
      for (const b of Composite.allBodies(world)) {
        if (b.label === 'fruit') Composite.remove(world, b);
      }
      scoreLocal = 0;
      overTimer = 0;
      gameOver = false;
      current = randSpawn();
      setScore(0);
      setOver(false);
    };
    resetRef.current = reset;

    setBest(Number(localStorage.getItem(BEST_KEY) || 0));

    const loop = () => {
      const now = performance.now();
      const dt = Math.min(now - lastT, 32);
      lastT = now;

      if (!gameOver) Engine.update(engine, dt);

      // Resolve merges queued by collisionStart during the step.
      if (merges.length) {
        for (const [a, b, idx] of merges) {
          Composite.remove(world, a);
          Composite.remove(world, b);
          const nx = (a.position.x + b.position.x) / 2;
          const ny = (a.position.y + b.position.y) / 2;
          const nIdx = idx + 1;
          scoreLocal += idx + 1;
          if (nIdx < FRUITS.length) {
            Composite.add(world, makeFruit(nx, ny, nIdx));
          } else {
            scoreLocal += 20; // two watermelons — big bonus, clears space
          }
        }
        merges.length = 0;
        setScore(scoreLocal);
      }
      consumed.clear();

      // Game over if a settled fruit sits above the danger line for too long.
      if (!gameOver) {
        let danger = false;
        for (const b of world.bodies) {
          const fb = b as FruitBody;
          if (fb.label !== 'fruit') continue;
          const r = fb.circleRadius ?? 0;
          const speed = Math.hypot(fb.velocity.x, fb.velocity.y);
          if (speed < 0.7 && now - fb.bornAt > 700 && fb.position.y - r < lineY) {
            danger = true;
            break;
          }
        }
        overTimer = danger ? overTimer + dt : 0;
        if (overTimer > 1400) triggerOver();
      }

      // --- render ---
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f4f9ff';
      ctx.fillRect(0, 0, W, H);

      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeStyle =
        gameOver || overTimer > 0 ? 'rgba(239,68,68,0.85)' : 'rgba(12,35,64,0.18)';
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(W, lineY);
      ctx.stroke();
      ctx.setLineDash([]);

      for (const b of world.bodies) {
        const fb = b as FruitBody;
        if (fb.label !== 'fruit') continue;
        drawFruit(fb.position.x, fb.position.y, fb.fruitIndex);
      }

      if (!gameOver) {
        const r = radiusOf(current);
        const x = Math.max(r + 2, Math.min(aimX, W - r - 2));
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(12,35,64,0.15)';
        ctx.beginPath();
        ctx.moveTo(x, dropY + r);
        ctx.lineTo(x, H);
        ctx.stroke();
        ctx.setLineDash([]);
        drawFruit(x, dropY, current, 0.92);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      Events.off(engine, 'collisionStart');
      Composite.clear(world, false);
      Engine.clear(engine);
    };
  }, []);

  return (
    <div ref={wrapRef} className="flex w-full max-w-sm flex-col items-center gap-2">
      <div className="flex w-full items-center justify-between px-1 font-display text-sm">
        <span className="text-ink">
          Score <span className="font-bold text-magenta">{score}</span>
        </span>
        <span className="text-grape/70">Best {best}</span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-white shadow-sm">
        <canvas ref={canvasRef} className="block touch-none select-none" />
        {over && (
          <div className="absolute inset-0 grid place-items-center bg-ink/60">
            <div className="flex flex-col items-center gap-3 px-4 text-center">
              <p className="font-display text-2xl font-bold text-white">
                Game over!
              </p>
              <p className="font-display text-white">Score {score}</p>
              <button
                onClick={() => resetRef.current()}
                className="rounded-2xl bg-linear-to-br from-magenta to-cyan px-5 py-2.5 font-display font-semibold text-white shadow-lg active:scale-95"
              >
                Play again 🍉
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-grape/60">
        Drag to aim, release to drop. Merge matching fruit! 🍒→🍉
      </p>
    </div>
  );
}
