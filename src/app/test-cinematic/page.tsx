"use client"
// Cinematic scrollytelling test — safe to delete after verification

import { useRef, useEffect, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Cormorant_Garamond, Inter } from "next/font/google"

gsap.registerPlugin(ScrollTrigger, useGSAP)

const cg = Cormorant_Garamond({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "600"], style: ["normal", "italic"] })
const it = Inter({ subsets: ["latin"], weight: ["300", "400", "500"] })

// ─── helpers ──────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const d2 = (ax: number, ay: number, bx: number, by: number) =>
  Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2)
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

type M   = { x: number; y: number }
type MRef = React.MutableRefObject<M>
type ARef = React.MutableRefObject<boolean>

// ─── SCENE 0 — HYPERDRIVE TUNNEL ──────────────────────────────────────────────
function initScene0(cv: HTMLCanvasElement, m: MRef, active: ARef) {
  const ctx = cv.getContext("2d")!
  const FL  = 300 // focal length

  const stars = Array.from({ length: 200 }, () => ({
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: Math.random(),
    baseSize: Math.random() * 1.8 + 0.4,
    cream: Math.random() > 0.88,
    px: 0, py: 0, reset: true,
  }))

  const blobs = [
    { nx: 0.28, ny: 0.42, rx: 280, ry: 200, op: 0.10 },
    { nx: 0.72, ny: 0.58, rx: 320, ry: 240, op: 0.07 },
  ]

  let id = 0
  function resize() { cv.width = cv.offsetWidth || 1; cv.height = cv.offsetHeight || 1 }
  resize()
  window.addEventListener("resize", resize)

  function draw() {
    id = requestAnimationFrame(draw)
    if (!active.current) return

    ctx.clearRect(0, 0, cv.width, cv.height)

    const rect = cv.getBoundingClientRect()
    const mx  = m.current.x - rect.left
    const my  = m.current.y - rect.top
    const xd  = Math.abs(mx - cv.width  * 0.5) / (cv.width  * 0.5)
    const speed = 0.004 * (0.5 + xd * 2.0)  // 0.002 to 0.012 per frame

    // Tunnel center shifts toward cursor
    const tcx = lerp(cv.width  * 0.5, mx, 0.12)
    const tcy = lerp(cv.height * 0.5, my, 0.12)

    // Galaxy blobs (screen composite)
    ctx.save()
    ctx.globalCompositeOperation = "screen"
    blobs.forEach(b => {
      const bx = b.nx * cv.width  + (mx - cv.width * 0.5) * 0.06
      const by = b.ny * cv.height + (my - cv.height * 0.5) * 0.04
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, b.rx)
      g.addColorStop(0, `rgba(212,149,74,${b.op})`)
      g.addColorStop(0.5, `rgba(180,110,40,${b.op * 0.4})`)
      g.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = g
      ctx.beginPath(); ctx.ellipse(bx, by, b.rx, b.ry, 0, 0, Math.PI * 2); ctx.fill()
    })
    ctx.restore()

    // Stars
    stars.forEach(s => {
      s.z -= speed
      if (s.z <= 0.01) {
        s.x = (Math.random() - 0.5) * 1.8
        s.y = (Math.random() - 0.5) * 1.8
        s.z = 0.98 + Math.random() * 0.02
        s.reset = true
      }

      const sx = tcx + (s.x / s.z) * FL
      const sy = tcy + (s.y / s.z) * FL

      // Skip off-canvas stars
      if (sx < -50 || sx > cv.width + 50 || sy < -50 || sy > cv.height + 50) {
        s.reset = true; s.px = sx; s.py = sy; return
      }

      const sz   = clamp(s.baseSize / s.z, 0.3, 6)
      const op   = clamp(1 - s.z * 0.8, 0.1, 1)
      const col  = s.cream ? `rgba(244,234,216,${op})` : `rgba(245,178,102,${op})`

      // Motion trail
      if (!s.reset && s.px !== 0) {
        ctx.beginPath()
        ctx.moveTo(s.px, s.py)
        ctx.lineTo(sx, sy)
        const trailOp = op * 0.45
        ctx.strokeStyle = s.cream ? `rgba(244,234,216,${trailOp})` : `rgba(245,178,102,${trailOp})`
        ctx.lineWidth = sz * 0.45
        ctx.stroke()
      }

      // Star dot
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sz * 1.8)
      g.addColorStop(0, col)
      g.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(sx, sy, sz * 1.8, 0, Math.PI * 2); ctx.fill()

      s.px = sx; s.py = sy; s.reset = false
    })
  }
  draw()
  return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize) }
}

