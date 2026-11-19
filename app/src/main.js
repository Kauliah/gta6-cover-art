// Vice City Cover Maker — wires the editor: photo panels, caption, layouts,
// grades, export sizes and the deterministic screenshot scenes.
//
// Photos are read on the user's own machine with FileReader and never leave
// it. The preview canvas is the cover: what you see is what the PNG holds.

import { LAYOUTS, GRADES, EXPORT_SIZES, panelRectsForLayout, drawCover, exportCoverPNG } from './cover.js';
import { runShot } from './shots.js';

/** The two sample photos shipped with the app, free to use. */
export const SAMPLE_PHOTOS = ['pier', 'boulevard'];

const canvas = document.getElementById('cover');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const statusLine = document.getElementById('status');
const panelPicker = document.getElementById('panel-picker');
const zoomSlider = document.getElementById('zoom');
const zoomValue = document.getElementById('zoom-value');
const photoInput = document.getElementById('photo-file');

/** The whole editor state; drawCover renders exactly this. */
export const coverState = {
  layout: 'hero',
  grade: 'sunset',
  size: 'square',
  title: 'Vice City',
  subtitle: 'Sunset Heist',
  photos: [null, null, null, null],
  selectedPanel: 0,
};

export function panelCount() {
  return LAYOUTS[coverState.layout].panels;
}

export function redrawCover() {
  const size = EXPORT_SIZES[coverState.size];
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  drawCover(canvas, coverState);
}

export function setStatus(message) {
  statusLine.textContent = message;
}

/** Loads an image from a URL (a sample, or a blob URL for an upload). */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image ${url}`));
    img.src = url;
  });
}

/** Builds the panel picker buttons for the active layout. */
export function rebuildPanelPicker() {
  panelPicker.innerHTML = '';
  for (let i = 0; i < panelCount(); i += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = `Panel ${i + 1}`;
    button.setAttribute('aria-pressed', String(coverState.selectedPanel === i));
    button.addEventListener('click', () => {
      coverState.selectedPanel = i;
      rebuildPanelPicker();
      syncZoomControl();
    });
    panelPicker.appendChild(button);
  }
  if (coverState.selectedPanel >= panelCount()) coverState.selectedPanel = 0;
}

/** Syncs the zoom slider with the selected panel's photo. */
export function syncZoomControl() {
  const photo = coverState.photos[coverState.selectedPanel];
  const zoom = photo ? photo.zoom : 1;
  zoomSlider.value = String(Math.round(zoom * 100));
  zoomValue.textContent = `${Math.round(zoom * 100)}%`;
  zoomSlider.disabled = !photo;
}

/** Puts an image into a panel (and keeps its zoom/pan when replacing it). */
export function setPanelPhoto(index, img) {
  const previous = coverState.photos[index];
  coverState.photos[index] = {
    img,
    zoom: previous ? previous.zoom : 1,
    offsetX: previous ? previous.offsetX : 0,
    offsetY: previous ? previous.offsetY : 0,
  };
}

/** Fills every panel with the two samples, alternating, for one-click art. */
export async function loadSamplePhotos() {
  for (let i = 0; i < panelCount(); i += 1) {
    const name = SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length];
    setPanelPhoto(i, await loadImage(`samples/${name}.jpg`));
  }
  coverState.selectedPanel = 0;
  rebuildPanelPicker();
  syncZoomControl();
  redrawCover();
  setStatus('Sample photos loaded — swap any panel with your own photo.');
}

/** Reads the chosen file into the selected panel. */
export async function addPhotoFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    setPanelPhoto(coverState.selectedPanel, img);
    redrawCover();
    syncZoomControl();
    setStatus(`${file.name} is in panel ${coverState.selectedPanel + 1}. Drag it to position it.`);
  } catch {
    setStatus('That file could not be read as a photo.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Copies the selected panel's photo into every panel of the layout. */
export function fillAllPanelsWithSelected() {
  const photo = coverState.photos[coverState.selectedPanel];
  if (!photo) {
    setStatus('Load a photo into the selected panel first.');
    return;
  }
  for (let i = 0; i < panelCount(); i += 1) coverState.photos[i] = { ...photo };
  redrawCover();
  setStatus('One photo now fills every panel.');
}

/** Finds which panel a point on the canvas falls in, if any. */
export function panelAtPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const rects = panelRectsForLayout(coverState.layout, canvas.width, canvas.height);
  const hit = rects.findIndex((r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height);
  return hit === -1 ? null : { index: hit, x, y };
}

/** Drag-to-pan and wheel-to-zoom on the preview canvas. */
export function wireCanvasGestures() {
  let dragging = null;
  canvas.addEventListener('pointerdown', (event) => {
    const hit = panelAtPoint(event.clientX, event.clientY);
    if (!hit) return;
    coverState.selectedPanel = hit.index;
    rebuildPanelPicker();
    syncZoomControl();
    const photo = coverState.photos[hit.index];
    if (!photo) return;
    dragging = { startX: event.clientX, startY: event.clientY, ox: photo.offsetX, oy: photo.offsetY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const photo = coverState.photos[coverState.selectedPanel];
    if (!photo) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    photo.offsetX = dragging.ox + (event.clientX - dragging.startX) * scale;
    photo.offsetY = dragging.oy + (event.clientY - dragging.startY) * scale;
    redrawCover();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const photo = coverState.photos[coverState.selectedPanel];
    if (!photo) return;
    photo.zoom = Math.min(4, Math.max(1, photo.zoom * (event.deltaY < 0 ? 1.08 : 0.92)));
    syncZoomControl();
    redrawCover();
  }, { passive: false });
}

/** Builds a row of option buttons (layouts, grades, sizes) into a container. */
export function buildOptionRow(containerId, entries, currentKey, onPick) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  Object.entries(entries).forEach(([key, entry]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = entry.name;
    button.title = entry.blurb || entry.name;
    button.setAttribute('aria-pressed', String(key === currentKey));
    button.addEventListener('click', () => {
      onPick(key);
      buildOptionRow(containerId, entries, key, onPick);
    });
    container.appendChild(button);
  });
}

/** Exports the current cover at the chosen size and downloads the PNG. */
export async function exportCurrentCover() {
  setStatus('Exporting PNG…');
  try {
    const blob = await exportCoverPNG(coverState, coverState.size);
    const size = EXPORT_SIZES[coverState.size];
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-city-cover-${size.width}x${size.height}.png`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`Saved vice-city-cover-${size.width}x${size.height}.png — share it anywhere.`);
  } catch {
    setStatus('Export failed — try again.');
  }
}

