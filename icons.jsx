// icons.jsx — Minimal stroke icons for Minko

const MinkoIcon = ({ name, size = 22, color = 'currentColor', strokeWidth = 1.6 }) => {
  const s = { width: size, height: size, fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'search':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'plus':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 5v14M5 12h14"/></svg>;
    case 'globe':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'friends':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="9" cy="9" r="3.2"/><path d="M3 19c.6-3 3-4.5 6-4.5s5.4 1.5 6 4.5"/><circle cx="17" cy="7.5" r="2.6"/><path d="M16 14.4c2.6.2 4.4 1.6 5 4.6"/></svg>;
    case 'user':
      return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="9" r="3.6"/><path d="M4.5 19.5c1.2-3.4 4-5 7.5-5s6.3 1.6 7.5 5"/></svg>;
    case 'star':
      return <svg viewBox="0 0 24 24" width={size} height={size} fill={color} stroke="none"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>;
    case 'star-outline':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>;
    case 'restaurant':
      return <svg viewBox="0 0 24 24" {...s}><path d="M6 3v8a2 2 0 0 0 2 2v8M6 3v6M10 3v6M8 9V3"/><path d="M16 3c-1.5 0-3 1-3 4s1.5 5 3 5v9"/></svg>;
    case 'hotel':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 19V8M21 19v-7H10v7M3 13h7M7 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/></svg>;
    case 'attraction':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'experience':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 21l3-7 4-1 5-7 6 4-7 5-1 4-7 3z"/><circle cx="16" cy="6" r="1.5"/></svg>;
    case 'camera':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 8h3.5l1.5-2h8l1.5 2H21v11H3z"/><circle cx="12" cy="13.5" r="3.5"/></svg>;
    case 'edit':
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 20h4l10-10-4-4L4 16zM14 6l4 4"/></svg>;
    case 'check':
      return <svg viewBox="0 0 24 24" {...s}><path d="M5 12.5l4.5 4.5L20 7"/></svg>;
    case 'close':
      return <svg viewBox="0 0 24 24" {...s}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'chevron-down':
      return <svg viewBox="0 0 24 24" {...s}><path d="M5 9l7 7 7-7"/></svg>;
    case 'chevron-right':
      return <svg viewBox="0 0 24 24" {...s}><path d="M9 5l7 7-7 7"/></svg>;
    case 'pin':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'sliders':
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"/></svg>;
    case 'heart':
      return <svg viewBox="0 0 24 24" {...s}><path d="M12 20s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 21 10c0 5.5-9 10-9 10z"/></svg>;
    case 'heart-filled':
      return <svg viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"><path d="M12 20s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 21 10c0 5.5-9 10-9 10z"/></svg>;
    case 'comment':
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 5h16v11H10l-4 3.5V16H4z"/></svg>;
    case 'send':
      return <svg viewBox="0 0 24 24" {...s}><path d="M4 12l16-7-7 16-2-7z"/></svg>;
    case 'bookmark':
      return <svg viewBox="0 0 24 24" {...s}><path d="M6 3h12v18l-6-4-6 4z"/></svg>;
    case 'bookmark-filled':
      return <svg viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>;
    case 'tag':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="8" cy="8" r="1.4"/></svg>;
    case 'lock':
      return <svg viewBox="0 0 24 24" {...s}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case 'eye-off':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 3l18 18"/><path d="M10.5 6.4A9.7 9.7 0 0 1 12 6.3c5 0 9 5.7 9 5.7a17 17 0 0 1-3.4 4.1M6.4 7.4C4 9.4 3 12 3 12s4 5.7 9 5.7c1.4 0 2.7-.4 3.9-1"/><path d="M9.6 9.6a3 3 0 0 0 4.2 4.2"/></svg>;
    case 'plane':
      return <svg viewBox="0 0 24 24" {...s}><path d="M3 14l8-2 5-9 2 1-3 9 6 3-1 2-7-2-4 6-2-1 1-5z"/></svg>;
    case 'trash':
      return <svg viewBox="0 0 24 24" {...s}><path d="M5 7h14M8 7V5h8v2M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/></svg>;
    case 'link':
      return <svg viewBox="0 0 24 24" {...s}><path d="M10 13a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-5.7l-1.5 1.5"/><path d="M14 11a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 5.7l1.5-1.5"/></svg>;
    case 'calendar':
      return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    default: return null;
  }
};

window.MinkoIcon = MinkoIcon;
