// globe.jsx — Mapbox GL JS map for Minko

const MINKO_CATEGORY_COLORS = {
  restaurant: '#d97757',
  hotel:      '#7a6ca3',
  attraction: '#5b8c6e',
  experience: '#c89e54',
};

function buildPinEl(pin, accent, isActive) {
  const color = pin.color || accent;
  const el = document.createElement('div');
  el.style.cssText = `
    cursor:pointer; display:block;
    filter:drop-shadow(0 3px 6px rgba(0,0,0,${isActive ? '0.45' : '0.28'}));
    transform:${isActive ? 'scale(1.28)' : 'scale(1)'};
    transform-origin:center bottom;
    transition:transform 0.15s ease, filter 0.15s ease;
  `;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '28');
  svg.setAttribute('viewBox', '0 0 20 28');
  svg.style.cssText = 'display:block;pointer-events:none;';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M10 1C5.6 1 2 4.6 2 9c0 6.2 8 18 8 18S18 15.2 18 9c0-4.4-3.6-8-8-8z');
  path.setAttribute('fill', color);
  path.setAttribute('stroke', 'white');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linejoin', 'round');

  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', '10');
  dot.setAttribute('cy', '9');
  dot.setAttribute('r', '3');
  dot.setAttribute('fill', 'white');
  dot.setAttribute('opacity', '0.9');

  svg.appendChild(path);
  svg.appendChild(dot);
  el.appendChild(svg);
  return el;
}

