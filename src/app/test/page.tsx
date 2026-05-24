"use client"
// Test page - safe to delete after verification

import { useRef, useEffect, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Cormorant_Garamond, Inter } from "next/font/google"

gsap.registerPlugin(ScrollTrigger, useGSAP)

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400"] })
const inter = Inter({ subsets: ["latin"], weight: ["400", "500"] })

const HEADING = "TEST SAHNESI"
const REVEAL_HEADING = "TEST BASARILI"

type Particle = {
  id: number; x: number; y: number
  size: number; duration: number; yMove: number; opacity: number
}

export default function TestPage() {
  const containerRef  = useRef<HTMLDivElement>(null)
  const heroRef       = useRef<HTMLDivElement>(null)
  const headingRef    = useRef<HTMLHeadingElement>(null)
  const subtitleRef   = useRef<HTMLParagraphElement>(null)
  const lineRef       = useRef<HTMLDivElement>(null)
  const beam1Ref      = useRef<HTMLDivElement>(null)
  const beam2Ref      = useRef<HTMLDivElement>(null)
  const beam3Ref      = useRef<HTMLDivElement>(null)
  const beamsRef      = useRef<HTMLDivElement>(null)
  const secondHeadRef = useRef<HTMLHeadingElement>(null)
  const revealRef     = useRef<HTMLDivElement>(null)
  const revealHeadRef = useRef<HTMLHeadingElement>(null)
  const revealSubRef  = useRef<HTMLParagraphElement>(null)
  const cardsRef      = useRef<HTMLDivElement>(null)
  const cursorDotRef  = useRef<HTMLDivElement>(null)
  const cursorRingRef = useRef<HTMLDivElement>(null)
  const particlesRef  = useRef<HTMLDivElement>(null)

  // Particles generated client-side only — avoids SSR/hydration mismatch
  const [particles, setParticles] = useState<Particle[]>([])
  useEffect(() => {
    setParticles(
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 4 + 8,
        yMove: Math.random() * 100 + 100,
        opacity: Math.random() * 0.4 + 0.4,
      }))
    )
  }, [])

  // --- MOUSE PARALLAX + CURSOR (rAF, runs outside GSAP scheduler) ---
  const mouse   = useRef({ x: 0, y: 0 })
  const b1      = useRef({ x: 0, y: 0 })
  const b2      = useRef({ x: 0, y: 0 })
  const b3      = useRef({ x: 0, y: 0 })
  const cursor  = useRef({ x: 0, y: 0 })
  const rafId   = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }
    window.addEventListener("mousemove", onMove)

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const tick = () => {
      const cx = window.innerWidth  / 2
      const cy = window.innerHeight / 2
      const dx = mouse.current.x - cx
      const dy = mouse.current.y - cy

      // Beam 1 — large, slow (0.08 lerp, 0.5x range = up to 120px at edge)
      b1.current.x = lerp(b1.current.x, dx * 0.5, 0.08)
      b1.current.y = lerp(b1.current.y, dy * 0.5, 0.08)
      // Beam 2 — medium, slower (depth layer)
      b2.current.x = lerp(b2.current.x, dx * 0.25, 0.05)
      b2.current.y = lerp(b2.current.y, dy * 0.25, 0.05)
      // Beam 3 — small, fastest (accent)
      b3.current.x = lerp(b3.current.x, dx * 0.8, 0.12)
      b3.current.y = lerp(b3.current.y, dy * 0.8, 0.12)

      if (beam1Ref.current) gsap.set(beam1Ref.current, { x: b1.current.x, y: b1.current.y })
      if (beam2Ref.current) gsap.set(beam2Ref.current, { x: b2.current.x, y: b2.current.y })
      if (beam3Ref.current) gsap.set(beam3Ref.current, { x: b3.current.x, y: b3.current.y })

      // Cursor ring — lerp follow
      cursor.current.x = lerp(cursor.current.x, mouse.current.x, 0.15)
      cursor.current.y = lerp(cursor.current.y, mouse.current.y, 0.15)
      if (cursorDotRef.current) {
        cursorDotRef.current.style.left = mouse.current.x + "px"
        cursorDotRef.current.style.top  = mouse.current.y + "px"
      }
      if (cursorRingRef.current) {
        cursorRingRef.current.style.left = cursor.current.x + "px"
        cursorRingRef.current.style.top  = cursor.current.y + "px"
      }

      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(rafId.current)
    }
  }, [])

  // --- PARTICLE ANIMATIONS — re-runs once particles are set ---
  useGSAP(() => {
    if (particles.length === 0) return
    const els = particlesRef.current?.querySelectorAll<HTMLElement>(".particle")
    els?.forEach((el) => {
      const dur   = parseFloat(el.dataset.dur   ?? "10")
      const yMove = parseFloat(el.dataset.ymove ?? "150")
      const op    = parseFloat(el.dataset.op    ?? "0.6")
      gsap.fromTo(
        el,
        { y: 0, opacity: op },
        {
          y: -yMove,
          opacity: 0,
          duration: dur,
          ease: "none",
          repeat: -1,
          delay: -(Math.random() * dur), // start at random phase
        }
      )
    })
  }, [particles])

  // --- MAIN GSAP ANIMATIONS ---
  useGSAP(
    () => {
      // HERO ENTRY — letter-by-letter, 3D rotateX + blur
      const chars = headingRef.current?.querySelectorAll<HTMLElement>(".char")
      if (chars && chars.length > 0) {
        gsap.set(chars, { transformPerspective: 600, transformOrigin: "50% 0%" })
        gsap.fromTo(
          chars,
          { y: 100, autoAlpha: 0, rotateX: -90, filter: "blur(20px)" },
          {
            y: 0,
            autoAlpha: 1,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 1.5,
            stagger: 0.04,
            ease: "expo.out",
            delay: 0.15,
          }
        )
      }

      // Amber line: draws left to right after heading finishes
      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 1.2, delay: 1.55, ease: "expo.inOut", transformOrigin: "left center" }
      )

      // Subtitle slide-up after heading
      gsap.fromTo(
        subtitleRef.current,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.9, delay: 1.85, ease: "power2.out" }
      )

      // PIN SCENE — hero pinned for 100vh of scroll
      // Uses a scrubbed timeline; total duration = 1 "second" mapped to the scroll range
      const pinTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "+=100%",
          pin: true,
          pinSpacing: true,
          scrub: 1,
        },
      })

      pinTl
        // 0 → 1: heading scales and translates out
        .to(headingRef.current, { scale: 0.3, y: -200, autoAlpha: 0, ease: "none", duration: 1 }, 0)
        .to(subtitleRef.current, { autoAlpha: 0, y: -40, ease: "none", duration: 0.6 }, 0)
        .to(lineRef.current, { scaleX: 0, autoAlpha: 0, ease: "none", duration: 0.5 }, 0)
        // 0 → 1: beams fade out
        .to(beamsRef.current, { autoAlpha: 0, ease: "none", duration: 0.8 }, 0)
        // 0 → 1: bg fades to pure black
        .to(heroRef.current, { backgroundColor: "#000000", ease: "none", duration: 1 }, 0)
        // 0.5 → 1: second heading enters in second half of scroll
        .fromTo(
          secondHeadRef.current,
          { autoAlpha: 0, y: 30, letterSpacing: "0.5em" },
          { autoAlpha: 1, y: 0, letterSpacing: "0.06em", ease: "none", duration: 0.5 },
          0.5
        )

      // REVEAL SCENE — split letters with 3D rotateX
      const revealChars = revealHeadRef.current?.querySelectorAll<HTMLElement>(".reveal-char")
      if (revealChars && revealChars.length > 0) {
        gsap.set(revealChars, { transformPerspective: 600, transformOrigin: "50% 0%" })
        gsap.fromTo(
          revealChars,
          { y: 80, autoAlpha: 0, rotateX: -60, filter: "blur(10px)" },
          {
            y: 0,
            autoAlpha: 1,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 1.2,
            stagger: 0.04,
            ease: "expo.out",
            scrollTrigger: {
              trigger: revealRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse",
            },
          }
        )
      }

      gsap.fromTo(
        revealSubRef.current,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out",
          scrollTrigger: {
            trigger: revealRef.current,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        }
      )

      // STATUS CARDS — y:80→0, scale:0.95→1, stagger 0.15, glow on entrance
      const cardEls = cardsRef.current?.querySelectorAll<HTMLElement>(".status-card")
      if (cardEls && cardEls.length > 0) {
        gsap.fromTo(
          cardEls,
          { autoAlpha: 0, y: 80, scale: 0.95 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cardsRef.current,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
            onComplete() {
              gsap.fromTo(
                cardEls,
                { boxShadow: "0 0 0px rgba(212,149,74,0)" },
                {
                  boxShadow: "0 0 28px rgba(212,149,74,0.35)",
                  duration: 0.5,
                  stagger: 0.08,
                  yoyo: true,
                  repeat: 1,
                  ease: "power2.inOut",
                }
              )
            },
          }
        )
      }
    },
    { scope: containerRef }
  )

  return (
    <>
      {/* Custom cursor */}
      <div
        ref={cursorDotRef}
        className="fixed pointer-events-none z-[9999]"
        style={{ width: 7, height: 7, backgroundColor: "#f5b266", borderRadius: "50%", transform: "translate(-50%,-50%)" }}
      />
      <div
        ref={cursorRingRef}
        className="fixed pointer-events-none z-[9998]"
        style={{ width: 38, height: 38, border: "1px solid rgba(245,178,102,0.55)", borderRadius: "50%", transform: "translate(-50%,-50%)" }}
      />

      <div ref={containerRef} style={{ cursor: "none" }}>

        {/* ---- HERO ---- */}
        <div
          ref={heroRef}
          className="relative flex items-center justify-center overflow-hidden"
          style={{ height: "100vh", backgroundColor: "#0a0806" }}
        >
          {/* Static ambient center glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(40,18,4,0.9) 0%, rgba(10,8,6,1) 75%)" }}
          />

          {/* 3-layer parallax beams */}
          <div ref={beamsRef} className="absolute inset-0 pointer-events-none">
            {/* Layer 1 — large, slowest */}
            <div
              ref={beam1Ref}
              className="absolute rounded-full"
              style={{
                width: 600, height: 600,
                top: "calc(50% - 300px)", left: "calc(50% - 300px)",
                background: "radial-gradient(ellipse at center, rgba(245,178,102,0.22) 0%, rgba(245,178,102,0.07) 45%, transparent 70%)",
                filter: "blur(60px)",
                opacity: 0.85,
              }}
            />
            {/* Layer 2 — medium, slow (depth) */}
            <div
              ref={beam2Ref}
              className="absolute rounded-full"
              style={{
                width: 420, height: 420,
                top: "calc(50% - 210px)", left: "calc(50% - 210px)",
                background: "radial-gradient(ellipse at center, rgba(245,178,102,0.35) 0%, rgba(245,178,102,0.1) 40%, transparent 65%)",
                filter: "blur(40px)",
                opacity: 0.75,
              }}
            />
            {/* Layer 3 — small, fastest */}
            <div
              ref={beam3Ref}
              className="absolute rounded-full"
              style={{
                width: 220, height: 220,
                top: "calc(50% - 110px)", left: "calc(50% - 110px)",
                background: "radial-gradient(ellipse at center, rgba(245,178,102,0.6) 0%, transparent 65%)",
                filter: "blur(25px)",
                opacity: 0.7,
              }}
            />
          </div>

          {/* Floating dust particles */}
          <div ref={particlesRef} className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
              <div
                key={p.id}
                className="particle absolute rounded-full"
                data-dur={p.duration}
                data-ymove={p.yMove}
                data-op={p.opacity}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: "#f5b266",
                  opacity: p.opacity,
                  filter: "blur(1px)",
                }}
              />
            ))}
          </div>

          {/* Heading + line + subtitle */}
          <div className="relative z-10 text-center px-8">
            <h1
              ref={headingRef}
              className={cormorant.className}
              style={{ fontSize: "9vw", fontWeight: 300, color: "#fff", letterSpacing: "0.06em", lineHeight: 1, margin: 0 }}
            >
              {HEADING.split("").map((char, i) => (
                <span
                  key={i}
                  className="char"
                  style={{ display: "inline-block", opacity: 0, ...(char === " " ? { width: "0.35em" } : {}) }}
                >
                  {char === " " ? " " : char}
                </span>
              ))}
            </h1>

            {/* Amber underline */}
            <div className="flex justify-center" style={{ marginTop: "1.4rem", marginBottom: "1.4rem" }}>
              <div
                ref={lineRef}
                style={{ width: "min(340px, 55vw)", height: 1, backgroundColor: "#d4954a", transformOrigin: "left center", transform: "scaleX(0)" }}
              />
            </div>

            <p
              ref={subtitleRef}
              className={inter.className}
              style={{ fontSize: "0.7rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "#4a4a4a", margin: 0, visibility: "hidden" }}
            >
              GSAP + ScrollTrigger calismiyorsa burada problem var
            </p>
          </div>

          {/* Secondary heading — enters during pin second half */}
          <h2
            ref={secondHeadRef}
            className={cormorant.className}
            style={{ position: "absolute", fontSize: "3.5vw", fontWeight: 300, color: "#d4954a", letterSpacing: "0.06em", margin: 0, visibility: "hidden" }}
          >
            ASAGI YOLCULUK BASLADI
          </h2>
        </div>

        {/* ---- REVEAL ---- */}
        <div
          ref={revealRef}
          className="flex flex-col items-center justify-start px-8"
          style={{ minHeight: "200vh", backgroundColor: "#000", paddingTop: "18vh" }}
        >
          <div className="text-center mb-20">
            <h2
              ref={revealHeadRef}
              className={cormorant.className}
              style={{ fontSize: "clamp(3rem, 6vw, 6.5rem)", fontWeight: 300, color: "#fff", letterSpacing: "0.04em", margin: 0 }}
            >
              {REVEAL_HEADING.split("").map((char, i) => (
                <span
                  key={i}
                  className="reveal-char"
                  style={{ display: "inline-block", opacity: 0, ...(char === " " ? { width: "0.3em" } : {}) }}
                >
                  {char === " " ? " " : char}
                </span>
              ))}
            </h2>
            <p
              ref={revealSubRef}
              className={inter.className}
              style={{ marginTop: "1rem", fontSize: "0.65rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#404040", visibility: "hidden" }}
            >
              Pipeline aktif
            </p>
          </div>

          <div ref={cardsRef} className="w-full max-w-sm flex flex-col gap-px">
            {["GSAP Core", "ScrollTrigger", "Pin + Scrub"].map(label => (
              <div
                key={label}
                className="status-card flex justify-between items-center px-6 py-4"
                style={{ backgroundColor: "#0a0806", border: "1px solid #1c1c1c", visibility: "hidden" }}
              >
                <span className={inter.className} style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#525252" }}>
                  {label}
                </span>
                <span className={inter.className} style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#d4954a" }}>
                  Aktif
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
