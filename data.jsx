// data.jsx — Mock journal data for Minko

const MINKO_ENTRIES = [
  {
    id: 'e1',
    place: 'Bar Buca',
    category: 'restaurant',
    rating: 5,
    note: 'The cacio e pepe ruined every other one for me. Sat at the marble counter and watched them roll pasta by hand. Yes, again.',
    date: 'Mar 14, 2026',
    location: 'Toronto, ON',
    lon: -79.383, lat: 43.650,
    coords: { x: 28, y: 35 },
    photos: [
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&q=80',
      'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=600&q=80',
    ],
    likes: 24,
    likedByMe: true,
    comments: [
      { id: 'c1', friendId: 'f1', text: 'The marble counter!! Best seat in the city.', date: '2d' },
      { id: 'c2', friendId: 'f3', text: 'Going next week — what else did you order?', date: '1d' },
      { id: 'c3', friendId: 'f4', text: 'Adding to my list immediately.', date: '6h' },
    ],
  },
  {
    id: 'e2',
    place: 'Hôtel des Grands Boulevards',
    category: 'hotel',
    rating: 4,
    note: 'Tiny room, perfect courtyard. The kind of place where you eat breakfast in a robe and feel like a person again.',
    date: 'Feb 02, 2026',
    location: 'Paris, FR',
    lon: 2.349, lat: 48.864,
    coords: { x: 51, y: 32 },
    photos: [
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80',
    ],
    likes: 18,
    likedByMe: false,
    comments: [
      { id: 'c4', friendId: 'f3', text: 'That courtyard is a whole vibe.', date: '3w' },
      { id: 'c5', friendId: 'f2', text: 'Did you try the bar downstairs?', date: '2w' },
    ],
  },
  {
    id: 'e3',
    place: 'Teshima Art Museum',
    category: 'attraction',
    rating: 5,
    note: 'Water beads moving across the concrete floor like they\u2019re alive. Not a museum. A room that breathes.',
    date: 'Nov 18, 2025',
    location: 'Teshima, JP',
    lon: 134.095, lat: 34.474,
    coords: { x: 81, y: 42 },
    photos: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80',
    ],
    likes: 41,
    likedByMe: true,
    comments: [
      { id: 'c6', friendId: 'f4', text: 'This is the one. Still think about it.', date: '4mo' },
      { id: 'c7', friendId: 'f1', text: 'How long was the ferry ride?', date: '4mo' },
    ],
  },
  {
    id: 'e4',
    place: 'Prospect Park',
    category: 'attraction',
    rating: 4,
    note: 'Sunday picnic, Brooklyn light, a borrowed dog. The kind of afternoon you can\u2019t schedule.',
    date: 'Sep 08, 2025',
    location: 'Brooklyn, NY',
    lon: -73.969, lat: 40.660,
    coords: { x: 26, y: 36 },
    photos: [
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600&q=80',
    ],
    likes: 12,
    likedByMe: false,
    comments: [
      { id: 'c8', friendId: 'f1', text: 'The borrowed dog era 🐕', date: '6mo' },
    ],
  },
  {
    id: 'e5',
    place: 'Tartine Manufactory',
    category: 'restaurant',
    rating: 4,
    note: 'Country loaf and a cortado. Read for an hour. No one rushed me.',
    date: 'Aug 21, 2025',
    location: 'San Francisco, CA',
    lon: -122.411, lat: 37.760,
    coords: { x: 14, y: 41 },
    photos: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
    ],
    likes: 9,
    likedByMe: false,
    comments: [],
  },
  {
    id: 'e6',
    place: 'Ace Hotel Kyoto',
    category: 'hotel',
    rating: 5,
    note: 'Tatami mats, a deep tub, and the river two blocks away. Came for one night, stayed three.',
    date: 'Jun 11, 2025',
    location: 'Kyoto, JP',
    lon: 135.768, lat: 35.012,
    coords: { x: 79, y: 41 },
    photos: [
      'https://images.unsplash.com/photo-1578469645742-46cae010e5d4?w=600&q=80',
    ],
    likes: 33,
    likedByMe: true,
    comments: [
      { id: 'c9', friendId: 'f2', text: 'Three nights minimum, agreed.', date: '9mo' },
      { id: 'c10', friendId: 'f5', text: 'Which room? Trying to book.', date: '8mo' },
    ],
  },
  {
    id: 'e7',
    place: 'Lago di Como Sunset',
    category: 'experience',
    rating: 5,
    note: 'A boat, a bottle of Franciacorta, the alps going pink. We didn\u2019t talk for an hour.',
    date: 'May 29, 2025',
    location: 'Como, IT',
    lon: 9.083, lat: 45.820,
    coords: { x: 53, y: 36 },
    photos: [
      'https://images.unsplash.com/photo-1601981400103-c812d29b51f1?w=600&q=80',
    ],
    likes: 27,
    likedByMe: true,
    comments: [
      { id: 'c11', friendId: 'f3', text: 'The alps going pink. I felt this.', date: '10mo' },
    ],
  },
  {
    id: 'e8',
    place: 'Sightglass Coffee',
    category: 'restaurant',
    rating: 3,
    note: 'Good drip. Too loud. Worth it for the upstairs nook.',
    date: 'Apr 04, 2025',
    location: 'San Francisco, CA',
    lon: -122.413, lat: 37.775, coords: { x: 14.2, y: 41.2 },
    likes: 4,
    likedByMe: false,
    comments: [],
  },
  // Additional pin coordinates for visual density
];

