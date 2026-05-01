// flows.jsx — Log entry flow, Profile, and Friends Globe screens

const { useState: useState2, useEffect: useEffect2 } = React;

function lonLatToCoords(lon, lat) {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

function mapboxCategoryToMinko(categories) {
  const cats = (Array.isArray(categories) ? categories.join(' ') : String(categories || '')).toLowerCase();
  if (/restaurant|food|cafe|bar|bistro|brasserie/.test(cats)) return 'restaurant';
  if (/hotel|lodging|hostel|motel|resort|inn/.test(cats)) return 'hotel';
  if (/museum|gallery|landmark|monument|park|attraction|temple|church/.test(cats)) return 'attraction';
  return 'experience';
}

// ─────────────────────────────────────────────────────────────
// ACTION PICKER — choose between Log Visit and Save to Wishlist
// ─────────────────────────────────────────────────────────────
function ActionPickerSheet({ dark, accent, onClose, onLogVisit, onSaveWishlist }) {
  return (
    <div style={{ padding: '8px 20px 44px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 22px' }}>
        <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, fontStyle: 'italic', color: dark ? '#f5f1e8' : '#1a1a2e' }}>
          What are you adding?
        </span>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 0,
          background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.06)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#f5f1e8' : '#1a1a2e' }}>
          <MinkoIcon name="close" size={16} strokeWidth={2}/>
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={onLogVisit} style={{
          height: 76, borderRadius: 16, border: 'none', cursor: 'pointer',
          background: accent, display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px',
          textAlign: 'left', boxShadow: `0 4px 18px ${accent}44`,
        }}>
          <MinkoIcon name="star" size={26} color="white" strokeWidth={1.5}/>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 15.5, fontWeight: 600, color: 'white' }}>Log a visit</div>
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: 'rgba(255,255,255,0.72)', marginTop: 3 }}>Rate a place you've been to</div>
          </div>
        </button>
        <button onClick={onSaveWishlist} style={{
          height: 76, borderRadius: 16, cursor: 'pointer', textAlign: 'left',
          border: dark ? '1.5px solid rgba(255,255,255,0.1)' : '1.5px solid rgba(20,30,60,0.1)',
          background: dark ? 'rgba(255,255,255,0.04)' : 'white',
          display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px',
        }}>
          <MinkoIcon name="bookmark" size={26} color={accent} strokeWidth={1.5}/>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 15.5, fontWeight: 600, color: dark ? '#f5f1e8' : '#1a1a2e' }}>Save to wishlist</div>
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)', marginTop: 3 }}>Add a place you want to visit</div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SAVE TO WISHLIST FLOW (2 steps)
// ─────────────────────────────────────────────────────────────
function SaveToWishlistFlow({ dark, accent, user, onClose, onConfirm }) {
  const [step, setStep] = useState2(1);
  const [place, setPlace] = useState2(null);
  const [category, setCategory] = useState2('experience');
  const [note, setNote] = useState2('');
  const [query, setQuery] = useState2('');
  const [results, setResults] = useState2([]);
  const [loading, setLoading] = useState2(false);
  const [saving, setSaving] = useState2(false);
  const [sessionToken] = useState2(() => 'minko-wish-' + Math.random().toString(36).slice(2));

  useEffect2(() => {
    if (!query.trim() || !window.MAPBOX_TOKEN) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${window.MAPBOX_TOKEN}&session_token=${sessionToken}&limit=5`;
        const res = await fetch(url);
        const json = await res.json();
        setResults((json.suggestions || []).map(s => ({
          id: s.mapbox_id, name: s.name, sub: s.place_formatted || '',
          mapbox_id: s.mapbox_id, poi_categories: s.poi_category || [],
        })));
      } catch(e) { setResults([]); }
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const selectPlace = async (r) => {
    if (!window.MAPBOX_TOKEN) return;
    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${r.mapbox_id}?access_token=${window.MAPBOX_TOKEN}&session_token=${sessionToken}`;
      const res = await fetch(url);
      const json = await res.json();
      const feat = json.features?.[0];
      setPlace({ ...r, lon: feat?.geometry.coordinates[0], lat: feat?.geometry.coordinates[1] });
      setCategory(mapboxCategoryToMinko(r.poi_categories));
    } catch(e) {
      setPlace({ ...r, lon: null, lat: null });
    }
  };

  const handleSave = async () => {
    if (!place || saving) return;
    setSaving(true);
    if (window.sb && user) {
      await window.sb.from('wishlist').insert({
        user_id: user.id,
        place: place.name,
        category,
        note: note || null,
        location: place.sub || null,
        lon: place.lon || null,
        lat: place.lat || null,
      });
    }
    setSaving(false);
    onConfirm();
  };

  const cats = [
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'hotel', label: 'Hotel' },
    { id: 'attraction', label: 'Attraction' },
    { id: 'experience', label: 'Experience' },
  ];

  return (
    <div style={{ padding: '4px 0 32px', minHeight: 420 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, fontStyle: 'italic', color: dark ? '#f5f1e8' : '#1a1a2e' }}>
            Save to wishlist
          </span>
          <span style={{ fontFamily: SANS, fontSize: 11, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.4)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Step {step} of 2
          </span>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 0,
          background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.06)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#f5f1e8' : '#1a1a2e' }}>
          <MinkoIcon name="close" size={16} strokeWidth={2}/>
        </button>
      </div>
      <div style={{ display: 'flex', gap: 5, padding: '2px 20px 16px' }}>
        {[1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, transition: 'background 0.25s',
            background: i <= step ? accent : (dark ? 'rgba(255,255,255,0.12)' : 'rgba(20,30,60,0.08)') }}/>
        ))}
      </div>

      {step === 1 && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <MinkoIcon name="search" size={18} color={dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.45)'} strokeWidth={1.8}/>
            </div>
            <input placeholder="Search for a place…" value={query}
              onChange={e => { setQuery(e.target.value); setPlace(null); }}
              style={{
                width: '100%', boxSizing: 'border-box', height: 52, paddingLeft: 42, paddingRight: 16,
                borderRadius: 14, border: 'none', outline: 'none',
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.05)',
                fontFamily: SANS, fontSize: 16, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e',
              }}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!query.trim() && <div style={{ padding: '24px 8px', textAlign: 'center', fontFamily: SANS, fontSize: 13.5, color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(20,20,30,0.35)' }}>Search for a place to add to your wishlist…</div>}
            {loading && !results.length && <div style={{ padding: '24px 8px', textAlign: 'center', fontFamily: SANS, fontSize: 13.5, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.4)' }}>Searching…</div>}
            {!loading && query.trim() && !results.length && <div style={{ padding: '24px 8px', textAlign: 'center', fontFamily: SANS, fontSize: 13.5, color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(20,20,30,0.35)' }}>No places found</div>}
            {results.map(r => {
              const sel = place?.id === r.id;
              return (
                <button key={r.id} onClick={() => selectPlace(r)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px',
                  background: sel ? (dark ? `${accent}22` : `${accent}10`) : 'transparent',
                  border: 0, borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: sel ? accent : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.06)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: sel ? 'white' : (dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)') }}>
                    <MinkoIcon name="bookmark" size={16} strokeWidth={1.8}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: dark ? '#f5f1e8' : '#1a1a2e' }}>{r.name}</div>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>
                  </div>
                  {sel && <MinkoIcon name="check" size={18} color={accent} strokeWidth={2.2}/>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ padding: '0 20px' }}>
          {place && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
              background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(20,30,60,0.04)', marginBottom: 18 }}>
              <MinkoIcon name="bookmark" size={16} color={accent} strokeWidth={2}/>
              <div style={{ flex: 1, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: dark ? '#f5f1e8' : '#1a1a2e' }}>{place.name}</div>
            </div>
          )}
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)', marginBottom: 12, letterSpacing: 0.3 }}>What kind of place?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {cats.map(c => {
              const sel = category === c.id;
              return (
                <button key={c.id} onClick={() => setCategory(c.id)} style={{
                  height: 80, borderRadius: 14, cursor: 'pointer', transition: 'all 0.18s',
                  border: sel ? `1.5px solid ${accent}` : (dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(20,30,60,0.07)'),
                  background: sel ? (dark ? `${accent}22` : `${accent}0e`) : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)'),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <MinkoIcon name={c.id} size={22} color={sel ? accent : (dark ? '#f5f1e8' : '#1a1a2e')} strokeWidth={1.5}/>
                  <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: sel ? 600 : 500, color: sel ? accent : (dark ? '#f5f1e8' : '#1a1a2e') }}>{c.label}</span>
                </button>
              );
            })}
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Why do you want to go? Any notes…"
            style={{
              width: '100%', boxSizing: 'border-box', minHeight: 80, padding: 14,
              borderRadius: 14, border: 'none', outline: 'none', resize: 'none',
              background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.04)',
              fontFamily: SERIF, fontSize: 17, lineHeight: 1.4, color: dark ? '#f5f1e8' : '#1a1a2e',
            }}/>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, padding: '20px 20px 0' }}>
        {step > 1 && (
          <button onClick={() => setStep(1)} style={{
            height: 50, padding: '0 18px', borderRadius: 12, cursor: 'pointer', border: 0,
            background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.05)',
            color: dark ? '#f5f1e8' : '#1a1a2e', fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
          }}>Back</button>
        )}
        <button
          disabled={step === 1 && !place}
          onClick={step === 1 ? () => setStep(2) : handleSave}
          style={{
            flex: 1, height: 50, borderRadius: 12, border: 0, letterSpacing: 0.2,
            cursor: (step === 1 && !place) ? 'default' : 'pointer',
            background: (step === 1 && !place) ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,60,0.1)') : accent,
            color: 'white', fontFamily: SANS, fontSize: 15, fontWeight: 600,
          }}>
          {step === 1 ? 'Continue' : (saving ? 'Saving…' : 'Save to wishlist')}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOG ENTRY FLOW (3 steps in one bottom sheet)
