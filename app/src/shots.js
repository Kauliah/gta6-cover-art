// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone,
// ?shot=editor shows the editor with a photo loaded. The query picks the
// sample photo, caption, layout, grade and size, so every screenshot is
// reproducible from its URL. window.__shotReady is set once the scene has
// painted, after the display font has loaded.

import { LAYOUTS, GRADES, EXPORT_SIZES } from './cover.js';

/**
 * Loads the sample photos into the panels. The `photo` query param picks the
 * first panel's photo; the panels then alternate the two samples so a
 * multi-panel cover shows more than one photo.
 */
async function loadShotPhotos(api, count, firstPhoto, query) {
  for (let i = 0; i < count; i += 1) {
    const name = i === 0 ? firstPhoto : (i % 2 === 0 ? 'pier' : 'boulevard');
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = `samples/${name}.jpg`;
    });
    api.setPanelPhoto(i, img);
    // A `pan<i>` query param frames the photo vertically in its panel
    // (export pixels, positive moves the photo down): the shot scene's
    // framing choice, the same drag a user would make in the editor.
    const pan = Number(query.get(`pan${i}`));
    if (Number.isFinite(pan) && pan !== 0) api.setPan(i, pan);
  }
}

/** Sets up one screenshot scene and marks it ready when painted. */
export async function runShot(shot, query, api) {
  const layout = LAYOUTS[query.get('layout')] ? query.get('layout') : 'hero';
  const grade = GRADES[query.get('grade')] ? query.get('grade') : 'sunset';
  const size = EXPORT_SIZES[query.get('size')] ? query.get('size') : 'square';
  api.setLayout(layout);
  api.setGrade(grade);
  api.setSize(size);
  api.setTitle(query.get('caption') || 'Vice City');
  api.setSubtitle(query.get('subtitle') || 'Sunset Heist');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'editor') document.body.classList.add('shot-editor');
  const firstPhoto = ['pier', 'boulevard'].includes(query.get('photo')) ? query.get('photo') : 'pier';
  await loadShotPhotos(api, LAYOUTS[layout].panels, firstPhoto, query);
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch { /* the fallback stack still draws bold lettering */ }
  api.rebuildPicker();
  api.syncZoom();
  api.redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