// Extra pins for visual density on the globe — no detail, just dots
const MINKO_PIN_DOTS = [
  { x: 22, y: 38 }, { x: 24, y: 33 }, { x: 30, y: 41 }, { x: 18, y: 28 },
  { x: 49, y: 28 }, { x: 54, y: 30 }, { x: 50, y: 38 }, { x: 56, y: 34 },
  { x: 78, y: 38 }, { x: 83, y: 45 }, { x: 76, y: 48 }, { x: 88, y: 36 },
  { x: 12, y: 38 }, { x: 16, y: 45 }, { x: 20, y: 50 }, { x: 33, y: 60 },
  { x: 60, y: 55 }, { x: 65, y: 30 }, { x: 70, y: 50 }, { x: 45, y: 60 },
  { x: 48, y: 22 }, { x: 38, y: 40 }, { x: 85, y: 28 }, { x: 90, y: 50 },
  { x: 8, y: 32 }, { x: 36, y: 25 }, { x: 41, y: 35 }, { x: 58, y: 65 },
  { x: 72, y: 22 }, { x: 25, y: 22 }, { x: 67, y: 40 }, { x: 75, y: 60 },
  { x: 10, y: 50 }, { x: 32, y: 50 }, { x: 44, y: 50 }, { x: 62, y: 45 },
  { x: 55, y: 50 }, { x: 86, y: 55 }, { x: 19, y: 55 }, { x: 28, y: 55 },
];

const MINKO_FRIENDS = [
  { id: 'f1', name: 'Maya', initial: 'M', color: '#d97757' },
  { id: 'f2', name: 'Theo', initial: 'T', color: '#5b8c6e' },
  { id: 'f3', name: 'Elena', initial: 'E', color: '#c89e54' },
  { id: 'f4', name: 'Jun', initial: 'J', color: '#7a6ca3' },
  { id: 'f5', name: 'Ravi', initial: 'R', color: '#b85a6e' },
];

