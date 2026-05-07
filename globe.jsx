// globe.jsx — Mapbox GL JS map for Minko

const MINKO_CATEGORY_COLORS = {
  restaurant: '#d97757',
  hotel:      '#7a6ca3',
  attraction: '#5b8c6e',
  experience: '#c89e54',
};

// Draw a teardrop pin onto a canvas and return Mapbox image data.
// Rendered at 2× for retina; Mapbox halves it via pixelRatio:2.
function createPinImageData(color, isActive) {
  const scale = 2;
  const W = 20, H = 28;
  const canvas = document.createElement('canvas');
  canvas.width  = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Drop shadow
  ctx.shadowColor   = 'rgba(0,0,0,0.32)';
  ctx.shadowBlur    = isActive ? 8 : 5;
  ctx.shadowOffsetY = isActive ? 4 : 2;

  // Pin body
  const body = new Path2D(
    'M10 1C5.6 1 2 4.6 2 9c0 6.2 8 18 8 18S18 15.2 18 9c0-4.4-3.6-8-8-8z'
  );
  ctx.fillStyle = color;
  ctx.fill(body);

  // White stroke
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'white';
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  ctx.stroke(body);

  // White dot
  ctx.beginPath();
  ctx.arc(10, 9, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();

  const { data } = ctx.getImageData(0, 0, W * scale, H * scale);
  return { width: W * scale, height: H * scale, data };
}

// Sanitise a hex/rgb color into a safe image-key segment
function colorKey(color) {
  return color.replace(/[^a-zA-Z0-9]/g, '_');
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
  onMapClick,
  onMapLongPress,
  centerOn = null,
}) {
  const containerRef    = React.useRef(null);
  const mapRef          = React.useRef(null);
  const initializedRef  = React.useRef(false);
  const hasFittedRef    = React.useRef(false);
  // Track images already added so we don't call addImage twice
  const addedImagesRef  = React.useRef(new Set());

  // Mutable refs so callbacks always see fresh values
  const pinsRef            = React.useRef(pins);
  const accentRef          = React.useRef(accent);
  const activePinIdRef     = React.useRef(activePinId);
  const onPinClickRef      = React.useRef(onPinClick);
  const scrollableRef      = React.useRef(scrollable);
  const onMapClickRef      = React.useRef(onMapClick);
  const onMapLongPressRef  = React.useRef(onMapLongPress);
  const fitToPinsRef       = React.useRef(fitToPins);
  React.useEffect(() => { pinsRef.current        = pins;        }, [pins]);
  React.useEffect(() => { accentRef.current       = accent;      }, [accent]);
  React.useEffect(() => { activePinIdRef.current  = activePinId; }, [activePinId]);
  React.useEffect(() => { onPinClickRef.current   = onPinClick;  }, [onPinClick]);
  React.useEffect(() => { onMapClickRef.current   = onMapClick;  }, [onMapClick]);
  React.useEffect(() => { onMapLongPressRef.current = onMapLongPress; }, [onMapLongPress]);
  React.useEffect(() => { fitToPinsRef.current    = fitToPins;   }, [fitToPins]);

  // ── Ensure a pin image (normal + active) is registered ──────────────────
  const ensurePinImage = React.useCallback((map, color) => {
    const kn = 'mp-' + colorKey(color);        // normal
    const ka = 'mp-' + colorKey(color) + '_a'; // active
    if (!addedImagesRef.current.has(kn)) {
      map.addImage(kn, createPinImageData(color, false), { pixelRatio: 2 });
      addedImagesRef.current.add(kn);
    }
    if (!addedImagesRef.current.has(ka)) {
      map.addImage(ka, createPinImageData(color, true),  { pixelRatio: 2 });
      addedImagesRef.current.add(ka);
    }
    return { kn, ka };
  }, []);

  // ── Build GeoJSON from current pins ─────────────────────────────────────
  const buildGeoJSON = React.useCallback((map) => {
    const valid = pinsRef.current.filter(p => p.lon != null && p.lat != null);
    const features = valid.map(p => {
      const color    = p.color || accentRef.current;
      const isActive = p.id === activePinIdRef.current;
      const { kn, ka } = ensurePinImage(map, color);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
        properties: { id: p.id, imgKey: isActive ? ka : kn, isActive: isActive ? 1 : 0 },
      };
    });
    return { type: 'FeatureCollection', features };
  }, [ensurePinImage]);

  // ── Push pin data into the map (create source+layer on first call) ───────
  const updatePins = React.useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const geojson = buildGeoJSON(map);

    if (map.getSource('minko-pins')) {
      map.getSource('minko-pins').setData(geojson);
    } else {
      map.addSource('minko-pins', { type: 'geojson', data: geojson });
      map.addLayer({
        id:     'minko-pins-layer',
        type:   'symbol',
        source: 'minko-pins',
        layout: {
          'icon-image':              ['get', 'imgKey'],
          'icon-size':               ['case', ['==', ['get', 'isActive'], 1], 1.28, 1.0],
          'icon-anchor':             'bottom',
          'icon-allow-overlap':      true,
          'icon-ignore-placement':   true,
          'icon-pitch-alignment':    'viewport',
          'icon-rotation-alignment': 'viewport',
        },
      });
      // Pointer cursor on hover (desktop)
      map.on('mouseenter', 'minko-pins-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'minko-pins-layer', () => { map.getCanvas().style.cursor = '';        });
    }
  }, [buildGeoJSON]);

  const setAtmosphere = React.useCallback((map, isDark) => {
    try {
      map.setFog({
        color:            isDark ? 'rgb(8,12,28)'    : 'rgb(210,228,242)',
        'high-color':     isDark ? 'rgb(18,28,58)'   : 'rgb(175,205,228)',
        'horizon-blend':  0.08,
        'space-color':    isDark ? 'rgb(4,6,18)'     : 'rgb(185,208,238)',
        'star-intensity': isDark ? 0.7 : 0.0,
      });
    } catch {}
  }, []);

  const fitGlobe = React.useCallback((map) => {
    const valid = pinsRef.current.filter(p => p.lon != null && p.lat != null);
    if (!valid.length) return;
    if (valid.length === 1) {
      map.flyTo({ center: [valid[0].lon, valid[0].lat], zoom: 4, duration: 0 });
    } else {
      const bounds = valid.reduce(
        (b, p) => b.extend([p.lon, p.lat]),
        new mapboxgl.LngLatBounds([valid[0].lon, valid[0].lat], [valid[0].lon, valid[0].lat])
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 5, duration: 0 });
    }
  }, []);

  const fitMiniMap = React.useCallback((map) => {
    const valid = pinsRef.current.filter(p => p.lon != null && p.lat != null);
    if (!valid.length) return;
    if (valid.length === 1) {
      map.setCenter([valid[0].lon, valid[0].lat]);
      map.setZoom(6);
    } else {
      const bounds = valid.reduce(
        (b, p) => b.extend([p.lon, p.lat]),
        new mapboxgl.LngLatBounds([valid[0].lon, valid[0].lat], [valid[0].lon, valid[0].lat])
      );
      map.fitBounds(bounds, { padding: 55, maxZoom: 8, duration: 0 });
    }
  }, []);

  // ── Initialize map once on mount ─────────────────────────────────────────
  React.useEffect(() => {
    if (!containerRef.current || !window.mapboxgl || initializedRef.current) return;
    initializedRef.current = true;

    mapboxgl.accessToken = window.MAPBOX_TOKEN;
    const isDark = dark;
    const isMini = !scrollable;

    const map = new mapboxgl.Map({
      container:         containerRef.current,
      style:             isDark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
      center:            isMini ? [15, 30] : [15, 20],
      zoom:              isMini ? 1.5 : 1.1,
      projection:        isMini ? 'mercator' : 'globe',
      scrollZoom:        !isMini,
      dragRotate:        false,
      touchZoomRotate:   true,
      touchPitch:        false,
      attributionControl: false,
      logoPosition:      'bottom-right',
    });
    mapRef.current = map;

    map.on('load', () => {
      if (!isMini) setAtmosphere(map, isDark);
      if (isMini)  map.touchZoomRotate.disableRotation();

      updatePins();

      if (!isMini) {
        // Pin-layer clicks fire first; flag prevents the canvas handler firing too
        let pinJustClicked = false;

        map.on('click', 'minko-pins-layer', (e) => {
          pinJustClicked = true;
          const id = e.features?.[0]?.properties?.id;
          if (id) onPinClickRef.current?.(id);
        });

        map.on('click', (e) => {
          if (pinJustClicked) { pinJustClicked = false; return; }
          const features = map.queryRenderedFeatures(e.point);
          // Exclude our own pin layer from POI detection
          const poi = features.find(f =>
            f.geometry?.type === 'Point' &&
            f.properties?.name &&
            f.layer?.id !== 'minko-pins-layer'
          );
          const lon = poi ? poi.geometry.coordinates[0] : e.lngLat.lng;
          const lat = poi ? poi.geometry.coordinates[1] : e.lngLat.lat;
          onMapClickRef.current?.({ lon, lat, poiFeature: poi || null });
        });

        // ── Long-press detection ───────────────────────────────────────────
        let lpTimer = null;
        let lpStartX = 0, lpStartY = 0;
        let lpLngLat = null;
        const LP_MS = 600;
        const LP_PX = 10;

        const fireLongPress = (point) => {
          const features = map.queryRenderedFeatures(point);
          const poi = features.find(f =>
            f.geometry?.type === 'Point' &&
            f.properties?.name &&
            f.layer?.id !== 'minko-pins-layer'
          );
          const lon = poi ? poi.geometry.coordinates[0] : lpLngLat.lng;
          const lat = poi ? poi.geometry.coordinates[1] : lpLngLat.lat;

          // Visual ripple at press point
          if (containerRef.current) {
            const ripple = document.createElement('div');
            ripple.style.cssText = `position:absolute;left:${point.x - 24}px;top:${point.y - 24}px;width:48px;height:48px;border-radius:50%;border:2.5px solid ${accentRef.current};pointer-events:none;opacity:0;z-index:10;animation:minko-lp-ripple 0.55s ease-out forwards;`;
            containerRef.current.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
          }

          onMapLongPressRef.current?.({ lon, lat, poiFeature: poi || null });
        };

        const cancelLP = () => { clearTimeout(lpTimer); lpTimer = null; };

        map.on('touchstart', (e) => {
          if (e.originalEvent.touches.length !== 1) return;
          lpStartX = e.point.x; lpStartY = e.point.y; lpLngLat = e.lngLat;
          cancelLP();
          lpTimer = setTimeout(() => fireLongPress(e.point), LP_MS);
        });
        map.on('touchend', cancelLP);
        map.on('touchcancel', cancelLP);
        map.on('touchmove', (e) => {
          if (!lpTimer) return;
          const dx = e.point.x - lpStartX, dy = e.point.y - lpStartY;
          if (Math.hypot(dx, dy) > LP_PX) cancelLP();
        });

        // Desktop fallback
        map.on('mousedown', (e) => {
          if (e.originalEvent.button !== 0) return;
          lpStartX = e.point.x; lpStartY = e.point.y; lpLngLat = e.lngLat;
          cancelLP();
          lpTimer = setTimeout(() => fireLongPress(e.point), LP_MS);
        });
        map.on('mouseup', cancelLP);
        map.on('mousemove', (e) => {
          if (!lpTimer) return;
          const dx = e.point.x - lpStartX, dy = e.point.y - lpStartY;
          if (Math.hypot(dx, dy) > LP_PX) cancelLP();
        });
      }

      if (isMini) {
        fitMiniMap(map);
      } else if (fitToPinsRef.current) {
        const valid = pinsRef.current.filter(p => p.lon != null && p.lat != null);
        if (valid.length) { hasFittedRef.current = true; fitGlobe(map); }
      }
    });

    return () => {
      addedImagesRef.current.clear();
      map.remove();
      mapRef.current     = null;
      initializedRef.current = false;
    };
  }, []); // eslint-disable-line

  // ── Switch style on dark mode change ─────────────────────────────────────
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    addedImagesRef.current.clear(); // images are gone after style reload
    map.setStyle(dark ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
    map.once('styledata', () => {
      if (!scrollableRef.current) {
        map.touchZoomRotate.disableRotation();
        updatePins();
        fitMiniMap(map);
      } else {
        setAtmosphere(map, dark);
        updatePins();
      }
    });
  }, [dark]); // eslint-disable-line

  // ── Refresh pins when data / active pin / accent changes ─────────────────
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const tryFit = () => {
      updatePins();
      if (!hasFittedRef.current) {
        const valid = pinsRef.current.filter(p => p.lon != null && p.lat != null);
        if (valid.length) {
          hasFittedRef.current = true;
          if (!scrollableRef.current) fitMiniMap(map);
          else if (fitToPinsRef.current) fitGlobe(map);
        }
      }
    };
    if (!map.isStyleLoaded()) {
      // Style still loading — wait for it then try
      map.once('load', tryFit);
      return () => map.off('load', tryFit);
    }
    tryFit();
  }, [pins, activePinId, accent]); // eslint-disable-line

  // ── Imperatively fly to a location ───────────────────────────────────────
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !centerOn) return;
    map.flyTo({ center: [centerOn.lon, centerOn.lat], zoom: centerOn.zoom ?? 14, duration: 600 });
  }, [centerOn]); // eslint-disable-line

  const btnStyle = (dark) => ({
    width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
    background: dark ? 'rgba(28,30,42,0.82)' : 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    boxShadow: dark
      ? '0 2px 8px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.08)'
      : '0 1px 4px rgba(0,0,0,0.12), inset 0 0.5px 0 rgba(255,255,255,0.7)',
    color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(20,20,30,0.75)',
    fontSize: 20, fontWeight: 300, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.15s', flexShrink: 0,
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
