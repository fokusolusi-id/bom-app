"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const ROAR = "/teaser/TIGER_ROAR_Angry.wav";
const LAYERS = 9;
const DEPTH = 3;
const MAX_TILT = 20;
const SCRATCH_MS = 1200;
/** How close the mouse must be, in half-widths of the stage from its centre: about the size of the logo itself. */
const NEAR = 0.7;

/**
 * The homepage logo on its claw marks. The three claws scratch in together from the top down; the logo sits in the middle as a
 * stack of layers, so it has real thickness and tilts toward the mouse. Each time the mouse comes onto the logo the claws scratch
 * again; the tiger roars only once per visit (the first time the sound can play), through to its end and never looped. The sound is played through the Web Audio API, which needs the visitor to have clicked, tapped or pressed a key on the
 * page once (that first touch unlocks it).
 */
export function ClawHero() {
  const stage = useRef<HTMLDivElement>(null);
  const ctx = useRef<AudioContext | null>(null);
  const roarSound = useRef<AudioBuffer | null>(null);
  const roared = useRef(false);
  const lastScratch = useRef(0);
  const wasNear = useRef(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [scratch, setScratch] = useState(0);

  // Load the roar once. The audio context starts suspended; the first click, tap or key press resumes it.
  useEffect(() => {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const c = new Context();
    ctx.current = c;
    let cancelled = false;
    fetch(ROAR).then((r) => r.arrayBuffer()).then((data) => c.decodeAudioData(data)).then((decoded) => { if (!cancelled) roarSound.current = decoded; }).catch(() => {});
    const unlock = () => { void c.resume().catch(() => {}); };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      void c.close().catch(() => {});
      ctx.current = null;
    };
  }, []);

  /** The one roar of the visit: played through, never looped or cut short. A hover before the page has been touched is silent and does not use it up. */
  const roar = useCallback(() => {
    const c = ctx.current;
    const buffer = roarSound.current;
    if (!c || !buffer || c.state !== "running" || roared.current) return;
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.loop = false;
    const volume = c.createGain();
    volume.gain.value = 0.7;
    source.connect(volume).connect(c.destination);
    roared.current = true;
    source.start();
  }, []);

  // The mouse came onto the logo: the claws scratch (not again while they are still being drawn) and the tiger roars.
  const approach = useCallback(() => {
    const now = Date.now();
    if (now - lastScratch.current > SCRATCH_MS) {
      lastScratch.current = now;
      setScratch((n) => n + 1);
    }
    roar();
  }, [roar]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const box = stage.current?.getBoundingClientRect();
      if (!box) return;
      // Direction and distance of the mouse from the centre of the logo, in half-widths of the stage.
      const dx = (e.clientX - (box.left + box.width / 2)) / (box.width / 2);
      const dy = (e.clientY - (box.top + box.height / 2)) / (box.height / 2);
      const distance = Math.hypot(dx, dy);
      const strength = Math.max(0, 1 - distance / 2.2);
      setTilt({ x: -Math.max(-1, Math.min(1, dy)) * MAX_TILT * strength, y: Math.max(-1, Math.min(1, dx)) * MAX_TILT * strength });
      const near = distance < NEAR;
      if (near && !wasNear.current) approach();
      wasNear.current = near;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [approach]);

  return (
    <div ref={stage} className="relative mx-auto aspect-square w-full max-w-[36rem] max-md:max-w-[22rem] select-none [perspective:900px]" onPointerDown={() => { void ctx.current?.resume().then(approach).catch(() => {}); }}>
      <div
        className="absolute inset-0 transition-transform duration-150 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        {/* The claws, behind the logo. Remounted on every approach of the mouse, so they scratch again. */}
        <div key={scratch} className="absolute inset-[-14%] max-md:inset-[-4%] [transform:translateZ(-30px)]" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- a decorative layer, drawn by a CSS mask */}
          <img src="/brand/claw.png" alt="" draggable={false} className="claw-layer absolute inset-0 size-full object-contain" />
        </div>
        {/* The logo as a stack of copies: darker and deeper behind, so it has thickness when it tilts. */}
        <div className="absolute inset-[18%] [transform-style:preserve-3d]">
          {Array.from({ length: LAYERS }, (_, i) => {
            const front = i === LAYERS - 1;
            return (
              <Image
                key={i} src="/brand/logo-768.png" alt={front ? "Beyblade of Medan logo" : ""} aria-hidden={front ? undefined : true} width={420} height={420} priority={front} draggable={false}
                className="absolute inset-0 size-full object-contain"
                style={{ transform: `translateZ(${(i - (LAYERS - 1)) * DEPTH}px)`, filter: front ? undefined : `brightness(${0.18 + (i / LAYERS) * 0.3}) saturate(0.7)` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
