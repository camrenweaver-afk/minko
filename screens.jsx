// screens.jsx — Minko screens: Home/Globe, Log Entry, Place Detail, Profile, Friends Globe

const { useState, useEffect, useRef } = React;

// ─────────────────────────────────────────────────────────────
// Shared visual primitives
// ─────────────────────────────────────────────────────────────
const SERIF = '"Cormorant Garamond", "Iowan Old Style", "Hoefler Text", Georgia, serif';
const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif';

const Stars = ({ n, size = 14, color = '#c89e54' }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {[1,2,3,4,5].map(i => {
      const full = n >= i;
      const half = !full && n >= i - 0.5;
      return (
        <span key={i} style={{ position: 'relative', display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
          <MinkoIcon name="star-outline" size={size} color="rgba(0,0,0,0.18)" strokeWidth={1.4}/>
          {(full || half) && (
            <span style={{ position: 'absolute', inset: 0, width: full ? '100%' : '50%', overflow: 'hidden', lineHeight: 0 }}>
              <MinkoIcon name="star" size={size} color={color}/>
            </span>
          )}
        </span>
      );
    })}
  </span>
);

// Interactive half-star picker — used in all rating forms
const HalfStarPicker = ({ rating = 0, onChange, size = 32, dark }) => {
  const [hover, setHover] = useState(0);
  const display = hover || rating || 0;
  const emptyColor = dark ? 'rgba(255,255,255,0.2)' : 'rgba(20,20,30,0.2)';
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {[1,2,3,4,5].map(i => {
        const full = display >= i;
        const half = !full && display >= i - 0.5;
        return (
          <span key={i} style={{ position: 'relative', display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
            {/* Empty star base */}
            <MinkoIcon name="star-outline" size={size} color={emptyColor} strokeWidth={1.5}/>
            {/* Filled overlay — full or half width */}
            {(full || half) && (
              <span style={{ position: 'absolute', inset: 0, width: full ? '100%' : '50%', overflow: 'hidden', lineHeight: 0, pointerEvents: 'none' }}>
                <MinkoIcon name="star" size={size} color="#c89e54"/>
              </span>
            )}
            {/* Left half = i-0.5 */}
            <button
              onMouseEnter={() => setHover(i - 0.5)} onMouseLeave={() => setHover(0)}
              onClick={() => onChange(rating === i - 0.5 ? 0 : i - 0.5)}
              style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%',
                background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
            />
            {/* Right half = i */}
            <button
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
              onClick={() => onChange(rating === i ? 0 : i)}
              style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%',
                background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
            />
          </span>
        );
      })}
    </span>
  );
};

const CategoryChip = ({ category, color, dark }) => {
  const map = { restaurant: 'Restaurant', hotel: 'Hotel', attraction: 'Attraction', experience: 'Experience' };
  const c = color || (window.MINKO_CATEGORY_COLORS && window.MINKO_CATEGORY_COLORS[category]) || '#4f5bd5';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontFamily: SANS, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase',
      color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)',
    }}>
      <MinkoIcon name={category} size={12} strokeWidth={1.6} color={c}/>
      {map[category]}
    </span>
  );
};

const Wordmark = ({ dark, size = 22 }) => (
  <span style={{
    fontFamily: SERIF, fontSize: size, fontWeight: 500, fontStyle: 'italic',
    color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.3,
  }}>minko</span>
);

const Avatar = ({ name, color, size = 28, ring, src }) => (
  src ? (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: ring ? `2px solid ${ring}` : '2px solid white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      overflow: 'hidden', flexShrink: 0,
    }}>
      <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name || ''}/>
    </div>
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: SANS, fontSize: size * 0.42, fontWeight: 600,
      border: ring ? `2px solid ${ring}` : '2px solid white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      flexShrink: 0,
    }}>{name?.[0]}</div>
  )
);

// Frosted backdrop that covers the status-bar zone (prevents raw map bleed-through)
const SafeTopBar = ({ dark }) => (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 28, pointerEvents: 'none',
    height: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px) + 6px)',
    backdropFilter: 'blur(18px) saturate(150%)',
    WebkitBackdropFilter: 'blur(18px) saturate(150%)',
    background: dark
      ? 'linear-gradient(to bottom, rgba(14,16,24,0.82) 55%, transparent 100%)'
      : 'linear-gradient(to bottom, rgba(207,225,238,0.88) 55%, transparent 100%)',
  }}/>
);

