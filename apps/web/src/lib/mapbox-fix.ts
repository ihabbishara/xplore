// Mapbox GL JS fix for Next.js
export function setupMapbox() {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.mapboxgl = window.mapboxgl || {};
    // @ts-ignore
    if (window.mapboxgl.workerClass === undefined) {
      // @ts-ignore
      window.mapboxgl.workerClass = null;
    }
  }
}