// ─── SCENE 1 — CONSTELLATION MAP ──────────────────────────────────────────────
function initScene1(cv: HTMLCanvasElement, m: MRef, active: ARef) {
  const ctx = cv.getContext("2d")!
  function resize() { cv.width = cv.offsetWidth || 1; cv.height = cv.offsetHeight || 1 }
  resize()
  window.addEventListener("resize", resize)

  const stars = Array.from({ length: 80 }, (_, i) => ({
    nx: Math.random(), ny: Math.random(),
    r: i < 10 ? Math.random() * 2.5 + 2.5 : Math.random() * 1.2 + 0.4,
    anchor: i < 10,
    phase: Math.random() * Math.PI * 2,
    twSpeed: Math.random() * 0.025 + 0.008,
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.12,
  }))

  const ring = Array.from({ length: 36 }, (_, i) => ({
    angle: (i / 36) * Math.PI * 2,
    speed: 0.00025,
  }))

  let t = 0, id = 0

  function drawFlare(x: number, y: number, r: number, op: number) {
    [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4].forEach(angle => {
      const len = r * 4.5
      ctx.beginPath()
      ctx.moveTo(x - Math.cos(angle) * len, y - Math.sin(angle) * len)
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
      ctx.strokeStyle = `rgba(244,234,216,${op * 0.35})`
      ctx.lineWidth = 0.6
      ctx.stroke()
    })
  }

  function draw() {
    id = requestAnimationFrame(draw)
    if (!active.current) return
    t += 0.018

    ctx.clearRect(0, 0, cv.width, cv.height)
    const rect = cv.getBoundingClientRect()
    const mx = m.current.x - rect.left
    const my = m.current.y - rect.top

    // Nebula edge glow
    const neb = ctx.createRadialGradient(cv.width * 0.5, cv.height * 0.5, cv.width * 0.15,
      cv.width * 0.5, cv.height * 0.5, cv.width * 0.75)
    neb.addColorStop(0, "rgba(0,0,0,0)")
    neb.addColorStop(0.6, "rgba(40,18,6,0.08)")
    neb.addColorStop(1, "rgba(60,24,6,0.22)")
    ctx.fillStyle = neb; ctx.fillRect(0, 0, cv.width, cv.height)

    // Outer ring
    const rr = Math.min(cv.width, cv.height) * 0.42
    ring.forEach(rs => {
      rs.angle += rs.speed
      const rx = cv.width * 0.5 + Math.cos(rs.angle) * rr
      const ry = cv.height * 0.5 + Math.sin(rs.angle) * rr * 0.75
      const ro = 0.07 + Math.abs(Math.sin(rs.angle * 4 + t)) * 0.06
      ctx.fillStyle = `rgba(212,149,74,${ro})`
      ctx.beginPath(); ctx.arc(rx, ry, 0.8, 0, Math.PI * 2); ctx.fill()
    })

    // Update + store star screen positions
    const spos = stars.map(s => {
      s.nx += s.vx / cv.width; s.ny += s.vy / cv.height
      if (s.nx < 0) s.nx = 1; if (s.nx > 1) s.nx = 0
      if (s.ny < 0) s.ny = 1; if (s.ny > 1) s.ny = 0
      return { x: s.nx * cv.width, y: s.ny * cv.height }
    })

    // Constellation lines
    stars.forEach((a, i) => {
      stars.slice(i + 1).forEach((b, j) => {
        const di = d2(spos[i].x, spos[i].y, spos[i + 1 + j].x, spos[i + 1 + j].y)
        if (di > 160) return
        const nearMouse = d2(spos[i].x, spos[i].y, mx, my) < 200 || d2(spos[i + 1 + j].x, spos[i + 1 + j].y, mx, my) < 200
        const baseOp = (1 - di / 160) * 0.22
        const op = nearMouse ? baseOp * 3.5 : baseOp
        const g = ctx.createLinearGradient(spos[i].x, spos[i].y, spos[i + 1 + j].x, spos[i + 1 + j].y)
        g.addColorStop(0, `rgba(212,149,74,${op})`)
        g.addColorStop(0.5, `rgba(245,178,102,${op * 1.3})`)
        g.addColorStop(1, `rgba(212,149,74,${op})`)
        ctx.beginPath(); ctx.moveTo(spos[i].x, spos[i].y); ctx.lineTo(spos[i + 1 + j].x, spos[i + 1 + j].y)
        ctx.strokeStyle = g; ctx.lineWidth = nearMouse ? 0.9 : 0.4; ctx.stroke()
      })
    })

    // Draw stars
    stars.forEach((s, i) => {
      const { x, y } = spos[i]
      const tw = 0.65 + Math.sin(t * s.twSpeed * 60 + s.phase) * 0.35
      const r  = s.r * tw
      const op = s.anchor ? 0.7 + tw * 0.3 : 0.4 + tw * 0.4
      if (s.anchor) {
        const ag = ctx.createRadialGradient(x, y, 0, x, y, r * 5)
        ag.addColorStop(0, `rgba(244,234,216,${op * 0.9})`)
        ag.addColorStop(0.3, `rgba(245,178,102,${op * 0.5})`)
        ag.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(x, y, r * 5, 0, Math.PI * 2); ctx.fill()
        drawFlare(x, y, r, op * tw)
      }
      ctx.fillStyle = s.anchor ? `rgba(244,234,216,${op})` : `rgba(245,178,102,${op})`
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    })
  }
  draw()
  return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize) }
}

// ─── SCENE 2 — DATA RAIN ──────────────────────────────────────────────────────
function initScene2(cv: HTMLCanvasElement, m: MRef, active: ARef): () => void {
  const ctx = cv.getContext("2d")!
  const FS        = 16
  const CHARS     = "0123456789İŞĞÜÖÇ₺$€%↑↓→✓"
  const BIZ_WORDS = ["VERİ", "RAPOR", "BELGE", "AKIŞ", "KARAR", "TREND", "ANALİZ"]

  type Col  = { x: number; y: number; lastY: number; speed: number; burst: number; wordBuf: string }
  type Drop = { x: number; y: number; char: string; op: number }

  let cols: Col[] = []
  const drops: Drop[] = []
  let frame = 0, id = 0

  function randChar() { return CHARS[Math.floor(Math.random() * CHARS.length)] }

  function buildCols() {
    const n   = clamp(Math.floor(cv.width / FS), 40, 90)
    const colW = cv.width / n
    cols = Array.from({ length: n }, (_, i) => ({
      x:     (i + 0.5) * colW,
      y:     -Math.random() * cv.height * 1.5,
      lastY: -9999,
      speed: 0.8 + Math.random() * 2.2,
      burst: 0,
      wordBuf: "",
    }))
  }

  function resize() {
    cv.width  = cv.offsetWidth  || 1
    cv.height = cv.offsetHeight || 1
    buildCols()
  }
  resize()
  window.addEventListener("resize", resize)

  let prevMX = -1, prevMY = -1

  function draw() {
    id = requestAnimationFrame(draw)
    if (!active.current) return
    frame++

    const rect = cv.getBoundingClientRect()
    const mx   = m.current.x - rect.left
    const my   = m.current.y - rect.top

    // Fade overlay — creates the trail by darkening previous frames
    ctx.fillStyle = "rgba(10,8,6,0.08)"
    ctx.fillRect(0, 0, cv.width, cv.height)

    ctx.font      = `${FS}px 'JetBrains Mono', monospace`
    ctx.textAlign = "center"

    // Mouse Y controls global fall speed
    const speedMult = clamp(0.35 + (my / (cv.height || 1)) * 2.0, 0.35, 2.35)

    // Inject a business word into a random free column every ~55 frames
    if (frame % 55 === 0) {
      const free = cols.filter(c => c.wordBuf.length === 0)
      if (free.length) {
        free[Math.floor(Math.random() * free.length)].wordBuf =
          BIZ_WORDS[Math.floor(Math.random() * BIZ_WORDS.length)]
      }
    }

    cols.forEach(col => {
      const xDist = Math.abs(col.x - mx)

      // Burst: cursor sweeps within 1 cell of column head
      if (xDist < FS && Math.abs(col.y - my) < FS * 4) col.burst = 50
      const bursting = col.burst > 0
      if (bursting) col.burst--

      // Wind: columns within 140px of cursor X get a speed boost
      const wind = xDist < 140 ? 1 + (1 - xDist / 140) * 1.8 : 1
      const eff  = col.speed * speedMult * wind * (bursting ? 2.5 : 1)

      col.y += eff

      // Reset column when far below viewport
      if (col.y > cv.height + FS * 20) {
        col.y    = -FS * (2 + Math.random() * 14)
        col.lastY = col.y - FS
      }

      // Draw one character each time head advances one cell
      if (col.y - col.lastY >= FS) {
        col.lastY = col.y

        // Word buffer takes priority over random chars
        let ch: string
        if (col.wordBuf.length > 0) {
          ch = col.wordBuf[0]
          col.wordBuf = col.wordBuf.slice(1)
        } else {
          ch = randChar()
        }

        if (col.y >= 0 && col.y <= cv.height) {
          ctx.shadowColor = bursting ? "#ffffff" : "#ffd89a"
          ctx.shadowBlur  = bursting ? 28 : 10
          ctx.fillStyle   = bursting ? "#ffffff" : "#ffd89a"
          ctx.fillText(ch, col.x, col.y)
          ctx.shadowBlur = 0
        }
      }
    })

    // Cursor trail: emit bright drops when mouse moves
    if (prevMX >= 0) {
      const moved = Math.hypot(mx - prevMX, my - prevMY)
      if (moved > 6 && mx > 0 && mx < cv.width && my > 0 && my < cv.height) {
        drops.push(
          { x: mx + (Math.random() - 0.5) * 28, y: my + (Math.random() - 0.5) * 8, char: randChar(), op: 0.95 },
          { x: mx + (Math.random() - 0.5) * 20, y: my + (Math.random() - 0.5) * 8, char: randChar(), op: 0.80 },
        )
        while (drops.length > 12) drops.shift()
      }
    }
    prevMX = mx; prevMY = my

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]
      d.y  += 2.2
      d.op -= 0.048
      if (d.op <= 0) { drops.splice(i, 1); continue }
      ctx.shadowColor = "#ffd89a"
      ctx.shadowBlur  = 14
      ctx.fillStyle   = `rgba(255,216,154,${d.op})`
      ctx.fillText(d.char, d.x, d.y)
      ctx.shadowBlur = 0
    }
  }

  draw()
  return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize) }
}