// ─────────────────────────────────────────────────────────────
function LogEntryFlow({ dark, accent, onClose, onConfirm }) {
  const [step, setStep] = useState2(1);
  const [place, setPlace] = useState2(null);
  const [category, setCategory] = useState2(null);
  const [rating, setRating] = useState2(0);
  const [note, setNote] = useState2('');
  const [query, setQuery] = useState2('');
  const [results, setResults] = useState2([]);
  const [loading, setLoading] = useState2(false);
  const [sessionToken] = useState2(() => 'minko-' + Math.random().toString(36).slice(2));

  useEffect2(() => {
    if (!query.trim() || !window.MAPBOX_TOKEN) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${window.MAPBOX_TOKEN}&session_token=${sessionToken}&limit=5`;
        const res = await fetch(url);
        const json = await res.json();
        setResults((json.suggestions || []).map(s => ({
          id: s.mapbox_id,
          name: s.name,
          sub: s.place_formatted || '',
          mapbox_id: s.mapbox_id,
          poi_categories: s.poi_category || [],
        })));
      } catch (e) { setResults([]); }
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const selectPlace = async (r) => {
    if (!window.MAPBOX_TOKEN) return;
    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${r.mapbox_id}?access_token=${window.MAPBOX_TOKEN}&session_token=${sessionToken}`;
      const res = await fetch(url);
      const json = await res.json();
      const feat = json.features?.[0];
      const lon = feat?.geometry.coordinates[0];
      const lat = feat?.geometry.coordinates[1];
      const coords = feat ? lonLatToCoords(lon, lat) : { x: 50, y: 40 };
      setPlace({ ...r, coords, lon, lat });
      setCategory(mapboxCategoryToMinko(r.poi_categories));
    } catch (e) {
      setPlace({ ...r, coords: { x: 50, y: 40 }, lon: null, lat: null });
      setCategory('experience');
    }
  };

  return (
    <div style={{ padding: '4px 0 32px', minHeight: 480 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', fontStyle: 'italic' }}>
            New memory
          </span>
          <span style={{ fontFamily: SANS, fontSize: 11, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.4)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Step {step} of 3
          </span>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 0,
          background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.06)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: dark ? '#f5f1e8' : '#1a1a2e' }}>
          <MinkoIcon name="close" size={16} strokeWidth={2}/>
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 5, padding: '2px 20px 16px' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 999,
            background: i <= step ? accent : (dark ? 'rgba(255,255,255,0.12)' : 'rgba(20,30,60,0.08)'),
            transition: 'background 0.25s',
          }}/>
        ))}
      </div>

      {/* STEP 1 — Place search */}
      {step === 1 && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <MinkoIcon name="search" size={18} color={dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.45)'} strokeWidth={1.8}/>
            </div>
            <input placeholder="Search for a place…" value={query}
              onChange={e => { setQuery(e.target.value); setPlace(null); }}
              style={{
                width: '100%', boxSizing: 'border-box',
                height: 52, paddingLeft: 42, paddingRight: 16, borderRadius: 14,
                border: 'none', outline: 'none',
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.05)',
                fontFamily: SANS, fontSize: 16, fontWeight: 500,
                color: dark ? '#f5f1e8' : '#1a1a2e',
              }}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!query.trim() && (
              <div style={{ padding: '24px 8px', textAlign: 'center', fontFamily: SANS, fontSize: 13.5, color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(20,20,30,0.35)' }}>
                Start typing to search restaurants, hotels, landmarks…
              </div>
            )}
            {loading && !results.length && (
              <div style={{ padding: '24px 8px', textAlign: 'center', fontFamily: SANS, fontSize: 13.5, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.4)' }}>
                Searching…
              </div>
            )}
            {!loading && query.trim() && !results.length && (
              <div style={{ padding: '24px 8px', textAlign: 'center', fontFamily: SANS, fontSize: 13.5, color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(20,20,30,0.35)' }}>
                No places found
              </div>
            )}
            {results.map(r => {
              const sel = place?.id === r.id;
              return (
                <button key={r.id} onClick={() => selectPlace(r)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px',
                  background: sel ? (dark ? 'rgba(79,91,213,0.18)' : `${accent}10`) : 'transparent',
                  border: 0, borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%',
                    background: sel ? accent : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.06)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: sel ? 'white' : (dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)'), flexShrink: 0 }}>
                    <MinkoIcon name="pin" size={16} strokeWidth={1.8}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: dark ? '#f5f1e8' : '#1a1a2e' }}>{r.name}</div>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>
                  </div>
                  {sel && <MinkoIcon name="check" size={18} color={accent} strokeWidth={2.2}/>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2 — Category */}
      {step === 2 && (
        <div style={{ padding: '0 20px' }}>
          {place && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
              background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(20,30,60,0.04)', marginBottom: 18 }}>
              <MinkoIcon name="pin" size={16} color={accent} strokeWidth={2}/>
              <div style={{ flex: 1, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: dark ? '#f5f1e8' : '#1a1a2e' }}>{place.name}</div>
            </div>
          )}
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)', marginBottom: 12, letterSpacing: 0.3 }}>
            What kind of place?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {MINKO_CATEGORIES.map(c => {
              const sel = category === c.id;
              return (
                <button key={c.id} onClick={() => setCategory(c.id)} style={{
                  height: 96, borderRadius: 14, cursor: 'pointer',
                  border: sel ? `1.5px solid ${accent}` : (dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(20,30,60,0.07)'),
                  background: sel ? (dark ? 'rgba(79,91,213,0.15)' : `${accent}0e`) : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)'),
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.18s',
                }}>
                  <MinkoIcon name={c.id} size={26} color={sel ? accent : (dark ? '#f5f1e8' : '#1a1a2e')} strokeWidth={1.5}/>
                  <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: sel ? 600 : 500, color: sel ? accent : (dark ? '#f5f1e8' : '#1a1a2e') }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3 — Rating + Note + Photo */}
      {step === 3 && (
        <div style={{ padding: '0 20px' }}>
          {place && (
            <div style={{ marginBottom: 22 }}>
              <CategoryChip category={category || 'restaurant'} color={accent} dark={dark}/>
              <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.3, lineHeight: 1.1, marginTop: 4 }}>
                {place.name}
              </div>
            </div>
          )}

          {/* Rating */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.5)', marginBottom: 8 }}>
              How was it? <span style={{ color: accent }}>·</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} onClick={() => setRating(i)} style={{ background: 'transparent', border: 0, padding: 4, cursor: 'pointer' }}>
                  <MinkoIcon name={i <= rating ? 'star' : 'star-outline'} size={32}
                    color={i <= rating ? '#c89e54' : (dark ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,30,0.2)')} strokeWidth={1.5}/>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 16 }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What made it memorable? Would you come back?"
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: 90, padding: 14,
                borderRadius: 14, border: 'none', outline: 'none', resize: 'none',
                background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.04)',
                fontFamily: SERIF, fontSize: 17, lineHeight: 1.4,
                color: dark ? '#f5f1e8' : '#1a1a2e',
              }}/>
          </div>

          {/* Photo upload row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <button style={{
              flex: 1, height: 56, borderRadius: 12, cursor: 'pointer',
              border: dark ? '1px dashed rgba(255,255,255,0.18)' : '1px dashed rgba(20,30,60,0.18)',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(20,20,30,0.65)',
              fontFamily: SANS, fontSize: 13.5, fontWeight: 500,
            }}>
              <MinkoIcon name="camera" size={18} strokeWidth={1.7}/>
              Add photo
            </button>
          </div>
        </div>
      )}

      {/* Footer buttons */}
      <div style={{ display: 'flex', gap: 10, padding: '20px 20px 0' }}>
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} style={{
            height: 50, padding: '0 18px', borderRadius: 12, cursor: 'pointer',
            background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.05)', border: 0,
            color: dark ? '#f5f1e8' : '#1a1a2e', fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
          }}>Back</button>
        )}
        <button
          disabled={(step === 1 && !place) || (step === 2 && !category) || (step === 3 && !rating)}
          onClick={async () => {
            if (step < 3) { setStep(step + 1); return; }
            if (window.sb) {
              const { data: { user } } = await window.sb.auth.getUser();
              if (user) {
                await window.sb.from('entries').insert({
                  user_id: user.id,
                  place: place.name,
                  category,
                  rating,
                  note: note || null,
                  location: place.sub || null,
                  lon: place.lon || null,
                  lat: place.lat || null,
                  date_visited: new Date().toISOString().split('T')[0],
                });
              }
            }
            onConfirm();
          }}
          style={{
            flex: 1, height: 50, borderRadius: 12, border: 0, cursor: 'pointer',
            background: ((step === 1 && !place) || (step === 2 && !category) || (step === 3 && !rating))
              ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,60,0.1)') : accent,
            color: 'white', fontFamily: SANS, fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
          }}>
          {step < 3 ? 'Continue' : 'Drop pin'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE SCREEN
// ─────────────────────────────────────────────────────────────

// Wishlist overlay — fetches real data, has + FAB
function WishlistOverlay({ open, onBack, dark, accent, user, refreshKey, onAdd }) {
  const [items, setItems] = useState2([]);
  const [fetching, setFetching] = useState2(false);

  useEffect2(() => {
    if (!open || !user) return;
    setFetching(true);
    window.sb.from('wishlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data || []); setFetching(false); });
  }, [open, refreshKey]);

  const catColor = (cat) => (window.MINKO_CATEGORY_COLORS && window.MINKO_CATEGORY_COLORS[cat]) || accent;

  return (
    <SlideOverlay open={open} onBack={onBack} dark={dark} title="Wishlist">
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '12px 16px 100px' }}>
          {fetching && (
            <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: SANS, fontSize: 13.5, color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(20,20,30,0.4)' }}>Loading…</div>
          )}
          {!fetching && items.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', gap: 12, textAlign: 'center' }}>
              <MinkoIcon name="bookmark" size={38} color={accent} strokeWidth={1.3}/>
              <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, letterSpacing: -0.3, color: dark ? '#f5f1e8' : '#1a1a2e' }}>No saved places yet</div>
              <div style={{ fontFamily: SANS, fontSize: 14, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)', lineHeight: 1.55 }}>Tap + to save a place you want to visit</div>
              <button onClick={onAdd} style={{
                marginTop: 8, height: 46, padding: '0 24px', borderRadius: 12, border: 0, cursor: 'pointer',
                background: accent, color: 'white', fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
                boxShadow: `0 4px 14px ${accent}44`,
              }}>Add your first place</button>
            </div>
          )}
          {items.map(w => (
            <div key={w.id} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 16, marginBottom: 8,
              background: dark ? 'rgba(255,255,255,0.04)' : 'white',
              border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(20,30,60,0.05)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                background: dark ? 'rgba(255,255,255,0.06)' : `${catColor(w.category)}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MinkoIcon name={w.category} size={22} color={catColor(w.category)} strokeWidth={1.4}/>
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, letterSpacing: -0.2, lineHeight: 1.15,
                  color: dark ? '#f5f1e8' : '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.place}</div>
                {w.location && <div style={{ fontFamily: SANS, fontSize: 12, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.location}</div>}
                {w.note && <div style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&ldquo;{w.note}&rdquo;</div>}
              </div>
            </div>
          ))}
        </div>
        {/* FAB */}
        <button onClick={onAdd} style={{
          position: 'absolute', right: 20, bottom: 28, width: 52, height: 52,
          borderRadius: '50%', border: 0, cursor: 'pointer',
          background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 18px ${accent}55`,
        }}>
          <MinkoIcon name="plus" size={24} color="white" strokeWidth={2.2}/>
        </button>
      </div>
    </SlideOverlay>
  );
}

