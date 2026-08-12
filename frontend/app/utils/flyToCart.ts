export function flyToCart(imgSrc: string, fromRect: DOMRect) {
  const cartEl = document.getElementById("cart-icon");
  if (!cartEl) return;

  const toRect   = cartEl.getBoundingClientRect();
  const startX   = fromRect.left + fromRect.width  / 2;
  const startY   = fromRect.top  + fromRect.height / 2;
  const endX     = toRect.left   + toRect.width    / 2;
  const endY     = toRect.top    + toRect.height   / 2;

  // Cubic bezier control points:
  // CP1 — bay thẳng lên trên trước (30% đường đến cart)
  // CP2 — tiếp cận từ phía trên cart
  const cp1X = startX + (endX - startX) * 0.25;
  const cp1Y = startY - Math.max(Math.abs(endY - startY) * 0.5, 120);
  const cp2X = endX + (startX - endX) * 0.15;
  const cp2Y = endY - 60;

  const SIZE_START = 56;
  const SIZE_END   = 10;

  const el  = document.createElement("div");
  const img = document.createElement("img");
  img.src = imgSrc;
  img.style.cssText = "width:100%;height:100%;object-fit:contain;";
  el.appendChild(img);

  Object.assign(el.style, {
    position:      "fixed",
    zIndex:        "99999",
    width:         `${SIZE_START}px`,
    height:        `${SIZE_START}px`,
    top:           `${startY - SIZE_START / 2}px`,
    left:          `${startX - SIZE_START / 2}px`,
    borderRadius:  "12px",
    overflow:      "hidden",
    pointerEvents: "none",
    boxShadow:     "0 4px 20px rgba(0,0,0,0.18)",
    background:    "#fff",
    willChange:    "left, top, width, height, opacity",
  });

  document.body.appendChild(el);

  const duration = 680;
  const start    = performance.now();

  // Cubic bezier interpolation
  const bez = (t: number, p0: number, p1: number, p2: number, p3: number) => {
    const u = 1 - t;
    return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
  };

  // Ease-in-out for smooth acceleration + deceleration
  const easeInOut = (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  function animate(now: number) {
    const raw  = Math.min((now - start) / duration, 1);
    const t    = easeInOut(raw);

    const x    = bez(t, startX, cp1X, cp2X, endX);
    const y    = bez(t, startY, cp1Y, cp2Y, endY);
    const size = SIZE_START + (SIZE_END - SIZE_START) * t;
    const opacity = raw > 0.88 ? Math.max(0, 1 - (raw - 0.88) / 0.12) : 1;

    el.style.width   = `${size}px`;
    el.style.height  = `${size}px`;
    el.style.left    = `${x - size / 2}px`;
    el.style.top     = `${y - size / 2}px`;
    el.style.opacity = String(opacity);
    el.style.borderRadius = `${10 + t * 50}%`;

    if (raw < 1) {
      requestAnimationFrame(animate);
    } else {
      el.remove();
      // Bounce cart icon khi ảnh chạm đích
      cartEl.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.35)" },
          { transform: "scale(0.92)" },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "ease-out" }
      );
    }
  }

  requestAnimationFrame(animate);
}
