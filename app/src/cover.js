// Vice City Cover Maker — the cover renderer.
//
// Draws multi-panel GTA-style poster art onto a canvas: a photo (or several)
// per panel, a Vice City sunset or neon colour grade, and bold display
// lettering for the title and subtitle. Everything is drawn with the plain
// 2D canvas API so the same code renders the live preview and the exported
// PNG at 1080x1080, 1080x1350 or 1920x1080.

/** The four poster grids, each with how many photo panels it holds. */
export const LAYOUTS = {
  hero: { name: 'Hero', panels: 3, blurb: 'One big hero shot over two small panels' },
  triptych: { name: 'Triptych', panels: 3, blurb: 'Three tall panels side by side' },
  duo: { name: 'Duo', panels: 2, blurb: 'Two wide panels, split down the middle' },
  grid: { name: 'Grid', panels: 4, blurb: 'Four panels in a two-by-two grid' },
};

/** The colour grades: a canvas filter plus a tint overlay per grade. */
export const GRADES = {
  sunset: {
    name: 'Sunset',
    filter: 'saturate(1.3) contrast(1.06) sepia(0.18)',
    tint: ['rgba(255, 122, 26, 0.20)', 'rgba(214, 51, 132, 0.34)'],
    accent: '#ff7a1a',
  },
  neon: {
    name: 'Neon',
    filter: 'saturate(1.7) contrast(1.18) hue-rotate(-12deg)',
    tint: ['rgba(255, 0, 128, 0.26)', 'rgba(0, 229, 255, 0.22)'],
    accent: '#ff2e88',
  },
  vice: {
    name: 'Vice',
    filter: 'saturate(1.35) contrast(1.1)',
    tint: ['rgba(0, 184, 212, 0.18)', 'rgba(124, 58, 237, 0.32)'],
    accent: '#22d3ee',
  },
  noir: {
    name: 'Noir',
    filter: 'grayscale(1) contrast(1.25) brightness(1.04)',
    tint: ['rgba(255, 255, 255, 0.06)', 'rgba(0, 0, 0, 0.28)'],
    accent: '#e5e7eb',
  },
};

/** The three post sizes the app exports. */
export const EXPORT_SIZES = {
  square: { name: 'Square post', width: 1080, height: 1080 },
  portrait: { name: 'Portrait post', width: 1080, height: 1350 },
  wide: { name: 'Wide post', width: 1920, height: 1080 },
};

/**
 * Panel rectangles for a layout, in canvas pixels. Every layout keeps a
 * bottom band free for the title lettering, so the caption never covers a
 * face in the middle of a panel.
 */
export function panelRectsForLayout(layout, width, height) {
  const gap = Math.max(4, Math.round(width * 0.008));
  const full = { x: 0, y: 0, width, height };
  if (layout === 'triptych') {
    const w = (width - gap * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: i * (w + gap), y: 0, width: w, height }));
  }
  if (layout === 'duo') {
    const w = (width - gap) / 2;
    return [
      { x: 0, y: 0, width: w, height },
      { x: w + gap, y: 0, width: w, height },
    ];
  }
  if (layout === 'grid') {
    const w = (width - gap) / 2;
    const h = (height - gap) / 2;
    return [
      { x: 0, y: 0, width: w, height: h },
      { x: w + gap, y: 0, width: w, height: h },
      { x: 0, y: h + gap, width: w, height: h },
      { x: w + gap, y: h + gap, width: w, height: h },
    ];
  }
  // hero: one wide panel over two small ones.
  const topH = height * 0.58;
  const botH = height - topH - gap;
  const w = (width - gap) / 2;
  return [
    { x: 0, y: 0, width, height: topH },
    { x: 0, y: topH + gap, width: w, height: botH },
    { x: w + gap, y: topH + gap, width: w, height: botH },
  ];
}