// ─── SCENE 3 — GALACTIC GRID (3D perspective) ────────────────────────────────
function initScene3(cv: HTMLCanvasElement, m: MRef, active: ARef) {
  const ctx = cv.getContext("2d")!
  function resize() { cv.width = cv.offsetWidth || 1; cv.height = cv.offsetHeight || 1 }
  resize()
  window.addEventListener("resize", resize)

  const GN = 22          // grid divisions
  const CS = 2.0         // world-space cell size
  const HALF = (GN - 1) * CS / 2
  const CAM_DIST = 42

  const BEACONS = [
    { gx: 3,  gz: 4,  orbitR: 0.85, speed: 0.022, phase: 0,   tilt: 0.38  },
    { gx: 11, gz: 11, orbitR: 1.10, speed: 0.016, phase: 2.1, tilt: 0.60  },
    { gx: 17, gz: 16, orbitR: 0.70, speed: 0.028, phase: 4.3, tilt: -0.45 },
  ]

  // Camera spherical coords (azimuth around Y, elevation above XZ)
  let camAz = 0.4, camEl = 0.52

  let t = 0, travP = 0, id = 0

  // Grid index → world-space (XZ plane, Y=0)
  const gw = (col: number, row: number) => ({
    x: col * CS - HALF,
    y: 0,
    z: row * CS - HALF,
  })

  // World → screen (true perspective from spherical camera)
  function proj(wx: number, wy: number, wz: number) {
    // Camera world position
    const cpx = Math.sin(camAz) * Math.cos(camEl) * CAM_DIST
    const cpy = Math.sin(camEl) * CAM_DIST
    const cpz = Math.cos(camAz) * Math.cos(camEl) * CAM_DIST

    // Camera basis vectors
    const fx = -cpx / CAM_DIST, fy = -cpy / CAM_DIST, fz = -cpz / CAM_DIST  // forward
    const rx =  Math.cos(camAz), ry = 0, rz = -Math.sin(camAz)               // right
    // up = right × forward
    const ux = ry * fz - rz * fy
    const uy = rz * fx - rx * fz
    const uz = rx * fy - ry * fx

    // Translate to camera-relative
    const dx = wx - cpx, dy = wy - cpy, dz = wz - cpz

    const depth  = dx * fx + dy * fy + dz * fz
    if (depth < 0.5) return null

    const FOV = Math.min(cv.width, cv.height) * 0.70
    return {
      x: cv.width  * 0.5 + ((dx * rx + dy * ry + dz * rz) / depth) * FOV,
      y: cv.height * 0.5 - ((dx * ux + dy * uy + dz * uz) / depth) * FOV,
      depth,
    }
  }

  type Cell = { col: number; row: number; depth: number; sx: number; sy: number }

  function draw() {
    id = requestAnimationFrame(draw)
    if (!active.current) return
    t += 0.018
    travP = (travP + 0.0025) % (BEACONS.length - 1)

    const rect = cv.getBoundingClientRect()
    const mx = m.current.x - rect.left
    const my = m.current.y - rect.top

    // Mouse → camera (smooth)
    camAz = lerp(camAz, 0.25 + (mx / (cv.width  || 1) - 0.5) * 2.2, 0.038)
    camEl = lerp(camEl, 0.18 + (1 - my / (cv.height || 1)) * 0.75, 0.038)

    ctx.clearRect(0, 0, cv.width, cv.height)

    const bwp = BEACONS.map(b => gw(b.gx, b.gz))

    // Collect + depth-sort all grid nodes (painter's algorithm)
    const cells: Cell[] = []
    for (let row = 0; row < GN; row++) {
      for (let col = 0; col < GN; col++) {
        const w = gw(col, row)
        const p = proj(w.x, w.y, w.z)
        if (!p) continue
        cells.push({ col, row, depth: p.depth, sx: p.x, sy: p.y })
      }
    }
    cells.sort((a, b) => b.depth - a.depth)

    const maxDepth = CAM_DIST * 2.8

    // Draw grid edges + nodes (far to near)
    cells.forEach(({ col, row, depth, sx, sy }) => {
      const fog  = clamp(1 - depth / maxDepth, 0.03, 1)
      const dm   = d2(sx, sy, mx, my)
      const glow = clamp(1 - dm / 190, 0, 1)
      const isB  = BEACONS.some(b => b.gx === col && b.gz === row)
      const pulse = isB ? 0.55 + Math.sin(t * 2.4 + col + row) * 0.45 : 0
      const lineOp = fog * (0.07 + glow * 0.40 + pulse * 0.30)
      const lw     = 0.4 + glow * 1.6 + pulse * 0.6

      // Right edge
      if (col < GN - 1) {
        const wr = gw(col + 1, row)
        const pr = proj(wr.x, wr.y, wr.z)
        if (pr) {
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(pr.x, pr.y)
          ctx.strokeStyle = `rgba(212,149,74,${lineOp})`
          ctx.lineWidth = lw; ctx.stroke()
        }
      }
      // Bottom edge
      if (row < GN - 1) {
        const ws = gw(col, row + 1)
        const ps = proj(ws.x, ws.y, ws.z)
        if (ps) {
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ps.x, ps.y)
          ctx.strokeStyle = `rgba(212,149,74,${lineOp})`
          ctx.lineWidth = lw; ctx.stroke()
        }
      }

      // Node dot
      if (isB) {
        const ng = ctx.createRadialGradient(sx, sy, 0, sx, sy, 16 * fog)
        ng.addColorStop(0, `rgba(245,178,102,${fog * (0.7 + pulse * 0.3)})`)
        ng.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(sx, sy, 16 * fog, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = `rgba(255,228,160,${fog})`
        ctx.beginPath(); ctx.arc(sx, sy, 3.8 * fog, 0, Math.PI * 2); ctx.fill()
      } else if (glow > 0.28) {
        ctx.fillStyle = `rgba(212,149,74,${fog * glow * 0.55})`
        ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill()
      }
    })

    // Beacon connection (dashed)
    ctx.setLineDash([4, 9]); ctx.strokeStyle = "rgba(212,149,74,0.30)"; ctx.lineWidth = 0.9
    ctx.beginPath()
    bwp.forEach((w, i) => {
      const p = proj(w.x, w.y, w.z)
      if (!p) return
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
    })
    ctx.stroke(); ctx.setLineDash([])

    // Traveling particle
    const seg = Math.floor(travP), frac = travP - seg
    const se  = Math.min(seg + 1, bwp.length - 1)
    const tp  = proj(
      bwp[seg].x + (bwp[se].x - bwp[seg].x) * frac, 0,
      bwp[seg].z + (bwp[se].z - bwp[seg].z) * frac,
    )
    if (tp) {
      const tg = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, 12)
      tg.addColorStop(0, "rgba(244,234,216,1)"); tg.addColorStop(1, "rgba(212,149,74,0)")
      ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(tp.x, tp.y, 12, 0, Math.PI * 2); ctx.fill()
    }

    // 3D beacon orbits
    BEACONS.forEach((b, bi) => {
      const wo  = bwp[bi]
      const ang = t * b.speed * 60 + b.phase
      const oR  = b.orbitR * CS

      // Orbit ring as 48-segment projected polyline
      ctx.beginPath()
      let first = true
      for (let k = 0; k <= 48; k++) {
        const a  = (k / 48) * Math.PI * 2
        const p = proj(
          wo.x + Math.cos(a) * oR,
          Math.sin(a) * oR * Math.sin(b.tilt),
          wo.z + Math.sin(a) * oR * Math.cos(b.tilt),
        )
        if (!p) continue
        if (first) { ctx.moveTo(p.x, p.y); first = false } else ctx.lineTo(p.x, p.y)
      }
      ctx.strokeStyle = "rgba(212,149,74,0.28)"; ctx.lineWidth = 0.75; ctx.stroke()

      // Particle 1
      const p1 = proj(
        wo.x + Math.cos(ang) * oR,
        Math.sin(ang) * oR * Math.sin(b.tilt),
        wo.z + Math.sin(ang) * oR * Math.cos(b.tilt),
      )
      if (p1) {
        ctx.fillStyle = "rgba(244,234,216,0.92)"
        ctx.beginPath(); ctx.arc(p1.x, p1.y, 2.5, 0, Math.PI * 2); ctx.fill()
      }

      // Particle 2 (counter-orbit, inner ring)
      const a2 = -ang * 1.4, oR2 = oR * 0.62
      const p2 = proj(
        wo.x + Math.cos(a2) * oR2,
        Math.sin(a2) * oR2 * Math.sin(-b.tilt * 0.8),
        wo.z + Math.sin(a2) * oR2 * Math.cos(-b.tilt * 0.8),
      )
      if (p2) {
        ctx.fillStyle = "rgba(212,149,74,0.78)"
        ctx.beginPath(); ctx.arc(p2.x, p2.y, 1.6, 0, Math.PI * 2); ctx.fill()
      }
    })
  }

  draw()
  return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize) }
}