function wireControls() {
  photoInput.addEventListener('change', (event) => addPhotoFile(event.target.files[0]));
  document.getElementById('use-samples').addEventListener('click', loadSamplePhotos);
  document.getElementById('fill-all').addEventListener('click', fillAllPanelsWithSelected);
  document.getElementById('clear-panel').addEventListener('click', () => {
    coverState.photos[coverState.selectedPanel] = null;
    redrawCover();
    syncZoomControl();
    setStatus(`Panel ${coverState.selectedPanel + 1} cleared.`);
  });
  titleInput.addEventListener('input', () => { coverState.title = titleInput.value; redrawCover(); });
  subtitleInput.addEventListener('input', () => { coverState.subtitle = subtitleInput.value; redrawCover(); });
  zoomSlider.addEventListener('input', () => {
    const photo = coverState.photos[coverState.selectedPanel];
    if (!photo) return;
    photo.zoom = Number(zoomSlider.value) / 100;
    zoomValue.textContent = `${zoomSlider.value}%`;
    redrawCover();
  });
  document.getElementById('export').addEventListener('click', exportCurrentCover);
  buildOptionRow('layout-row', LAYOUTS, coverState.layout, (key) => {
    coverState.layout = key;
    coverState.selectedPanel = 0;
    rebuildPanelPicker();
    syncZoomControl();
    redrawCover();
  });
  buildOptionRow('grade-row', GRADES, coverState.grade, (key) => {
    coverState.grade = key;
    redrawCover();
  });
  buildOptionRow('size-row', EXPORT_SIZES, coverState.size, (key) => {
    coverState.size = key;
    redrawCover();
  });
}

/** Lets the screenshot and test harness drive the app from the page. */
window.__coverMaker = {
  state: coverState,
  redraw: redrawCover,
  loadSamples: loadSamplePhotos,
  exportPNG: (sizeKey) => exportCoverPNG(coverState, sizeKey),
  setTitle: (text) => { coverState.title = text; titleInput.value = text; redrawCover(); },
};

async function startEditor() {
  wireControls();
  wireCanvasGestures();
  rebuildPanelPicker();
  syncZoomControl();
  try {
    await document.fonts.load('100px Anton');
  } catch { /* the fallback stack still draws bold lettering */ }
  const query = new URLSearchParams(location.search);
  if (query.get('shot')) {
    await runShot(query.get('shot'), query, {
      loadSamples: loadSamplePhotos,
      setLayout: (key) => { coverState.layout = key; },
      setGrade: (key) => { coverState.grade = key; },
      setSize: (key) => { coverState.size = key; },
      setTitle: (text) => { coverState.title = text; titleInput.value = text; },
      setSubtitle: (text) => { coverState.subtitle = text; subtitleInput.value = text; },
      setPanelPhoto,
      setPan: (index, dy) => {
        const photo = coverState.photos[index];
        if (photo) photo.offsetY = dy;
      },
      redraw: redrawCover,
      rebuildPicker: rebuildPanelPicker,
      syncZoom: syncZoomControl,
    });
  } else {
    redrawCover();
    setStatus('Add a photo, or load the samples to start.');
  }
}

startEditor();