// Shared slide-in full-screen overlay with back button
function SlideOverlay({ open, onBack, dark, title, children }) {
  const bg = dark ? '#13141b' : '#faf8f3';
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: bg,
      transform: open ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
      display: 'flex', flexDirection: 'column',
      pointerEvents: open ? 'auto' : 'none',
    }}>
      {/* Nav bar */}
      <div style={{ paddingTop: 58, padding: '58px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 0, background: 'none', cursor: 'pointer', padding: '6px 4px 6px 0', color: dark ? '#f5f1e8' : '#1a1a2e' }}>
          <MinkoIcon name="chevron-right" size={20} strokeWidth={2.2} style={{ transform: 'rotate(180deg)', display: 'block' }}/>
          <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 500 }}>Back</span>
        </button>
        {title && <div style={{ flex: 1, textAlign: 'center', fontFamily: SANS, fontSize: 15, fontWeight: 600, color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(20,20,30,0.6)', marginRight: 60 }}>{title}</div>}
      </div>
      {children}
    </div>
  );
}

// Full-screen friends list
function FriendsListOverlay({ open, onBack, onSelectFriend, dark, accent }) {
  return (
    <SlideOverlay open={open} onBack={onBack} dark={dark} title="Friends">
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 48px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MINKO_FRIENDS.map(f => {
          const entries = MINKO_FRIEND_ENTRIES.filter(e => e.friendId === f.id);
          const cities = [...new Set(entries.map(e => e.location.split(',')[0].trim()))];
          return (
            <button key={f.id} onClick={() => onSelectFriend(f)} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 16,
              background: dark ? 'rgba(255,255,255,0.04)' : 'white',
              border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(20,30,60,0.06)',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <Avatar name={f.name} color={f.color} size={46}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.2 }}>{f.name}</div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)', marginTop: 2 }}>
                  {entries.length} pins · {cities.slice(0, 2).join(', ')}{cities.length > 2 ? ` +${cities.length - 2}` : ''}
                </div>
              </div>
              <MinkoIcon name="chevron-right" size={16} color={dark ? 'rgba(255,255,255,0.25)' : 'rgba(20,20,30,0.25)'} strokeWidth={2}/>
            </button>
          );
        })}
      </div>
    </SlideOverlay>
  );
}