// ─── SCENE 4 — SUPERNOVA AWAKENING ───────────────────────────────────────────
function initScene4(cv: HTMLCanvasElement, section: HTMLElement | null, m: MRef, active: ARef) {
  const ctx = cv.getContext("2d")!
  function resize() { cv.width = cv.offsetWidth || 1; cv.height = cv.offsetHeight || 1 }
  resize()
  window.addEventListener("resize", resize)

  type Wave    = { x: number; y: number; r: number; op: number; shock: boolean }
  type Spiral  = { x: number; y: number; vx: number; vy: number; av: number; r: number; op: number; decay: number }

  const waves: Wave[]   = []
  const spirals: Spiral[] = []
  let t = 0, lastWave = 0, id = 0

  function supernova(x: number, y: number) {
    waves.push({ x, y, r: 0, op: 1,    shock: true  })
    waves.push({ x, y, r: 0, op: 0.8,  shock: false })
    for (let k = 0; k < 50; k++) {
      const angle = (k / 50) * Math.PI * 2 + Math.random() * 0.4
      const speed = Math.random() * 6 + 3
      spirals.push({ x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        av: (Math.random() - 0.5) * 0.18,
        r:  Math.random() * 3 + 1,
        op: 0.9 + Math.random() * 0.1,
        decay: 0.012 + Math.random() * 0.008,
      })
    }
  }

  const onClick = (e: MouseEvent) => {
    if (!active.current) return
    const rect = cv.getBoundingClientRect()
    supernova(e.clientX - rect.left, e.clientY - rect.top)
  }
  window.addEventListener("click", onClick)

  function drawFlare(x: number, y: number, r: number, op: number) {
    [0, 0.52, 1.05, 1.57, 2.09, 2.62].forEach((a, i) => {
      const len = r * [4, 2.5, 6, 2, 3.5, 1.8][i]
      ctx.beginPath()
      ctx.moveTo(x - Math.cos(a) * len, y - Math.sin(a) * len)
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
      ctx.strokeStyle = `rgba(244,234,216,${op * 0.28})`
      ctx.lineWidth = 0.5; ctx.stroke()
    })
  }

  function draw() {
    id = requestAnimationFrame(draw)
    if (!active.current) return
    t += 0.03

    ctx.clearRect(0, 0, cv.width, cv.height)
    const rect = cv.getBoundingClientRect()
    const mx = m.current.x - rect.left
    const my = m.current.y - rect.top

    // Cosmic dust background
    const now = Date.now()
    if (now - lastWave > 1200) {
      waves.push({ x: mx, y: my, r: 0, op: 0.65, shock: false })
      lastWave = now
    }

    // Constant heartbeat
    const hb = 3 + Math.sin(t * 1.8) * 2.5
    const hg = ctx.createRadialGradient(mx, my, 0, mx, my, hb * 12)
    hg.addColorStop(0, `rgba(245,178,102,${0.25 + Math.sin(t * 1.8) * 0.1})`)
    hg.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(mx, my, hb * 12, 0, Math.PI * 2); ctx.fill()

    // Waves
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i]
      w.r += w.shock ? 5 : 2.5
      w.op -= w.shock ? 0.018 : 0.010
      if (w.op <= 0) { waves.splice(i, 1); continue }
      if (w.shock) {
        // Shockwave: thick bright ring
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(244,234,216,${w.op * 0.9})`
        ctx.lineWidth = 3.5; ctx.stroke()
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 0.88, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(245,178,102,${w.op * 0.5})`
        ctx.lineWidth = 1.5; ctx.stroke()
      } else {
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(212,149,74,${w.op})`
        ctx.lineWidth = 1.2; ctx.stroke()
      }
    }

    // Spiral particles
    for (let i = spirals.length - 1; i >= 0; i--) {
      const s = spirals[i]
      s.x += s.vx; s.y += s.vy
      s.vx *= 0.97; s.vy *= 0.97
      const angle = Math.atan2(s.vy, s.vx)
      s.vx += Math.cos(angle + Math.PI * 0.5) * s.av
      s.vy += Math.sin(angle + Math.PI * 0.5) * s.av
      s.op -= s.decay
      if (s.op <= 0) { spirals.splice(i, 1); continue }
      const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.5)
      sg.addColorStop(0, `rgba(244,234,216,${s.op})`)
      sg.addColorStop(1, "rgba(212,149,74,0)")
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2); ctx.fill()
    }

    // Lens flare at cursor
    drawFlare(mx, my, 8 + Math.sin(t * 2.5) * 2, 0.9)

    // Core dot
    ctx.fillStyle = "rgba(255,255,220,1)"
    ctx.beginPath(); ctx.arc(mx, my, 3.5 + Math.sin(t * 3) * 1.2, 0, Math.PI * 2); ctx.fill()
  }
  draw()
  return () => {
    cancelAnimationFrame(id)
    window.removeEventListener("resize", resize)
    window.removeEventListener("click", onClick)
  }
}

// ─── static data ──────────────────────────────────────────────────────────────
const HERO_WORDS = ["CLAUDE'U", "sizin", "için", "İŞLETİYORUZ"]
const SERVICES = [
  { name: "Belge Asistanı",    desc: "PDF · fatura · yapılandırma" },
  { name: "İletişim Asistanı", desc: "E-posta · WhatsApp taslakları" },
  { name: "Veri Asistanı",     desc: "Excel raporları ve tahminler" },
  { name: "Süreç Asistanı",    desc: "Tekrarlı işleri otomatikleştir" },
  { name: "Karar Asistanı",    desc: "Yönetici için aylık özet" },
  { name: "Özel Çözüm",        desc: "Sektörünüze özel geliştirme" },
]
const STEPS = [
  { num: "01", label: "Keşif",    desc: "İşletmenizi ve süreçlerinizi anlıyoruz." },
  { num: "02", label: "Kurulum",  desc: "Claude'u sizin dilinizde konuşturuyoruz." },
  { num: "03", label: "Birlikte", desc: "Sürekli iyileştirme ve destek." },
]

function Vignette() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1]"
      style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 20%, rgba(10,8,6,0.78) 100%)" }} />
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function CinematicPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const dotsRef      = useRef<HTMLDivElement>(null)
  const cursorDot    = useRef<HTMLDivElement>(null)
  const cursorRing   = useRef<HTMLDivElement>(null)

  const s0 = useRef<HTMLElement>(null), s1 = useRef<HTMLElement>(null)
  const s2 = useRef<HTMLElement>(null), s3 = useRef<HTMLElement>(null)
  const s4 = useRef<HTMLElement>(null)

  const c0 = useRef<HTMLCanvasElement>(null), c1 = useRef<HTMLCanvasElement>(null)
  const c2 = useRef<HTMLCanvasElement>(null), c3 = useRef<HTMLCanvasElement>(null)
  const c4 = useRef<HTMLCanvasElement>(null)

  // Active flags (pause inactive canvases)
  const a0 = useRef(true),  a1 = useRef(false)
  const a2 = useRef(false), a3 = useRef(false)
  const a4 = useRef(false)

  const mouse      = useRef({ x: 0, y: 0 })
  const cursorPos  = useRef({ x: 0, y: 0 })
  const lastMove   = useRef(Date.now())
  const autoT      = useRef(0)
  const rafMain    = useRef(0)

  // ── Audio player ───────────────────────────────────────────────────────────
  const audioRef   = useRef<HTMLAudioElement>(null)
  const fadeRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const [playing, setPlaying] = useState(false)

  const fadeTo = (target: number, duration: number, onDone?: () => void) => {
    const audio = audioRef.current
    if (!audio) return
    if (fadeRef.current) clearInterval(fadeRef.current)
    const steps    = 30
    const interval = duration / steps
    const delta    = (target - audio.volume) / steps
    fadeRef.current = setInterval(() => {
      if (!audioRef.current) return
      const next = audioRef.current.volume + delta
      if ((delta > 0 && next >= target) || (delta < 0 && next <= target)) {
        audioRef.current.volume = target
        clearInterval(fadeRef.current!)
        fadeRef.current = null
        onDone?.()
      } else {
        audioRef.current.volume = next
      }
    }, interval)
  }

  const toggleAudio = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      fadeTo(0, 800, () => audio.pause())
      setPlaying(false)
    } else {
      audio.volume = 0
      audio.play()
        .then(() => fadeTo(0.2, 1500))
        .catch(() => setPlaying(false))
      setPlaying(true)
    }
  }

  // Unmount cleanup only — separate from visibility effect to avoid
  // React's effect cleanup cycle pausing audio on every playing change
  useEffect(() => {
    return () => {
      if (fadeRef.current) clearInterval(fadeRef.current)
      audioRef.current?.pause()
    }
  }, [])

  // Visibility change: re-register whenever playing changes to capture latest value
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) {
        audioRef.current?.pause()
      } else if (playing) {
        audioRef.current?.play().catch(() => {})
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [playing])

  // ── Mouse + cursor + autonomous drift ─────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      lastMove.current = Date.now()
    }
    window.addEventListener("mousemove", onMove)

    const tick = () => {
      const idle = Date.now() - lastMove.current > 3000
      if (idle) {
        autoT.current += 0.006
        const cx = window.innerWidth  / 2
        const cy = window.innerHeight / 2
        mouse.current.x = cx + Math.sin(autoT.current) * cx * 0.44
        mouse.current.y = cy + Math.cos(autoT.current * 0.67) * cy * 0.34
      }
      cursorPos.current.x = lerp(cursorPos.current.x, mouse.current.x, 0.14)
      cursorPos.current.y = lerp(cursorPos.current.y, mouse.current.y, 0.14)
      if (cursorDot.current) {
        cursorDot.current.style.left = mouse.current.x + "px"
        cursorDot.current.style.top  = mouse.current.y + "px"
      }
      if (cursorRing.current) {
        cursorRing.current.style.left = cursorPos.current.x + "px"
        cursorRing.current.style.top  = cursorPos.current.y + "px"
      }
      rafMain.current = requestAnimationFrame(tick)
    }
    rafMain.current = requestAnimationFrame(tick)
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafMain.current) }
  }, [])

  // ── Canvas inits ─────────────────────────────────────────────────────────
  useEffect(() => { if (!c0.current) return; return initScene0(c0.current, mouse, a0) }, [])
  useEffect(() => { if (!c1.current) return; return initScene1(c1.current, mouse, a1) }, [])
  useEffect(() => { if (!c2.current) return; return initScene2(c2.current, mouse, a2) }, [])
  useEffect(() => { if (!c3.current) return; return initScene3(c3.current, mouse, a3) }, [])
  useEffect(() => { if (!c4.current) return; return initScene4(c4.current, s4.current, mouse, a4) }, [])

  // ── GSAP: pinned scroll-jacking with singularity transitions ─────────────
  useGSAP(() => {
    const secs = [s0.current, s1.current, s2.current, s3.current, s4.current]
    const cvs  = [c0.current, c1.current, c2.current, c3.current, c4.current]
    const acts = [a0, a1, a2, a3, a4]
    const dots = Array.from(dotsRef.current?.querySelectorAll<HTMLElement>("button") ?? [])

    // Initial states: s0 fully open, s1-s4 collapsed to singularity (hidden)
    gsap.set(secs[0]!, { clipPath: "circle(150% at 50% 50%)" })
    for (let i = 1; i < secs.length; i++) {
      if (secs[i]) gsap.set(secs[i]!, { clipPath: "circle(0% at 50% 50%)" })
    }
    gsap.set(cvs[0]!, { opacity: 1 })
    for (let i = 1; i < cvs.length; i++) {
      if (cvs[i]) gsap.set(cvs[i]!, { opacity: 0 })
    }

    function activateDot(i: number) {
      dots.forEach((dot, di) =>
        gsap.to(dot, { scale: di === i ? 1.9 : 1, opacity: di === i ? 1 : 0.3, duration: 0.3 })
      )
    }
    activateDot(0)

    // Content selectors per scene (used in collapse)
    const contentSels = [
      [".s0-words", ".s0-meta", ".s0-sub"],
      [".s1-tag", ".s1-title", ".s1-item"],
      [".s2-label", ".s2-card"],
      [".s3-label", ".s3-step"],
      [".s4-quote", ".s4-cta", ".s4-btn"],
    ]

    secs.forEach((sec, i) => {
      const cv = cvs[i]
      if (!sec || !cv) return

      const isLast = i === secs.length - 1

      // D = total timeline units (proportional positions, not real seconds)
      const D = 10

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sec,
          start:   "top top",
          end:     "+=130%",   // 130vh extra scroll per scene = 230vh total per scene
          pin:     true,
          scrub:   0.8,
          onEnter:     () => { acts[i].current = true;  activateDot(i) },
          onLeave:     () => { acts[i].current = false },
          onEnterBack: () => { acts[i].current = true;  activateDot(i) },
          onLeaveBack: () => { acts[i].current = false },
        },
      })

      // ── EMERGE from singularity (scenes 1–4) ────────────────────────────
      if (i > 0) {
        tl.fromTo(sec,
          { clipPath: "circle(0% at 50% 50%)" },
          { clipPath: "circle(150% at 50% 50%)", duration: 1.6, ease: "power3.out" },
          0
        )
        tl.to(cv, { opacity: 1, duration: 0.6 }, 0)
      }

      // ── CONTENT REVEALS (scrubbed) ───────────────────────────────────────
      const R = i === 0 ? 0 : 1.6  // start reveal after emerge finishes

      if (i === 0) {
        const words = sec.querySelectorAll<HTMLElement>(".word-inner")
        tl.from(sec.querySelector(".s0-meta"),  { autoAlpha: 0, y: 14, duration: 1.2 }, R)
        tl.from(words, { y: "120%", stagger: 0.22, duration: 2.2, ease: "expo.out" }, R + 0.1)
        tl.from(sec.querySelector(".s0-sub"),   { autoAlpha: 0, y: 18, duration: 1.4 }, R + 1.0)
      } else if (i === 1) {
        tl.from(sec.querySelector(".s1-tag"),   { autoAlpha: 0, y: 24, duration: 1.0 }, R)
        tl.from(sec.querySelector(".s1-title"), { autoAlpha: 0, y: 52, duration: 1.5, ease: "expo.out" }, R + 0.4)
        tl.from(sec.querySelectorAll(".s1-item"), { autoAlpha: 0, x: -45, stagger: 0.28, duration: 1.1 }, R + 1.0)
      } else if (i === 2) {
        tl.from(sec.querySelector(".s2-label"), { autoAlpha: 0, y: 24, duration: 1.0 }, R)
        tl.from(sec.querySelectorAll(".s2-card"), { autoAlpha: 0, y: 52, scale: 0.92, stagger: 0.14, duration: 1.1, ease: "power3.out" }, R + 0.5)
      } else if (i === 3) {
        tl.from(sec.querySelector(".s3-label"), { autoAlpha: 0, y: 24, duration: 1.0 }, R)
        tl.from(sec.querySelectorAll(".s3-step"), { autoAlpha: 0, y: 48, stagger: 0.35, duration: 1.3 }, R + 0.5)
      } else {
        tl.from(sec.querySelector(".s4-quote"), { autoAlpha: 0, y: 36, duration: 1.2 }, R)
        tl.from(sec.querySelector(".s4-cta"),   { autoAlpha: 0, y: 62, duration: 1.6, ease: "expo.out" }, R + 0.6)
        tl.from(sec.querySelector(".s4-btn"),   { autoAlpha: 0, scale: 0.88, duration: 1.3, ease: "back.out(1.7)" }, R + 1.3)
      }

      // ── BREATHING pause (scene lives here) ──────────────────────────────
      tl.to({}, { duration: 1.5 }, D * 0.54)

      // ── COLLAPSE to singularity (all except last scene) ──────────────────
      if (!isLast) {
        const C = D * 0.80  // collapse begins at 80% — more breathing room, shorter void at end

        // Gather this scene's content elements
        const els: Element[] = []
        contentSels[i].forEach(sel => sec.querySelectorAll(sel).forEach(el => els.push(el)))

        // Content implodes toward center
        tl.to(els, { autoAlpha: 0, scale: 0.65, duration: 1.4, ease: "power3.in" }, C)
        // Canvas dims
        tl.to(cv,  { opacity: 0, duration: 0.7, ease: "power3.in" }, C + 0.1)
        // Circle crushes to singularity point
        tl.to(sec, { clipPath: "circle(0% at 50% 50%)", duration: 1.8, ease: "power4.in" }, C + 0.25)
        // Minimal hold — just enough for next scene to start emerging
        tl.to({},  { duration: 0.2 }, D - 0.2)
      }
    })

    // Hero glow pulse: non-scrubbed, runs continuously
    gsap.to(".word-inner", {
      textShadow: "0 0 30px rgba(245,178,102,0.7), 0 0 60px rgba(212,149,74,0.35)",
      duration: 2, delay: 2, repeat: -1, yoyo: true, ease: "sine.inOut",
    })

  }, { scope: containerRef })

  // Each scene = 100vh section + 130vh pin spacer = 230vh = 2.3 * innerHeight
  const scrollTo = (i: number) => {
    window.scrollTo({ top: i * 2.3 * window.innerHeight, behavior: "smooth" })
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Custom cursor */}
      <div ref={cursorDot} className="fixed z-[9999] pointer-events-none rounded-full"
        style={{ width: 7, height: 7, backgroundColor: "#f5b266", transform: "translate(-50%,-50%)" }} />
      <div ref={cursorRing} className="fixed z-[9998] pointer-events-none rounded-full"
        style={{ width: 38, height: 38, border: "1px solid rgba(245,178,102,0.5)", transform: "translate(-50%,-50%)" }} />

      {/* Scene dots */}
      <div ref={dotsRef} className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {[0,1,2,3,4].map(i => (
          <button key={i} onClick={() => scrollTo(i)}
            style={{ width: 8, height: 8, padding: 0, cursor: "none", border: "1px solid #d4954a",
              borderRadius: "50%", backgroundColor: "transparent", opacity: 0.3 }} />
        ))}
      </div>

      <div ref={containerRef} style={{
        cursor: "none",
        backgroundColor: "#0a0806",
        backgroundImage: "radial-gradient(ellipse 140% 60% at 50% 100%, rgba(28,14,4,1) 0%, #0a0806 55%)"
      }}>

        {/* ═══ SCENE 0 — HYPERDRIVE HERO ══════════════════════════════════════ */}
        <section ref={s0} className="relative h-screen overflow-hidden">
          <canvas ref={c0} className="absolute inset-0 w-full h-full" style={{ opacity: 1 }} />
          <Vignette />
          <div className="relative z-10 h-full flex flex-col justify-center px-12 md:px-20 max-w-5xl">
            <p className={`s0-meta ${it.className}`}
              style={{ fontSize: "0.82rem", letterSpacing: "0.26em", color: "#8a7e6f",
                textTransform: "uppercase", marginBottom: "2.5rem" }}>
              EDISYON 01 · MAYIS 2026 · İZMİR - İSTANBUL
            </p>
            <h1 className="s0-words" style={{ margin: 0, lineHeight: 1.02 }}>
              {HERO_WORDS.map((word, i) => (
                <span key={i} style={{ display: "inline-block", overflow: "hidden",
                  marginRight: "0.3em", verticalAlign: "bottom" }}>
                  <span className={`word-inner ${cg.className}`}
                    style={{ display: "block",
                      fontSize: "clamp(2.8rem, 7.2vw, 8.5rem)", fontWeight: 300,
                      color: "#e8dcc9", letterSpacing: "0.04em",
                      fontStyle: i === 1 || i === 2 ? "italic" : "normal" }}>
                    {word}
                  </span>
                </span>
              ))}
            </h1>
            <p className={`s0-sub ${it.className}`}
              style={{ marginTop: "2rem", fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
                color: "#8a7e6f", maxWidth: 520, lineHeight: 1.75, fontWeight: 300 }}>
              KOBİ&apos;lerin yapay zekayla kurduğu ilişki yanlış başlıyor.
              Biz aracıyız. Sizin işiniz için Claude&apos;u biz konuşturuyoruz.
            </p>
          </div>
          <p className={`${it.className} absolute bottom-8 left-1/2 -translate-x-1/2 z-10`}
            style={{ fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(138,126,111,0.5)",
              textTransform: "uppercase" }}>
            Fare ile yıldızları yönlendir · Aşağı kaydır
          </p>
        </section>

        {/* ═══ SCENE 1 — CONSTELLATION ════════════════════════════════════════ */}
        <section ref={s1} className="relative h-screen overflow-hidden flex items-center">
          <canvas ref={c1} className="absolute inset-0 w-full h-full" style={{ opacity: 0 }} />
          <Vignette />
          <div className="relative z-10 px-12 md:px-20 max-w-3xl">
            <p className={`s1-tag ${it.className}`}
              style={{ fontSize: "0.82rem", letterSpacing: "0.32em", color: "#d4954a",
                textTransform: "uppercase", marginBottom: "2rem" }}>
              Manifesto
            </p>
            <h2 className={`s1-title ${cg.className}`}
              style={{ fontSize: "clamp(2.2rem, 4.6vw, 3.9rem)", fontWeight: 300, fontStyle: "italic",
                color: "#f4ead8", lineHeight: 1.22, marginBottom: "3rem" }}>
              Biz bir yazılım satıcısı değiliz. Biz karar vericiyiz.
              Bağlantı kuruyoruz.
            </h2>
            <div className="flex flex-col gap-6">
              {["Sade ama derin", "Sektörünüze konuşur", "Bir el sıkışma"].map((item, i) => (
                <div key={i} className={`s1-item ${it.className} flex items-center gap-4`}>
                  <span style={{ width: 28, height: 1, backgroundColor: "#d4954a", flexShrink: 0 }} />
                  <span style={{ fontSize: "1.875rem", color: "#e8dcc9", fontWeight: 300, letterSpacing: "0.04em", lineHeight: 1.3 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SCENE 2 — WORMHOLE / SERVICES ══════════════════════════════════ */}
        <section ref={s2} className="relative h-screen overflow-hidden flex items-center">
          <canvas ref={c2} className="absolute inset-0 w-full h-full" style={{ opacity: 0 }} />
          <Vignette />
          <div className="relative z-10 w-full px-12 md:px-20">
            <p className={`s2-label ${it.className}`}
              style={{ fontSize: "0.82rem", letterSpacing: "0.32em", color: "#d4954a",
                textTransform: "uppercase", marginBottom: "2.5rem" }}>
              Hizmet Katalogu
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px" style={{ maxWidth: 740 }}>
              {SERVICES.map(s => (
                <div key={s.name} className="s2-card px-6 py-5"
                  style={{ backgroundColor: "rgba(10,8,6,0.72)", border: "1px solid rgba(212,149,74,0.12)" }}>
                  <p className={cg.className}
                    style={{ fontSize: "2rem", fontWeight: 400, color: "#e8dcc9", marginBottom: "0.4rem" }}>
                    {s.name}
                  </p>
                  <p className={it.className}
                    style={{ fontSize: "1rem", color: "#8a7e6f", letterSpacing: "0.05em", lineHeight: 1.7 }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SCENE 3 — GALACTIC GRID / PROCESS ══════════════════════════════ */}
        <section ref={s3} className="relative h-screen overflow-hidden flex items-center">
          <canvas ref={c3} className="absolute inset-0 w-full h-full" style={{ opacity: 0 }} />
          <Vignette />
          <div className="relative z-10 px-12 md:px-20 max-w-xl">
            <p className={`s3-label ${it.className}`}
              style={{ fontSize: "0.82rem", letterSpacing: "0.32em", color: "#d4954a",
                textTransform: "uppercase", marginBottom: "2.5rem" }}>
              Nasıl Çalışır
            </p>
            <div className="flex flex-col gap-8">
              {STEPS.map(s => (
                <div key={s.num} className="s3-step flex gap-6 items-start">
                  <span className={cg.className}
                    style={{ fontSize: "2.6rem", fontWeight: 300, color: "#d4954a", lineHeight: 1, minWidth: 50 }}>
                    {s.num}
                  </span>
                  <div>
                    <p className={cg.className}
                      style={{ fontSize: "2rem", fontWeight: 400, color: "#e8dcc9", marginBottom: "0.3rem" }}>
                      {s.label}
                    </p>
                    <p className={it.className}
                      style={{ fontSize: "1.0625rem", color: "#8a7e6f", lineHeight: 1.7, fontWeight: 300 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SCENE 4 — SUPERNOVA / CTA ═══════════════════════════════════════ */}
        <section ref={s4} className="relative h-screen overflow-hidden flex items-center justify-center">
          <canvas ref={c4} className="absolute inset-0 w-full h-full" style={{ opacity: 0 }} />
          <Vignette />
          <div className="relative z-10 text-center px-8 max-w-2xl">
            <p className={`s4-quote ${it.className}`}
              style={{ fontSize: "0.82rem", letterSpacing: "0.28em", color: "#8a7e6f",
                textTransform: "uppercase", marginBottom: "2rem" }}>
              Tıkla · patlat · hayal et
            </p>
            <h2 className={`s4-cta ${cg.className}`}
              style={{ fontSize: "clamp(2.2rem, 4.8vw, 4.2rem)", fontWeight: 300, fontStyle: "italic",
                color: "#f4ead8", lineHeight: 1.2, marginBottom: "3rem" }}>
              İşinizin sessiz katmanı artık zeki olabilir.
            </h2>
            <button
              className={`s4-btn ${it.className}`}
              style={{ border: "1px solid #d4954a", color: "#d4954a", backgroundColor: "transparent",
                padding: "0.9rem 2.4rem", fontSize: "0.7rem", letterSpacing: "0.22em",
                textTransform: "uppercase", cursor: "none" }}
              onMouseEnter={e => gsap.to(e.currentTarget, { backgroundColor: "#d4954a", color: "#0a0806", duration: 0.25 })}
              onMouseLeave={e => gsap.to(e.currentTarget, { backgroundColor: "transparent", color: "#d4954a", duration: 0.25 })}
            >
              Keşif Görüşmesi
            </button>
          </div>
        </section>

      </div>

      {/* Audio element */}
      <audio ref={audioRef} src="/audio/ambient.mp3" loop preload="none" />

      {/* Audio toggle button */}
      <button
        onClick={toggleAudio}
        aria-label={playing ? "Sesi kapat" : "Sesi aç"}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          width: 44, height: 44, borderRadius: "50%", cursor: "none",
          border: `1px solid rgba(245,178,102,${playing ? 0.8 : 0.4})`,
          backgroundColor: "rgba(245,178,102,0.1)",
          backdropFilter: "blur(12px)",
          color: "#f5b266", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s, border-color 0.2s",
          animation: playing ? "audioGlow 1.8s ease-in-out infinite" : "none",
          outline: "none", padding: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.1)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)" }}
      >
        {playing ? (
          // Speaker with sound waves
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ) : (
          // Speaker with X
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes audioGlow {
          0%   { box-shadow: 0 0 6px 0px rgba(245,178,102,0.35); }
          50%  { box-shadow: 0 0 16px 6px rgba(245,178,102,0.15); }
          100% { box-shadow: 0 0 6px 0px rgba(245,178,102,0.35); }
        }
      `}</style>
    </>
  )
}
