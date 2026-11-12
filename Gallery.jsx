import { useEffect, useRef, useState } from "react";
import "./Gallery.css";

const COLORS = ["#e9e4d8", "#c9694a", "#d99a2b", "#4f6b46", "#5f82a8", "#efe9dd", "#2b2b2b", "#e8742c"];

// Shown only if an image fails to load (demo fallback)
const placeholder = (c) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 200"><rect width="150" height="200" fill="#d9dcdf"/>
     <rect y="160" width="150" height="40" fill="#eceeef"/><path d="M45 85 L55 40 H95 L105 85Z" fill="${c}"/>
     <rect x="73" y="85" width="4" height="65" fill="${c}"/><ellipse cx="75" cy="152" rx="24" ry="5" fill="${c}"/></svg>`
  );

const mod = (a, n) => ((a % n) + n) % n;

// Each layout returns a transform for an item at offset d from the active one
const LAYOUTS = {
  coverflow: (d) => {
    const s = Math.sign(d), a = Math.abs(d);
    if (!a) return { t: "translateZ(60px)", o: 1, z: 100 };
    return {
      t: `translateX(${s * (80 + a * 42)}px) translateZ(${-a * 60}px) rotateY(${-s * 55}deg)`,
      o: a > 4 ? 0 : 1,
      z: 100 - a,
    };
  },
  ring: (d, n) => ({
    t: `rotateY(${(d * 360) / n}deg) translateZ(${Math.max(230, n * 34)}px)`,
    o: 1,
    z: 50,
  }),
  helix: (d) => ({
    t: `translateY(${d * 38}px) rotateY(${d * 40}deg) translateZ(260px)`,
    o: Math.abs(d) > 5 ? 0 : 1,
    z: 50,
  }),
  sphere: (d) => {
    const lat = mod(d * 37 + 50, 100) - 50;
    return { t: `rotateY(${d * 137.5}deg) rotateX(${-lat * 0.9}deg) translateZ(280px)`, o: 1, z: 50 };
  },
  grid: (d, n, i) => {
    const col = i % 3, row = Math.floor(i / 3), rows = Math.ceil(n / 3);
    return { t: `translate(${(col - 1) * 112}px, ${(row - (rows - 1) / 2) * 150}px) scale(.62)`, o: 1, z: 10 };
  },
  stack: (d) => {
    const a = Math.abs(d);
    return {
      t: `translate(${d * 14}px, ${a * -6}px) scale(${1 - a * 0.05}) rotate(${d * 3}deg)`,
      o: a > 5 ? 0 : 1,
      z: 100 - a,
    };
  },
};

/**
 * items: [{ src: string, title: string }]
 */
export default function Gallery({ items }) {
  const n = items.length;
  const [mode, setMode] = useState("coverflow");
  const [active, setActive] = useState(0);
  const [openIndex, setOpenIndex] = useState(null);
  const [broken, setBroken] = useState({});

  const stageRef = useRef(null);
  const drag = useRef({ on: false, startX: 0, startActive: 0, moved: false });

  // drag / swipe
  const onPointerDown = (e) => {
    drag.current = { on: true, startX: e.clientX, startActive: active, moved: false };
  };
  useEffect(() => {
    const move = (e) => {
      const d = drag.current;
      if (!d.on || mode === "grid") return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > 8) d.moved = true;
      setActive(mod(d.startActive - Math.round(dx / 50), n));
    };
    const up = () => {
      drag.current.on = false;
      setTimeout(() => (drag.current.moved = false), 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [mode, n]);

  // horizontal trackpad scroll (needs non-passive listener)
  useEffect(() => {
    const el = stageRef.current;
    const wheel = (e) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
      e.preventDefault();
      setActive((a) => mod(a + Math.sign(e.deltaX), n));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [n]);

  // keyboard
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") setOpenIndex(null);
      if (openIndex !== null) return;
      if (e.key === "ArrowRight") setActive((a) => mod(a + 1, n));
      if (e.key === "ArrowLeft") setActive((a) => mod(a - 1, n));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [openIndex, n]);

  const srcOf = (i) => (broken[i] ? placeholder(COLORS[i % COLORS.length]) : items[i].src);

  const onItemClick = (i) => {
    if (drag.current.moved) return;
    const shortest = mod(i - active + n / 2, n) - n / 2;
    if (mode === "grid" || shortest === 0) setOpenIndex(i);
    else setActive(mod(active + shortest, n));
  };

  return (
    <section className="gx">
      <div className="gx-live"><i /> Live · Gallery</div>

      <div className="gx-tabs" role="tablist">
        {Object.keys(LAYOUTS).map((k) => (
          <button key={k} role="tab" aria-selected={k === mode} onClick={() => setMode(k)}>
            {k}
          </button>
        ))}
      </div>

      <div className="gx-stage" ref={stageRef} onPointerDown={onPointerDown}>
        {items.map((it, i) => {
          const d = mode === "grid" ? 0 : mod(i - active + n / 2, n) - n / 2;
          const r = LAYOUTS[mode](d, n, i);
          return (
            <button
              key={i}
              type="button"
              className="gx-item"
              aria-label={it.title}
              onClick={() => onItemClick(i)}
              style={{
                transform: r.t,
                opacity: r.o,
                zIndex: r.z,
                pointerEvents: r.o ? "auto" : "none",
              }}
            >
              <img
                src={srcOf(i)}
                alt={it.title}
                draggable={false}
                onError={() => setBroken((b) => ({ ...b, [i]: true }))}
              />
            </button>
          );
        })}
      </div>

      {openIndex !== null && (
        <div
          className="gx-open"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setOpenIndex(null)}
        >
          <img src={srcOf(openIndex)} alt={items[openIndex].title} />
          <div className="gx-bar">
            <span>{items[openIndex].title}</span>
            <button type="button" autoFocus onClick={() => setOpenIndex(null)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