// Full-screen friend profile (mirrors ProfileScreen layout)
function FriendDetailOverlay({ open, friend, onBack, dark, accent }) {
  if (!friend) return null;
  const entries = MINKO_FRIEND_ENTRIES.filter(e => e.friendId === friend.id);
  const cats = [
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'hotel', label: 'Hotel' },
    { id: 'attraction', label: 'Attraction' },
    { id: 'experience', label: 'Experience' },
  ];
  return (
    <SlideOverlay open={open} onBack={onBack} dark={dark}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'clip' }}>
        {/* Header */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={friend.name} color={friend.color} size={56}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.3, lineHeight: 1.1 }}>{friend.name}</div>
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.5)', marginTop: 2 }}>
              {entries.length} pins · {new Set(entries.map(e => e.location.split(',')[0].trim())).size} cities
            </div>
          </div>
        </div>
        {/* Mini globe */}
        <div style={{ position: 'relative', height: 210, margin: '0 16px 8px', borderRadius: 18, overflow: 'hidden' }}>
          <MinkoGlobe dark={dark} accent={friend.color} scrollable={false}
            pins={entries.map(e => ({ id: e.id, lon: e.lon, lat: e.lat, color: friend.color }))}
          />
        </div>
        {/* Category counts */}
        <div style={{ padding: '10px 16px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          {cats.map(c => (
            <div key={c.id} style={{ padding: '12px 10px', borderRadius: 12,
              background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
              border: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(20,30,60,0.05)',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <MinkoIcon name={c.id} size={18} color={friend.color} strokeWidth={1.5}/>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, lineHeight: 1, color: dark ? '#f5f1e8' : '#1a1a2e' }}>{entries.filter(e => e.category === c.id).length}</div>
                <div style={{ fontFamily: SANS, fontSize: 10.5, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)', marginTop: 2, letterSpacing: 0.3 }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Pins */}
        <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', fontStyle: 'italic' }}>Pins</div>
          <span style={{ fontFamily: SANS, fontSize: 12, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)' }}>{entries.length} total</span>
        </div>
        <div style={{ padding: '0 16px 60px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 14,
              background: dark ? 'rgba(255,255,255,0.04)' : 'white',
              border: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(20,30,60,0.05)' }}>
              {e.photos?.[0] ? (
                <img src={e.photos[0]} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 10, flexShrink: 0, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MinkoIcon name={e.category} size={22} color={friend.color} strokeWidth={1.4}/>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.2, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.place}</div>
                <div style={{ margin: '5px 0 3px' }}>
                  <Stars n={e.rating} size={28}/>
                </div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.location} · {e.date}</div>
                {e.note && <div style={{ fontFamily: SANS, fontSize: 11.5, fontStyle: 'italic', color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(20,20,30,0.4)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&ldquo;{e.note}&rdquo;</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideOverlay>
  );
}

function ProfileScreen({ dark, accent, onPin, navProps, onLog, onSignOut, entries = [], user = null, wishlistCount = 0, wishlistRefreshKey = 0, onOpenWishlistAdd }) {
  const [showWishlist, setShowWishlist] = useState2(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You';
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;
  const cities = entries.length > 0
    ? new Set(entries.map(e => e.location?.split(',')[0].trim()).filter(Boolean)).size
    : 0;

  const avgRating = entries.length > 0
    ? (entries.reduce((s, e) => s + (e.rating || 0), 0) / entries.length).toFixed(1)
    : '—';
  const topRated = [...entries].sort((a, b) => (b.rating || 0) - (a.rating || 0));


  return (
    <div style={{ position: 'absolute', inset: 0, background: dark ? '#13141b' : '#faf8f3', display: 'flex', flexDirection: 'column' }}>
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'clip' }}>
      {/* Top header band */}
      <div style={{ paddingTop: 64, padding: '64px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => {}} style={{ border: 0, padding: 0, background: 'none', cursor: 'pointer', borderRadius: '50%', position: 'relative' }}>
          <Avatar name={displayName} color="#7a6ca3" size={56}/>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: '50%',
            background: dark ? '#2a2c38' : '#f0eee8', border: dark ? '1.5px solid rgba(255,255,255,0.08)' : '1.5px solid rgba(20,30,60,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MinkoIcon name="sliders" size={10} color={dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.5)'} strokeWidth={1.8}/>
          </div>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.3, lineHeight: 1.1, flex: 1 }}>
              {displayName}
            </div>
            {onSignOut && (
              <button onClick={onSignOut} style={{
                border: 0, cursor: 'pointer', padding: '3px 10px', borderRadius: 20,
                background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.07)',
                fontFamily: SANS, fontSize: 12, fontWeight: 600,
                color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.6)',
              }}>Sign out</button>
            )}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.5)', marginTop: 2 }}>
            {joinedDate ? `Joined ${joinedDate}` : 'Welcome to Minko'}{cities > 0 ? ` · ${cities} ${cities === 1 ? 'city' : 'cities'}` : ''}
          </div>
        </div>
      </div>

      {/* Mini globe — visual anchor */}
      <div style={{ position: 'relative', height: 220, margin: '8px 16px', borderRadius: 18, overflow: 'hidden' }}>
        <MinkoGlobe
          dark={dark} accent={accent}
          scrollable={false}
          pins={entries.filter(e => e.lon && e.lat).map(e => ({ id: e.id, lon: e.lon, lat: e.lat, color: accent }))}
          onPinClick={onPin}
        />
      </div>

      {/* Avg rating + place count */}
      <div style={{ padding: '10px 16px 4px', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, padding: '14px 16px', borderRadius: 16,
          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
          border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(20,30,60,0.06)',
          display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 500, lineHeight: 1, color: '#c89e54' }}>{avgRating}</div>
          {entries.length > 0 && <Stars n={Math.round(parseFloat(avgRating))} size={16}/>}
          <div style={{ fontFamily: SANS, fontSize: 11, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)', letterSpacing: 0.2 }}>avg rating · {entries.length} {entries.length === 1 ? 'place' : 'places'}</div>
        </div>
        <button onClick={() => setShowWishlist(true)} style={{ flex: 1, padding: '14px 16px', borderRadius: 16,
          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
          border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(20,30,60,0.06)',
          cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <MinkoIcon name="bookmark" size={22} color={accent} strokeWidth={1.5}/>
          <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', lineHeight: 1 }}>Wishlist</div>
          <div style={{ fontFamily: SANS, fontSize: 11, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)', letterSpacing: 0.2 }}>{wishlistCount} {wishlistCount === 1 ? 'saved place' : 'saved places'}</div>
        </button>
      </div>

      {/* Top rated */}
      <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', fontStyle: 'italic' }}>Top rated</div>
        <span style={{ fontFamily: SANS, fontSize: 12, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)' }}>{entries.length > 0 ? `${entries.length} total` : ''}</span>
      </div>
      <div style={{ padding: '0 16px 160px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: SANS, fontSize: 14, color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(20,20,30,0.35)' }}>
            Log your first place to see it here
          </div>
        )}
        {topRated.slice(0, 5).map(e => (
          <button key={e.id} onClick={() => onPin(e.id)} style={{
            display: 'flex', gap: 12, padding: 12, borderRadius: 14,
            background: dark ? 'rgba(255,255,255,0.04)' : 'white',
            border: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(20,30,60,0.05)',
            cursor: 'pointer', textAlign: 'left',
          }}>
            {e.photos?.[0] ? (
              <img src={e.photos[0]} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
            ) : (
              <div style={{ width: 60, height: 60, borderRadius: 10, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MinkoIcon name={e.category} size={22} color={accent} strokeWidth={1.4}/>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.2, lineHeight: 1.15,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.place}</div>
              <div style={{ margin: '5px 0 3px' }}>
                <Stars n={e.rating} size={28}/>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.location} · {e.date}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
      <BottomNav {...navProps} dark={dark} accent={accent} onLog={onLog}/>
      <WishlistOverlay
        open={showWishlist} dark={dark} accent={accent}
        onBack={() => setShowWishlist(false)}
        user={user}
        refreshKey={wishlistRefreshKey}
        onAdd={onOpenWishlistAdd}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FRIENDS GLOBE SCREEN
// ─────────────────────────────────────────────────────────────
function FriendsScreen({ dark, accent, onPin, activePinId, navProps, onLog }) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MinkoGlobe dark={dark} accent={accent} pins={[]} activePinId={null} onPinClick={() => {}}/>

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 58, left: 12, right: 12, zIndex: 30 }}>
        <GlassSurface dark={dark} radius={26} style={{ height: 52, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wordmark dark={dark} size={20}/>
          <span style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)' }}>· friends</span>
        </GlassSurface>
      </div>

      {/* Banner — sits just below the top bar */}
      <div style={{ position: 'absolute', top: 122, left: 12, right: 12, zIndex: 20 }}>
        <GlassSurface dark={dark} radius={16} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <MinkoIcon name="friends" size={22} color={accent} strokeWidth={1.5}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: dark ? '#f5f1e8' : '#1a1a2e' }}>Add friends to see their recommendations</div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)', marginTop: 2 }}>Friends feature coming soon</div>
          </div>
        </GlassSurface>
      </div>

      <BottomNav {...navProps} dark={dark} accent={accent} onLog={onLog}/>
    </div>
  );
}

window.ActionPickerSheet = ActionPickerSheet;
window.SaveToWishlistFlow = SaveToWishlistFlow;
window.LogEntryFlow = LogEntryFlow;
window.ProfileScreen = ProfileScreen;
window.FriendsScreen = FriendsScreen;