// Floating glass surface used for top search & FAB
const GlassSurface = ({ children, style, dark, radius = 999 }) => (
  <div style={{
    position: 'relative', borderRadius: radius,
    background: dark ? 'rgba(28,30,42,0.75)' : 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    boxShadow: dark
      ? '0 2px 8px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.25), inset 0 0.5px 0 rgba(255,255,255,0.08)'
      : '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(20,30,60,0.10), inset 0 0.5px 0 rgba(255,255,255,0.6)',
    border: dark ? '0.5px solid rgba(255,255,255,0.08)' : '0.5px solid rgba(0,0,0,0.04)',
    ...style,
  }}>{children}</div>
);

// ─────────────────────────────────────────────────────────────
// Bottom nav (always present, floats over map)
// ─────────────────────────────────────────────────────────────
function BottomNav({ active, onChange, accent, dark, onLog, hideNav = false }) {
  if (hideNav) return null;
  const items = [
    { id: 'home', icon: 'globe', label: 'World' },
    { id: 'friends', icon: 'friends', label: 'Friends' },
    { id: null, icon: 'plus', label: 'Log', isFab: true },
    { id: 'profile', icon: 'user', label: 'You' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 14, right: 14, bottom: 'max(26px, calc(env(safe-area-inset-bottom) + 10px))', zIndex: 150,
      display: 'flex', alignItems: 'center', gap: 10, boxSizing: 'border-box',
    }}>
      <GlassSurface dark={dark} radius={28} style={{ flex: 1, minWidth: 0, padding: '8px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          {items.filter(i => !i.isFab).map(it => {
            const a = active === it.id;
            return (
              <button key={it.label} onClick={() => onChange(it.id)} style={{
                background: 'transparent', border: 0, padding: '6px 10px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                color: a ? accent : (dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)'),
              }}>
                <MinkoIcon name={it.icon} size={22} strokeWidth={a ? 2 : 1.6}/>
                <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: a ? 600 : 500, letterSpacing: 0.3 }}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </GlassSurface>
      <button onClick={onLog} style={{
        width: 54, height: 54, borderRadius: '50%', border: 0, cursor: 'pointer',
        background: accent, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 14px ${accent}55, 0 2px 4px rgba(0,0,0,0.15)`,
        flexShrink: 0,
      }}>
        <MinkoIcon name="plus" size={24} strokeWidth={2.2}/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom sheet wrapper
// ─────────────────────────────────────────────────────────────
function BottomSheet({ open, onClose, dark, height = 'auto', children, fullDrag = false }) {
  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: 'absolute', inset: 0, zIndex: 40,
          background: 'rgba(15,20,40,0.18)', backdropFilter: 'blur(2px)',
          animation: 'minko-fade-in 0.2s ease',
        }}/>
      )}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41,
        background: dark ? '#1c1d28' : '#faf8f3',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        transform: open ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        maxHeight: '85%', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 38, height: 4.5, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)' }}/>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>{children}</div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Top search bar (floats over map)
// ─────────────────────────────────────────────────────────────
function TopSearch({ dark, onTap, placeholder = 'Search your places', user }) {
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px) + 6px)',
      left: 12, right: 12, zIndex: 30,
      display: 'flex', gap: 10, alignItems: 'center',
    }}>
      <GlassSurface dark={dark} radius={26} style={{ flex: 1, height: 52, padding: '0 10px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="logo2.png" style={{ height: 39, width: 'auto', display: 'block' }} alt="minko"/>
        <div onClick={onTap} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }}>
          <MinkoIcon name="search" size={18} color={dark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.5)'} strokeWidth={1.8}/>
          <span style={{ fontFamily: SANS, fontSize: 14.5, color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.5)' }}>{placeholder}</span>
        </div>
        <Avatar name={user?.user_metadata?.full_name || 'You'} color="#7a6ca3" size={32} src={user?.user_metadata?.avatar_url}/>
      </GlassSurface>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Category legend (small color-key chip near top)
// ─────────────────────────────────────────────────────────────
function CategoryLegend({ dark }) {
  const cats = [
    { id: 'restaurant', label: 'Eat' },
    { id: 'hotel',      label: 'Stay' },
    { id: 'attraction', label: 'See' },
    { id: 'experience', label: 'Do' },
  ];
  const colors = window.MINKO_CATEGORY_COLORS || {};
  return (
    <div style={{ position: 'absolute', top: 'calc(var(--status-h, 58px) + env(safe-area-inset-top, 0px) + 72px)', right: 12, zIndex: 25 }}>
      <GlassSurface dark={dark} radius={999} style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        {cats.map(c => (
          <div key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[c.id], boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.15)' }}/>
            <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 500, letterSpacing: 0.2,
              color: dark ? 'rgba(255,255,255,0.75)' : 'rgba(20,20,30,0.65)' }}>{c.label}</span>
          </div>
        ))}
      </GlassSurface>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME / GLOBE SCREEN
// ─────────────────────────────────────────────────────────────
function HomeScreen({ accent, dark, variant, onPin, activePinId, navProps, onLog, entries = [], user }) {
  const cat = window.MINKO_CATEGORY_COLORS;
  const pins = entries.filter(e => e.lon && e.lat).map(e => ({
    id: e.id, lon: e.lon, lat: e.lat,
    color: cat[e.category] || accent,
    photo: variant === 'photo' ? e.photos?.[0] : undefined,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <MinkoGlobe dark={dark} accent={accent}
        pins={pins}
        activePinId={activePinId}
        onPinClick={onPin}
        fitToPins={pins.length > 0}
      />
      <SafeTopBar dark={dark}/>
      <TopSearch dark={dark} user={user}/>
      <CategoryLegend dark={dark}/>
      <BottomNav {...navProps} dark={dark} accent={accent} onLog={onLog}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PLACE DETAIL (bottom sheet content)
// ─────────────────────────────────────────────────────────────
function PlaceDetailSheet({ entry, dark, accent, friendsAtPlace, onClose, friendMode = false, friend, onEdit, onDelete, onPhotosChanged, user, onFriendProfile }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    setLiked(false);
    setLikeCount(0);
    setComments([]);
    setCommentDraft('');
    if (!entry?.id || !window.sb) return;

    // Fetch like count + whether current user liked this entry
    const likesQ = window.sb.from('entry_likes').select('user_id').eq('entry_id', entry.id);
    const myLikeQ = user?.id
      ? window.sb.from('entry_likes').select('id').eq('entry_id', entry.id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null });

    Promise.all([likesQ, myLikeQ]).then(([all, mine]) => {
      setLikeCount((all.data || []).length);
      setLiked(!!mine.data);
    });

    // Fetch comments with commenter profile
    window.sb.from('entry_comments')
      .select('id, body, created_at, user_id, profiles(display_name, avatar_url)')
      .eq('entry_id', entry.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setComments(data || []));
  }, [entry?.id]); // eslint-disable-line

  if (!entry) return null;
  const catColor = (window.MINKO_CATEGORY_COLORS && window.MINKO_CATEGORY_COLORS[entry.category]) || accent;

  const toggleLike = async () => {
    if (!user?.id || likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => c + (wasLiked ? -1 : 1));
    if (wasLiked) {
      await window.sb.from('entry_likes').delete().eq('entry_id', entry.id).eq('user_id', user.id);
    } else {
      await window.sb.from('entry_likes').insert({ entry_id: entry.id, user_id: user.id });
    }
    setLikeLoading(false);
  };

  const submitComment = async () => {
    if (!user?.id || !commentDraft.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    const body = commentDraft.trim();
    setCommentDraft('');
    const { data } = await window.sb.from('entry_comments')
      .insert({ entry_id: entry.id, user_id: user.id, body })
      .select('id, body, created_at, user_id, profiles(display_name, avatar_url)')
      .single();
    if (data) setComments(prev => [...prev, data]);
    setCommentSubmitting(false);
  };
  return (
    <div style={{ padding: '6px 0 24px' }}>
      {/* Photo gallery */}
      {entry.photos?.length === 1 && (
        <div style={{ height: 200, margin: '4px 16px 0', borderRadius: 16, overflow: 'hidden' }}>
          <img src={entry.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        </div>
      )}
      {entry.photos?.length > 1 && (
        <div style={{ margin: '4px 0 0', overflowX: 'auto', display: 'flex', gap: 8,
          padding: '0 16px', scrollSnapType: 'x mandatory', paddingBottom: 2 }}>
          {entry.photos.map((url, i) => (
            <div key={i} style={{ flexShrink: 0, width: 200, height: 175, borderRadius: 14,
              overflow: 'hidden', scrollSnapAlign: 'start' }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '18px 20px 0' }}>
        {friendMode && friend && (
          <button onClick={onFriendProfile} style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            background: 'none', border: 'none', padding: 0, cursor: onFriendProfile ? 'pointer' : 'default',
            textAlign: 'left',
          }}>
            <Avatar
              name={friend.display_name || friend.name}
              color="#7a6ca3"
              size={26}
              src={friend.avatar_url}
            />
            <span style={{ fontFamily: SANS, fontSize: 12, color: dark ? 'rgba(255,255,255,0.65)' : 'rgba(20,20,30,0.6)' }}>
              <b style={{ fontWeight: 600, color: dark ? '#f5f1e8' : '#1a1a2e' }}>{friend.display_name || friend.name}</b> logged this
            </span>
            {onFriendProfile && <MinkoIcon name="chevron-right" size={14} color={dark ? 'rgba(255,255,255,0.3)' : 'rgba(20,20,30,0.3)'} strokeWidth={2}/>}
          </button>
        )}
        <CategoryChip category={entry.category} dark={dark}/>
        <h2 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, lineHeight: 1.05, margin: '4px 0 6px',
          color: dark ? '#f5f1e8' : '#1a1a2e', letterSpacing: -0.4 }}>{entry.place}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Stars n={entry.rating} size={15}/>
          <span style={{ fontFamily: SANS, fontSize: 12, color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(20,20,30,0.5)' }}>
            {entry.location} · {entry.date}
          </span>
        </div>

        {entry.note && (
          <p style={{
            fontFamily: SERIF, fontSize: 17, lineHeight: 1.45, fontWeight: 400,
            color: dark ? 'rgba(245,241,232,0.85)' : 'rgba(26,26,46,0.78)',
            margin: '18px 0 6px', textWrap: 'pretty',
            paddingLeft: 14, borderLeft: `2px solid ${catColor}55`,
          }}>
            {entry.note}
          </p>
        )}

        {/* Links */}
        {entry.links?.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
              color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(20,20,30,0.45)', marginBottom: 8 }}>Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entry.links.map((url, i) => {
                let domain = url;
                try { domain = new URL(url).hostname.replace('www.', ''); } catch(e) {}
                return (
                  <button key={i} onClick={() => window.open(url, '_blank')} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                    background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(20,30,60,0.04)',
                    border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(20,30,60,0.06)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}>
                    <MinkoIcon name="link" size={14} color={accent} strokeWidth={2}/>
                    <span style={{ fontFamily: SANS, fontSize: 13.5, color: dark ? '#f5f1e8' : '#1a1a2e',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Geographic tag row */}
        {(entry.lat && entry.lon) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18,
            fontFamily: SANS, fontSize: 12.5, color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)' }}>
            <MinkoIcon name="pin" size={14} color={catColor} strokeWidth={1.8}/>
            {Math.abs(entry.lat).toFixed(4)}°{entry.lat >= 0 ? 'N' : 'S'}, {Math.abs(entry.lon).toFixed(4)}°{entry.lon >= 0 ? 'E' : 'W'}
          </div>
        )}

        {/* Likes + Comments */}
        <div style={{ marginTop: 20, paddingTop: 18,
          borderTop: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(20,30,60,0.07)' }}>

          {/* Like button */}
          <button onClick={toggleLike} disabled={!user?.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px 7px 10px', borderRadius: 999, cursor: user?.id ? 'pointer' : 'default',
            border: liked ? `1px solid ${catColor}` : (dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(20,30,60,0.12)'),
            background: liked ? `${catColor}18` : 'transparent',
            color: liked ? catColor : (dark ? '#f5f1e8' : '#1a1a2e'),
            fontFamily: SANS, fontSize: 13, fontWeight: 600,
            transition: 'all 0.15s ease',
          }}>
            <MinkoIcon name={liked ? 'heart-filled' : 'heart'} size={15} color={liked ? catColor : (dark ? '#f5f1e8' : '#1a1a2e')} strokeWidth={1.8}/>
            {likeCount > 0 ? likeCount : ''} {likeCount === 1 ? 'like' : likeCount > 1 ? 'likes' : 'Like'}
          </button>

          {/* Existing comments */}
          {comments.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {comments.map(c => {
                const name = c.profiles?.display_name || 'User';
                const avatar = c.profiles?.avatar_url;
                const isMe = c.user_id === user?.id;
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <Avatar name={name} color="#7a6ca3" size={26} src={avatar}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600,
                          color: dark ? '#f5f1e8' : '#1a1a2e' }}>{name}</span>
                        {isMe && (
                          <button onClick={async () => {
                            await window.sb.from('entry_comments').delete().eq('id', c.id);
                            setComments(prev => prev.filter(x => x.id !== c.id));
                          }} style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer',
                            color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(20,20,30,0.3)', lineHeight: 1 }}>
                            <MinkoIcon name="close" size={11} strokeWidth={2.2}/>
                          </button>
                        )}
                      </div>
                      <p style={{ margin: '2px 0 0', fontFamily: SANS, fontSize: 13.5,
                        color: dark ? 'rgba(245,241,232,0.85)' : 'rgba(26,26,46,0.8)', lineHeight: 1.4 }}>{c.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment composer */}
          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Avatar name={user?.user_metadata?.full_name || 'You'} color="#7a6ca3" size={28} src={user?.user_metadata?.avatar_url}/>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                placeholder={friendMode ? `Reply to ${friend?.display_name || friend?.name || 'them'}…` : 'Add a comment…'}
                style={{
                  width: '100%', height: 38, padding: '0 44px 0 14px', boxSizing: 'border-box',
                  borderRadius: 999, border: 0, outline: 'none',
                  background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.05)',
                  fontFamily: SANS, fontSize: 13.5, color: dark ? '#f5f1e8' : '#1a1a2e',
                }}/>
              {commentDraft.trim() && (
                <button onClick={submitComment} disabled={commentSubmitting} style={{
                  position: 'absolute', right: 4, top: 4, width: 30, height: 30, borderRadius: '50%',
                  background: catColor, color: 'white', border: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: commentSubmitting ? 0.6 : 1,
                }}>
                  <MinkoIcon name="send" size={14} color="white" strokeWidth={2}/>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons — edit, photos, delete */}
        {!friendMode && (
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={onEdit} style={{
              flex: 1, height: 48, borderRadius: 12, border: 0, cursor: 'pointer',
              background: accent, color: 'white',
              fontFamily: SANS, fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <MinkoIcon name="edit" size={16} color="white" strokeWidth={1.8}/>
              Edit entry
            </button>
            <button onClick={onPhotosChanged} style={{
              width: 48, height: 48, borderRadius: 12, cursor: 'pointer',
              background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(20,30,60,0.06)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: dark ? '#f5f1e8' : '#1a1a2e',
            }}>
              <MinkoIcon name="camera" size={18} strokeWidth={1.7}/>
            </button>
            <button onClick={onDelete} style={{
              width: 48, height: 48, borderRadius: 12, cursor: 'pointer',
              background: dark ? 'rgba(229,83,75,0.15)' : 'rgba(229,83,75,0.08)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#e5534b',
            }}>
              <MinkoIcon name="trash" size={18} strokeWidth={1.7}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PIN PREVIEW (small bottom sheet on tap)
// ─────────────────────────────────────────────────────────────
function PinPreview({ entry, dark, accent, onView, onClose, friend }) {
  if (!entry) return null;
  const catColor = (window.MINKO_CATEGORY_COLORS && window.MINKO_CATEGORY_COLORS[entry.category]) || accent;
  return (
    <div style={{ padding: '4px 16px 24px' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '6px 4px 14px' }}>
        {entry.photos?.[0] ? (
          <img src={entry.photos[0]} alt="" style={{ width: 76, height: 76, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}/>
        ) : (
          <div style={{ width: 76, height: 76, borderRadius: 12, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(20,30,60,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MinkoIcon name={entry.category} size={28} color={catColor} strokeWidth={1.4}/>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          {friend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Avatar name={friend.name} color={friend.color} size={18}/>
              <span style={{ fontFamily: SANS, fontSize: 11, color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(20,20,30,0.55)' }}>{friend.name}'s pin</span>
            </div>
          )}
          <CategoryChip category={entry.category} dark={dark}/>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, lineHeight: 1.1, color: dark ? '#f5f1e8' : '#1a1a2e', margin: '2px 0 4px', letterSpacing: -0.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.place}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Stars n={entry.rating} size={12}/>
            <span style={{ fontFamily: SANS, fontSize: 11.5, color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(20,20,30,0.5)' }}>{entry.location}</span>
          </div>
        </div>
      </div>
      <button onClick={onView} style={{
        width: '100%', height: 46, borderRadius: 12, border: 0, cursor: 'pointer',
        background: catColor, color: 'white', fontFamily: SANS, fontSize: 14.5, fontWeight: 600, letterSpacing: 0.2,
      }}>View entry</button>
    </div>
  );
}

window.HomeScreen = HomeScreen;
window.PlaceDetailSheet = PlaceDetailSheet;
window.PinPreview = PinPreview;
window.BottomSheet = BottomSheet;
window.BottomNav = BottomNav;
window.TopSearch = TopSearch;
window.GlassSurface = GlassSurface;
window.Avatar = Avatar;
window.Stars = Stars;
window.CategoryChip = CategoryChip;
window.Wordmark = Wordmark;
window.SERIF = SERIF;
window.SANS = SANS;