const MINKO_FRIEND_ENTRIES = [
  { id: 'fe1', friendId: 'f1', place: 'Cafe Mogador', category: 'restaurant', rating: 5, note: 'Their tagine is a love letter. Sit by the window.', date: 'Mar 22, 2026', location: 'Brooklyn, NY', lon: -73.982, lat: 40.728, coords: { x: 26.5, y: 35 }, photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80'] },
  { id: 'fe2', friendId: 'f2', place: 'Lisbon Tram 28', category: 'experience', rating: 4, note: 'Crowded, rickety, perfect. Get on at Martim Moniz.', date: 'Feb 14, 2026', location: 'Lisbon, PT', lon: -9.140, lat: 38.717, coords: { x: 47, y: 37 } },
  { id: 'fe3', friendId: 'f3', place: 'Parc Güell', category: 'attraction', rating: 5, note: 'Go at sunrise. The mosaics glow.', date: 'Jan 30, 2026', location: 'Barcelona, ES', lon: 2.153, lat: 41.415, coords: { x: 49, y: 36 } },
  { id: 'fe4', friendId: 'f4', place: 'Onomichi Ramen', category: 'restaurant', rating: 5, note: 'The broth has a soy backbone. Slurp respectfully.', date: 'Mar 03, 2026', location: 'Hiroshima, JP', lon: 133.207, lat: 34.409, coords: { x: 80, y: 43 } },
  { id: 'fe5', friendId: 'f5', place: 'Sunset Cliffs', category: 'experience', rating: 4, note: 'Bring a blanket. Stay past golden hour.', date: 'Feb 27, 2026', location: 'San Diego, CA', lon: -117.249, lat: 32.721, coords: { x: 14, y: 44 } },
  { id: 'fe6', friendId: 'f1', place: 'The High Line', category: 'attraction', rating: 4, note: 'Walk the whole thing. Pretzels at the south end.', date: 'Mar 11, 2026', location: 'New York, NY', lon: -74.005, lat: 40.748, coords: { x: 25.8, y: 35.2 } },
  { id: 'fe7', friendId: 'f2', place: 'Ace Hotel London', category: 'hotel', rating: 4, note: 'Lobby bar > rooms. Order the negroni.', date: 'Jan 18, 2026', location: 'London, UK', lon: -0.075, lat: 51.524, coords: { x: 48, y: 28 } },
  { id: 'fe8', friendId: 'f3', place: 'Vondelpark', category: 'attraction', rating: 5, note: 'Bring a book and stroopwafels. Don\u2019t rush.', date: 'Sep 12, 2025', location: 'Amsterdam, NL', lon: 4.876, lat: 52.358, coords: { x: 50.5, y: 29 } },
  { id: 'fe9', friendId: 'f4', place: 'Tsukiji Outer Market', category: 'restaurant', rating: 5, note: 'Tamago on a stick. Don\u2019t skip the knife shops.', date: 'Dec 04, 2025', location: 'Tokyo, JP', lon: 139.770, lat: 35.666, coords: { x: 84, y: 38 } },
  { id: 'fe10', friendId: 'f5', place: 'Joshua Tree', category: 'experience', rating: 5, note: 'No service. That\u2019s the point.', date: 'Nov 21, 2025', location: 'California, US', lon: -116.167, lat: 34.020, coords: { x: 15, y: 43 } },
];

// Friends who have also been to Bar Buca (entry e1)
const MINKO_FRIENDS_AT_BUCA = ['f1', 'f3'];

const MINKO_CATEGORIES = [
  { id: 'restaurant', label: 'Eat',  count: 18 },
  { id: 'hotel',      label: 'Stay', count: 9  },
  { id: 'attraction', label: 'See',  count: 14 },
  { id: 'experience', label: 'Do',   count: 6  },
];

// ─────────────────────────────────────────────────────────────
// TRIPS — collections of pins (logged + saved) by city/trip.
// Used to filter the globe and group wishlist items.
// ─────────────────────────────────────────────────────────────
const MINKO_TRIPS = [
  { id: 't_tokyo',    label: 'Tokyo · May',     city: 'Tokyo, JP',       dates: 'May 2026',     status: 'upcoming', emoji: '🗼', color: '#d97757' },
  { id: 't_lisbon',   label: 'Lisbon weekend',  city: 'Lisbon, PT',      dates: 'Jun 2026',     status: 'upcoming', emoji: '🌅', color: '#c89e54' },
  { id: 't_mexico',   label: 'Mexico City',     city: 'Mexico City, MX', dates: 'Aug 2026',     status: 'planning', emoji: '🌮', color: '#5b8c6e' },
  { id: 't_kyoto',    label: 'Kyoto · 2025',    city: 'Kyoto, JP',       dates: 'Jun 2025',     status: 'past',     emoji: '⛩️', color: '#7a6ca3' },
  { id: 't_paris',    label: 'Paris · winter',  city: 'Paris, FR',       dates: 'Feb 2026',     status: 'past',     emoji: '🥐', color: '#b85a6e' },
  { id: 't_toronto',  label: 'Home',            city: 'Toronto, ON',     dates: 'Ongoing',      status: 'home',     emoji: '🏠', color: '#4f5bd5' },
];

// Tag existing logged entries with their trip
MINKO_ENTRIES[0].tripId = 't_toronto';   // Bar Buca
MINKO_ENTRIES[1].tripId = 't_paris';     // Hôtel des Grands Boulevards
MINKO_ENTRIES[2].tripId = 't_kyoto';     // Teshima
MINKO_ENTRIES[3].tripId = null;          // Brooklyn
MINKO_ENTRIES[4].tripId = null;          // SF
MINKO_ENTRIES[5].tripId = 't_kyoto';     // Ace Hotel Kyoto
MINKO_ENTRIES[6].tripId = null;          // Como
MINKO_ENTRIES[7].tripId = null;          // Sightglass

// ─────────────────────────────────────────────────────────────
// WISHLIST — private "save for later" pins. Friends never see these.
// Tagged by trip so the user can filter their map by upcoming plans.
// ─────────────────────────────────────────────────────────────
const MINKO_WISHLIST = [
  {
    id: 'w1', place: 'Sushi Saito', category: 'restaurant',
    note: 'Three stars. Need to call the concierge a month out.',
    location: 'Tokyo, JP', coords: { x: 84.2, y: 38.4 },
    savedFrom: 'Maya recommended', tripId: 't_tokyo', date: 'Saved 3d ago',
    photo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80',
  },
  {
    id: 'w2', place: 'teamLab Planets', category: 'attraction',
    note: 'Book the 9am slot. Wear shorts.',
    location: 'Tokyo, JP', coords: { x: 84.4, y: 38.1 },
    savedFrom: 'From Jun\u2019s pin', tripId: 't_tokyo', date: 'Saved 1w ago',
  },
  {
    id: 'w3', place: 'Hoshinoya Tokyo', category: 'hotel',
    note: 'Onsen in the middle of Tokyo. Splurge night?',
    location: 'Tokyo, JP', coords: { x: 84.1, y: 38.3 },
    tripId: 't_tokyo', date: 'Saved 2w ago',
    photo: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=600&q=80',
  },
  {
    id: 'w4', place: 'Time Out Market', category: 'restaurant',
    note: 'Skip lunch, go straight here. Try the bifana.',
    location: 'Lisbon, PT', coords: { x: 47.2, y: 37.3 },
    savedFrom: 'From Theo\u2019s pin', tripId: 't_lisbon', date: 'Saved 5d ago',
  },
  {
    id: 'w5', place: 'Miradouro da Senhora do Monte', category: 'attraction',
    note: 'Sunset. Walk up from Graça.',
    location: 'Lisbon, PT', coords: { x: 47.0, y: 37.0 }, tripId: 't_lisbon', date: 'Saved 5d ago',
  },
  {
    id: 'w6', place: 'Pujol', category: 'restaurant',
    note: 'Tasting menu. The mole madre is 2,500 days old.',
    location: 'Mexico City, MX', coords: { x: 19.5, y: 47.5 },
    tripId: 't_mexico', date: 'Saved 1mo ago',
    photo: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
  },
  {
    id: 'w7', place: 'Casa Luis Barragán', category: 'attraction',
    note: 'Reserve weeks ahead. Pink walls in person.',
    location: 'Mexico City, MX', coords: { x: 19.3, y: 47.7 },
    tripId: 't_mexico', date: 'Saved 1mo ago',
  },
  {
    id: 'w8', place: 'Le Servan', category: 'restaurant',
    note: 'For next Paris trip. Natural wine list.',
    location: 'Paris, FR', coords: { x: 51.2, y: 32.3 },
    tripId: null, date: 'Saved 6mo ago',
  },
];

Object.assign(window, {
  MINKO_ENTRIES, MINKO_PIN_DOTS, MINKO_FRIENDS, MINKO_FRIEND_ENTRIES,
  MINKO_FRIENDS_AT_BUCA, MINKO_CATEGORIES,
  MINKO_TRIPS, MINKO_WISHLIST,
});
