// flows.jsx — Log entry flow, Profile, and Friends Globe screens

const { useState: useState2, useEffect: useEffect2, useRef: useRef2 } = React;

// ─────────────────────────────────────────────────────────────
// PHOTO UPLOAD UTILITY
// ─────────────────────────────────────────────────────────────
async function uploadPhoto(userId, tableKind, entryId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${tableKind}/${entryId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await window.sb.storage.from('entry-photos').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data: { publicUrl } } = window.sb.storage.from('entry-photos').getPublicUrl(path);
  return publicUrl;
}

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

async function reverseGeocode(lon, lat) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${window.MAPBOX_TOKEN}&types=poi,address,place&limit=1`;
    const res = await fetch(url);
    const json = await res.json();
    return json.features?.[0]?.place_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch { return `${lat.toFixed(4)}, ${lon.toFixed(4)}`; }
}

// ─────────────────────────────────────────────────────────────
// ADD PHOTO SHEET
// ─────────────────────────────────────────────────────────────
function AddPhotoSheet({ entry, tableKind, user, dark, accent, onClose, onSave }) {
  const [photos, setPhotos] = useState2(Array.isArray(entry?.photos) ? [...entry.photos] : []);
  const [uploading, setUploading] = useState2(false);
  const [saving, setSaving] = useState2(false);
  const fileRef = useRef2(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadPhoto(user.id, tableKind, entry.id, f)));
      setPhotos(prev => [...prev, ...urls]);
    } catch(err) { console.error('Upload error', err); }
    setUploading(false);
    e.target.value = '';
  };

  const removePhoto = (i) => setPhotos(prev => prev.filter((_, j) => j !== i));

  const handleSave = async () => {
    setSaving(true);
    await window.sb.from(tableKind).update({ photos }).eq('id', entry.id);
    setSaving(false);
    onSave(photos);
  };

  return (
    <div style={{ padding: '4px 0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 16px' }}>
        <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, fontStyle: 'italic', color: dark ? '#f5f1e8' : '#1a1a2e' }}>Photos</span>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 0,
          background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.06)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#f5f1e8' : '#1a1a2e' }}>
          <MinkoIcon name="close" size={16} strokeWidth={2}/>
        </button>
      </div>
      <div style={{ padding: '0 20px' }}>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {photos.map((url, i) => (
            <div key={i} style={{ position: 'relative', paddingBottom: '100%', borderRadius: 12, overflow: 'hidden' }}>
              <img src={url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
              <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24,
                borderRadius: '50%', border: 0, cursor: 'pointer', background: 'rgba(0,0,0,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MinkoIcon name="close" size={12} strokeWidth={2.2} color="white"/>
              </button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
            paddingBottom: '100%', borderRadius: 12, position: 'relative', cursor: uploading ? 'default' : 'pointer',
            border: dark ? '1.5px dashed rgba(255,255,255,0.2)' : '1.5px dashed rgba(20,30,60,0.2)',
            background: 'transparent',
          }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {uploading
                ? <span style={{ fontFamily: SANS, fontSize: 11, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)' }}>Uploading…</span>
                : <>
                    <MinkoIcon name="plus" size={20} color={dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)'} strokeWidth={2}/>
                    <span style={{ fontFamily: SANS, fontSize: 11, color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(20,20,30,0.4)' }}>Add</span>
                  </>
              }
            </div>
          </button>
        </div>
        {photos.length === 0 && !uploading && (
          <div style={{ textAlign: 'center', padding: '4px 0 16px', fontFamily: SANS, fontSize: 13.5, color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(20,20,30,0.4)' }}>
            No photos yet — tap + to add one
          </div>
        )}
        <button onClick={handleSave} disabled={saving || uploading} style={{
          width: '100%', height: 50, borderRadius: 14, border: 0, cursor: (saving || uploading) ? 'default' : 'pointer',
          background: (saving || uploading) ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,60,0.1)') : accent,
          color: 'white', fontFamily: SANS, fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
        }}>
          {saving ? 'Saving…' : uploading ? 'Uploading…' : 'Save photos'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EDIT ITEM FLOW (entries or wishlist)
// ─────────────────────────────────────────────────────────────
function EditItemFlow({ entry, tableKind, dark, accent, onClose, onConfirm }) {
  const [category, setCategory] = useState2(entry?.category || 'experience');
  const [rating, setRating] = useState2(entry?.rating || 0);
  const [note, setNote] = useState2(entry?.note || '');
  const [dateVisited, setDateVisited] = useState2(entry?.date_visited || '');
  const [links, setLinks] = useState2(Array.isArray(entry?.links) ? [...entry.links] : []);
  const [linkInput, setLinkInput] = useState2('');
  const [isPrivate, setIsPrivate] = useState2(entry?.is_private || false);
  const [saving, setSaving] = useState2(false);

  const isWishlist = tableKind === 'wishlist';
  const cats = [
    { id: 'restaurant', label: 'Restaurant' },
    { id: 'hotel', label: 'Hotel' },
    { id: 'attraction', label: 'Attraction' },
    { id: 'experience', label: 'Experience' },
  ];

  const addLink = () => {
    const v = linkInput.trim();
    if (!v) return;
    const url = v.startsWith('http') ? v : 'https://' + v;
    try { new URL(url); setLinks(prev => [...prev, url]); setLinkInput(''); } catch(e) {}
  };

  const handleSave = async () => {
    setSaving(true);
    const patch = {
      category,
      rating: rating || null,
      note: note || null,
      date_visited: dateVisited || null,
      links,
    };
    if (!isWishlist) patch.is_private = isPrivate;
    await window.sb.from(tableKind).update(patch).eq('id', entry.id);
    setSaving(false);
    onConfirm({ ...patch });
  };

  return (
    <div style={{ padding: '4px 0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 16px' }}>
        <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, fontStyle: 'italic', color: dark ? '#f5f1e8' : '#1a1a2e' }}>
          {isWishlist ? 'Edit wishlist item' : 'Edit entry'}
        </span>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 0,
          background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.06)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#f5f1e8' : '#1a1a2e' }}>
          <MinkoIcon name="close" size={16} strokeWidth={2}/>
        </button>
      </div>
      <div style={{ padding: '0 20px' }}>
        {/* Place name (read-only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, marginBottom: 20,
          background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(20,30,60,0.04)' }}>
          <MinkoIcon name="pin" size={15} color={accent} strokeWidth={2}/>
          <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: dark ? '#f5f1e8' : '#1a1a2e' }}>{entry?.place}</span>
        </div>

        {/* Category */}
        <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.45)', marginBottom: 10 }}>Category</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          {cats.map(c => {
            const sel = category === c.id;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                height: 72, borderRadius: 14, cursor: 'pointer', transition: 'all 0.18s',
                border: sel ? `1.5px solid ${accent}` : (dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(20,30,60,0.07)'),
                background: sel ? (dark ? `${accent}22` : `${accent}0e`) : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)'),
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                <MinkoIcon name={c.id} size={20} color={sel ? accent : (dark ? '#f5f1e8' : '#1a1a2e')} strokeWidth={1.5}/>
                <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: sel ? 600 : 500, color: sel ? accent : (dark ? '#f5f1e8' : '#1a1a2e') }}>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Rating */}
        <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.45)', marginBottom: 8 }}>Rating</div>
        <div style={{ marginBottom: 20 }}>
          <HalfStarPicker rating={rating} onChange={setRating} size={30} dark={dark}/>
        </div>

        {/* Note */}
        <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.45)', marginBottom: 8 }}>Note</div>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder={isWishlist ? 'Why do you want to go? Any notes…' : 'What made it memorable?'}
          style={{ width: '100%', boxSizing: 'border-box', minHeight: 80, padding: 14,
            borderRadius: 14, border: 'none', outline: 'none', resize: 'none',
            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.04)',
            fontFamily: SERIF, fontSize: 16, lineHeight: 1.4, color: dark ? '#f5f1e8' : '#1a1a2e',
            marginBottom: 20 }}/>

        {/* Date */}
        <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.45)', marginBottom: 8 }}>
          {isWishlist ? 'Planning to go' : 'Date visited'} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>· optional</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <input type="date" value={dateVisited} onChange={e => setDateVisited(e.target.value)}
            style={{ flex: 1, minWidth: 0, height: 44, padding: '0 14px',
              borderRadius: 12, border: 'none', outline: 'none',
              background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.04)',
              fontFamily: SANS, fontSize: 15, color: dark ? '#f5f1e8' : '#1a1a2e',
              colorScheme: dark ? 'dark' : 'light' }}/>
          {dateVisited && (
            <button onClick={() => setDateVisited('')} style={{
              width: 32, height: 32, borderRadius: '50%', border: 0, cursor: 'pointer', flexShrink: 0,
              background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,60,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)',
            }}>
              <MinkoIcon name="close" size={14} strokeWidth={2.5}/>
            </button>
          )}
        </div>

        {/* Links */}
        <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.45)', marginBottom: 8 }}>Links</div>
        {links.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            {links.map((url, i) => {
              let domain = url;
              try { domain = new URL(url).hostname.replace('www.', ''); } catch(e) {}
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10,
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.04)' }}>
                  <MinkoIcon name="link" size={14} color={accent} strokeWidth={2}/>
                  <span style={{ flex: 1, fontFamily: SANS, fontSize: 13, color: dark ? '#f5f1e8' : '#1a1a2e',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</span>
                  <button onClick={() => setLinks(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 0, cursor: 'pointer', padding: 2,
                      color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)' }}>
                    <MinkoIcon name="close" size={14} strokeWidth={2}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <input value={linkInput} onChange={e => setLinkInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addLink()}
            placeholder="https://…"
            style={{ flex: 1, height: 44, padding: '0 14px', borderRadius: 12, border: 'none', outline: 'none',
              background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.04)',
              fontFamily: SANS, fontSize: 14, color: dark ? '#f5f1e8' : '#1a1a2e' }}/>
          <button onClick={addLink} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: 0, cursor: 'pointer',
            background: accent, color: 'white', fontFamily: SANS, fontSize: 14, fontWeight: 600 }}>Add</button>
        </div>

        {/* Privacy toggle — entries only */}
        {!isWishlist && (
          <button onClick={() => setIsPrivate(p => !p)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderRadius: 14, border: `1px solid ${isPrivate ? accent + '55' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.07)')}`,
            background: isPrivate ? (dark ? `${accent}18` : `${accent}0c`) : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(20,30,60,0.02)'),
            cursor: 'pointer', textAlign: 'left', marginBottom: 20, transition: 'all 0.18s',
          }}>
            <MinkoIcon name="lock" size={18} color={isPrivate ? accent : (dark ? 'rgba(255,255,255,0.4)' : 'rgba(20,20,30,0.4)')} strokeWidth={1.8}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: dark ? '#f5f1e8' : '#1a1a2e' }}>Private entry</div>
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)', marginTop: 1 }}>Only visible to you</div>
            </div>
            {/* Toggle pill */}
            <div style={{
              width: 44, height: 26, borderRadius: 999, flexShrink: 0,
              background: isPrivate ? accent : (dark ? 'rgba(255,255,255,0.15)' : 'rgba(20,30,60,0.15)'),
              position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: isPrivate ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.2s',
              }}/>
            </div>
          </button>
        )}

        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', height: 50, borderRadius: 14, border: 0, cursor: saving ? 'default' : 'pointer',
          background: saving ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,60,0.1)') : accent,
          color: 'white', fontFamily: SANS, fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
        }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DELETE CONFIRM SHEET
