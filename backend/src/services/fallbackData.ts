import bcrypt from 'bcryptjs';

const HASH_SOURAV = bcrypt.hashSync('Sourav@12345', 10);
const HASH_VENDOR = bcrypt.hashSync('Vendor@12345', 10);
const HASH_PROVIDER = bcrypt.hashSync('Provider@2026', 10);
const HASH_STUDENT = bcrypt.hashSync('Student@2026', 10);
const HASH_DELIVERY = bcrypt.hashSync('Delivery@12345', 10);

export const fallbackZones = [
  {
    id: 'zone_a',
    name: 'Zone A - Academic & Central Complex',
    polygonCoordinates: JSON.stringify([
      { lat: 23.5505, lng: 87.291 },
      { lat: 23.5535, lng: 87.297 },
      { lat: 23.548, lng: 87.3 },
      { lat: 23.546, lng: 87.293 }
    ]),
    isActive: true,
    availableServices: '["FOOD","FRUITS","LAUNDRY","ESSENTIALS"]',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'zone_b',
    name: 'Zone B - Halls 1 to 8 & Sports Grounds',
    polygonCoordinates: JSON.stringify([
      { lat: 23.542, lng: 87.288 },
      { lat: 23.547, lng: 87.295 },
      { lat: 23.543, lng: 87.298 },
      { lat: 23.54, lng: 87.29 }
    ]),
    isActive: true,
    availableServices: '["FOOD","FRUITS","LAUNDRY","ESSENTIALS"]',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'zone_c',
    name: 'Zone C - New Halls 11, 12, 13, 14 & Girls Hostels',
    polygonCoordinates: JSON.stringify([
      { lat: 23.552, lng: 87.285 },
      { lat: 23.555, lng: 87.292 },
      { lat: 23.551, lng: 87.294 },
      { lat: 23.548, lng: 87.287 }
    ]),
    isActive: true,
    availableServices: '["FOOD","FRUITS","LAUNDRY","ESSENTIALS"]',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const fallbackHalls = [
  { id: 'hall_1', name: 'Hall 1', hallNumber: '1', serviceZoneId: 'zone_b', isActive: true, isServiceable: true, deliveryInstructions: 'Security Gate Common Counter', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_2', name: 'Hall 2', hallNumber: '2', serviceZoneId: 'zone_b', isActive: true, isServiceable: true, deliveryInstructions: 'Hostel Gate Reception', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_3', name: 'Hall 3', hallNumber: '3', serviceZoneId: 'zone_b', isActive: true, isServiceable: true, deliveryInstructions: 'Common Room Entrance', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_4', name: 'Hall 4', hallNumber: '4', serviceZoneId: 'zone_b', isActive: true, isServiceable: true, deliveryInstructions: 'Gate 2 Delivery Point', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_5', name: 'Hall 5', hallNumber: '5', serviceZoneId: 'zone_b', isActive: true, isServiceable: true, deliveryInstructions: 'Front Gate Security Desk', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_7', name: 'Hall 7', hallNumber: '7', serviceZoneId: 'zone_b', isActive: true, isServiceable: true, deliveryInstructions: 'Hostel Security Desk', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_8', name: 'Hall 8', hallNumber: '8', serviceZoneId: 'zone_b', isActive: true, isServiceable: true, deliveryInstructions: 'Security Gate Counter', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_9', name: 'Hall 9', hallNumber: '9', serviceZoneId: 'zone_b', isActive: true, isServiceable: true, deliveryInstructions: 'Security Office Ground Floor', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_10', name: 'Hall 10', hallNumber: '10', serviceZoneId: 'zone_b', isActive: true, isServiceable: true, deliveryInstructions: 'Reception Desk', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_11', name: 'Hall 11', hallNumber: '11', serviceZoneId: 'zone_c', isActive: true, isServiceable: true, deliveryInstructions: 'Wing B Security Desk / Lobby', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_12', name: 'Hall 12', hallNumber: '12', serviceZoneId: 'zone_c', isActive: true, isServiceable: true, deliveryInstructions: 'Hostel Front Desk', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_13', name: 'Hall 13', hallNumber: '13', serviceZoneId: 'zone_c', isActive: true, isServiceable: true, deliveryInstructions: 'Security Gate Desk', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_14', name: 'Hall 14', hallNumber: '14', serviceZoneId: 'zone_c', isActive: true, isServiceable: true, deliveryInstructions: 'Ground Floor Lounge', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_mth', name: 'Mother Teresa Hall', hallNumber: 'MTH', serviceZoneId: 'zone_c', isActive: true, isServiceable: true, deliveryInstructions: 'Girls Hostel Security Gate', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_snh', name: 'Sister Nivedita Hall', hallNumber: 'SNH', serviceZoneId: 'zone_c', isActive: true, isServiceable: true, deliveryInstructions: 'Security Window Ground Floor', createdAt: new Date(), updatedAt: new Date() },
  { id: 'hall_gh', name: 'Gargi Hall', hallNumber: 'GH', serviceZoneId: 'zone_c', isActive: true, isServiceable: true, deliveryInstructions: 'Main Gate Verification Point', createdAt: new Date(), updatedAt: new Date() }
];

export const fallbackCategories = [
  {
    id: 'cat_food',
    name: 'Food & Meals',
    slug: 'food',
    description: 'Hot, freshly prepared campus meals, biryani, snacks, and cafeteria specials',
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'cat_fruits',
    name: 'Fresh Fruits',
    slug: 'fruits',
    description: 'Handpicked fresh seasonal fruits delivered directly to your hostel room',
    displayOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'cat_laundry',
    name: 'Express Laundry',
    slug: 'laundry',
    description: 'Doorstep room pickup, automated wash, steam iron, and dual-OTP verified return',
    displayOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'cat_essentials',
    name: 'Stationery & Essentials',
    slug: 'essentials',
    description: 'Calculators, engineering notebooks, pens, print paper, and dorm essentials',
    displayOrder: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const fallbackLaundryServices = [
  { id: 'lnd_srv_1', name: 'Shirt Wash & Steam Iron', unitPrice: 20, unit: 'piece', estimatedHours: 24, category: 'Apparel' },
  { id: 'lnd_srv_2', name: 'T-Shirt Wash & Fold', unitPrice: 15, unit: 'piece', estimatedHours: 24, category: 'Apparel' },
  { id: 'lnd_srv_3', name: 'Formal Pants / Trousers Wash & Iron', unitPrice: 25, unit: 'piece', estimatedHours: 24, category: 'Apparel' },
  { id: 'lnd_srv_4', name: 'Denim Jeans Deep Wash', unitPrice: 30, unit: 'piece', estimatedHours: 36, category: 'Heavy Wear' },
  { id: 'lnd_srv_5', name: 'Single Bedsheet & Pillow Covers', unitPrice: 40, unit: 'set', estimatedHours: 24, category: 'Bedding' },
  { id: 'lnd_srv_6', name: 'Bath Towel Antiseptic Wash', unitPrice: 20, unit: 'piece', estimatedHours: 24, category: 'Linen' },
  { id: 'lnd_srv_7', name: 'Winter Blanket / Comforter Dry Clean', unitPrice: 150, unit: 'piece', estimatedHours: 48, category: 'Winter Wear' },
  { id: 'lnd_srv_8', name: 'Express Steam Iron Only', unitPrice: 10, unit: 'piece', estimatedHours: 12, category: 'Ironing' }
];

export const fallbackProducts = [
  // FOOD & MEALS
  {
    id: 'prod_1',
    name: 'Kolkata Style Chicken Biryani',
    slug: 'kolkata-chicken-biryani',
    categoryId: 'cat_food',
    subcategory: 'Hot Meals & Biryani',
    sku: 'FOOD-BIRYANI-01',
    description: 'Fragrant basmati rice cooked with succulent chicken piece, boiled egg, and golden spiced potato.',
    price: 140,
    discountPrice: 125,
    unit: 'plate',
    stock: 45,
    lowStockThreshold: 10,
    availability: true,
    isFeatured: true,
    deliveryTime: '20-30 mins',
    images: [{ id: 'img_1', googleDriveUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', isPrimary: true }],
    inventory: { currentStock: 45, lowStockThreshold: 10 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_2',
    name: 'Egg Curry with Steamed Basmati Rice',
    slug: 'egg-curry-rice',
    categoryId: 'cat_food',
    subcategory: 'Student Thali & Curries',
    sku: 'FOOD-MEAL-02',
    description: 'Two spiced eggs in home-style tomato-onion gravy served with piping hot steamed rice.',
    price: 80,
    discountPrice: 75,
    unit: 'meal',
    stock: 35,
    lowStockThreshold: 5,
    availability: true,
    isFeatured: false,
    deliveryTime: '15-25 mins',
    images: [{ id: 'img_2', googleDriveUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800', isPrimary: true }],
    inventory: { currentStock: 35, lowStockThreshold: 5 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_3',
    name: 'Paneer Butter Masala Combo',
    slug: 'paneer-butter-masala-combo',
    categoryId: 'cat_food',
    subcategory: 'Student Thali & Curries',
    sku: 'FOOD-PANEER-03',
    description: 'Rich cottage cheese cubes in buttery creamy tomato gravy served with 3 butter rotis and salad.',
    price: 110,
    discountPrice: 99,
    unit: 'combo',
    stock: 25,
    lowStockThreshold: 5,
    availability: true,
    isFeatured: true,
    deliveryTime: '20-30 mins',
    images: [{ id: 'img_3', googleDriveUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800', isPrimary: true }],
    inventory: { currentStock: 25, lowStockThreshold: 5 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_4',
    name: 'Campus Samosa & Masala Chai Combo',
    slug: 'samosa-chai-combo',
    categoryId: 'cat_food',
    subcategory: 'Snacks & Beverages',
    sku: 'FOOD-SNACK-04',
    description: 'Two crisp golden aloo samosas served with tangy chutney and a steaming cup of ginger masala tea.',
    price: 25,
    discountPrice: null,
    unit: 'combo',
    stock: 80,
    lowStockThreshold: 15,
    availability: true,
    isFeatured: false,
    deliveryTime: '10-15 mins',
    images: [{ id: 'img_4', googleDriveUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800', isPrimary: true }],
    inventory: { currentStock: 80, lowStockThreshold: 15 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_9',
    name: 'Kolkata Double Egg Chicken Kathi Roll',
    slug: 'kolkata-chicken-roll',
    categoryId: 'cat_food',
    subcategory: 'Hostel Night Snacks',
    sku: 'FOOD-ROLL-05',
    description: 'Flaky paratha layered with double eggs, spiced marinated chicken chunks, sliced onions, and zesty sauce.',
    price: 80,
    discountPrice: 70,
    unit: 'roll',
    stock: 60,
    lowStockThreshold: 10,
    availability: true,
    isFeatured: true,
    deliveryTime: '15-20 mins',
    images: [{ id: 'img_9', googleDriveUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800', isPrimary: true }],
    inventory: { currentStock: 60, lowStockThreshold: 10 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_10',
    name: 'South Indian Crispy Masala Dosa',
    slug: 'masala-dosa',
    categoryId: 'cat_food',
    subcategory: 'South Indian Specials',
    sku: 'FOOD-DOSA-06',
    description: 'Golden fermented rice crepe filled with spiced potato masala, served with piping hot sambar and fresh chutney.',
    price: 65,
    discountPrice: 55,
    unit: 'plate',
    stock: 40,
    lowStockThreshold: 8,
    availability: true,
    isFeatured: false,
    deliveryTime: '15-25 mins',
    images: [{ id: 'img_10', googleDriveUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800', isPrimary: true }],
    inventory: { currentStock: 40, lowStockThreshold: 8 },
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // FRESH FRUITS
  {
    id: 'prod_5',
    name: 'Kashmiri Crisp Apples',
    slug: 'kashmiri-apples',
    categoryId: 'cat_fruits',
    subcategory: 'Apples & Pears',
    sku: 'FRUIT-APPLE-01',
    description: 'Sweet, crisp, and nutrient-dense fresh Kashmiri red apples.',
    price: 150,
    discountPrice: 135,
    unit: 'kg',
    stock: 30,
    lowStockThreshold: 5,
    availability: true,
    isFeatured: true,
    images: [{ id: 'img_5', googleDriveUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800', isPrimary: true }],
    inventory: { currentStock: 30, lowStockThreshold: 5 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_6',
    name: 'Robusta Ripe Bananas',
    slug: 'robusta-bananas',
    categoryId: 'cat_fruits',
    subcategory: 'Bananas',
    sku: 'FRUIT-BANANA-02',
    description: 'Naturally ripened, potassium-rich fresh bananas.',
    price: 60,
    discountPrice: 50,
    unit: 'dozen',
    stock: 50,
    lowStockThreshold: 10,
    availability: true,
    isFeatured: false,
    images: [{ id: 'img_6', googleDriveUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800', isPrimary: true }],
    inventory: { currentStock: 50, lowStockThreshold: 10 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_11',
    name: 'Nagpur Fresh Sweet Oranges',
    slug: 'nagpur-sweet-oranges',
    categoryId: 'cat_fruits',
    subcategory: 'Citrus',
    sku: 'FRUIT-ORANGE-03',
    description: 'Juicy, vitamin-C rich hand-sorted Nagpur mandarins, bursting with refreshing citrus flavor.',
    price: 90,
    discountPrice: 79,
    unit: 'kg',
    stock: 45,
    lowStockThreshold: 8,
    availability: true,
    isFeatured: true,
    images: [{ id: 'img_11', googleDriveUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800', isPrimary: true }],
    inventory: { currentStock: 45, lowStockThreshold: 8 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_12',
    name: 'Ruby Red Fresh Pomegranate (Anar)',
    slug: 'fresh-pomegranate',
    categoryId: 'cat_fruits',
    subcategory: 'Pomegranates',
    sku: 'FRUIT-POM-04',
    description: 'Antioxidant-loaded ruby red pomegranate pearls, sweet and crunchy for daily hostel nutrition.',
    price: 180,
    discountPrice: 159,
    unit: 'kg',
    stock: 25,
    lowStockThreshold: 5,
    availability: true,
    isFeatured: false,
    images: [{ id: 'img_12', googleDriveUrl: 'https://images.unsplash.com/photo-1541344999736-83eca872f241?w=800', isPrimary: true }],
    inventory: { currentStock: 25, lowStockThreshold: 5 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_13',
    name: 'Green Thompson Seedless Grapes',
    slug: 'green-seedless-grapes',
    categoryId: 'cat_fruits',
    subcategory: 'Grapes',
    sku: 'FRUIT-GRAPE-05',
    description: 'Crisp, sweet, and seedless green table grapes, washed and packed fresh.',
    price: 90,
    discountPrice: 80,
    unit: '500g',
    stock: 4, // Intentionally low stock
    lowStockThreshold: 6,
    availability: true,
    isFeatured: false,
    images: [{ id: 'img_13', googleDriveUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800', isPrimary: true }],
    inventory: { currentStock: 4, lowStockThreshold: 6 },
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // STATIONERY & ESSENTIALS
  {
    id: 'prod_7',
    name: 'Casio fx-991EX Classwiz Scientific Calculator',
    slug: 'casio-fx-991ex-calculator',
    categoryId: 'cat_essentials',
    subcategory: 'Calculators & Tech',
    sku: 'ESS-CASIO-01',
    description: 'High-resolution LCD display, 552 functions, matrix, vector, integration for engineering students.',
    price: 1350,
    discountPrice: 1250,
    unit: 'piece',
    stock: 12,
    lowStockThreshold: 3,
    availability: true,
    isFeatured: true,
    images: [{ id: 'img_7', googleDriveUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800', isPrimary: true }],
    inventory: { currentStock: 12, lowStockThreshold: 3 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_8',
    name: 'Classmate Hardbound Long Exercise Notebook (180 pgs)',
    slug: 'classmate-long-notebook',
    categoryId: 'cat_essentials',
    subcategory: 'Notebooks',
    sku: 'ESS-BOOK-02',
    description: 'Smooth ozone-treated elemental chlorine-free paper, ruled, ideal for engineering lectures.',
    price: 70,
    discountPrice: 60,
    unit: 'book',
    stock: 100,
    lowStockThreshold: 20,
    availability: true,
    isFeatured: false,
    images: [{ id: 'img_8', googleDriveUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800', isPrimary: true }],
    inventory: { currentStock: 100, lowStockThreshold: 20 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_14',
    name: 'Engineering Drawing Instrument Box & Mini Drafter',
    slug: 'engineering-mini-drafter',
    categoryId: 'cat_essentials',
    subcategory: 'Engineering Kits',
    sku: 'ESS-DRAFT-03',
    description: 'Heavy-duty steel mini-drafter with compass set and scale protractor for 1st & 2nd year graphics.',
    price: 450,
    discountPrice: 399,
    unit: 'set',
    stock: 2, // Low stock
    lowStockThreshold: 5,
    availability: true,
    isFeatured: true,
    images: [{ id: 'img_14', googleDriveUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800', isPrimary: true }],
    inventory: { currentStock: 2, lowStockThreshold: 5 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_15',
    name: 'JK Cedar A4 Lab Report Copier Paper (500 Sheets)',
    slug: 'jk-copier-a4-paper',
    categoryId: 'cat_essentials',
    subcategory: 'Printing Paper',
    sku: 'ESS-PAPER-04',
    description: '75 GSM bright white A4 sheets for seminar reports, laboratory submissions, and laser printing.',
    price: 290,
    discountPrice: 260,
    unit: 'ream',
    stock: 60,
    lowStockThreshold: 10,
    availability: true,
    isFeatured: false,
    images: [{ id: 'img_15', googleDriveUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800', isPrimary: true }],
    inventory: { currentStock: 60, lowStockThreshold: 10 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_16',
    name: 'Pilot V5 Hi-Techpoint Liquid Ink Rollerball Pen (Pack of 3)',
    slug: 'pilot-v5-pen-pack',
    categoryId: 'cat_essentials',
    subcategory: 'Pens & Markers',
    sku: 'ESS-PEN-05',
    description: 'Pure liquid ink with dimple rollerball tip for smooth engineering problem-solving.',
    price: 180,
    discountPrice: 160,
    unit: 'pack',
    stock: 75,
    lowStockThreshold: 15,
    availability: true,
    isFeatured: false,
    images: [{ id: 'img_16', googleDriveUrl: 'https://images.unsplash.com/photo-1585336261026-7f516d004e0e?w=800', isPrimary: true }],
    inventory: { currentStock: 75, lowStockThreshold: 15 },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const fallbackUsers = [
  // Primary Admin
  {
    id: 'user_admin_sourav',
    email: 'souravsenapati408@gmail.com',
    passwordHash: HASH_SOURAV,
    role: 'ADMIN' as const,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date(),
    admin: {
      id: 'admin_sourav',
      userId: 'user_admin_sourav',
      fullName: 'Sourav Senapati',
      permissions: 'ALL',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date()
    },
    student: null,
    provider: null
  },
  // Secondary Admin
  {
    id: 'user_admin_nitdgp',
    email: 'admin@nitdgp.ac.in',
    passwordHash: HASH_SOURAV,
    role: 'ADMIN' as const,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date(),
    admin: {
      id: 'admin_nitdgp',
      userId: 'user_admin_nitdgp',
      fullName: 'Campus Operations Administrator',
      permissions: 'ALL',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date()
    },
    student: null,
    provider: null
  },
  // Service Provider 1 (Stationery & Essentials)
  {
    id: 'user_prov_general',
    username: 'SP_ESSNT_01',
    email: 'vendor@nitdgp.ac.in',
    personalEmail: 'vendor@gmail.com',
    passwordHash: HASH_VENDOR,
    role: 'SERVICE_PROVIDER' as const,
    isActive: true,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date(),
    admin: null,
    student: null,
    deliveryBoy: null,
    provider: {
      id: 'prov_general',
      userId: 'user_prov_general',
      fullName: 'Campus Services Dispatch & Essentials Cell',
      mobileNumber: '9876543200',
      serviceCategory: 'Stationery & Essentials',
      assignedZones: 'ALL',
      activeStatus: true,
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date()
    }
  },
  // Service Provider 2 (Laundry)
  {
    id: 'user_prov_laundry',
    username: 'SP_LAUND_01',
    email: 'laundry.vendor@nitdgp.ac.in',
    personalEmail: 'laundry.vendor@gmail.com',
    passwordHash: HASH_VENDOR,
    role: 'SERVICE_PROVIDER' as const,
    isActive: true,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date(),
    admin: null,
    student: null,
    deliveryBoy: null,
    provider: {
      id: 'prov_laundry',
      userId: 'user_prov_laundry',
      fullName: 'NIT Durgapur Campus Laundry Cell',
      mobileNumber: '9876543210',
      serviceCategory: 'Express Laundry',
      assignedZones: 'ALL',
      activeStatus: true,
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date()
    }
  },
  // Service Provider 3 (Food & Meals - Canteen)
  {
    id: 'user_prov_canteen',
    username: 'SP_FOOD_01',
    email: 'canteen.vendor@nitdgp.ac.in',
    personalEmail: 'canteen.vendor@gmail.com',
    passwordHash: HASH_VENDOR,
    role: 'SERVICE_PROVIDER' as const,
    isActive: true,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date(),
    admin: null,
    student: null,
    deliveryBoy: null,
    provider: {
      id: 'prov_canteen',
      userId: 'user_prov_canteen',
      fullName: 'Campus Food & Cafeteria Vendor',
      mobileNumber: '9876543211',
      serviceCategory: 'Food & Meals',
      assignedZones: 'ALL',
      activeStatus: true,
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date()
    }
  },
  // Service Provider 4 (Fresh Fruits)
  {
    id: 'user_prov_fruits',
    username: 'SP_FRUIT_01',
    email: 'fruits.vendor@nitdgp.ac.in',
    personalEmail: 'fruits.vendor@gmail.com',
    passwordHash: HASH_VENDOR,
    role: 'SERVICE_PROVIDER' as const,
    isActive: true,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date(),
    admin: null,
    student: null,
    deliveryBoy: null,
    provider: {
      id: 'prov_fruits',
      userId: 'user_prov_fruits',
      fullName: 'Green Basket Campus Fresh Fruits',
      mobileNumber: '9876543212',
      serviceCategory: 'Fresh Fruits',
      assignedZones: 'ALL',
      activeStatus: true,
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date()
    }
  },
  // Delivery Boy 1 (Lead Runner)
  {
    id: 'user_db_boy_1',
    username: 'DB_BOY_01',
    email: 'runner.delivery@gmail.com',
    personalEmail: 'runner.delivery@gmail.com',
    passwordHash: HASH_DELIVERY,
    role: 'DELIVERY_BOY' as const,
    isActive: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date(),
    admin: null,
    student: null,
    provider: null,
    deliveryBoy: {
      id: 'db_boy_1',
      userId: 'user_db_boy_1',
      fullName: 'Bikash Mondal (Lead Runner)',
      mobileNumber: '9876543220',
      vehicleType: 'Bicycle / Walk',
      activeStatus: true,
      currentZone: 'ALL',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date()
    }
  },
  // Delivery Boy 2 (Express Runner)
  {
    id: 'user_db_boy_2',
    username: 'DB_BOY_02',
    email: 'campus.runner2@gmail.com',
    personalEmail: 'campus.runner2@gmail.com',
    passwordHash: HASH_DELIVERY,
    role: 'DELIVERY_BOY' as const,
    isActive: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date(),
    admin: null,
    student: null,
    provider: null,
    deliveryBoy: {
      id: 'db_boy_2',
      userId: 'user_db_boy_2',
      fullName: 'Rajesh Kumar (Express Runner)',
      mobileNumber: '9876543221',
      vehicleType: 'Electric Scooter',
      activeStatus: true,
      currentZone: 'ALL',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date()
    }
  },
  // Primary Test Student
  {
    id: 'user_student_sourav',
    email: 'ss.24u10227@nitdgp.ac.in',
    passwordHash: HASH_STUDENT,
    role: 'STUDENT' as const,
    isActive: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date(),
    admin: null,
    provider: null,
    student: {
      id: 'stud_sourav',
      userId: 'user_student_sourav',
      fullName: 'Sourav Senapati',
      rollNumber: '24U10227',
      registrationNumber: '202410227',
      mobileNumber: '9876501234',
      hallId: 'hall_11',
      hallNumber: '11',
      roomNumber: 'B-304',
      isVerified: true,
      hall: { id: 'hall_11', name: 'Hall 11', hallNumber: '11' },
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date()
    }
  },
  // Additional Students for Directory
  {
    id: 'user_student_rohit',
    email: 'rohit.23cs@nitdgp.ac.in',
    passwordHash: HASH_STUDENT,
    role: 'STUDENT' as const,
    isActive: true,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date(),
    admin: null,
    provider: null,
    student: {
      id: 'stud_rohit',
      userId: 'user_student_rohit',
      fullName: 'Rohit Sharma',
      rollNumber: '23CS8012',
      registrationNumber: '202310812',
      mobileNumber: '9876505678',
      hallId: 'hall_2',
      hallNumber: '2',
      roomNumber: 'A-102',
      isVerified: true,
      hall: { id: 'hall_2', name: 'Hall 2', hallNumber: '2' },
      createdAt: new Date('2026-02-01'),
      updatedAt: new Date()
    }
  },
  {
    id: 'user_student_priya',
    email: 'priya.24ec@nitdgp.ac.in',
    passwordHash: HASH_STUDENT,
    role: 'STUDENT' as const,
    isActive: true,
    createdAt: new Date('2026-02-05'),
    updatedAt: new Date(),
    admin: null,
    provider: null,
    student: {
      id: 'stud_priya',
      userId: 'user_student_priya',
      fullName: 'Priya Mukherjee',
      rollNumber: '24EC8045',
      registrationNumber: '202410945',
      mobileNumber: '9876509012',
      hallId: 'hall_mth',
      hallNumber: 'MTH',
      roomNumber: 'C-215',
      isVerified: true,
      hall: { id: 'hall_mth', name: 'Mother Teresa Hall', hallNumber: 'MTH' },
      createdAt: new Date('2026-02-05'),
      updatedAt: new Date()
    }
  },
  {
    id: 'user_student_arun',
    email: 'arun.22me@nitdgp.ac.in',
    passwordHash: HASH_STUDENT,
    role: 'STUDENT' as const,
    isActive: true,
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date(),
    admin: null,
    provider: null,
    student: {
      id: 'stud_arun',
      userId: 'user_student_arun',
      fullName: 'Arunav Roy',
      rollNumber: '22ME8003',
      registrationNumber: '202210803',
      mobileNumber: '9876503456',
      hallId: 'hall_5',
      hallNumber: '5',
      roomNumber: 'B-201',
      isVerified: true,
      hall: { id: 'hall_5', name: 'Hall 5', hallNumber: '5' },
      createdAt: new Date('2026-01-20'),
      updatedAt: new Date()
    }
  }
];

// Helper to generate dates over the past 30 days
const pastDays = (daysAgo: number, hoursOffset: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursOffset);
  return d;
};

export const fallbackOrders = [
  {
    id: 'ord_101',
    orderNumber: 'NIT-ORD-9021',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 265,
    subtotal: 250,
    deliveryFee: 15,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(0, 2),
    updatedAt: pastDays(0, 1),
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_1', productName: 'Kolkata Style Chicken Biryani', quantity: 1, unitPrice: 140, totalPrice: 140 },
      { id: 'it_2', productName: 'Paneer Butter Masala Combo', quantity: 1, unitPrice: 110, totalPrice: 110 }
    ]
  },
  {
    id: 'ord_102',
    orderNumber: 'NIT-ORD-9022',
    studentId: 'stud_rohit',
    providerId: 'prov_general',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    totalAmount: 1350,
    subtotal: 1350,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'CONFIRMED',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'PENDING',
    createdAt: pastDays(0, 4),
    updatedAt: pastDays(0, 3),
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'it_3', productName: 'Casio fx-991EX Classwiz Scientific Calculator', quantity: 1, unitPrice: 1350, totalPrice: 1350 }
    ]
  },
  {
    id: 'ord_103',
    orderNumber: 'NIT-ORD-9023',
    studentId: 'stud_priya',
    providerId: 'prov_canteen',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    totalAmount: 195,
    subtotal: 180,
    deliveryFee: 15,
    discountAmount: 0,
    status: 'OUT_FOR_DELIVERY',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(0, 6),
    updatedAt: pastDays(0, 5),
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'it_4', productName: 'Kashmiri Crisp Apples', quantity: 1, unitPrice: 150, totalPrice: 150 },
      { id: 'it_5', productName: 'Campus Samosa & Masala Chai Combo', quantity: 1, unitPrice: 25, totalPrice: 25 }
    ]
  },
  {
    id: 'ord_104',
    orderNumber: 'NIT-ORD-9024',
    studentId: 'stud_arun',
    providerId: 'prov_general',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    totalAmount: 414,
    subtotal: 399,
    deliveryFee: 15,
    discountAmount: 0,
    status: 'PREPARING',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(1, 3),
    updatedAt: pastDays(1, 2),
    student: { fullName: 'Arunav Roy', rollNumber: '22ME8003', email: 'arun.22me@nitdgp.ac.in', mobileNumber: '9876503456', hallName: 'Hall 5', roomNumber: 'B-201' },
    items: [
      { id: 'it_6', productName: 'Engineering Drawing Instrument Box & Mini Drafter', quantity: 1, unitPrice: 399, totalPrice: 399 }
    ]
  },
  {
    id: 'ord_105',
    orderNumber: 'NIT-ORD-9025',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 85,
    subtotal: 70,
    deliveryFee: 15,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(2, 5),
    updatedAt: pastDays(2, 4),
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_7', productName: 'Kolkata Double Egg Chicken Kathi Roll', quantity: 1, unitPrice: 70, totalPrice: 70 }
    ]
  },
  {
    id: 'ord_106',
    orderNumber: 'NIT-ORD-9026',
    studentId: 'stud_rohit',
    providerId: 'prov_general',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    totalAmount: 320,
    subtotal: 320,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(3, 8),
    updatedAt: pastDays(3, 7),
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'it_8', productName: 'JK Cedar A4 Lab Report Copier Paper (500 Sheets)', quantity: 1, unitPrice: 260, totalPrice: 260 },
      { id: 'it_9', productName: 'Classmate Hardbound Long Exercise Notebook (180 pgs)', quantity: 1, unitPrice: 60, totalPrice: 60 }
    ]
  },
  {
    id: 'ord_107',
    orderNumber: 'NIT-ORD-9027',
    studentId: 'stud_priya',
    providerId: 'prov_canteen',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    totalAmount: 140,
    subtotal: 125,
    deliveryFee: 15,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(4, 10),
    updatedAt: pastDays(4, 9),
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'it_10', productName: 'Kolkata Style Chicken Biryani', quantity: 1, unitPrice: 125, totalPrice: 125 }
    ]
  },
  {
    id: 'ord_108',
    orderNumber: 'NIT-ORD-9028',
    studentId: 'stud_arun',
    providerId: 'prov_canteen',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    totalAmount: 180,
    subtotal: 165,
    deliveryFee: 15,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(6, 12),
    updatedAt: pastDays(6, 11),
    student: { fullName: 'Arunav Roy', rollNumber: '22ME8003', email: 'arun.22me@nitdgp.ac.in', mobileNumber: '9876503456', hallName: 'Hall 5', roomNumber: 'B-201' },
    items: [
      { id: 'it_11', productName: 'South Indian Crispy Masala Dosa', quantity: 3, unitPrice: 55, totalPrice: 165 }
    ]
  },
  {
    id: 'ord_109',
    orderNumber: 'NIT-ORD-9029',
    studentId: 'stud_sourav',
    providerId: 'prov_general',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 175,
    subtotal: 160,
    deliveryFee: 15,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(8, 4),
    updatedAt: pastDays(8, 3),
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_12', productName: 'Pilot V5 Hi-Techpoint Liquid Ink Rollerball Pen (Pack of 3)', quantity: 1, unitPrice: 160, totalPrice: 160 }
    ]
  },
  {
    id: 'ord_110',
    orderNumber: 'NIT-ORD-9030',
    studentId: 'stud_rohit',
    providerId: 'prov_canteen',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    totalAmount: 238,
    subtotal: 238,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(12, 6),
    updatedAt: pastDays(12, 5),
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'it_13', productName: 'Ruby Red Fresh Pomegranate (Anar)', quantity: 1, unitPrice: 159, totalPrice: 159 },
      { id: 'it_14', productName: 'Nagpur Fresh Sweet Oranges', quantity: 1, unitPrice: 79, totalPrice: 79 }
    ]
  },
  {
    id: 'ord_111',
    orderNumber: 'NIT-ORD-9031',
    studentId: 'stud_priya',
    providerId: 'prov_canteen',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    totalAmount: 140,
    subtotal: 125,
    deliveryFee: 15,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(16, 7),
    updatedAt: pastDays(16, 6),
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'it_15', productName: 'Kolkata Style Chicken Biryani', quantity: 1, unitPrice: 125, totalPrice: 125 }
    ]
  },
  {
    id: 'ord_112',
    orderNumber: 'NIT-ORD-9032',
    studentId: 'stud_arun',
    providerId: 'prov_canteen',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    totalAmount: 90,
    subtotal: 75,
    deliveryFee: 15,
    discountAmount: 0,
    status: 'CANCELLED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'REFUNDED',
    createdAt: pastDays(20, 9),
    updatedAt: pastDays(20, 8),
    student: { fullName: 'Arunav Roy', rollNumber: '22ME8003', email: 'arun.22me@nitdgp.ac.in', mobileNumber: '9876503456', hallName: 'Hall 5', roomNumber: 'B-201' },
    items: [
      { id: 'it_16', productName: 'Egg Curry with Steamed Basmati Rice', quantity: 1, unitPrice: 75, totalPrice: 75 }
    ]
  },
  {
    id: 'ord_113',
    orderNumber: 'NIT-ORD-9033',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 140,
    subtotal: 125,
    deliveryFee: 15,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(25, 4),
    updatedAt: pastDays(25, 3),
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_17', productName: 'Kolkata Style Chicken Biryani', quantity: 1, unitPrice: 125, totalPrice: 125 }
    ]
  }
];

export const fallbackLaundryJobs = [
  {
    id: 'laundry_job_1',
    orderNumber: 'NIT-LND-501',
    studentId: 'stud_sourav',
    providerId: 'prov_laundry',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    serviceType: 'Wash & Steam Iron',
    totalClothesCount: 6,
    estimatedPrice: 120,
    finalPrice: 120,
    status: 'IN_LAUNDRY',
    pickupOtpStatus: 'VERIFIED',
    deliveryOtpStatus: 'PENDING',
    pickupDate: pastDays(1),
    preferredPickupTime: '18:00 - 20:00',
    preferredReturnTime: '20:00 - 21:00',
    createdAt: pastDays(1, 4),
    updatedAt: pastDays(0, 2),
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'li_1', itemType: 'Shirt Wash & Steam Iron', quantity: 3, unitPrice: 20 },
      { id: 'li_2', itemType: 'Denim Jeans Deep Wash', quantity: 2, unitPrice: 30 }
    ]
  },
  {
    id: 'laundry_job_2',
    orderNumber: 'NIT-LND-502',
    studentId: 'stud_rohit',
    providerId: 'prov_laundry',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    serviceType: 'Express Steam Iron',
    totalClothesCount: 4,
    estimatedPrice: 40,
    finalPrice: 40,
    status: 'REQUESTED',
    pickupOtpStatus: 'PENDING',
    deliveryOtpStatus: 'PENDING',
    pickupDate: pastDays(0),
    preferredPickupTime: '19:00 - 21:00',
    preferredReturnTime: '12:00 - 14:00',
    createdAt: pastDays(0, 2),
    updatedAt: pastDays(0, 1),
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'li_3', itemType: 'Express Steam Iron Only', quantity: 4, unitPrice: 10 }
    ]
  },
  {
    id: 'laundry_job_3',
    orderNumber: 'NIT-LND-503',
    studentId: 'stud_priya',
    providerId: 'prov_laundry',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    serviceType: 'Linen & Bedding Care',
    totalClothesCount: 2,
    estimatedPrice: 80,
    finalPrice: 80,
    status: 'COMPLETED',
    pickupOtpStatus: 'VERIFIED',
    deliveryOtpStatus: 'VERIFIED',
    pickupDate: pastDays(3),
    preferredPickupTime: '17:00 - 19:00',
    preferredReturnTime: '18:00 - 20:00',
    createdAt: pastDays(3, 6),
    updatedAt: pastDays(2, 2),
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'li_4', itemType: 'Single Bedsheet & Pillow Covers', quantity: 2, unitPrice: 40 }
    ]
  },
  {
    id: 'laundry_job_4',
    orderNumber: 'NIT-LND-504',
    studentId: 'stud_arun',
    providerId: 'prov_laundry',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    serviceType: 'Winter Comforter Wash',
    totalClothesCount: 1,
    estimatedPrice: 150,
    finalPrice: 150,
    status: 'WASHING',
    pickupOtpStatus: 'VERIFIED',
    deliveryOtpStatus: 'PENDING',
    pickupDate: pastDays(2),
    preferredPickupTime: '18:00 - 20:00',
    preferredReturnTime: '20:00 - 21:00',
    createdAt: pastDays(2, 5),
    updatedAt: pastDays(1, 2),
    student: { fullName: 'Arunav Roy', rollNumber: '22ME8003', email: 'arun.22me@nitdgp.ac.in', mobileNumber: '9876503456', hallName: 'Hall 5', roomNumber: 'B-201' },
    items: [
      { id: 'li_5', itemType: 'Winter Blanket / Comforter Dry Clean', quantity: 1, unitPrice: 150 }
    ]
  }
];

export const fallbackCoupons = [
  { id: 'cp_1', code: 'NITFRESH', description: 'Welcome coupon for NIT students - 20% off up to ₹50', discountType: 'PERCENTAGE', discountValue: 20, minOrderAmount: 100, maxDiscountAmount: 50, perUserLimit: 2, isActive: true, createdAt: new Date() },
  { id: 'cp_2', code: 'EXAM2026', description: 'Semester Exam Special - Flat ₹30 off on late-night orders', discountType: 'FIXED', discountValue: 30, minOrderAmount: 150, maxDiscountAmount: null, perUserLimit: 3, isActive: true, createdAt: new Date() },
  { id: 'cp_3', code: 'CAMPUSHERO', description: 'Hostel rep exclusive - 15% off all orders above ₹200', discountType: 'PERCENTAGE', discountValue: 15, minOrderAmount: 200, maxDiscountAmount: 100, perUserLimit: 5, isActive: true, createdAt: new Date() }
];

export const fallbackAnnouncements = [
  {
    id: 'ann_1',
    title: 'Express Doorstep Delivery Active Across All 14 Halls',
    message: 'Food, fresh fruits, academic stationery, and dual-OTP laundry service are fully functional with live geofence verification.',
    targetService: 'ALL',
    targetZone: 'ALL',
    isActive: true,
    createdAt: pastDays(2)
  },
  {
    id: 'ann_2',
    title: 'Extended Cafeteria Hours during Mid-Term Evaluations',
    message: 'Hostel night canteen is serving hot biryani and snacks until 02:30 AM every night during exam week.',
    targetService: 'FOOD',
    targetZone: 'ALL',
    isActive: true,
    createdAt: pastDays(1)
  }
];

export const fallbackSupportTickets = [
  {
    id: 'tkt_1',
    ticketNumber: 'TKT-2026-0081',
    studentId: 'stud_rohit',
    category: 'PAYMENT',
    message: 'UPI payment succeeded on phone, but order screen refreshed and showed pending for 2 minutes.',
    priority: 'HIGH',
    status: 'RESOLVED',
    adminResponse: 'Payment webhook synchronized and verified by campus accounting. Order marked confirmed.',
    createdAt: pastDays(1),
    updatedAt: pastDays(0)
  },
  {
    id: 'tkt_2',
    ticketNumber: 'TKT-2026-0082',
    studentId: 'stud_priya',
    category: 'LAUNDRY',
    message: 'Wanted to reschedule pickup slot for Friday 6 PM due to lab class schedule.',
    priority: 'MEDIUM',
    status: 'OPEN',
    adminResponse: null,
    createdAt: pastDays(0, 3),
    updatedAt: pastDays(0, 3)
  },
  {
    id: 'tkt_3',
    ticketNumber: 'TKT-2026-0083',
    studentId: 'stud_arun',
    category: 'DELIVERY',
    message: 'Delivery runner waited at Hall 5 Gate 2 instead of common lobby desk.',
    priority: 'LOW',
    status: 'IN_PROGRESS',
    adminResponse: 'Runner briefed on Hall 5 lobby protocols.',
    createdAt: pastDays(0, 6),
    updatedAt: pastDays(0, 1)
  }
];

export const fallbackAuditLogs = [
  {
    id: 'log_1',
    userId: 'user_admin_sourav',
    action: 'PRODUCT_PRICE_UPDATED',
    entity: 'Product',
    entityId: 'prod_1',
    oldValue: JSON.stringify({ name: 'Kolkata Style Chicken Biryani', price: 135 }),
    newValue: JSON.stringify({ name: 'Kolkata Style Chicken Biryani', price: 140 }),
    createdAt: pastDays(1, 2)
  },
  {
    id: 'log_2',
    userId: 'user_admin_sourav',
    action: 'INVENTORY_RESTOCKED',
    entity: 'Inventory',
    entityId: 'prod_7',
    oldValue: JSON.stringify({ stock: 2 }),
    newValue: JSON.stringify({ stock: 12 }),
    createdAt: pastDays(2, 5)
  },
  {
    id: 'log_3',
    userId: 'user_admin_sourav',
    action: 'COUPON_CREATED',
    entity: 'Coupon',
    entityId: 'cp_2',
    oldValue: null,
    newValue: JSON.stringify({ code: 'EXAM2026', discountValue: 30 }),
    createdAt: pastDays(3, 8)
  }
];

export const fallbackSettings = [
  { id: 'set_1', key: 'APP_NAME', value: 'NIT Durgapur Campus Services', description: 'Institutional portal title' },
  { id: 'set_2', key: 'ENABLE_CASH_ON_DELIVERY', value: 'true', description: 'Allow COD for hostel room drop' },
  { id: 'set_3', key: 'MAX_COD_AMOUNT', value: '1500', description: 'Maximum INR ceiling for Cash on Delivery' },
  { id: 'set_4', key: 'DELIVERY_FEE_FLAT', value: '15', description: 'Flat room delivery fee' },
  { id: 'set_5', key: 'FREE_DELIVERY_THRESHOLD', value: '250', description: 'Cart threshold for free delivery' },
  { id: 'set_6', key: 'MAINTENANCE_MODE', value: 'false', description: 'Emergency campus maintenance toggle' },
  { id: 'set_7', key: 'SUPPORT_EMAIL', value: 'services@nitdgp.ac.in', description: 'Support email address' },
  { id: 'set_8', key: 'SUPPORT_PHONE', value: '+91 343 275 4000', description: 'Direct campus helpline' },
  { id: 'set_9', key: 'HOURS_FOOD', value: JSON.stringify({ open: '08:00', close: '23:30', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], isOpen: true, notice: 'Normal operation' }), description: 'Food & Meals Operating Timings' },
  { id: 'set_10', key: 'HOURS_FRUITS', value: JSON.stringify({ open: '07:00', close: '21:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], isOpen: true, notice: 'Fresh morning & evening batches' }), description: 'Fresh Fruits Operating Timings' },
  { id: 'set_11', key: 'HOURS_LAUNDRY', value: JSON.stringify({ open: '09:00', close: '19:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], isOpen: true, notice: 'Sunday batch maintenance' }), description: 'Express Laundry Operating Timings' },
  { id: 'set_12', key: 'HOURS_ESSENTIALS', value: JSON.stringify({ open: '09:00', close: '22:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], isOpen: true, notice: 'Stationery & personal care' }), description: 'Stationery & Essentials Timings' }
];

export const fallbackReportHistory = [
  {
    id: 'rep_1',
    reportTitle: 'Food & Meals Performance Audit',
    reportType: 'Food & Meals',
    dateRangeText: 'Last 30 Days',
    generatedBy: 'souravsenapati408@gmail.com',
    generatedAt: pastDays(1, 10),
    fileSize: '142 KB'
  },
  {
    id: 'rep_2',
    reportTitle: 'Comprehensive Campus Operations Summary',
    reportType: 'Overall',
    dateRangeText: 'This Month',
    generatedBy: 'souravsenapati408@gmail.com',
    generatedAt: pastDays(0, 5),
    fileSize: '198 KB'
  }
];

export const fallbackOtpStore: Array<{
  id: string;
  email: string;
  otpHash: string;
  purpose: string;
  isVerified: boolean;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}> = [];
