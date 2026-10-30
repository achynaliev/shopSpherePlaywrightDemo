// Catalog seed data. Prices are in dollars here and converted to cents when seeded.
// Brands are fictional. `daysAgo` spreads out "newest" ordering.

const C = {
  electronics: ['#dbeafe', '#93c5fd'],
  home: ['#fef3c7', '#fcd34d'],
  books: ['#ede9fe', '#c4b5fd'],
  fashion: ['#fce7f3', '#f9a8d4'],
  sports: ['#dcfce7', '#86efac'],
  beauty: ['#ffe4e6', '#fda4af'],
  toys: ['#ffedd5', '#fdba74'],
};

export const products = [
  // ---- Electronics -------------------------------------------------------
  {
    title: 'Auralis Pro Wireless Noise-Cancelling Headphones',
    brand: 'Auralis', category: 'Electronics', price: 179.99, listPrice: 249.99, stock: 42, emoji: '🎧', colors: C.electronics, featured: true, daysAgo: 12,
    description: 'Over-ear headphones with adaptive active noise cancellation, plush memory-foam cushions and a 40-hour battery. Fold flat for travel and switch between two paired devices instantly.',
    features: ['Adaptive ANC with transparency mode', '40-hour battery; 10 min charge = 5 hours of play', 'Multipoint Bluetooth 5.3', 'Built-in mics for clear calls'],
  },
  {
    title: 'Voltera 65W GaN USB-C Fast Charger, 3 Ports',
    brand: 'Voltera', category: 'Electronics', price: 39.99, listPrice: 54.99, stock: 120, emoji: '🔌', colors: C.electronics, daysAgo: 40,
    description: 'A compact gallium-nitride charger that powers a laptop, phone and earbuds at the same time. About the size of a standard phone charger with foldable prongs.',
    features: ['65W max output across 2× USB-C + 1× USB-A', 'Charges most 13–14" laptops at full speed', 'Foldable prongs, travel-friendly', 'Over-heat and surge protection'],
  },
  {
    title: 'Pixelcraft 27" 4K UHD IPS Monitor with USB-C',
    brand: 'Pixelcraft', category: 'Electronics', price: 329.99, listPrice: 399.99, stock: 18, emoji: '🖥️', colors: C.electronics, featured: true, daysAgo: 25,
    description: 'Sharp 3840×2160 IPS panel with 99% sRGB coverage, a single-cable USB-C connection that charges your laptop, and an ergonomic stand that tilts, swivels and pivots.',
    features: ['27" 4K IPS, 99% sRGB, HDR10', 'USB-C with 90W power delivery', 'Height, tilt, swivel and pivot adjustable', 'Built-in KVM switch'],
  },
  {
    title: 'Keyforge 75% Mechanical Keyboard, Hot-Swappable, RGB',
    brand: 'Keyforge', category: 'Electronics', price: 89.99, listPrice: null, stock: 55, emoji: '⌨️', colors: C.electronics, daysAgo: 8,
    description: 'A compact 75% layout with gasket-mounted plate, pre-lubed linear switches and per-key RGB. Hot-swap sockets let you change switches without soldering.',
    features: ['Hot-swappable 5-pin sockets', 'Gasket mount with sound-dampening foam', 'Wired USB-C, 2.4 GHz and Bluetooth', 'PBT double-shot keycaps'],
  },
  {
    title: 'Nimbus Mini Smart Speaker with Voice Assistant',
    brand: 'Nimbus', category: 'Electronics', price: 49.99, listPrice: 69.99, stock: 200, emoji: '🔊', colors: C.electronics, daysAgo: 60,
    description: 'Room-filling 360° sound in a palm-sized speaker. Ask for music, timers, weather and control compatible smart-home devices hands-free.',
    features: ['360° sound with passive bass radiator', 'Far-field microphones', 'Physical mic-off switch', 'Works with most smart-home platforms'],
  },
  {
    title: 'Lumen Glow 7" E-Reader, Glare-Free, Waterproof',
    brand: 'Lumen', category: 'Electronics', price: 139.99, listPrice: null, stock: 64, emoji: '📲', colors: C.electronics, daysAgo: 3,
    description: 'A 300 ppi glare-free display that reads like paper in direct sun, adjustable warm light for night reading and weeks of battery on a single charge.',
    features: ['7" 300 ppi E Ink display', 'Adjustable warm front light', 'IPX8 waterproof', '32 GB storage, weeks of battery'],
  },
  {
    title: 'Stride Fit 2 Fitness Tracker with Heart Rate & GPS',
    brand: 'Stride', category: 'Electronics', price: 79.99, listPrice: 99.99, stock: 0, emoji: '⌚', colors: C.electronics, daysAgo: 90,
    description: 'Track workouts, sleep and heart rate around the clock. Built-in GPS maps your runs without a phone, and the battery lasts up to 10 days.',
    features: ['24/7 heart rate and sleep tracking', 'Built-in GPS', 'Water resistant to 50 m', 'Up to 10-day battery life'],
  },

  // ---- Home & Kitchen ----------------------------------------------------
  {
    title: 'Brewmaster 12-Cup Programmable Coffee Maker',
    brand: 'Brewmaster', category: 'Home & Kitchen', price: 64.99, listPrice: 79.99, stock: 75, emoji: '☕', colors: C.home, featured: true, daysAgo: 33,
    description: 'Wake up to fresh coffee with a 24-hour programmable timer, bold-brew setting and a thermal carafe that keeps coffee hot for hours without a hot plate.',
    features: ['12-cup double-wall thermal carafe', '24-hour programmable start', 'Bold and 1–4 cup settings', 'Reusable gold-tone filter included'],
  },
  {
    title: 'Ironclad 12" Pre-Seasoned Cast Iron Skillet',
    brand: 'Ironclad', category: 'Home & Kitchen', price: 34.99, listPrice: null, stock: 140, emoji: '🍳', colors: C.home, daysAgo: 120,
    description: 'A heavy-duty skillet that goes from stovetop to oven to campfire. Pre-seasoned with vegetable oil and ready to sear, bake and fry right out of the box.',
    features: ['Pre-seasoned, naturally non-stick', 'Oven safe to 500°F', 'Works on induction, gas and electric', 'Dual pour spouts and helper handle'],
  },
  {
    title: 'CrispAir 6-Quart Digital Air Fryer',
    brand: 'CrispAir', category: 'Home & Kitchen', price: 99.99, listPrice: 129.99, stock: 38, emoji: '🍟', colors: C.home, featured: true, daysAgo: 15,
    description: 'Crispy results with up to 95% less oil. Eight one-touch presets, a shake reminder and a dishwasher-safe basket big enough for a family of four.',
    features: ['6-quart non-stick basket', '8 presets: fries, wings, fish, veggies and more', 'Temperature range 180–400°F', 'Dishwasher-safe basket and crisper plate'],
  },
  {
    title: 'Hearth Stoneware Dinnerware Set, 16 Pieces',
    brand: 'Hearth', category: 'Home & Kitchen', price: 74.99, listPrice: 89.99, stock: 22, emoji: '🍽️', colors: C.home, daysAgo: 70,
    description: 'Reactive-glaze stoneware with a hand-finished look. Service for four: dinner plates, salad plates, bowls and mugs that are microwave and dishwasher safe.',
    features: ['Service for 4 (16 pieces)', 'Chip-resistant stoneware', 'Microwave and dishwasher safe', 'Each piece has a unique glaze'],
  },
  {
    title: 'CloudRest Cooling Memory Foam Pillow, 2-Pack',
    brand: 'CloudRest', category: 'Home & Kitchen', price: 49.99, listPrice: null, stock: 90, emoji: '🛏️', colors: C.home, daysAgo: 45,
    description: 'Shredded memory foam you can add or remove to dial in the perfect loft, wrapped in a breathable cooling cover for back, side and stomach sleepers.',
    features: ['Adjustable shredded foam fill', 'Removable, washable cooling cover', 'CertiPUR-US certified foam', 'Queen size, set of two'],
  },
  {
    title: 'Verdant Self-Watering Indoor Planter, 8"',
    brand: 'Verdant', category: 'Home & Kitchen', price: 24.99, listPrice: null, stock: 160, emoji: '🪴', colors: C.home, daysAgo: 5,
    description: 'A modern matte planter with a hidden reservoir and wicking system that keeps plants watered for up to two weeks. Includes a water-level indicator.',
    features: ['Up to 2 weeks between waterings', 'Water-level indicator', 'Removable inner pot', 'UV-resistant matte finish'],
  },

  // ---- Books -------------------------------------------------------------
  {
    title: 'The Quiet Algorithm: A Novel (Hardcover)',
    brand: 'Mara Ellison', category: 'Books', price: 16.99, listPrice: 27.0, stock: 300, emoji: '📕', colors: C.books, featured: true, daysAgo: 20,
    description: 'When a reclusive engineer discovers her city’s traffic system has started making decisions of its own, she must decide whether to shut it down or listen. A tense, warm-hearted techno-thriller.',
    features: ['Hardcover, 384 pages', 'Book-club discussion guide included', 'Publisher: Northlight Press', 'Ages 16 and up'],
  },
  {
    title: 'Practical Sourdough: Bread for Busy People',
    brand: 'Theo Marchand', category: 'Books', price: 24.95, listPrice: null, stock: 85, emoji: '📗', colors: C.books, daysAgo: 100,
    description: 'A no-fuss guide to building a starter and baking great loaves around a work schedule, with 60 recipes from everyday sandwich bread to focaccia and bagels.',
    features: ['Paperback, 256 pages', '60 recipes with step-by-step photos', 'Weekday and weekend baking schedules', 'Troubleshooting chapter'],
  },
  {
    title: 'Atlas of Small Wonders: 100 Hidden Places',
    brand: 'Iris Okafor', category: 'Books', price: 29.99, listPrice: 40.0, stock: 40, emoji: '📘', colors: C.books, daysAgo: 55,
    description: 'A lavishly illustrated travel atlas of tiny museums, secret gardens and odd landmarks across six continents, each with a map and a story.',
    features: ['Hardcover, 320 pages', 'Over 200 illustrations and maps', 'Covers 6 continents', 'Makes a great gift'],
  },
  {
    title: 'Focus by Design: Build a Calmer, Deeper Workday',
    brand: 'Daniel Reyes', category: 'Books', price: 18.0, listPrice: null, stock: 0, emoji: '📙', colors: C.books, daysAgo: 30,
    description: 'Practical, research-backed techniques for protecting your attention, planning realistic days and doing your best work without burning out.',
    features: ['Paperback, 224 pages', 'Includes printable planning templates', 'Chapter summaries and exercises', 'Audiobook companion available'],
  },

  // ---- Fashion -----------------------------------------------------------
  {
    title: "Trailmark Men's Packable Waterproof Rain Jacket",
    brand: 'Trailmark', category: 'Fashion', price: 69.99, listPrice: 89.99, stock: 58, emoji: '🧥', colors: C.fashion, daysAgo: 18,
    description: 'Lightweight, fully seam-sealed shell that packs into its own pocket. Breathable membrane, adjustable hood and pit zips keep you dry without overheating.',
    features: ['Waterproof, breathable 2.5-layer fabric', 'Packs into its own chest pocket', 'Adjustable hood and cuffs', 'Sizes S–XXL'],
  },
  {
    title: "Cadence Women's Cushioned Running Shoes",
    brand: 'Cadence', category: 'Fashion', price: 89.99, listPrice: 119.99, stock: 33, emoji: '👟', colors: C.fashion, featured: true, daysAgo: 10,
    description: 'Responsive foam midsole, an engineered-knit upper and a durable rubber outsole make these an everyday trainer for road runs and long walks.',
    features: ['Responsive full-length foam midsole', 'Breathable engineered-knit upper', '8 mm heel-to-toe drop', 'Sizes 5–12, regular and wide'],
  },
  {
    title: 'Meridian Slim Leather Bifold Wallet with RFID Blocking',
    brand: 'Meridian', category: 'Fashion', price: 29.99, listPrice: null, stock: 110, emoji: '👛', colors: C.fashion, daysAgo: 80,
    description: 'Full-grain leather wallet that ages beautifully. Six card slots, a cash compartment and RFID-blocking lining in a slim profile that fits a front pocket.',
    features: ['Full-grain leather', '6 card slots + 2 hidden pockets', 'RFID-blocking lining', 'Gift box included'],
  },
  {
    title: 'Coastline Polarized Sunglasses, Unisex',
    brand: 'Coastline', category: 'Fashion', price: 39.99, listPrice: 49.99, stock: 95, emoji: '🕶️', colors: C.fashion, daysAgo: 2,
    description: 'Lightweight acetate frames with polarized, scratch-resistant lenses that cut glare on the water and the road. Includes a hard case and cleaning cloth.',
    features: ['Polarized lenses, 100% UV400', 'Lightweight acetate frame', 'Spring hinges', 'Hard case and microfiber cloth included'],
  },

  // ---- Sports & Outdoors -------------------------------------------------
  {
    title: 'Summit Lite 2-Person Backpacking Tent',
    brand: 'Summit', category: 'Sports & Outdoors', price: 149.99, listPrice: 189.99, stock: 14, emoji: '⛺', colors: C.sports, featured: true, daysAgo: 28,
    description: 'Freestanding 3-season tent that weighs just 4 lb packed. Two doors, two vestibules and a color-coded setup that takes under five minutes.',
    features: ['4 lb packed weight', 'Two doors and two vestibules', 'Color-coded aluminum poles', 'Fully taped rainfly'],
  },
  {
    title: 'FlexCore Adjustable Dumbbells, 5–52.5 lb (Pair)',
    brand: 'FlexCore', category: 'Sports & Outdoors', price: 299.99, listPrice: 349.99, stock: 9, emoji: '🏋️', colors: C.sports, daysAgo: 50,
    description: 'Replace 15 sets of weights with one compact pair. Turn the dial to change weight in 2.5 lb increments, from 5 up to 52.5 lb per dumbbell.',
    features: ['Adjusts from 5 to 52.5 lb', '15 weight settings per dumbbell', 'Molded storage trays included', 'Durable steel and molded plastic'],
  },
  {
    title: 'Hydra Insulated Stainless Steel Water Bottle, 32 oz',
    brand: 'Hydra', category: 'Sports & Outdoors', price: 27.99, listPrice: null, stock: 250, emoji: '💧', colors: C.sports, daysAgo: 65,
    description: 'Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12. Leak-proof straw lid and powder-coated finish for a sweat-free grip.',
    features: ['Cold 24 h / hot 12 h', 'Leak-proof straw and chug lids', 'BPA-free, dishwasher-safe lid', 'Fits most car cup holders'],
  },
  {
    title: 'ZenGrip Non-Slip Yoga Mat, 6 mm',
    brand: 'ZenGrip', category: 'Sports & Outdoors', price: 32.99, listPrice: 39.99, stock: 130, emoji: '🧘', colors: C.sports, daysAgo: 35,
    description: 'Extra-cushioned 6 mm mat with a grippy textured surface on both sides. Lightweight, easy to clean and comes with a carrying strap.',
    features: ['6 mm thick for joint support', 'Non-slip texture on both sides', '72" × 24", 2.5 lb', 'Free of PVC and latex'],
  },

  // ---- Beauty & Personal Care -------------------------------------------
  {
    title: 'Glowleaf 15% Vitamin C Brightening Serum, 1 oz',
    brand: 'Glowleaf', category: 'Beauty & Personal Care', price: 21.99, listPrice: 28.0, stock: 175, emoji: '✨', colors: C.beauty, daysAgo: 22,
    description: 'A lightweight daily serum with stabilized vitamin C, hyaluronic acid and vitamin E to brighten, hydrate and even out skin tone.',
    features: ['15% stabilized vitamin C', 'With hyaluronic acid and vitamin E', 'Fragrance-free, cruelty-free', 'Suitable for all skin types'],
  },
  {
    title: 'Silkwave Ionic Hair Dryer with Diffuser',
    brand: 'Silkwave', category: 'Beauty & Personal Care', price: 59.99, listPrice: 79.99, stock: 47, emoji: '💨', colors: C.beauty, daysAgo: 42,
    description: 'Fast-drying 1875W dryer with ionic technology to reduce frizz. Three heat and two speed settings, cool-shot button and three attachments.',
    features: ['1875W with ionic frizz control', '3 heat / 2 speed settings + cool shot', 'Diffuser and two concentrator nozzles', 'Lightweight, 1.2 lb'],
  },
  {
    title: 'Evergreen Natural Bar Soap Gift Set, 6 Bars',
    brand: 'Evergreen', category: 'Beauty & Personal Care', price: 18.99, listPrice: null, stock: 220, emoji: '🧼', colors: C.beauty, daysAgo: 75,
    description: 'Cold-process soaps made with olive oil, shea butter and essential oils. Six scents including lavender, cedar, citrus and oatmeal-honey.',
    features: ['6 × 4 oz bars', 'Made with plant oils and shea butter', 'Scented with essential oils', 'Plastic-free packaging'],
  },

  // ---- Toys & Games ------------------------------------------------------
  {
    title: 'BrickVerse Creative Building Set, 1,200 Pieces',
    brand: 'BrickVerse', category: 'Toys & Games', price: 59.99, listPrice: 74.99, stock: 66, emoji: '🧱', colors: C.toys, featured: true, daysAgo: 14,
    description: 'A big box of bricks in 40 colors with wheels, windows, doors and minifigures. Includes idea booklets for 30 builds and a storage bin.',
    features: ['1,200 pieces in 40 colors', 'Compatible with major brick brands', 'Idea booklet with 30 builds', 'Ages 6+'],
  },
  {
    title: 'Quandary: The Island Trading Strategy Board Game',
    brand: 'Tallow Games', category: 'Toys & Games', price: 34.99, listPrice: null, stock: 80, emoji: '🎲', colors: C.toys, daysAgo: 7,
    description: 'Build trade routes, bargain for resources and race to settle the archipelago. Easy to learn, different every time, and plays in about 45 minutes.',
    features: ['2–5 players, ages 10+', '45-minute play time', 'Modular board for endless setups', 'Quick-start rules sheet'],
  },
];

