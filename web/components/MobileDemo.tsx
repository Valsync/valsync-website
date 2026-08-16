"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const B = process.env.NEXT_PUBLIC_BASE_PATH;

const SLIDES = [
  { src: `${B}/img/screenshot-home.jpg`, alt: "Dashboard with live stats, rank, and RR tracker", caption: "Dashboard — live stats, rank, RR tracker", eager: true },
  { src: `${B}/img/screenshot-matches.jpg`, alt: "Match history list with K/D, ACS, map, and RR changes", caption: "Match history — round-by-round detail" },
  { src: `${B}/img/screenshot-store.jpg`, alt: "Daily store with weapon skin offers and countdown timer", caption: "Daily store — offers + countdown" },
  { src: `${B}/img/screenshot-loadout.jpg`, alt: "Weapon armory showing owned and available skins", caption: "Loadout — weapon skin collection" },
  { src: `${B}/img/screenshot-party.jpg`, alt: "Party screen with agent plan and access controls", caption: "Party — agent plan, join codes" },
  { src: `${B}/img/screenshot-social.jpg`, alt: "Friends list showing online status and current match maps", caption: "Social — friends, presence, chat" },
];

export default function MobileDemo() {
  const screenRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLButtonElement>(null);
  const zoomIconRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const screen = screenRef.current;
    const track = trackRef.current;
    const prevBtn = prevRef.current;
    const nextBtn = nextRef.current;
    const dotsWrap = dotsRef.current;
    const thumbsWrap = thumbsRef.current;
    const zoomBtn = zoomRef.current;
    const zoomIcon = zoomIconRef.current;
    if (!screen || !track || !prevBtn || !nextBtn || !dotsWrap || !thumbsWrap || !zoomBtn || !zoomIcon) return;

    const mediaEls = Array.from(screen.querySelectorAll<HTMLElement>(".slide-media"));
    const count = mediaEls.length;
    let current = 0;
    let startX = 0, startY = 0, dragging = false;

    const zoomStates = mediaEls.map(() => ({ scale: 1, x: 0, y: 0 }));
    let panning = false;
    const panStart = { x: 0, y: 0, tx: 0, ty: 0 };
    const MAX_ZOOM = 3, MIN_ZOOM = 1;

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    function clampState(i: number) {
      const st = zoomStates[i];
      const el = mediaEls[i];
      const w = el.offsetWidth, h = el.offsetHeight;
      st.x = clamp(st.x, w * (1 - st.scale), 0);
      st.y = clamp(st.y, h * (1 - st.scale), 0);
    }

    function applyZoom(i: number) {
      const st = zoomStates[i];
      const el = mediaEls[i];
      el.style.transform = `translate(${st.x}px,${st.y}px) scale(${st.scale})`;
      el.classList.toggle("is-zoomed", st.scale > 1);
      if (i === current) updateZoomButton();
    }

    function updateZoomButton() {
      const st = zoomStates[current];
      const zoomed = st.scale > 1;
      zoomBtn!.setAttribute("aria-pressed", String(zoomed));
      zoomBtn!.setAttribute("aria-label", zoomed ? "Zoom out of screenshot" : "Zoom in on screenshot");
      zoomIcon!.innerHTML = zoomed
        ? '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line>'
        : '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line>';
    }

    function zoomAt(i: number, clientX: number, clientY: number, newScale: number) {
      const st = zoomStates[i];
      const rect = mediaEls[i].closest(".slide")!.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const oldScale = st.scale;
      if (newScale <= MIN_ZOOM) {
        st.scale = 1; st.x = 0; st.y = 0;
      } else {
        st.scale = clamp(newScale, MIN_ZOOM, MAX_ZOOM);
        st.x = st.x + px * (oldScale - st.scale);
        st.y = st.y + py * (oldScale - st.scale);
        clampState(i);
      }
      applyZoom(i);
    }

    function toggleZoomAt(i: number, clientX: number, clientY: number) {
      zoomAt(i, clientX, clientY, zoomStates[i].scale > 1 ? 1 : 2.5);
    }

    function resetZoom(i: number) {
      zoomStates[i] = { scale: 1, x: 0, y: 0 };
      applyZoom(i);
    }

    function paint() {
      track!.style.transform = `translateX(${-(current * 100)}%)`;
      prevBtn!.disabled = current === 0;
      nextBtn!.disabled = current === count - 1;
      prevBtn!.setAttribute("aria-disabled", String(current === 0));
      nextBtn!.setAttribute("aria-disabled", String(current === count - 1));
      const dots = dotsWrap!.querySelectorAll(".dot");
      const thumbs = thumbsWrap!.querySelectorAll(".thumb");
      for (let i = 0; i < count; i++) {
        const active = i === current;
        dots[i].setAttribute("aria-current", active ? "true" : "false");
        dots[i].setAttribute("tabindex", active ? "0" : "-1");
        thumbs[i].setAttribute("aria-current", active ? "true" : "false");
        thumbs[i].setAttribute("tabindex", active ? "0" : "-1");
      }
      updateZoomButton();
    }

    function go(i: number) {
      const next = clamp(i, 0, count - 1);
      if (next !== current) {
        current = next;
        resetZoom(current);
        paint();
      }
    }
    const next = () => go(current + 1);
    const prev = () => go(current - 1);

    function buildControls() {
      for (let i = 0; i < count; i++) {
        const dot = document.createElement("button");
        dot.className = "dot";
        dot.type = "button";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Go to screenshot " + (i + 1));
        dot.addEventListener("click", () => go(i));
        dotsWrap!.appendChild(dot);

        const thumb = document.createElement("button");
        thumb.className = "thumb";
        thumb.type = "button";
        thumb.setAttribute("role", "tab");
        thumb.setAttribute("aria-label", "Go to screenshot " + (i + 1));
        const img = SLIDES[i];
        const imgEl = document.createElement("img");
        imgEl.src = img.src;
        imgEl.alt = "";
        thumb.appendChild(imgEl);
        thumb.addEventListener("click", () => go(i));
        thumbsWrap!.appendChild(thumb);
      }
    }

    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") { e.preventDefault(); resetZoom(current); }
    }
    document.addEventListener("keydown", onKey);

    zoomBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const rect = mediaEls[current].closest(".slide")!.getBoundingClientRect();
      toggleZoomAt(current, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const st = zoomStates[current];
      const direction = e.deltaY > 0 ? -1 : 1;
      zoomAt(current, e.clientX, e.clientY, st.scale * (direction > 0 ? 1.15 : 0.87));
    }
    screen.addEventListener("wheel", onWheel, { passive: false });

    let lastTap = { time: 0, x: 0, y: 0 };

    function moveTrack(dx: number) {
      const base = -(current * 100);
      const shift = (dx / screen!.offsetWidth) * 100;
      track!.style.transform = `translateX(${base + shift}%)`;
    }

    function finishSwipe(clientX: number, clientY: number) {
      dragging = false;
      track!.classList.remove("dragging");
      const now = Date.now();
      const dx = clientX - startX;
      const dy = clientY - startY;
      const dist = Math.hypot(dx, dy);
      const isDoubleTap = now - lastTap.time < 300 && Math.hypot(clientX - lastTap.x, clientY - lastTap.y) < 30 && dist < 10;
      if (isDoubleTap) {
        lastTap.time = 0;
        toggleZoomAt(current, clientX, clientY);
        return;
      }
      if (dist < 10) {
        lastTap = { time: now, x: clientX, y: clientY };
        const rect = screen!.getBoundingClientRect();
        if (clientX > rect.left + rect.width / 2) next();
        else prev();
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && dx < -40) next();
      else if (Math.abs(dx) > Math.abs(dy) && dx > 40) prev();
      else paint();
    }

    function finishPan(clientX: number, clientY: number) {
      panning = false;
      mediaEls[current].classList.remove("is-dragging");
      clampState(current);
      applyZoom(current);
      const now = Date.now();
      const dist = Math.hypot(clientX - lastTap.x, clientY - lastTap.y);
      if (now - lastTap.time < 300 && dist < 30) {
        lastTap.time = 0;
        toggleZoomAt(current, clientX, clientY);
      } else {
        lastTap = { time: now, x: clientX, y: clientY };
      }
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      if ((e.target as HTMLElement).closest("#zoom-toggle")) return;
      const st = zoomStates[current];
      screen!.setPointerCapture(e.pointerId);
      if (st.scale > 1) {
        panning = true;
        panStart.x = e.clientX; panStart.y = e.clientY;
        panStart.tx = st.x; panStart.ty = st.y;
        mediaEls[current].classList.add("is-dragging");
        return;
      }
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      track!.classList.add("dragging");
    }

    function onPointerMove(e: PointerEvent) {
      if (panning) {
        const st = zoomStates[current];
        st.x = panStart.tx + (e.clientX - panStart.x);
        st.y = panStart.ty + (e.clientY - panStart.y);
        clampState(current);
        applyZoom(current);
        return;
      }
      if (!dragging) return;
      moveTrack(e.clientX - startX);
    }

    function endPointer(e: PointerEvent) {
      if (panning) { finishPan(e.clientX, e.clientY); return; }
      if (!dragging) return;
      finishSwipe(e.clientX, e.clientY);
    }

    screen.addEventListener("pointerdown", onPointerDown);
    screen.addEventListener("pointermove", onPointerMove);
    screen.addEventListener("pointerup", endPointer);
    screen.addEventListener("pointercancel", () => {
      panning = false; dragging = false;
      track!.classList.remove("dragging");
      mediaEls[current]?.classList.remove("is-dragging");
      paint(); applyZoom(current);
    });

    // Touch
    function onTouchStart(e: TouchEvent) {
      if ((e.target as HTMLElement).closest("#zoom-toggle") || e.touches.length !== 1) return;
      const t = e.touches[0];
      const st = zoomStates[current];
      if (st.scale > 1) {
        panning = true;
        panStart.x = t.clientX; panStart.y = t.clientY;
        panStart.tx = st.x; panStart.ty = st.y;
        mediaEls[current].classList.add("is-dragging");
        return;
      }
      dragging = true;
      startX = t.clientX; startY = t.clientY;
      track!.classList.add("dragging");
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (panning) {
        e.preventDefault();
        const st = zoomStates[current];
        st.x = panStart.tx + (t.clientX - panStart.x);
        st.y = panStart.ty + (t.clientY - panStart.y);
        clampState(current);
        applyZoom(current);
        return;
      }
      if (!dragging) return;
      e.preventDefault();
      moveTrack(t.clientX - startX);
    }
    function onTouchEnd(e: TouchEvent) {
      const t = e.changedTouches[0];
      if (!t) return;
      if (panning) { finishPan(t.clientX, t.clientY); return; }
      if (!dragging) return;
      finishSwipe(t.clientX, t.clientY);
    }
    screen.addEventListener("touchstart", onTouchStart, { passive: true });
    screen.addEventListener("touchmove", onTouchMove, { passive: false });
    screen.addEventListener("touchend", onTouchEnd, { passive: true });
    screen.addEventListener("touchcancel", () => {
      panning = false; dragging = false;
      track!.classList.remove("dragging");
      mediaEls[current]?.classList.remove("is-dragging");
      paint(); applyZoom(current);
    }, { passive: true });

    buildControls();
    paint();

    return () => {
      document.removeEventListener("keydown", onKey);
      screen.removeEventListener("wheel", onWheel);
      screen.removeEventListener("pointerdown", onPointerDown);
      screen.removeEventListener("pointermove", onPointerMove);
      screen.removeEventListener("pointerup", endPointer);
      screen.removeEventListener("touchstart", onTouchStart);
      screen.removeEventListener("touchmove", onTouchMove);
      screen.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div className="mobile-page">
      <header className="mobile-header">
        <Link href="/" className="m-logo" aria-label="VALSYNC home">
          <span className="m-logo-mark" aria-hidden="true">V</span>
          VALSYNC
        </Link>
        <h1>Interactive phone demo</h1>
        <p>Swipe, tap, or use arrow keys to explore the app.</p>
      </header>

      <main className="stage" role="region" aria-roledescription="carousel" aria-label="VALSYNC app screenshots">
        <button type="button" className="ctrl ctrl--prev" aria-label="Previous screenshot" ref={prevRef}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>

        <div className="m-phone">
          <div className="phone-notch" aria-hidden="true"></div>
          <div className="screen" ref={screenRef}>
            <div className="screen-track" ref={trackRef} role="list">
              {SLIDES.map((s, i) => (
                <div className="slide" role="listitem" key={i}>
                  <div className="slide-media">
                    <img src={s.src} alt={s.alt} loading={s.eager ? "eager" : "lazy"} />
                  </div>
                  <div className="slide-caption">{s.caption}</div>
                </div>
              ))}
            </div>
            <button type="button" className="zoom-toggle" id="zoom-toggle" aria-label="Zoom in on screenshot" aria-pressed="false" ref={zoomRef}>
              <svg viewBox="0 0 24 24" aria-hidden="true" ref={zoomIconRef}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            <div className="home-bar" aria-hidden="true"></div>
          </div>
        </div>

        <button type="button" className="ctrl ctrl--next" aria-label="Next screenshot" ref={nextRef}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <div className="dots" ref={dotsRef} role="tablist" aria-label="Screenshot pages"></div>
        <div className="thumbs" ref={thumbsRef} role="tablist" aria-label="Screenshot thumbnails"></div>
        <p className="hint">← → · swipe · double-tap image to zoom · Ctrl+scroll to zoom</p>
      </main>

      <footer className="mobile-footer">
        <a href="https://play.google.com/store/apps/details?id=com.valsync.app" className="m-btn-primary" rel="noopener">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download on Play Store
        </a>
      </footer>
    </div>
  );
}