/** Draws one photo into one panel, cover-fit, with the panel's zoom and pan. */
export function drawPanelPhoto(ctx, photo, rect, grade) {
  const { img, zoom, offsetX, offsetY } = photo;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  const base = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
  const scale = base * (zoom || 1);
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const cx = rect.x + rect.width / 2 + (offsetX || 0);
  const cy = rect.y + rect.height / 2 + (offsetY || 0);
  ctx.filter = grade.filter;
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.filter = 'none';
  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height);
  tint.addColorStop(0, grade.tint[0]);
  tint.addColorStop(1, grade.tint[1]);
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

/** Draws the empty-panel placeholder: a sunset gradient and a prompt. */
export function drawEmptyPanel(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
  g.addColorStop(0, '#3b115f');
  g.addColorStop(0.55, '#c2410c');
  g.addColorStop(1, '#f97316');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  // A low sun disc, the Vice City calling card.
  const sunR = Math.min(rect.width, rect.height) * 0.22;
  const sun = ctx.createRadialGradient(
    rect.x + rect.width / 2, rect.y + rect.height * 0.42, sunR * 0.1,
    rect.x + rect.width / 2, rect.y + rect.height * 0.42, sunR,
  );
  sun.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  sun.addColorStop(1, 'rgba(255, 122, 26, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(rect.x + rect.width / 2, rect.y + rect.height * 0.42, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = `700 ${Math.max(14, rect.width * 0.045)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', rect.x + rect.width / 2, rect.y + rect.height * 0.72);
}

/** Fits a line of display type to a width, shrinking it until it fits. */
export function fitDisplayFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

/** Draws the title band: accent bar, big title, letterspaced subtitle. */
export function drawTitleBand(ctx, state, width, height) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const bandH = height * 0.3;
  const bandY = height - bandH;
  const scrim = ctx.createLinearGradient(0, bandY - height * 0.06, 0, height);
  scrim.addColorStop(0, 'rgba(10, 4, 18, 0)');
  scrim.addColorStop(0.45, 'rgba(10, 4, 18, 0.55)');
  scrim.addColorStop(1, 'rgba(10, 4, 18, 0.88)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - height * 0.06, width, bandH + height * 0.06);

  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  const cx = width / 2;
  // Accent bar above the title.
  const barW = Math.min(width * 0.22, 260);
  const barH = Math.max(4, height * 0.006);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(cx - barW / 2, bandY + height * 0.055, barW, barH);

  if (title) {
    const size = fitDisplayFont(ctx, title, width * 0.92, height * 0.115, 'Anton, "Arial Black", sans-serif');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(10, 4, 18, 0.9)';
    ctx.lineWidth = size * 0.09;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.03;
    const titleY = height - height * 0.115;
    ctx.strokeText(title, cx, titleY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, cx, titleY);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (subtitle) {
    const subSize = Math.max(14, height * 0.032);
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.32)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle, cx, height - height * 0.045);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}

/** Draws the whole cover for a state onto the canvas at its own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const rects = panelRectsForLayout(state.layout, width, height);
  ctx.fillStyle = '#0a0412';
  ctx.fillRect(0, 0, width, height);
  rects.forEach((rect, i) => {
    const photo = (state.photos || [])[i] || null;
    if (photo && photo.img) drawPanelPhoto(ctx, photo, rect, grade);
    else drawEmptyPanel(ctx, rect);
  });
  // Crisp white gutters between panels, poster style.
  const gap = Math.max(4, Math.round(width * 0.008));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = gap;
  rects.forEach((rect) => ctx.strokeRect(rect.x, rect.y, rect.width, rect.height));
  // Vignette to pull the eye to the middle.
  const vig = ctx.createRadialGradient(
    width / 2, height * 0.45, Math.min(width, height) * 0.35,
    width / 2, height / 2, Math.max(width, height) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
  drawTitleBand(ctx, state, width, height);
}

/**
 * Renders the cover off-screen at an export size and resolves with a PNG blob.
 * The same drawCover code renders the preview, so the export is exactly
 * what the editor shows.
 */
export function exportCoverPNG(state, sizeKey) {
  const size = EXPORT_SIZES[sizeKey] || EXPORT_SIZES.square;
  const off = document.createElement('canvas');
  off.width = size.width;
  off.height = size.height;
  drawCover(off, state);
  return new Promise((resolve, reject) => {
    off.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png');
  });
}