// ─────────────────────────────────────────────────────────────
function DeleteConfirmSheet({ entry, tableKind, dark, accent, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState2(false);
  const label = tableKind === 'wishlist' ? 'wishlist item' : 'entry';

  const handleDelete = async () => {
    setDeleting(true);
    await window.sb.from(tableKind).delete().eq('id', entry.id);
    setDeleting(false);
    onConfirm();
  };

  return (
    <div style={{ padding: '24px 20px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(229,83,75,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MinkoIcon name="trash" size={26} color="#e5534b" strokeWidth={1.7}/>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.3 }}>
        Delete this {label}?
      </div>
      {entry?.place && (
        <div style={{ fontFamily: SANS, fontSize: 14, color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.55)', lineHeight: 1.55 }}>
          <strong style={{ color: dark ? '#f5f1e8' : '#1a1a2e' }}>{entry.place}</strong> will be permanently removed.
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, height: 50, borderRadius: 14, border: 0, cursor: 'pointer',
          background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.06)',
          color: dark ? '#f5f1e8' : '#1a1a2e', fontFamily: SANS, fontSize: 15, fontWeight: 600 }}>Cancel</button>
        <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, height: 50, borderRadius: 14, border: 0,
          cursor: deleting ? 'default' : 'pointer', background: '#e5534b',
          color: 'white', fontFamily: SANS, fontSize: 15, fontWeight: 600 }}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WISHLIST ITEM SHEET — full view of a wishlist item
// ─────────────────────────────────────────────────────────────
function WishlistItemSheet({ item, open, onBack, dark, accent, user, onDeleted, onUpdated }) {
  const [localItem, setLocalItem] = useState2(item || {});
  const [showEdit, setShowEdit] = useState2(false);
  const [showPhotos, setShowPhotos] = useState2(false);
  const [showDelete, setShowDelete] = useState2(false);

  useEffect2(() => { if (item) setLocalItem(item); }, [item?.id]);
  if (!item) return null;

  const catColor = (window.MINKO_CATEGORY_COLORS && window.MINKO_CATEGORY_COLORS[localItem.category]) || accent;

  const setRating = async (r) => {
    const newRating = (r === localItem.rating) ? null : r;
    const updated = { ...localItem, rating: newRating };
    setLocalItem(updated);
    await window.sb.from('wishlist').update({ rating: newRating }).eq('id', localItem.id);
    if (onUpdated) onUpdated(updated);
  };

  const InlineSheet = ({ show, onDismiss, children }) => (
    <>
      {show && <div onClick={onDismiss} style={{ position: 'absolute', inset: 0, zIndex: 5,
        background: 'rgba(15,20,40,0.22)', backdropFilter: 'blur(2px)' }}/>}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6,
        background: dark ? '#1c1d28' : '#faf8f3', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)', maxHeight: '90%', overflow: 'auto',
        transform: show ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        pointerEvents: show ? 'auto' : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 38, height: 4.5, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)' }}/>
        </div>
        {children}
      </div>
    </>
  );

  return (
    <SlideOverlay open={open} onBack={onBack} dark={dark} title="">
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {/* Photo gallery */}
        {localItem.photos?.length === 1 && (
          <div style={{ height: 200, margin: '8px 16px 0', borderRadius: 16, overflow: 'hidden' }}>
            <img src={localItem.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>
        )}
        {localItem.photos?.length > 1 && (
          <div style={{ margin: '8px 0 0', overflowX: 'auto', display: 'flex', gap: 8,
            padding: '0 16px', scrollSnapType: 'x mandatory' }}>
            {localItem.photos.map((url, i) => (
              <div key={i} style={{ flexShrink: 0, width: 200, height: 175, borderRadius: 14,
                overflow: 'hidden', scrollSnapAlign: 'start' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              </div>
            ))}
          </div>
        )}
        {!localItem.photos?.length && (
          <div style={{ height: 120, margin: '8px 16px 0', borderRadius: 16,
            background: dark ? `${catColor}18` : `${catColor}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MinkoIcon name={localItem.category} size={40} color={catColor} strokeWidth={1.3}/>
          </div>
        )}

        <div style={{ padding: '18px 20px 0' }}>
          <CategoryChip category={localItem.category} dark={dark}/>
          <h2 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, lineHeight: 1.05, margin: '4px 0 8px',
            color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.4 }}>{localItem.place}</h2>

          {localItem.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
              fontFamily: SANS, fontSize: 12.5, color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)' }}>
              <MinkoIcon name="pin" size={13} color={catColor} strokeWidth={2}/>
              {localItem.location}
            </div>
          )}

          {/* Rating — tappable */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
              color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.45)', marginBottom: 8 }}>Rating</div>
            <HalfStarPicker rating={localItem.rating || 0} onChange={setRating} size={30} dark={dark}/>
          </div>

          {localItem.note && (
            <p style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.45, fontWeight: 400,
              color: dark ? 'rgba(245,241,232,0.85)' : 'rgba(26,26,46,0.78)',
              margin: '0 0 18px', paddingLeft: 14, borderLeft: `2px solid ${catColor}55` }}>
              {localItem.note}
            </p>
          )}

          {/* Links */}
          {localItem.links?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
                color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)', marginBottom: 8 }}>Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {localItem.links.map((url, i) => {
                  let domain = url;
                  try { domain = new URL(url).hostname.replace('www.', ''); } catch(e) {}
                  return (
                    <button key={i} onClick={() => window.open(url, '_blank')} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                      background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.04)',
                      border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(20,30,60,0.06)',
                      cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <MinkoIcon name="link" size={14} color={accent} strokeWidth={2}/>
                      <span style={{ fontFamily: SANS, fontSize: 13.5, color: dark ? '#f5f1e8' : '#1a1a2e',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4, marginBottom: 48 }}>
            <button onClick={() => setShowEdit(true)} style={{
              flex: 1, height: 48, borderRadius: 12, border: 0, cursor: 'pointer',
              background: accent, color: 'white',
              fontFamily: SANS, fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MinkoIcon name="edit" size={16} color="white" strokeWidth={1.8}/>
              Edit
            </button>
            <button onClick={() => setShowPhotos(true)} style={{
              width: 48, height: 48, borderRadius: 12, cursor: 'pointer',
              background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.06)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dark ? '#f5f1e8' : '#1a1a2e' }}>
              <MinkoIcon name="camera" size={18} strokeWidth={1.7}/>
            </button>
            <button onClick={() => setShowDelete(true)} style={{
              width: 48, height: 48, borderRadius: 12, cursor: 'pointer',
              background: dark ? 'rgba(229,83,75,0.15)' : 'rgba(229,83,75,0.08)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#e5534b' }}>
              <MinkoIcon name="trash" size={18} strokeWidth={1.7}/>
            </button>
          </div>
        </div>

        {/* Inline sub-sheets */}
        <InlineSheet show={showEdit} onDismiss={() => setShowEdit(false)}>
          <EditItemFlow
            entry={localItem} tableKind="wishlist" dark={dark} accent={accent}
            onClose={() => setShowEdit(false)}
            onConfirm={(fields) => {
              setShowEdit(false);
              const merged = { ...localItem, ...fields };
              setLocalItem(merged);
              if (onUpdated) onUpdated(merged);
            }}
          />
        </InlineSheet>

        <InlineSheet show={showPhotos} onDismiss={() => setShowPhotos(false)}>
          <AddPhotoSheet
            entry={localItem} tableKind="wishlist" user={user} dark={dark} accent={accent}
            onClose={() => setShowPhotos(false)}
            onSave={(photos) => {
              setShowPhotos(false);
              const updated = { ...localItem, photos };
              setLocalItem(updated);
              if (onUpdated) onUpdated(updated);
            }}
          />
        </InlineSheet>

        <InlineSheet show={showDelete} onDismiss={() => setShowDelete(false)}>
          <DeleteConfirmSheet
            entry={localItem} tableKind="wishlist" dark={dark} accent={accent}
            onClose={() => setShowDelete(false)}
            onConfirm={() => { setShowDelete(false); if (onDeleted) onDeleted(); }}
          />
        </InlineSheet>
      </div>
    </SlideOverlay>
  );
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
function SaveToWishlistFlow({ dark, accent, user, onClose, onConfirm, initialPlace = null }) {
  const [step, setStep] = useState2(initialPlace ? 2 : 1);
  const [place, setPlace] = useState2(initialPlace);
  const [category, setCategory] = useState2(initialPlace ? mapboxCategoryToMinko(initialPlace.poi_categories) : 'experience');
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
        const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${window.MAPBOX_TOKEN}&session_token=${sessionToken}&types=poi,place,address&proximity=ip&limit=8`;
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
// LOCATION PICKER SCREEN — full-screen map + search for step 1
// ─────────────────────────────────────────────────────────────
function LocationPickerScreen({ dark, accent, onConfirm, onCancel }) {
  const [query, setQuery]                   = useState2('');
  const [results, setResults]               = useState2([]);
  const [loading, setLoading]               = useState2(false);
  const [dropdownOpen, setDropdownOpen]     = useState2(false);
  const [pinLoc, setPinLoc]                 = useState2(null);   // { lon, lat }
  const [selectedPlace, setSelectedPlace]   = useState2(null);
  const [customName, setCustomName]         = useState2('');
  const [isCustom, setIsCustom]             = useState2(false);
  const [reverseLoading, setReverseLoading] = useState2(false);
  const [awaitingPin, setAwaitingPin]       = useState2(false);  // custom row tapped, waiting for map tap
  const [sessionToken] = useState2(() => 'minko-pick-' + Math.random().toString(36).slice(2));
  const inputRef = useRef2(null);

  // Search debounce
  useEffect2(() => {
    if (!query.trim() || !window.MAPBOX_TOKEN) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${window.MAPBOX_TOKEN}&session_token=${sessionToken}&types=poi,place,address&proximity=ip&limit=8`;
        const res = await fetch(url);
        const json = await res.json();
        setResults((json.suggestions || []).map(s => ({
          id: s.mapbox_id, name: s.name, sub: s.place_formatted || '',
          mapbox_id: s.mapbox_id, poi_categories: s.poi_category || [],
        })));
      } catch { setResults([]); }
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const selectSearchResult = async (r) => {
    if (!window.MAPBOX_TOKEN) return;
    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${r.mapbox_id}?access_token=${window.MAPBOX_TOKEN}&session_token=${sessionToken}`;
      const res = await fetch(url);
      const json = await res.json();
      const feat = json.features?.[0];
      const lon = feat?.geometry.coordinates[0] ?? null;
      const lat = feat?.geometry.coordinates[1] ?? null;
      const place = { ...r, lon, lat, coords: lon != null ? lonLatToCoords(lon, lat) : { x: 50, y: 40 }, isCustom: false };
      setSelectedPlace(place);
      setPinLoc(lon != null ? { lon, lat } : null);
      setIsCustom(false);
      setAwaitingPin(false);
      setDropdownOpen(false);
      setQuery(r.name);
    } catch {
      setDropdownOpen(false);
    }
  };

  const handleMapTap = async ({ lon, lat, poiFeature }) => {
    setPinLoc({ lon, lat });
    setIsCustom(true);
    setAwaitingPin(false);

    if (poiFeature?.properties?.name) {
      // User tapped a named POI label — use its data directly, no reverse geocode needed
      const name = poiFeature.properties.name;
      const poiCat = poiFeature.properties.category_en || poiFeature.properties.maki || '';
      setCustomName(name);
      setDropdownOpen(false);
      setSelectedPlace({ id: 'custom-' + Date.now(), name, sub: poiFeature.properties.address || '', lon, lat, coords: lonLatToCoords(lon, lat), poi_categories: [poiCat], isCustom: true });
    } else {
      // Plain map tap — reverse geocode for a default name
      setReverseLoading(true);
      const name = await reverseGeocode(lon, lat);
      setReverseLoading(false);
      setCustomName(name);
      setSelectedPlace({ id: 'custom-' + Date.now(), name, sub: '', lon, lat, coords: lonLatToCoords(lon, lat), poi_categories: [], isCustom: true });
    }
  };

  const handleCustomRow = () => {
    const name = query.trim();
    setCustomName(name);
    setIsCustom(true);
    setDropdownOpen(false);
    setAwaitingPin(true);
    setSelectedPlace(null);
    setPinLoc(null);
  };

  const handleConfirm = () => {
    if (!selectedPlace) return;
    const final = isCustom ? { ...selectedPlace, name: customName || selectedPlace.name } : selectedPlace;
    onConfirm(final);
  };

  const canConfirm = selectedPlace && (!isCustom || pinLoc);

  const topBarTop = 'calc(env(safe-area-inset-top, 0px) + 14px)';

  const floatBg = dark ? 'rgba(22,24,36,0.88)' : 'rgba(255,255,255,0.92)';
  const floatShadow = dark
    ? '0 2px 12px rgba(0,0,0,0.45), inset 0 0.5px 0 rgba(255,255,255,0.08)'
    : '0 2px 12px rgba(0,0,0,0.12), inset 0 0.5px 0 rgba(255,255,255,0.7)';
  const textColor = dark ? '#f5f1e8' : '#1a1a2e';
  const subColor = dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: dark ? '#0d0f1a' : '#eef2f7' }}>
      {/* Map fills everything */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <MinkoGlobe
          dark={dark}
          accent={accent}
          scrollable={true}
          fitToPins={false}
          pins={pinLoc ? [{ id: 'pick', lon: pinLoc.lon, lat: pinLoc.lat, color: accent }] : []}
          centerOn={pinLoc ? { lon: pinLoc.lon, lat: pinLoc.lat, zoom: 14 } : null}
          onMapClick={handleMapTap}
        />
      </div>

      {/* Top bar: cancel + search */}
      <div style={{ position: 'absolute', top: topBarTop, left: 14, right: 14, zIndex: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Cancel button */}
        <button onClick={onCancel} style={{
          width: 42, height: 42, borderRadius: 13, border: 0, cursor: 'pointer', flexShrink: 0,
          background: floatBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: floatShadow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: textColor,
        }}>
          <MinkoIcon name="close" size={16} strokeWidth={2}/>
        </button>

        {/* Search bar */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
          height: 42, borderRadius: 13,
          background: floatBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: floatShadow,
        }}>
          <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <MinkoIcon name="search" size={17} color={subColor} strokeWidth={1.8}/>
          </div>
          <input
            ref={inputRef}
            placeholder="Search restaurants, stores, hotels…"
            value={query}
            onChange={e => { setQuery(e.target.value); setDropdownOpen(true); setSelectedPlace(null); setIsCustom(false); setAwaitingPin(false); setPinLoc(null); }}
            onFocus={() => { if (query.trim()) setDropdownOpen(true); }}
            style={{
              flex: 1, height: '100%', paddingLeft: 38, paddingRight: 14, border: 'none', outline: 'none',
              background: 'transparent', fontFamily: SANS, fontSize: 15, fontWeight: 500, color: textColor,
              borderRadius: 13,
            }}
          />
          {query.length > 0 && (
            <button onClick={() => { setQuery(''); setResults([]); setDropdownOpen(false); setSelectedPlace(null); setIsCustom(false); setAwaitingPin(false); setPinLoc(null); }}
              style={{ background: 'none', border: 0, cursor: 'pointer', padding: '0 12px', color: subColor, display: 'flex', alignItems: 'center' }}>
              <MinkoIcon name="close" size={14} strokeWidth={2.2}/>
            </button>
          )}
        </div>
      </div>

      {/* Dropdown results */}
      {dropdownOpen && (query.trim()) && (
        <div style={{
          position: 'absolute', top: `calc(${topBarTop} + 52px)`, left: 14, right: 14, zIndex: 15,
          background: floatBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 16, boxShadow: floatShadow,
          overflow: 'hidden',
        }}>
          {loading && results.length === 0 && (
            <div style={{ padding: '18px 16px', fontFamily: SANS, fontSize: 13.5, color: subColor, textAlign: 'center' }}>Searching…</div>
          )}
          {results.map((r, i) => (
            <button key={r.id} onMouseDown={(e) => { e.preventDefault(); selectSearchResult(r); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
              background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left',
              borderBottom: i < results.length - 1 || true ? `0.5px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}` : 'none',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                <MinkoIcon name="pin" size={15} strokeWidth={1.8}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: subColor, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</div>
              </div>
            </button>
          ))}
          {/* Custom location row */}
          <button onMouseDown={(e) => { e.preventDefault(); handleCustomRow(); }} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
            background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: dark ? `${accent}22` : `${accent}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
              <MinkoIcon name="plus" size={16} strokeWidth={2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: accent }}>Add "{query.trim()}" as custom location</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: subColor, marginTop: 1 }}>Tap the map to place the pin</div>
            </div>
          </button>
        </div>
      )}

      {/* Awaiting pin instruction */}
      {awaitingPin && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 10, pointerEvents: 'none',
          background: floatBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: floatShadow, borderRadius: 16, padding: '14px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: textColor, marginBottom: 4 }}>Tap the map to place your pin</div>
          <div style={{ fontFamily: SANS, fontSize: 13, color: subColor }}>Pinch to zoom, drag to explore</div>
        </div>
      )}

      {/* Custom name editor — shows when a custom pin is placed */}
      {isCustom && pinLoc && (
        <div style={{
          position: 'absolute', bottom: `calc(max(24px, env(safe-area-inset-bottom, 0px) + 16px) + 62px)`,
          left: 14, right: 14, zIndex: 10,
          background: floatBg, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: floatShadow, borderRadius: 16, padding: '14px 16px',
        }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: subColor, marginBottom: 8 }}>
            {reverseLoading ? 'Finding place…' : 'Name this place'}
          </div>
          <input
            value={customName}
            onChange={e => {
              setCustomName(e.target.value);
              setSelectedPlace(prev => prev ? { ...prev, name: e.target.value } : null);
            }}
            placeholder="e.g. Grandma's House"
            style={{
              width: '100%', boxSizing: 'border-box', height: 42, padding: '0 12px',
              borderRadius: 10, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              outline: 'none', background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(20,30,60,0.05)',
              fontFamily: SANS, fontSize: 15, fontWeight: 500, color: textColor,
            }}
          />
        </div>
      )}

      {/* Confirm button */}
      <button
        disabled={!canConfirm}
        onClick={handleConfirm}
        style={{
          position: 'absolute', left: 14, right: 14,
          bottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
          zIndex: 10, height: 52, borderRadius: 16, border: 0,
          cursor: canConfirm ? 'pointer' : 'default',
          background: canConfirm ? accent : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,60,0.1)'),
          color: canConfirm ? 'white' : subColor,
          fontFamily: SANS, fontSize: 16, fontWeight: 600, letterSpacing: 0.2,
          backdropFilter: canConfirm ? 'none' : 'blur(10px)',
          WebkitBackdropFilter: canConfirm ? 'none' : 'blur(10px)',
          boxShadow: canConfirm ? `0 4px 18px ${accent}55` : 'none',
          transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
        }}>
        {awaitingPin ? 'Tap the map to place your pin' : canConfirm ? `Confirm — ${selectedPlace?.name || ''}` : 'Search or tap the map'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOG ENTRY FLOW (steps 2+3 — rendered after LocationPickerScreen confirms)
// ─────────────────────────────────────────────────────────────
function LogEntryFlow({ dark, accent, user, onClose, onConfirm, initialPlace = null, onBackToPicker }) {
  // initialPlace is always provided (place was chosen in LocationPickerScreen at App level)
  const [step, setStep] = useState2(2);
  const [place, setPlace] = useState2(initialPlace);
  const [category, setCategory] = useState2(initialPlace ? mapboxCategoryToMinko(initialPlace.poi_categories) : null);
  const [rating, setRating] = useState2(0);
  const [note, setNote] = useState2('');
  const [links, setLinks] = useState2([]);
  const [linkInput, setLinkInput] = useState2('');
  // pendingFiles holds {file, preview} objects — photos are NOT uploaded until submit
  // so we always have a real entry ID to use as the storage path
  const [pendingFiles, setPendingFiles] = useState2([]);
  const [dateVisited, setDateVisited] = useState2('');
  const [isPrivate, setIsPrivate] = useState2(false);
  const [submitting, setSubmitting] = useState2(false);
  const photoInputRef = useRef2(null);

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

          {/* Rating + Date — side by side */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
            {/* Rating */}
            <div style={{ flex: '0 0 auto' }}>
              <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.5)', marginBottom: 8 }}>
                Rating
              </div>
              <HalfStarPicker rating={rating} onChange={setRating} size={28} dark={dark}/>
            </div>
            {/* Date visited */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.5)', marginBottom: 8 }}>
                Date <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>· optional</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="date" value={dateVisited} onChange={e => setDateVisited(e.target.value)}
                  style={{
                    flex: 1, minWidth: 0, height: 38, padding: '0 10px', borderRadius: 10, border: 'none', outline: 'none',
                    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.05)',
                    fontFamily: SANS, fontSize: 13, color: dark ? '#f5f1e8' : '#1a1a2e',
                    colorScheme: dark ? 'dark' : 'light',
                  }}/>
                {dateVisited && (
                  <button onClick={() => setDateVisited('')} style={{
                    width: 26, height: 26, borderRadius: '50%', border: 0, cursor: 'pointer', flexShrink: 0,
                    background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,60,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)',
                  }}>
                    <MinkoIcon name="close" size={12} strokeWidth={2.5}/>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Photos */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.5)', marginBottom: 10 }}>Photos</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {pendingFiles.map(({ preview }, i) => (
                <div key={preview} style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={preview} style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', display: 'block' }} alt=""/>
                  <button onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', border: 0, cursor: 'pointer',
                      background: 'rgba(0,0,0,0.55)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                    <MinkoIcon name="close" size={11} strokeWidth={2.5} color="white"/>
                  </button>
                </div>
              ))}
              <button onClick={() => photoInputRef.current?.click()}
                disabled={submitting}
                style={{ width: 72, height: 72, borderRadius: 12, border: `1.5px dashed ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,30,0.18)'}`,
                  background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(20,30,60,0.03)', cursor: submitting ? 'default' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0 }}>
                <MinkoIcon name="camera" size={22} color={dark ? 'rgba(255,255,255,0.4)' : 'rgba(20,20,30,0.35)'} strokeWidth={1.6}/>
              </button>
              <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => {
                  const snap = Array.from(e.target.files || []);
                  e.target.value = '';
                  setPendingFiles(prev => [...prev, ...snap.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
                }}/>
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

          {/* Links */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.45)', marginBottom: 8 }}>Links (optional)</div>
            {links.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {links.map((url, i) => {
                  let domain = url;
                  try { domain = new URL(url).hostname.replace('www.', ''); } catch(e) {}
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10,
                      background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.04)' }}>
                      <MinkoIcon name="link" size={13} color={accent} strokeWidth={2}/>
                      <span style={{ flex: 1, fontFamily: SANS, fontSize: 13, color: dark ? '#f5f1e8' : '#1a1a2e',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</span>
                      <button onClick={() => setLinks(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 0, cursor: 'pointer', padding: 2,
                          color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)' }}>
                        <MinkoIcon name="close" size={14} strokeWidth={2}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { const v = linkInput.trim(); if (v) { const url = v.startsWith('http') ? v : 'https://' + v; try { new URL(url); setLinks(prev => [...prev, url]); setLinkInput(''); } catch(err) {} } } }}
                placeholder="https://…"
                style={{ flex: 1, height: 44, padding: '0 14px', borderRadius: 12, border: 'none', outline: 'none',
                  background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.04)',
                  fontFamily: SANS, fontSize: 14, color: dark ? '#f5f1e8' : '#1a1a2e' }}/>
              <button onClick={() => { const v = linkInput.trim(); if (v) { const url = v.startsWith('http') ? v : 'https://' + v; try { new URL(url); setLinks(prev => [...prev, url]); setLinkInput(''); } catch(e) {} } }}
                style={{ height: 44, padding: '0 14px', borderRadius: 12, border: 0, cursor: 'pointer',
                  background: accent, color: 'white', fontFamily: SANS, fontSize: 14, fontWeight: 600 }}>Add</button>
            </div>
          </div>

          {/* Privacy toggle */}
          <button onClick={() => setIsPrivate(p => !p)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderRadius: 14, border: `1px solid ${isPrivate ? accent + '55' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.07)')}`,
            background: isPrivate ? (dark ? `${accent}18` : `${accent}0c`) : (dark ? 'rgba(255,255,255,0.03)' : 'rgba(20,30,60,0.02)'),
            cursor: 'pointer', textAlign: 'left', marginBottom: 4, transition: 'all 0.18s',
          }}>
            <MinkoIcon name="lock" size={18} color={isPrivate ? accent : (dark ? 'rgba(255,255,255,0.4)' : 'rgba(20,20,30,0.4)')} strokeWidth={1.8}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: dark ? '#f5f1e8' : '#1a1a2e' }}>Private entry</div>
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)', marginTop: 1 }}>Only visible to you</div>
            </div>
            <div style={{
              width: 44, height: 26, borderRadius: 999, flexShrink: 0,
              background: isPrivate ? accent : (dark ? 'rgba(255,255,255,0.15)' : 'rgba(20,30,60,0.15)'),
              position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: isPrivate ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.2s',
              }}/>
            </div>
          </button>
        </div>
      )}

      {/* Footer buttons */}
      <div style={{ display: 'flex', gap: 10, padding: '20px 20px 0' }}>
        <button onClick={() => step === 2 ? (onBackToPicker ? onBackToPicker() : onClose()) : setStep(step - 1)} style={{
          height: 50, padding: '0 18px', borderRadius: 12, cursor: 'pointer',
          background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.05)', border: 0,
          color: dark ? '#f5f1e8' : '#1a1a2e', fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
        }}>Back</button>
        <button
          disabled={(step === 2 && !category) || (step === 3 && (!rating || submitting))}
          onClick={async () => {
            if (step < 3) { setStep(step + 1); return; }
            if (!window.sb) { onConfirm(); return; }
            setSubmitting(true);
            try {
              const { data: { user } } = await window.sb.auth.getUser();
              if (!user) { onConfirm(); return; }

              // 1. Insert entry (no photos yet — we need the real ID first)
              const { data: inserted, error: insertErr } = await window.sb.from('entries').insert({
                user_id: user.id,
                place: place.name,
                category,
                rating,
                note: note || null,
                location: place.sub || null,
                lon: place.lon || null,
                lat: place.lat || null,
                date_visited: dateVisited || null,
                links: links.length ? links : [],
                photos: [],
                is_private: isPrivate,
              }).select('id').single();

              if (insertErr) { console.error('insert error', insertErr); onConfirm(); return; }

              // 2. Upload photos using the real entry ID, then patch the row
              if (pendingFiles.length > 0) {
                const urls = await Promise.all(
                  pendingFiles.map(({ file }) => uploadPhoto(user.id, 'entries', inserted.id, file))
                );
                await window.sb.from('entries').update({ photos: urls }).eq('id', inserted.id);
              }
            } catch (err) {
              console.error('submit error', err);
            }
            setSubmitting(false);
            onConfirm();
          }}
          style={{
            flex: 1, height: 50, borderRadius: 12, border: 0, cursor: 'pointer',
            background: ((step === 2 && !category) || (step === 3 && (!rating || submitting)))
              ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(20,30,60,0.1)') : accent,
            color: 'white', fontFamily: SANS, fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
          }}>
          {step < 3 ? 'Continue' : submitting ? 'Saving…' : 'Drop pin'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE SCREEN
// ─────────────────────────────────────────────────────────────

// Wishlist overlay — fetches real data, manages its own add sheet inline
function WishlistOverlay({ open, onBack, dark, accent, user, refreshKey, onItemAdded }) {
  const [items, setItems] = useState2([]);
  const [fetching, setFetching] = useState2(false);
  const [showAdd, setShowAdd] = useState2(false);
  const [activeItem, setActiveItem] = useState2(null);

  const refetch = () => {
    if (!user) return;
    window.sb.from('wishlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setItems(data || []));
  };

  useEffect2(() => {
    if (!open || !user) return;
    setFetching(true);
    window.sb.from('wishlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { setItems(data || []); setFetching(false); });
  }, [open, refreshKey]);

  const handleAdded = () => {
    setShowAdd(false);
    refetch();
    if (onItemAdded) onItemAdded();
  };

  const handleItemUpdated = (updated) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    if (onItemAdded) onItemAdded();
  };

  const handleItemDeleted = () => {
    setActiveItem(null);
    refetch();
    if (onItemAdded) onItemAdded();
  };

  const catColor = (cat) => (window.MINKO_CATEGORY_COLORS && window.MINKO_CATEGORY_COLORS[cat]) || accent;

  return (
    <SlideOverlay open={open} onBack={onBack} dark={dark} title="Wishlist">
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Scrollable list */}
        <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '12px 16px 100px' }}>
          {fetching && (
            <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: SANS, fontSize: 13.5, color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(20,20,30,0.4)' }}>Loading…</div>
          )}
          {!fetching && items.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', gap: 12, textAlign: 'center' }}>
              <MinkoIcon name="bookmark" size={38} color={accent} strokeWidth={1.3}/>
              <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, letterSpacing: -0.3, color: dark ? '#f5f1e8' : '#1a1a2e' }}>No saved places yet</div>
              <div style={{ fontFamily: SANS, fontSize: 14, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)', lineHeight: 1.55 }}>Tap + to save a place you want to visit</div>
              <button onClick={() => setShowAdd(true)} style={{
                marginTop: 8, height: 46, padding: '0 24px', borderRadius: 12, border: 0, cursor: 'pointer',
                background: accent, color: 'white', fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
                boxShadow: `0 4px 14px ${accent}44`,
              }}>Add your first place</button>
            </div>
          )}
          {items.map(w => (
            <button key={w.id} onClick={() => setActiveItem(w)} style={{
              display: 'flex', gap: 12, padding: 14, borderRadius: 16, marginBottom: 8, width: '100%',
              background: dark ? 'rgba(255,255,255,0.04)' : 'white',
              border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(20,30,60,0.05)',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                background: dark ? 'rgba(255,255,255,0.06)' : `${catColor(w.category)}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MinkoIcon name={w.category} size={22} color={catColor(w.category)} strokeWidth={1.4}/>
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, letterSpacing: -0.2, lineHeight: 1.15,
                  color: dark ? '#f5f1e8' : '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.place}</div>
                {w.location && <div style={{ fontFamily: SANS, fontSize: 12, color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.location}</div>}
                {w.rating > 0 && <div style={{ marginTop: 4 }}><Stars n={w.rating} size={12}/></div>}
                {!w.rating && w.note && <div style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&ldquo;{w.note}&rdquo;</div>}
              </div>
              <MinkoIcon name="chevron-right" size={16} color={dark ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,30,0.2)'} strokeWidth={2}/>
            </button>
          ))}
        </div>

        {/* FAB */}
        <button onClick={() => setShowAdd(true)} style={{
          position: 'absolute', right: 20, bottom: 28, width: 52, height: 52,
          borderRadius: '50%', border: 0, cursor: 'pointer',
          background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 18px ${accent}55`,
        }}>
          <MinkoIcon name="plus" size={24} color="white" strokeWidth={2.2}/>
        </button>

        {/* Add sheet */}
        {showAdd && (
          <div onClick={() => setShowAdd(false)} style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(15,20,40,0.18)', backdropFilter: 'blur(2px)',
          }}/>
        )}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 11,
          background: dark ? '#1c1d28' : '#faf8f3',
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
          transform: showAdd ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '90%', overflow: 'auto',
          pointerEvents: showAdd ? 'auto' : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
            <div style={{ width: 38, height: 4.5, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)' }}/>
          </div>
          <SaveToWishlistFlow
            dark={dark} accent={accent} user={user}
            onClose={() => setShowAdd(false)}
            onConfirm={handleAdded}
          />
        </div>

        {/* Wishlist item detail — nested slide overlay */}
        <WishlistItemSheet
          item={activeItem}
          open={!!activeItem}
          onBack={() => setActiveItem(null)}
          dark={dark} accent={accent} user={user}
          onDeleted={handleItemDeleted}
          onUpdated={handleItemUpdated}
        />
      </div>
    </SlideOverlay>
  );
}

// Shared slide-in full-screen overlay with back button
function SlideOverlay({ open, onBack, dark, title, children }) {
  const bg = dark ? '#13141b' : '#faf8f3';
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 160,
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

// ─────────────────────────────────────────────────────────────
// SHARED FRIEND PROFILE PAGE
// Used from both ProfileScreen (friends list) and FriendsScreen (search/friend rows)
// ─────────────────────────────────────────────────────────────
function FriendProfilePage({ profile, dark, accent, currentUserId, user, onBack, onFriendshipChanged, zIndex = 160 }) {
  const [pEntries, setPEntries] = useState2([]);
  const [friendsCount, setFriendsCount] = useState2(null);
  const [loading, setLoading] = useState2(true);
  const [friendshipId, setFriendshipId] = useState2(null);
  const [optimistic, setOptimistic] = useState2(false);
  const [viewingEntry, setViewingEntry] = useState2(null);
  const [showReviews, setShowReviews] = useState2(false);
  const [showFriendsList, setShowFriendsList] = useState2(false);
  const [profileFriends, setProfileFriends] = useState2([]);
  const [friendsListLoading, setFriendsListLoading] = useState2(false);
  const [viewingSubFriend, setViewingSubFriend] = useState2(null);

  const mutedC = dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)';
  const labelC = dark ? '#f5f1e8' : '#1a1a2e';

  useEffect2(() => {
    if (!profile?.id) return;
    setLoading(true);
    setPEntries([]);
    setFriendsCount(null);
    setFriendshipId(null);
    setOptimistic(false);
    Promise.all([
      window.sb.from('entries').select('*').eq('user_id', profile.id).neq('is_private', true).order('created_at', { ascending: false }),
      window.sb.from('friendships').select('id', { count: 'exact', head: true })
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
        .eq('status', 'accepted'),
      currentUserId
        ? window.sb.from('friendships').select('id, requester_id, addressee_id').eq('status', 'accepted')
            .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
        : Promise.resolve({ data: [] }),
    ]).then(([entriesRes, fcRes, fsRes]) => {
      setPEntries((entriesRes.data || []).map(e => ({
        ...e,
        date: e.date_visited
          ? new Date(e.date_visited + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
          : '',
        photos: Array.isArray(e.photos) ? e.photos : [],
        links: Array.isArray(e.links) ? e.links : [],
      })));
      setFriendsCount(fcRes.count || 0);
      const fs = (fsRes.data || []).find(f => f.requester_id === profile.id || f.addressee_id === profile.id);
      setFriendshipId(fs?.id || null);
      setLoading(false);
    });
  }, [profile?.id]);

  const isFriend = optimistic || friendshipId !== null;

  const handleAdd = async () => {
    if (!currentUserId) return;
    setOptimistic(true);
    const { data, error } = await window.sb.from('friendships').upsert(
      { requester_id: currentUserId, addressee_id: profile.id, status: 'accepted' },
      { onConflict: 'requester_id,addressee_id', ignoreDuplicates: false }
    ).select('id').single();
    if (error) { console.error('addFriend', error); setOptimistic(false); }
    else { setFriendshipId(data?.id || null); onFriendshipChanged?.(); }
  };

  const handleRemove = async () => {
    if (!friendshipId) return;
    await window.sb.from('friendships').delete().eq('id', friendshipId);
    setFriendshipId(null);
    setOptimistic(false);
    onFriendshipChanged?.();
    onBack();
  };

  const openFriendsList = async () => {
    setShowFriendsList(true);
    if (profileFriends.length > 0 || friendsListLoading) return;
    setFriendsListLoading(true);
    const { data } = await window.sb.from('friendships')
      .select('id, requester_id, addressee_id, requester:profiles!requester_id(id, display_name, avatar_url), addressee:profiles!addressee_id(id, display_name, avatar_url)')
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)
      .eq('status', 'accepted');
    setProfileFriends(data || []);
    setFriendsListLoading(false);
  };

  const pAvgRating = pEntries.length > 0
    ? (pEntries.reduce((s, e) => s + (e.rating || 0), 0) / pEntries.length).toFixed(1)
    : '—';
  const pTopRated = [...pEntries].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex, background: dark ? '#13141b' : '#faf8f3', display: 'flex', flexDirection: 'column', animation: 'minko-fade-in 0.18s ease' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'clip' }}>

        {/* Header row — mirrors ProfileScreen exactly */}
        <div style={{ paddingTop: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px) + 6px)', paddingLeft: 20, paddingRight: 20, paddingBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, position: 'relative', flexShrink: 0 }}>
            <Avatar src={profile.avatar_url} name={profile.display_name} color="#7a6ca3" size={44}/>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: '50%',
              background: dark ? 'rgba(40,42,58,0.95)' : 'rgba(240,238,232,0.95)',
              border: '1.5px solid ' + (dark ? 'rgba(255,255,255,0.12)' : 'rgba(20,20,30,0.1)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke={mutedC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </div>
          </button>

          <div style={{ flex: 1, fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: labelC, letterSpacing: -0.3, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.display_name || 'User'}
          </div>

          {[
            { value: loading ? '…' : pEntries.length, label: pEntries.length === 1 ? 'review' : 'reviews', onClick: () => setShowReviews(true) },
            { value: loading ? '…' : (friendsCount ?? '…'), label: friendsCount === 1 ? 'friend' : 'friends', onClick: openFriendsList },
          ].map(({ value, label, onClick }) => (
            <button key={label} onClick={onClick} style={{ flexShrink: 0, padding: '5px 9px', borderRadius: 8, border: 0,
              cursor: 'pointer', textAlign: 'left',
              background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)',
              outline: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(20,30,60,0.07)',
              display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, lineHeight: 1.1, color: labelC }}>{value}</div>
              <div style={{ fontFamily: SANS, fontSize: 10, color: mutedC, letterSpacing: 0.1 }}>{label}</div>
            </button>
          ))}

          {currentUserId && (isFriend
            ? <_FriendPillBtn onClick={handleRemove} label="Friends" bg={dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,20,30,0.07)'} color={mutedC}/>
            : <_FriendPillBtn onClick={handleAdd} label="Add" bg={accent} color="white"/>)}
        </div>

        {/* Mini globe */}
        <div style={{ position: 'relative', height: 220, margin: '8px 16px', borderRadius: 18, overflow: 'hidden' }}>
          <MinkoGlobe dark={dark} accent={accent} scrollable={false}
            pins={pEntries.filter(e => e.lon && e.lat).map(e => ({ id: e.id, lon: e.lon, lat: e.lat, color: (window.MINKO_CATEGORY_COLORS?.[e.category] || accent) }))}
            onPinClick={(id) => setViewingEntry(pEntries.find(e => e.id === id) || null)}
          />
        </div>

        {/* Avg rating */}
        <div style={{ padding: '10px 16px 4px' }}>
          <div style={{ padding: '14px 16px', borderRadius: 16,
            background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
            border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(20,30,60,0.06)',
            display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 500, lineHeight: 1, color: '#c89e54' }}>{pAvgRating}</div>
            {pEntries.length > 0 && <Stars n={Math.round(parseFloat(pAvgRating))} size={16}/>}
            <div style={{ fontFamily: SANS, fontSize: 11, color: mutedC, letterSpacing: 0.2 }}>avg rating · {pEntries.length} {pEntries.length === 1 ? 'place' : 'places'}</div>
          </div>
        </div>

        {/* Top rated */}
        <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: labelC, fontStyle: 'italic' }}>Top rated</div>
          <span style={{ fontFamily: SANS, fontSize: 12, color: mutedC }}>{pEntries.length > 0 ? `${pEntries.length} total` : ''}</span>
        </div>
        <div style={{ padding: '0 16px 160px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: SANS, fontSize: 14, color: mutedC }}>Loading…</div>
          ) : pEntries.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: SANS, fontSize: 14, color: mutedC }}>No places logged yet</div>
          ) : pTopRated.map(e => (
            <button key={e.id} onClick={() => setViewingEntry(e)} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 14,
              background: dark ? 'rgba(255,255,255,0.04)' : 'white',
              border: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(20,30,60,0.05)',
              cursor: 'pointer', textAlign: 'left', width: '100%' }}>
              {e.photos?.[0] ? (
                <img src={e.photos[0]} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 10, flexShrink: 0,
                  background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MinkoIcon name={e.category} size={22} color={accent} strokeWidth={1.4}/>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: labelC, letterSpacing: -0.2, lineHeight: 1.15,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.place || 'Unnamed place'}</div>
                <div style={{ margin: '5px 0 3px' }}><Stars n={e.rating} size={28}/></div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, color: mutedC,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.location} · {e.date}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Inline entry detail — slides up over the profile page */}
      {viewingEntry && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', flexDirection: 'column', animation: 'minko-fade-in 0.18s ease' }}>
          <div onClick={() => setViewingEntry(null)} style={{ flex: 1, background: 'rgba(15,20,40,0.25)', backdropFilter: 'blur(2px)' }}/>
          <div style={{ background: dark ? '#1c1d28' : '#faf8f3', borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: '0 -10px 40px rgba(0,0,0,0.18)', maxHeight: '85%', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
              <div style={{ width: 38, height: 4.5, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)' }}/>
            </div>
            <PlaceDetailSheet
              entry={viewingEntry} dark={dark} accent={accent}
              friendMode={true} friend={profile}
              friendsAtPlace={[]}
              user={user}
              onClose={() => setViewingEntry(null)}
            />
          </div>
        </div>
      )}

      {/* Reviews overlay */}
      {showReviews && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 6, background: dark ? '#0e1018' : '#f4f1eb',
          display: 'flex', flexDirection: 'column', animation: 'minko-fade-in 0.18s ease' }}>
          <div style={{ paddingTop: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px))',
            display: 'flex', alignItems: 'center', gap: 4, padding: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px)) 8px 0',
            flexShrink: 0 }}>
            <button onClick={() => setShowReviews(false)} style={{ border: 0, background: 'none', cursor: 'pointer',
              padding: '10px 12px', color: accent, display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: labelC, flex: 1 }}>
              {profile.display_name?.split(' ')[0] || 'Their'}'s Reviews
            </span>
            <span style={{ fontFamily: SANS, fontSize: 13, color: mutedC, paddingRight: 16 }}>{pEntries.length} total</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px',
            paddingBottom: 'max(100px, calc(env(safe-area-inset-bottom) + 90px))' }}>
            {pTopRated.map(e => (
              <button key={e.id} onClick={() => { setShowReviews(false); setViewingEntry(e); }}
                style={{ width: '100%', display: 'flex', gap: 12, padding: 12, borderRadius: 14,
                  background: dark ? 'rgba(255,255,255,0.04)' : 'white',
                  border: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(20,30,60,0.05)',
                  cursor: 'pointer', textAlign: 'left', marginBottom: 8 }}>
                {e.photos?.[0] ? (
                  <img src={e.photos[0]} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}/>
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 10, flexShrink: 0,
                    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MinkoIcon name={e.category} size={22} color={accent} strokeWidth={1.4}/>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: labelC,
                    letterSpacing: -0.2, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.place}</div>
                  <div style={{ margin: '4px 0 2px' }}><Stars n={e.rating} size={12}/></div>
                  <div style={{ fontFamily: SANS, fontSize: 11.5, color: mutedC,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.location} · {e.date}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Friends list overlay */}
      {showFriendsList && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 6, background: dark ? '#0e1018' : '#f4f1eb',
          display: 'flex', flexDirection: 'column', animation: 'minko-fade-in 0.18s ease' }}>
          <div style={{ paddingTop: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px))',
            display: 'flex', alignItems: 'center', gap: 4, padding: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px)) 8px 0',
            flexShrink: 0 }}>
            <button onClick={() => setShowFriendsList(false)} style={{ border: 0, background: 'none', cursor: 'pointer',
              padding: '10px 12px', color: accent, display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: labelC, flex: 1 }}>
              {profile.display_name?.split(' ')[0] || 'Their'}'s Friends
            </span>
            <span style={{ fontFamily: SANS, fontSize: 13, color: mutedC, paddingRight: 16 }}>{friendsCount} total</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px',
            paddingBottom: 'max(100px, calc(env(safe-area-inset-bottom) + 90px))' }}>
            {friendsListLoading ? (
              <div style={{ padding: '48px 0', textAlign: 'center', fontFamily: SANS, fontSize: 14, color: mutedC }}>Loading…</div>
            ) : profileFriends.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', fontFamily: SANS, fontSize: 14, color: mutedC }}>No friends yet</div>
            ) : profileFriends.map((f, i) => {
              const p = f.requester_id === profile.id ? f.addressee : f.requester;
              if (!p) return null;
              return (
                <button key={f.id} onClick={() => setViewingSubFriend(p)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                    border: 0, background: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: i < profileFriends.length - 1
                      ? `0.5px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}` : 'none' }}>
                  <Avatar src={p.avatar_url} name={p.display_name} color="#7a6ca3" size={46}/>
                  <div style={{ flex: 1, fontFamily: SANS, fontSize: 15, fontWeight: 600, color: labelC }}>{p.display_name || 'User'}</div>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={mutedC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-friend profile — opened from the friends list */}
      {viewingSubFriend && (
        <FriendProfilePage
          key={viewingSubFriend.id}
          profile={viewingSubFriend}
          dark={dark} accent={accent}
          currentUserId={currentUserId}
          user={user}
          onBack={() => setViewingSubFriend(null)}
          onFriendshipChanged={onFriendshipChanged}
          zIndex={7}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EDIT PROFILE SHEET
// ─────────────────────────────────────────────────────────────
function EditProfileSheet({ user, dark, accent, onClose, onSignOut, onSaved }) {
  const [firstName, setFirstName] = useState2('');
  const [lastName, setLastName] = useState2('');
  const [email, setEmail] = useState2('');
  const [phone, setPhone] = useState2('');
  const [homeCities, setHomeCities] = useState2([]);
  const [cityInput, setCityInput] = useState2('');
  const [citySuggestions, setCitySuggestions] = useState2([]);
  const [citySearching, setCitySearching] = useState2(false);
  const [localAvatar, setLocalAvatar] = useState2(user?.user_metadata?.avatar_url || null);
  const [avatarUploading, setAvatarUploading] = useState2(false);
  const [saving, setSaving] = useState2(false);
  const [emailNote, setEmailNote] = useState2('');
  const avatarRef = useRef2(null);
  const cityTimer = useRef2(null);

  const mutedC = dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)';
  const labelC = dark ? '#f5f1e8' : '#1a1a2e';
  const fieldBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,20,30,0.05)';
  const fieldStyle = {
    width: '100%', boxSizing: 'border-box', height: 46, padding: '0 14px',
    borderRadius: 12, border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(20,20,30,0.09)',
    background: fieldBg, outline: 'none',
    fontFamily: SANS, fontSize: 15, color: labelC,
  };

  useEffect2(() => {
    if (!user?.id) return;
    window.sb.from('profiles')
      .select('first_name, last_name, phone, home_cities')
      .eq('id', user.id).single()
      .then(({ data }) => {
        const fn = data?.first_name || '';
        const ln = data?.last_name || '';
        if (fn || ln) {
          setFirstName(fn); setLastName(ln);
        } else {
          // Fall back to full_name from auth metadata
          const parts = (user?.user_metadata?.full_name || '').trim().split(/\s+/);
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
        setPhone(data?.phone || '');
        setHomeCities(Array.isArray(data?.home_cities) ? data.home_cities : []);
      });
    setEmail(user?.email || '');
  }, [user?.id]); // eslint-disable-line

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${user.id}/avatar.${ext}`;
      await window.sb.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true });
      const { data: { publicUrl } } = window.sb.storage.from('avatars').getPublicUrl(path);
      setLocalAvatar(publicUrl + '?t=' + Date.now());
      await window.sb.auth.updateUser({ data: { avatar_url: publicUrl } });
      await window.sb.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    } catch(err) { console.error('Avatar upload', err); }
    setAvatarUploading(false);
    e.target.value = '';
  };

  const addCity = (name) => {
    const v = (name || cityInput).trim();
    if (!v || homeCities.includes(v)) { setCityInput(''); setCitySuggestions([]); return; }
    setHomeCities(p => [...p, v]);
    setCityInput('');
    setCitySuggestions([]);
  };

  const handleCityInput = (val) => {
    setCityInput(val);
    clearTimeout(cityTimer.current);
    if (val.trim().length < 2) { setCitySuggestions([]); return; }
    setCitySearching(true);
    cityTimer.current = setTimeout(async () => {
      try {
        const token = window.MAPBOX_TOKEN;
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val.trim())}.json` +
          `?types=place&language=en&limit=6&access_token=${token}`
        );
        const json = await res.json();
        setCitySuggestions((json.features || []).map(f => ({
          id: f.id,
          name: f.text,
          full: f.place_name,
        })));
      } catch(e) { setCitySuggestions([]); }
      setCitySearching(false);
    }, 280);
  };

  const handleSave = async () => {
    if (!user?.id || saving) return;
    setSaving(true);
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

    // Update profiles table
    await window.sb.from('profiles').update({
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      display_name: fullName || user.email?.split('@')[0] || 'User',
      phone: phone.trim() || null,
      home_cities: homeCities,
    }).eq('id', user.id);

    // Sync display name to auth metadata
    if (fullName) await window.sb.auth.updateUser({ data: { full_name: fullName } });

    // Email change (triggers confirmation email)
    const newEmail = email.trim();
    if (newEmail && newEmail !== user.email) {
      const { error } = await window.sb.auth.updateUser({ email: newEmail });
      if (!error) {
        setEmailNote('Confirmation sent to ' + newEmail + ' — check your inbox.');
        setSaving(false);
        onSaved?.();
        return; // Keep sheet open so user sees the note
      } else {
        setEmailNote('Could not update email: ' + error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onSaved?.();
    onClose();
  };

  const SectionLabel = ({ children }) => (
    <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
      textTransform: 'uppercase', color: mutedC, marginBottom: 6, marginTop: 20 }}>{children}</div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 160, background: dark ? '#13141b' : '#faf8f3',
      display: 'flex', flexDirection: 'column', animation: 'minko-fade-in 0.18s ease' }}>

      {/* Top bar */}
      <div style={{ paddingTop: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px))',
        display: 'flex', alignItems: 'center', gap: 4, padding: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px)) 8px 0',
        flexShrink: 0 }}>
        <button onClick={onClose} style={{ border: 0, background: 'none', cursor: 'pointer',
          padding: '10px 12px', color: accent, fontFamily: SANS, fontSize: 15, fontWeight: 600 }}>
          Cancel
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontFamily: SERIF, fontSize: 18,
          fontWeight: 500, color: labelC, fontStyle: 'italic' }}>Edit Profile</span>
        <button onClick={handleSave} disabled={saving} style={{ border: 0, background: 'none', cursor: 'pointer',
          padding: '10px 12px', color: accent, fontFamily: SANS, fontSize: 15, fontWeight: 700,
          opacity: saving ? 0.5 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px',
        paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom) + 24px))' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0 8px' }}>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile}/>
          <button onClick={() => avatarRef.current?.click()} style={{ border: 0, background: 'none', cursor: 'pointer',
            padding: 0, position: 'relative', opacity: avatarUploading ? 0.7 : 1 }}>
            <Avatar src={localAvatar} name={[firstName, lastName].filter(Boolean).join(' ') || 'You'}
              color="#7a6ca3" size={88}/>
            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: '50%',
              background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
              <MinkoIcon name="camera" size={14} color="white" strokeWidth={2}/>
            </div>
          </button>
          {avatarUploading && (
            <div style={{ position: 'absolute', fontFamily: SANS, fontSize: 12, color: mutedC, marginTop: 100 }}>Uploading…</div>
          )}
        </div>
        <div style={{ textAlign: 'center', fontFamily: SANS, fontSize: 13, color: accent,
          fontWeight: 600, paddingBottom: 4 }}
          onClick={() => avatarRef.current?.click()}>
          Change photo
        </div>

        {/* Name */}
        <SectionLabel>Name</SectionLabel>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={firstName} onChange={e => setFirstName(e.target.value)}
            placeholder="First" style={{ ...fieldStyle, flex: 1 }}/>
          <input value={lastName} onChange={e => setLastName(e.target.value)}
            placeholder="Last" style={{ ...fieldStyle, flex: 1 }}/>
        </div>

        {/* Email */}
        <SectionLabel>Email</SectionLabel>
        <input value={email} onChange={e => { setEmail(e.target.value); setEmailNote(''); }}
          placeholder="your@email.com" type="email" style={fieldStyle}/>
        {emailNote && (
          <div style={{ fontFamily: SANS, fontSize: 12, color: accent, marginTop: 6, lineHeight: 1.4 }}>{emailNote}</div>
        )}

        {/* Phone */}
        <SectionLabel>Phone</SectionLabel>
        <input value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000" type="tel" style={fieldStyle}/>

        {/* Home cities */}
        <SectionLabel>Home {homeCities.length === 1 ? 'City' : 'Cities'}</SectionLabel>
        {/* Chips */}
        {homeCities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {homeCities.map((c, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 10px 6px 12px', borderRadius: 999,
                background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,20,30,0.07)',
                border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(20,20,30,0.1)' }}>
                <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 500, color: labelC }}>{c}</span>
                <button onClick={() => setHomeCities(p => p.filter((_, j) => j !== i))}
                  style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0, lineHeight: 0,
                    color: mutedC, display: 'flex', alignItems: 'center' }}>
                  <MinkoIcon name="close" size={12} strokeWidth={2.4}/>
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Search input + dropdown */}
        <div style={{ position: 'relative' }}>
          <input
            value={cityInput}
            onChange={e => handleCityInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
            placeholder="Search for a city…"
            style={{ ...fieldStyle, paddingRight: citySearching ? 40 : 14 }}
          />
          {citySearching && (
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              width: 16, height: 16, borderRadius: '50%',
              border: `2px solid ${accent}`, borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite' }}/>
          )}
          {citySuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
              marginTop: 4, borderRadius: 12, overflow: 'hidden',
              background: dark ? '#22253a' : '#ffffff',
              boxShadow: dark
                ? '0 8px 24px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.07)'
                : '0 8px 24px rgba(20,30,60,0.14), 0 0 0 1px rgba(20,30,60,0.07)',
            }}>
              {citySuggestions.map((s, i) => (
                <button key={s.id} onMouseDown={e => { e.preventDefault(); addCity(s.name); }}
                  style={{
                    width: '100%', display: 'flex', flexDirection: 'column', gap: 1,
                    padding: '11px 14px', border: 0, background: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: i < citySuggestions.length - 1
                      ? `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.06)'}` : 'none',
                  }}>
                  <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: labelC }}>{s.name}</span>
                  <span style={{ fontFamily: SANS, fontSize: 12, color: mutedC,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.full}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sign out */}
        <div style={{ marginTop: 32, paddingTop: 20,
          borderTop: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(20,20,30,0.06)' }}>
          <button onClick={() => { onClose(); onSignOut?.(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14, border: 0, cursor: 'pointer', textAlign: 'left',
              background: dark ? 'rgba(229,83,75,0.1)' : 'rgba(229,83,75,0.07)' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#e5534b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: '#e5534b' }}>Sign out</span>
          </button>
        </div>

      </div>
    </div>
  );
}

function ProfileScreen({ dark, accent, onPin, navProps, onLog, onSignOut, entries = [], user = null, wishlistCount = 0, wishlistRefreshKey = 0, onWishlistItemAdded, friendsRefreshKey = 0 }) {
  const [showWishlist, setShowWishlist] = useState2(false);
  const [showSettings, setShowSettings] = useState2(false);
  const [showReviews, setShowReviews] = useState2(false);
  const [showFriendsList, setShowFriendsList] = useState2(false);
  const [viewingFriend, setViewingFriend] = useState2(null);
  const [avatarUploading, setAvatarUploading] = useState2(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState2(null);
  const [friendsList, setFriendsList] = useState2([]);
  const avatarFileRef = useRef2(null);

  // Load avatar from profiles table — survives OAuth re-login without being overwritten
  useEffect2(() => {
    if (!user?.id) return;
    window.sb.from('profiles').select('avatar_url').eq('id', user.id).single()
      .then(({ data }) => setLocalAvatarUrl(data?.avatar_url || user?.user_metadata?.avatar_url || null));
  }, [user?.id]);

  // Fetch friends list — re-runs when friendsRefreshKey changes (e.g. after adding from Friends tab)
  useEffect2(() => {
    if (!user?.id) return;
    window.sb.from('friendships')
      .select('id, requester_id, addressee_id, requester:profiles!requester_id(id, display_name, avatar_url), addressee:profiles!addressee_id(id, display_name, avatar_url)')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .then(({ data }) => setFriendsList(data || []));
  }, [user?.id, friendsRefreshKey]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You';

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await window.sb.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = window.sb.storage.from('avatars').getPublicUrl(path);
      setLocalAvatarUrl(publicUrl);
      // Write to both auth metadata and profiles table so the avatar persists across sign-outs
      await Promise.all([
        window.sb.auth.updateUser({ data: { avatar_url: publicUrl } }),
        window.sb.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id),
      ]);
    } catch(err) { console.error('Avatar upload error', err); }
    setAvatarUploading(false);
    e.target.value = '';
  };

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const avgRating = entries.length > 0
    ? (entries.reduce((s, e) => s + (e.rating || 0), 0) / entries.length).toFixed(1)
    : '—';
  const topRated = [...entries].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const mutedC = dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)';
  const labelC = dark ? '#f5f1e8' : '#1a1a2e';

  return (
    <div style={{ position: 'absolute', inset: 0, background: dark ? '#13141b' : '#faf8f3', display: 'flex', flexDirection: 'column' }}>
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'clip' }}>

      {/* Top header — [avatar+gear badge] [name] [reviews] [friends] all in one line */}
      <div style={{ paddingTop: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px) + 6px)', paddingLeft: 20, paddingRight: 20, paddingBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile}/>

        {/* Avatar — gear badge replaces camera badge, opens settings */}
        <button onClick={() => setShowSettings(true)} style={{ border: 0, padding: 0, background: 'none', cursor: 'pointer', borderRadius: '50%', position: 'relative', opacity: avatarUploading ? 0.6 : 1, flexShrink: 0 }}>
          <Avatar src={localAvatarUrl} name={displayName} color="#7a6ca3" size={44}/>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: '50%',
            background: dark ? 'rgba(40,42,58,0.95)' : 'rgba(240,238,232,0.95)',
            border: '1.5px solid ' + (dark ? 'rgba(255,255,255,0.12)' : 'rgba(20,20,30,0.1)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke={mutedC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
        </button>

        {/* Name — takes all remaining space, boxes stay pinned right */}
        <div style={{ flex: 1, fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: labelC, letterSpacing: -0.3, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </div>

        {/* Metric boxes — pinned right, tappable */}
        {[
          { value: entries.length, label: entries.length === 1 ? 'review' : 'reviews', onClick: () => setShowReviews(true) },
          { value: friendsList.length, label: friendsList.length === 1 ? 'friend' : 'friends', onClick: () => setShowFriendsList(true) },
        ].map(({ value, label, onClick }) => (
          <button key={label} onClick={onClick} style={{ flexShrink: 0, padding: '5px 9px', borderRadius: 8, border: 0, cursor: 'pointer', textAlign: 'left',
            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.75)',
            outline: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(20,30,60,0.07)',
            display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, lineHeight: 1.1, color: labelC }}>{value}</div>
            <div style={{ fontFamily: SANS, fontSize: 10, color: mutedC, letterSpacing: 0.1 }}>{label}</div>
          </button>
        ))}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.2, lineHeight: 1.15,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e.place}</div>
                {e.is_private && <MinkoIcon name="lock" size={13} color={dark ? 'rgba(255,255,255,0.35)' : 'rgba(20,20,30,0.35)'} strokeWidth={2}/>}
              </div>
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
        onItemAdded={onWishlistItemAdded}
      />

      {/* Reviews list overlay */}
      {showReviews && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 160, background: dark ? '#0e1018' : '#f4f1eb', display: 'flex', flexDirection: 'column', animation: 'minko-fade-in 0.18s ease' }}>
          <div style={{ paddingTop: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px))', paddingLeft: 8, paddingRight: 16, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button onClick={() => setShowReviews(false)} style={{ border: 0, background: 'none', cursor: 'pointer', padding: '8px 10px', color: accent, display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: labelC, flex: 1 }}>My Reviews</span>
            <span style={{ fontFamily: SANS, fontSize: 13, color: mutedC }}>{entries.length} total</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom) + 12px))' }}>
            {entries.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', fontFamily: SANS, fontSize: 14, color: mutedC }}>No reviews yet</div>
            ) : [...entries].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).map((e, i, arr) => (
              <button key={e.id} onClick={() => { setShowReviews(false); onPin(e.id); }} style={{
                width: '100%', display: 'flex', gap: 12, padding: '12px 0', textAlign: 'left', border: 0, background: 'none', cursor: 'pointer',
                borderBottom: i < arr.length - 1 ? `0.5px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}` : 'none',
              }}>
                {e.photos?.[0] ? (
                  <img src={e.photos[0]} style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} alt=""/>
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 12, flexShrink: 0, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,20,30,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MinkoIcon name="pin" size={22} color={mutedC} strokeWidth={1.4}/>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: labelC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{e.place || 'Unnamed place'}</div>
                    {e.is_private && <MinkoIcon name="lock" size={12} color={mutedC} strokeWidth={2}/>}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: mutedC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.location || ''}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {e.rating > 0 && <Stars n={e.rating} size={12} color="#c89e54"/>}
                    {e.date && <span style={{ fontFamily: SANS, fontSize: 11, color: mutedC }}>{e.date}</span>}
                  </div>
                  {e.note && <div style={{ fontFamily: SERIF, fontSize: 13, color: mutedC, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>{e.note}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Friends list overlay */}
      {showFriendsList && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 160, background: dark ? '#0e1018' : '#f4f1eb', display: 'flex', flexDirection: 'column', animation: 'minko-fade-in 0.18s ease' }}>
          <div style={{ paddingTop: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px))', paddingLeft: 8, paddingRight: 16, paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button onClick={() => setShowFriendsList(false)} style={{ border: 0, background: 'none', cursor: 'pointer', padding: '8px 10px', color: accent, display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: labelC, flex: 1 }}>Friends</span>
            <span style={{ fontFamily: SANS, fontSize: 13, color: mutedC }}>{friendsList.length} total</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom) + 12px))' }}>
            {friendsList.length === 0 ? (
              <div style={{ padding: '48px 0', textAlign: 'center', fontFamily: SANS, fontSize: 14, color: mutedC }}>No friends yet</div>
            ) : friendsList.map((f, i) => {
              const p = f.requester_id === user?.id ? f.addressee : f.requester;
              if (!p) return null;
              return (
                <button key={f.id} onClick={() => setViewingFriend(p)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', border: 0, background: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: i < friendsList.length - 1 ? `0.5px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}` : 'none' }}>
                  <Avatar src={p.avatar_url} name={p.display_name} color="#7a6ca3" size={46}/>
                  <div style={{ flex: 1, fontFamily: SANS, fontSize: 15, fontWeight: 600, color: labelC }}>{p.display_name || 'User'}</div>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={mutedC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit profile — full screen overlay */}
      {showSettings && (
        <EditProfileSheet
          user={user}
          dark={dark}
          accent={accent}
          onClose={() => setShowSettings(false)}
          onSignOut={onSignOut}
          onSaved={() => {
            // Re-read profile to pick up new avatar and name
            if (user?.id) {
              window.sb.from('profiles').select('avatar_url, display_name').eq('id', user.id).single()
                .then(({ data }) => { if (data?.avatar_url) setLocalAvatarUrl(data.avatar_url); });
            }
          }}
        />
      )}

      {/* Friend profile page — slides over everything */}
      {viewingFriend && (
        <FriendProfilePage
          key={viewingFriend.id}
          profile={viewingFriend}
          dark={dark} accent={accent}
          currentUserId={user?.id}
          user={user}
          onBack={() => setViewingFriend(null)}
          onFriendshipChanged={() => {
            // Refresh friends list after add/remove
            if (user?.id) {
              window.sb.from('friendships')
                .select('id, requester_id, addressee_id, requester:profiles!requester_id(id, display_name, avatar_url), addressee:profiles!addressee_id(id, display_name, avatar_url)')
                .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
                .eq('status', 'accepted')
                .then(({ data }) => setFriendsList(data || []));
            }
          }}
          zIndex={90}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FRIENDS GLOBE SCREEN
// ─────────────────────────────────────────────────────────────
function normalizeFriendEntry(e, profile) {
  return {
    ...e,
    _ownerProfile: profile || null,
    date: e.date_visited
      ? new Date(e.date_visited + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      : '',
    photos: Array.isArray(e.photos) ? e.photos : [],
    links: Array.isArray(e.links) ? e.links : [],
    likes: e.likes || 0,
    likedByMe: false,
    comments: [],
  };
}

// ─── small reusable buttons (defined outside component to avoid remount) ────
function _FriendPillBtn({ onClick, label, bg, color }) {
  return (
    <button onClick={onClick} style={{ border: 0, padding: '6px 14px', borderRadius: 20, background: bg, color, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
      {label}
    </button>
  );
}

function FriendsScreen({ dark, accent, onPin, activePinId, navProps, onLog, user, friendEntries = [], onFriendEntriesChange, onFriendAdded }) {
  const [searchQuery, setSearchQuery] = useState2('');
  const [searchResults, setSearchResults] = useState2([]);
  const [searching, setSearching] = useState2(false);
  const [friendships, setFriendships] = useState2([]);
  const [loading, setLoading] = useState2(false);
  const [optimisticAdded, setOptimisticAdded] = useState2(new Set()); // ids added this session
  const [viewingProfile, setViewingProfile] = useState2(null); // just the profile object now
  const searchTimer = useRef2(null);

  const TOP = 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px) + 6px)';
  const PANEL_TOP = 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px) + 68px)';
  const PANEL_BOT = 'max(90px, calc(env(safe-area-inset-bottom) + 90px))';

  const loadFriendships = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: fs } = await window.sb.from('friendships')
        .select('id, status, created_at, requester_id, addressee_id, requester:profiles!requester_id(id, display_name, avatar_url), addressee:profiles!addressee_id(id, display_name, avatar_url)')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      setFriendships(fs || []);

      const friendIds = (fs || []).map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      if (friendIds.length > 0) {
        const profileMap = {};
        (fs || []).forEach(f => {
          if (f.requester) profileMap[f.requester_id] = f.requester;
          if (f.addressee) profileMap[f.addressee_id] = f.addressee;
        });
        const { data: entries } = await window.sb.from('entries').select('*').in('user_id', friendIds).neq('is_private', true);
        onFriendEntriesChange?.((entries || []).map(e => normalizeFriendEntry(e, profileMap[e.user_id])));
      } else {
        onFriendEntriesChange?.([]);
      }
    } catch (err) { console.error('loadFriendships', err); }
    setLoading(false);
  };

  useEffect2(() => {
    if (user) loadFriendships();
    else { setFriendships([]); onFriendEntriesChange?.([]); }
  }, [user?.id]);

  const handleSearch = (val) => {
    setSearchQuery(val);
    clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await window.sb.from('profiles')
        .select('id, display_name, avatar_url')
        .ilike('display_name', `%${val.trim()}%`)
        .neq('id', user?.id || '')
        .limit(20);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
  };

  const addFriend = async (profileId) => {
    if (!user?.id) return;
    // Optimistic: show "Added" immediately
    setOptimisticAdded(prev => new Set([...prev, profileId]));
    const { error } = await window.sb.from('friendships').upsert(
      { requester_id: user.id, addressee_id: profileId, status: 'accepted' },
      { onConflict: 'requester_id,addressee_id', ignoreDuplicates: false }
    );
    if (error) {
      console.error('addFriend error:', error.message, error.code);
      setOptimisticAdded(prev => { const s = new Set(prev); s.delete(profileId); return s; });
    } else {
      loadFriendships();
      onFriendAdded?.();
    }
  };

  const removeFriend = async (id) => {
    const fs = friendships.find(f => f.id === id);
    await window.sb.from('friendships').delete().eq('id', id);
    loadFriendships();
    if (fs) onFriendEntriesChange?.(friendEntries.filter(e => e.user_id !== fs.requester_id && e.user_id !== fs.addressee_id));
  };

  const openProfile = (profile) => setViewingProfile(profile);

  const getFs = (profileId) => friendships.find(f => f.requester_id === profileId || f.addressee_id === profileId);
  const getFriendProfile = (f) => f.requester_id === user?.id ? f.addressee : f.requester;

  const showSearch = searchQuery.trim().length >= 2;
  const showPanel = showSearch;
  const pins = friendEntries.filter(e => e.lon && e.lat).map(e => ({ id: e.id, lon: e.lon, lat: e.lat, color: accent }));
  const sep = (i, len) => i < len - 1 ? { borderBottom: `0.5px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` } : {};
  const mutedText = dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)';
  const labelText = dark ? '#f5f1e8' : '#1a1a2e';

  const FriendRow = ({ profile, right, sub }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={() => openProfile(profile)} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, flex: 1, textAlign: 'left' }}>
        <Avatar src={profile?.avatar_url} name={profile?.display_name} color="#7a6ca3" size={40}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: labelText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.display_name || 'User'}</div>
          {sub && <div style={{ fontFamily: SANS, fontSize: 12, color: mutedText, marginTop: 1 }}>{sub}</div>}
        </div>
      </button>
      {right}
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MinkoGlobe dark={dark} accent={accent} pins={pins} activePinId={activePinId} onPinClick={onPin} fitToPins={pins.length > 0}/>
      <SafeTopBar dark={dark}/>

      {/* Search bar */}
      <div style={{ position: 'absolute', top: TOP, left: 12, right: 12, zIndex: 30 }}>
        <GlassSurface dark={dark} radius={26} style={{ height: 52, padding: '0 12px 0 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="logo2.png" style={{ height: 39, width: 'auto', display: 'block', flexShrink: 0 }} alt="minko"/>
          <MinkoIcon name="search" size={17} color={dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.4)'} strokeWidth={1.8}/>
          <input
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search people by name…"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: SANS, fontSize: 14.5, color: labelText }}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 4, color: mutedText, display: 'flex', alignItems: 'center' }}>
              <MinkoIcon name="close" size={16} strokeWidth={2.2}/>
            </button>
          )}
        </GlassSurface>
      </div>

      {/* Search results panel — only shown while actively searching */}
      {showPanel && (
        <div style={{ position: 'absolute', top: PANEL_TOP, left: 12, right: 12, bottom: PANEL_BOT, zIndex: 25, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <GlassSurface dark={dark} radius={18} style={{ overflow: 'hidden' }}>
            {searching ? (
              <div style={{ padding: '18px 16px', fontFamily: SANS, fontSize: 13.5, color: mutedText, textAlign: 'center' }}>Searching…</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '18px 16px', fontFamily: SANS, fontSize: 13.5, color: mutedText, textAlign: 'center' }}>No users found</div>
            ) : searchResults.map((p, i) => {
              const isFriend = optimisticAdded.has(p.id) || !!getFs(p.id);
              return (
                <div key={p.id} style={{ padding: '10px 16px', ...sep(i, searchResults.length) }}>
                  <FriendRow profile={p} right={
                    isFriend
                      ? <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: accent, flexShrink: 0 }}>Added</span>
                      : <_FriendPillBtn onClick={() => addFriend(p.id)} label="Add" bg={dark ? 'rgba(255,255,255,0.12)' : 'rgba(20,20,30,0.08)'} color={labelText}/>
                  }/>
                </div>
              );
            })}
          </GlassSurface>
        </div>
      )}

      <BottomNav {...navProps} dark={dark} accent={accent} onLog={onLog}/>

      {/* Friend full-page profile view */}
      {viewingProfile && (
        <FriendProfilePage
          key={viewingProfile.id}
          profile={viewingProfile}
          dark={dark} accent={accent}
          currentUserId={user?.id}
          user={user}
          onBack={() => setViewingProfile(null)}
          onFriendshipChanged={loadFriendships}
          zIndex={60}
        />
      )}
    </div>
  );
}

window.ActionPickerSheet = ActionPickerSheet;
window.SaveToWishlistFlow = SaveToWishlistFlow;
window.LogEntryFlow = LogEntryFlow;
window.ProfileScreen = ProfileScreen;
window.FriendsScreen = FriendsScreen;
window.AddPhotoSheet = AddPhotoSheet;
window.EditItemFlow = EditItemFlow;
window.DeleteConfirmSheet = DeleteConfirmSheet;
window.WishlistItemSheet = WishlistItemSheet;