function MinkoGlobe({
  dark = false,
  accent = '#4f5bd5',
  pins = [],
  dots = [],
  onPinClick,
  activePinId,
  scrollable = true,
  initialOffset,
  fitToPins = false,
}) {
  const containerRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const initializedRef = React.useRef(false);
  const hasFittedRef = React.useRef(false);

  // Keep mutable refs so marker callbacks always see fresh values
  const pinsRef = React.useRef(pins);
  const accentRef = React.useRef(accent);
  const activePinIdRef = React.useRef(activePinId);
  const onPinClickRef = React.useRef(onPinClick);
  const scrollableRef = React.useRef(scrollable);
  React.useEffect(() => { pinsRef.current = pins; }, [pins]);
  React.useEffect(() => { accentRef.current = accent; }, [accent]);
  React.useEffect(() => { activePinIdRef.current = activePinId; }, [activePinId]);
  React.useEffect(() => { onPinClickRef.current = onPinClick; }, [onPinClick]);

  const addMarkers = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    pinsRef.current.forEach(pin => {
      if (pin.lon == null || pin.lat == null) return;
      const el = buildPinEl(pin, accentRef.current, activePinIdRef.current === pin.id);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onPinClickRef.current && onPinClickRef.current(pin.id);
      });
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([pin.lon, pin.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, []);

  const setAtmosphere = React.useCallback((map, isDark) => {
    try {
      map.setFog({
        color: isDark ? 'rgb(8,12,28)' : 'rgb(210,228,242)',
        'high-color': isDark ? 'rgb(18,28,58)' : 'rgb(175,205,228)',
        'horizon-blend': 0.08,
        'space-color': isDark ? 'rgb(4,6,18)' : 'rgb(185,208,238)',
        'star-intensity': isDark ? 0.7 : 0.0,
      });
    } catch (e) { /* globe projection may not be active yet */ }
  }, []);

  const fitGlobe = React.useCallback((map) => {
    const validPins = pinsRef.current.filter(p => p.lon != null && p.lat != null);
    if (validPins.length === 0) return;
    if (validPins.length === 1) {
      map.flyTo({ center: [validPins[0].lon, validPins[0].lat], zoom: 4, duration: 0 });
    } else {
      const bounds = validPins.reduce(
        (b, p) => b.extend([p.lon, p.lat]),
        new mapboxgl.LngLatBounds(
          [validPins[0].lon, validPins[0].lat],
          [validPins[0].lon, validPins[0].lat]
        )
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 5, duration: 0 });
    }
  }, []);

  const fitMiniMap = React.useCallback((map) => {
    const validPins = pinsRef.current.filter(p => p.lon != null && p.lat != null);
    if (validPins.length === 0) return;
    if (validPins.length === 1) {
      map.setCenter([validPins[0].lon, validPins[0].lat]);
      map.setZoom(6);
    } else {
      const bounds = validPins.reduce(
        (b, p) => b.extend([p.lon, p.lat]),
        new mapboxgl.LngLatBounds(
          [validPins[0].lon, validPins[0].lat],
          [validPins[0].lon, validPins[0].lat]
        )
      );
      map.fitBounds(bounds, { padding: 55, maxZoom: 8, duration: 0 });
    }
  }, []);

  // Initialize map once on mount
  React.useEffect(() => {
    if (!containerRef.current || !window.mapboxgl || initializedRef.current) return;
    initializedRef.current = true;

    mapboxgl.accessToken = window.MAPBOX_TOKEN;
    const isDark = dark;
    const isMini = !scrollable;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center: isMini ? [15, 30] : [15, 20],
      zoom: isMini ? 1.5 : 1.1,
      projection: isMini ? 'mercator' : 'globe',
      scrollZoom: !isMini,
      dragRotate: false,
      touchZoomRotate: true,
      touchPitch: false,
      attributionControl: false,
      logoPosition: 'bottom-right',
    });

    mapRef.current = map;

    map.on('load', () => {
      if (!isMini) setAtmosphere(map, isDark);
      if (isMini) map.touchZoomRotate.disableRotation();
      addMarkers();
      if (isMini) {
        fitMiniMap(map);
      } else if (fitToPins) {
        const valid = pinsRef.current.filter(p => p.lon != null && p.lat != null);
        if (valid.length > 0) {
          hasFittedRef.current = true;
          fitGlobe(map);
        }
      }
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      initializedRef.current = false;
    };
  }, []); // eslint-disable-line

  // Switch style on dark mode change
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const newStyle = dark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
    map.setStyle(newStyle);
    map.once('styledata', () => {
      if (!scrollableRef.current) {
        map.touchZoomRotate.disableRotation();
        addMarkers();
        fitMiniMap(map);
      } else {
        setAtmosphere(map, dark);
        addMarkers();
      }
    });
  }, [dark]); // eslint-disable-line

  // Refresh markers when pins / active pin / accent changes
  // Also fit to pins on first arrival — works for both globe and mini-map modes
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    addMarkers();
    if (!hasFittedRef.current) {
      const valid = pinsRef.current.filter(p => p.lon != null && p.lat != null);
      if (valid.length > 0) {
        hasFittedRef.current = true;
        if (!scrollableRef.current) {
          fitMiniMap(map);
        } else if (fitToPins) {
          fitGlobe(map);
        }
      }
    }
  }, [pins, activePinId, accent]); // eslint-disable-line

  const btnStyle = (dark) => ({
    width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
    background: dark ? 'rgba(28,30,42,0.82)' : 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: dark
      ? '0 2px 8px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.08)'
      : '0 1px 4px rgba(0,0,0,0.12), inset 0 0.5px 0 rgba(255,255,255,0.7)',
    color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(20,20,30,0.75)',
    fontSize: 20, fontWeight: 300, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.15s',
    flexShrink: 0,
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}/>
      {scrollable && (
        <div style={{ position: 'absolute', right: 14, bottom: 'max(100px, calc(env(safe-area-inset-bottom) + 100px))', display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10 }}>
          <button style={btnStyle(dark)} onClick={() => mapRef.current?.zoomIn({ duration: 250 })}>+</button>
          <button style={btnStyle(dark)} onClick={() => mapRef.current?.zoomOut({ duration: 250 })}>−</button>
        </div>
      )}
    </div>
  );
}

window.MinkoGlobe = MinkoGlobe;
window.MINKO_CATEGORY_COLORS = MINKO_CATEGORY_COLORS;