export const reviewers = [
  'Jordan Pike', 'Priya Shah', 'Marcus Lee', 'Sofia Alvarez', 'Ethan Brooks', 'Amara Okoye',
  'Liam Walsh', 'Hannah Kim', 'Diego Ramos', 'Chloe Martin', 'Noah Fischer', 'Grace Chen',
];

export const reviewTemplates = {
  5: [
    ['Exceeded my expectations', 'Honestly better than I expected for the price. Build quality is great and it does exactly what it promises. Would buy again.'],
    ['Five stars, no regrets', 'I did a lot of research before picking this one and I am really happy with the choice. Arrived quickly and well packaged.'],
    ['Perfect gift', 'Bought this as a gift and ended up getting one for myself too. Everyone who has tried it has been impressed.'],
    ['Use it every day', 'It has become part of my daily routine. A month in and it still feels like new.'],
  ],
  4: [
    ['Great, with one small gripe', 'Really solid overall. Only knocking off a star because the instructions could be clearer, but once set up it works great.'],
    ['Very good value', 'Does the job well and looks nice. Not the absolute best on the market but a great balance of quality and price.'],
    ['Happy with it', 'Works as described. Shipping was fast. I would recommend it to friends.'],
  ],
  3: [
    ['It is okay', 'Decent, but nothing special. It works, though I expected a bit more polish at this price point.'],
    ['Mixed feelings', 'Some things I love and some I do not. Quality is fine but a couple of design choices are odd.'],
  ],
  2: [
    ['Not for me', 'It works, but I ran into a few issues in the first week. Customer support was helpful though.'],
  ],
  1: [
    ['Disappointed', 'Mine arrived with a defect. The replacement was fine, but it was a hassle to deal with.'],
  ],
};
