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
    name: 'Fresh Produce',
    slug: 'fruits',
    description: 'Handpicked fresh seasonal fruits and produce delivered directly to your hostel room',
    displayOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'cat_stationery',
    name: 'Stationery',
    slug: 'stationery',
    description: 'Calculators, engineering notebooks, pens, drawing instruments, and print paper',
    displayOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'cat_essentials',
    name: 'Hostel Essentials',
    slug: 'essentials',
    description: 'Personal care, cleaning kits, detergents, and daily hostel room essentials',
    displayOrder: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'cat_laundry',
    name: 'Express Laundry',
    slug: 'laundry',
    description: 'Doorstep room pickup, automated wash, steam iron, and dual-OTP verified return',
    displayOrder: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'cat_other',
    name: 'Other',
    slug: 'other',
    description: 'Miscellaneous student campus supplies and utility services',
    displayOrder: 6,
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
    providerId: 'prov_canteen',
    name: 'Kolkata Style Chicken Biryani',
    slug: 'kolkata-chicken-biryani',
    categoryId: 'cat_food',
    subcategory: 'Meals',
    dietaryType: 'Non-Veg',
    isPopular: true,
    sku: 'FOOD-BIRYANI-01',
    description: 'Fragrant basmati rice cooked with succulent chicken piece, boiled egg, and golden spiced potato.',
    price: 140,
    discountPrice: 125,
    discountPercentage: 11,
    tags: 'biryani, chicken, meals, nonveg, spicy, popular',
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
    providerId: 'prov_canteen',
    name: 'Egg Curry with Steamed Basmati Rice',
    slug: 'egg-curry-rice',
    categoryId: 'cat_food',
    subcategory: 'Meals',
    dietaryType: 'Non-Veg',
    isPopular: false,
    sku: 'FOOD-MEAL-02',
    description: 'Two spiced eggs in home-style tomato-onion gravy served with piping hot steamed rice.',
    price: 80,
    discountPrice: 75,
    discountPercentage: 6,
    tags: 'egg curry, rice, meals, nonveg',
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
    providerId: 'prov_canteen',
    name: 'Paneer Butter Masala Combo',
    slug: 'paneer-butter-masala-combo',
    categoryId: 'cat_food',
    subcategory: 'Meals',
    dietaryType: 'Pure Veg',
    isPopular: true,
    sku: 'FOOD-PANEER-03',
    description: 'Rich cottage cheese cubes in buttery creamy tomato gravy served with 3 butter rotis and salad.',
    price: 110,
    discountPrice: 99,
    discountPercentage: 10,
    tags: 'paneer, butter masala, veg, pure veg, meal, roti, popular',
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
    providerId: 'prov_canteen',
    name: 'Campus Samosa & Masala Chai Combo',
    slug: 'samosa-chai-combo',
    categoryId: 'cat_food',
    subcategory: 'Snacks',
    dietaryType: 'Pure Veg',
    isPopular: true,
    sku: 'FOOD-SNACK-04',
    description: 'Two crisp golden aloo samosas served with tangy chutney and a steaming cup of ginger masala tea.',
    price: 25,
    discountPrice: null,
    discountPercentage: 0,
    tags: 'samosa, chai, tea, snacks, veg, pure veg, popular',
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
    providerId: 'prov_canteen',
    name: 'Kolkata Double Egg Chicken Kathi Roll',
    slug: 'kolkata-chicken-roll',
    categoryId: 'cat_food',
    subcategory: 'Snacks',
    dietaryType: 'Non-Veg',
    isPopular: true,
    sku: 'FOOD-ROLL-05',
    description: 'Flaky paratha layered with double eggs, spiced marinated chicken chunks, sliced onions, and zesty sauce.',
    price: 80,
    discountPrice: 70,
    discountPercentage: 13,
    tags: 'roll, chicken roll, egg, snacks, nonveg, fastfood, popular',
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
    providerId: 'prov_canteen',
    name: 'South Indian Crispy Masala Dosa',
    slug: 'masala-dosa',
    categoryId: 'cat_food',
    subcategory: 'Meals',
    dietaryType: 'Pure Veg',
    isPopular: false,
    sku: 'FOOD-DOSA-06',
    description: 'Golden fermented rice crepe filled with spiced potato masala, served with piping hot sambar and fresh chutney.',
    price: 65,
    discountPrice: 55,
    discountPercentage: 15,
    tags: 'dosa, south indian, masala dosa, veg, pure veg',
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

  // FRESH PRODUCE
  {
    id: 'prod_5',
    providerId: 'prov_fruits',
    name: 'Kashmiri Crisp Apples',
    slug: 'kashmiri-apples',
    categoryId: 'cat_fruits',
    subcategory: 'Fruits',
    dietaryType: 'Not Applicable',
    isPopular: true,
    sku: 'FRUIT-APPLE-01',
    description: 'Sweet, crisp, and nutrient-dense fresh Kashmiri red apples.',
    price: 150,
    discountPrice: 135,
    discountPercentage: 10,
    tags: 'apples, fruit, kashmiri, fresh produce, healthy, popular',
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
    providerId: 'prov_fruits',
    name: 'Robusta Ripe Bananas',
    slug: 'robusta-bananas',
    categoryId: 'cat_fruits',
    subcategory: 'Fruits',
    dietaryType: 'Not Applicable',
    isPopular: true,
    sku: 'FRUIT-BANANA-02',
    description: 'Naturally ripened, potassium-rich fresh bananas.',
    price: 60,
    discountPrice: 50,
    discountPercentage: 17,
    tags: 'bananas, fruit, fresh produce, healthy, popular',
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
    providerId: 'prov_fruits',
    name: 'Nagpur Fresh Sweet Oranges',
    slug: 'nagpur-sweet-oranges',
    categoryId: 'cat_fruits',
    subcategory: 'Fruits',
    dietaryType: 'Not Applicable',
    isPopular: false,
    sku: 'FRUIT-ORANGE-03',
    description: 'Juicy, vitamin-C rich hand-sorted Nagpur mandarins, bursting with refreshing citrus flavor.',
    price: 90,
    discountPrice: 79,
    discountPercentage: 12,
    tags: 'orange, fruit, citrus, fresh produce',
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
    providerId: 'prov_fruits',
    name: 'Ruby Red Fresh Pomegranate (Anar)',
    slug: 'fresh-pomegranate',
    categoryId: 'cat_fruits',
    subcategory: 'Fruits',
    dietaryType: 'Not Applicable',
    isPopular: false,
    sku: 'FRUIT-POM-04',
    description: 'Antioxidant-loaded ruby red pomegranate pearls, sweet and crunchy for daily hostel nutrition.',
    price: 180,
    discountPrice: 159,
    discountPercentage: 12,
    tags: 'pomegranate, anar, fruit, fresh produce',
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
    providerId: 'prov_fruits',
    name: 'Green Thompson Seedless Grapes',
    slug: 'green-seedless-grapes',
    categoryId: 'cat_fruits',
    subcategory: 'Fruits',
    dietaryType: 'Not Applicable',
    isPopular: false,
    sku: 'FRUIT-GRAPE-05',
    description: 'Crisp, sweet, and seedless green table grapes, washed and packed fresh.',
    price: 90,
    discountPrice: 80,
    discountPercentage: 11,
    tags: 'grapes, fruit, fresh produce',
    unit: '500g',
    stock: 4,
    lowStockThreshold: 6,
    availability: true,
    isFeatured: false,
    images: [{ id: 'img_13', googleDriveUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800', isPrimary: true }],
    inventory: { currentStock: 4, lowStockThreshold: 6 },
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // STATIONERY
  {
    id: 'prod_7',
    providerId: 'prov_general',
    name: 'Casio fx-991EX Classwiz Scientific Calculator',
    slug: 'casio-fx-991ex-calculator',
    categoryId: 'cat_stationery',
    subcategory: 'Calculators',
    dietaryType: 'Not Applicable',
    isPopular: true,
    sku: 'ESS-CASIO-01',
    description: 'High-resolution LCD display, 552 functions, matrix, vector, integration for engineering students.',
    price: 1350,
    discountPrice: 1250,
    discountPercentage: 7,
    tags: 'casio, calculator, scientific, engineering, exam, stationery, popular',
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
    providerId: 'prov_general',
    name: 'Classmate Hardbound Long Exercise Notebook (180 pgs)',
    slug: 'classmate-long-notebook',
    categoryId: 'cat_stationery',
    subcategory: 'Notebooks',
    dietaryType: 'Not Applicable',
    isPopular: true,
    sku: 'ESS-BOOK-02',
    description: 'Smooth ozone-treated elemental chlorine-free paper, ruled, ideal for engineering lectures.',
    price: 70,
    discountPrice: 60,
    discountPercentage: 14,
    tags: 'classmate, notebook, long book, stationery, study, popular',
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
    providerId: 'prov_general',
    name: 'Engineering Drawing Instrument Box & Mini Drafter',
    slug: 'engineering-mini-drafter',
    categoryId: 'cat_stationery',
    subcategory: 'Art Supplies',
    dietaryType: 'Not Applicable',
    isPopular: false,
    sku: 'ESS-DRAFT-03',
    description: 'Heavy-duty steel mini-drafter with compass set and scale protractor for 1st & 2nd year graphics.',
    price: 450,
    discountPrice: 399,
    discountPercentage: 11,
    tags: 'mini drafter, engineering drawing, stationery, tools',
    unit: 'set',
    stock: 2,
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
    providerId: 'prov_general',
    name: 'JK Cedar A4 Lab Report Copier Paper (500 Sheets)',
    slug: 'jk-copier-a4-paper',
    categoryId: 'cat_stationery',
    subcategory: 'Notebooks',
    dietaryType: 'Not Applicable',
    isPopular: false,
    sku: 'ESS-PAPER-04',
    description: '75 GSM bright white A4 sheets for seminar reports, laboratory submissions, and laser printing.',
    price: 290,
    discountPrice: 260,
    discountPercentage: 10,
    tags: 'paper, a4, printing, xerox, stationery',
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
    providerId: 'prov_general',
    name: 'Pilot V5 Hi-Techpoint Liquid Ink Rollerball Pen (Pack of 3)',
    slug: 'pilot-v5-pen-pack',
    categoryId: 'cat_stationery',
    subcategory: 'Pens',
    dietaryType: 'Not Applicable',
    isPopular: true,
    sku: 'ESS-PEN-05',
    description: 'Pure liquid ink with dimple rollerball tip for smooth engineering problem-solving.',
    price: 180,
    discountPrice: 160,
    discountPercentage: 11,
    tags: 'pilot, pen, v5, rollerball, stationery, popular',
    unit: 'pack',
    stock: 75,
    lowStockThreshold: 15,
    availability: true,
    isFeatured: false,
    images: [{ id: 'img_16', googleDriveUrl: 'https://images.unsplash.com/photo-1585336261026-7f516d004e0e?w=800', isPrimary: true }],
    inventory: { currentStock: 75, lowStockThreshold: 15 },
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // HOSTEL ESSENTIALS
  {
    id: 'prod_17',
    providerId: 'prov_general',
    name: 'Hostel Cleaning Kit & Disinfectant Set',
    slug: 'hostel-cleaning-kit',
    categoryId: 'cat_essentials',
    subcategory: 'Cleaning',
    dietaryType: 'Not Applicable',
    isPopular: true,
    sku: 'ESS-CLEAN-01',
    description: 'Complete hostel room sanitation set with floor cleaner, toilet cleaner, spray bottle, and microfiber wipes.',
    price: 250,
    discountPrice: 200,
    discountPercentage: 20,
    tags: 'cleaning, hostel cleaning kit, floor cleaner, wiper, brush, essentials, popular',
    unit: 'kit',
    stock: 40,
    lowStockThreshold: 8,
    availability: true,
    isFeatured: true,
    images: [{ id: 'img_17', googleDriveUrl: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=800', isPrimary: true }],
    inventory: { currentStock: 40, lowStockThreshold: 8 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_18',
    providerId: 'prov_general',
    name: 'Dettol Original Antiseptic & Liquid Handwash Pack',
    slug: 'dettol-antiseptic-pack',
    categoryId: 'cat_essentials',
    subcategory: 'Personal Care',
    dietaryType: 'Not Applicable',
    isPopular: false,
    sku: 'ESS-DETTOL-02',
    description: 'Trusted personal protection liquid disinfectant and germ protection liquid hand wash for hostel students.',
    price: 160,
    discountPrice: 140,
    discountPercentage: 13,
    tags: 'dettol, antiseptic, handwash, personal care, essentials',
    unit: 'pack',
    stock: 55,
    lowStockThreshold: 10,
    availability: true,
    isFeatured: false,
    images: [{ id: 'img_18', googleDriveUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', isPrimary: true }],
    inventory: { currentStock: 55, lowStockThreshold: 10 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod_19',
    providerId: 'prov_general',
    name: 'Campus Student Room Daily Essentials Kit',
    slug: 'student-daily-essentials-kit',
    categoryId: 'cat_essentials',
    subcategory: 'Daily Essentials',
    dietaryType: 'Not Applicable',
    isPopular: true,
    sku: 'ESS-DAILY-03',
    description: 'Toothpaste, bathing soap, shampoo sachets, laundry detergent bar, and room freshener all in one package.',
    price: 320,
    discountPrice: 280,
    discountPercentage: 13,
    tags: 'daily essentials, hostel kit, room kit, essentials, popular',
    unit: 'kit',
    stock: 35,
    lowStockThreshold: 6,
    availability: true,
    isFeatured: true,
    images: [{ id: 'img_19', googleDriveUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800', isPrimary: true }],
    inventory: { currentStock: 35, lowStockThreshold: 6 },
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
    student: {
      id: 'student_sourav',
      userId: 'user_admin_sourav',
      fullName: 'Sourav Senapati',
      rollNumber: '21CS8001',
      registrationNumber: 'REG20268001',
      mobileNumber: '+91 9876543210',
      collegeEmail: 'souravsenapati408@gmail.com',
      personalEmail: 'souravsenapati408@gmail.com',
      hallId: 'hall_11',
      hallNumber: '11',
      roomNumber: 'Room 304',
      department: 'Computer Science',
      programme: 'B.Tech',
      year: '4th Year',
      isVerified: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date()
    },
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
      autoAssignDelivery: false,
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
      fullName: 'Campus Laundry Cell',
      mobileNumber: '9876543210',
      serviceCategory: 'Express Laundry',
      assignedZones: 'ALL',
      activeStatus: true,
      autoAssignDelivery: false,
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
      autoAssignDelivery: false,
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
      autoAssignDelivery: false,
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
      paymentType: 'PER_DELIVERY' as const,
      perDeliveryRate: 10.00,
      monthlySalary: 0.00,
      walletBalance: 1250.00,
      totalSettled: 500.00,
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
      paymentType: 'MONTHLY_CONTRACT' as const,
      perDeliveryRate: 0.00,
      monthlySalary: 15000.00,
      walletBalance: 0.00,
      totalSettled: 0.00,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date()
    }
  },
  // Primary Test Student
  {
    id: 'user_student_sourav',
    email: 'ss.24u10227@nitdgp.ac.in',
    collegeEmail: 'ss.24u10227@nitdgp.ac.in',
    personalEmail: 'souravsenapati055@gmail.com',
    collegeEmailVerified: true,
    personalEmailVerified: true,
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
      collegeEmail: 'ss.24u10227@nitdgp.ac.in',
      personalEmail: 'souravsenapati055@gmail.com',
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
    id: 'mock_ord_prepaid_180',
    orderNumber: 'CB-ORD-TEST-180',
    studentId: 'student_123',
    providerId: 'prov_canteen',
    serviceType: 'FOOD',
    totalAmount: 180,
    subtotal: 180,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'CONFIRMED',
    providerAccepted: false,
    paymentMethod: 'ONLINE',
    paymentStatus: 'PAID',
    createdAt: new Date(),
    updatedAt: new Date(),
    student: { fullName: 'Test Student', email: 'test@nitdgp.ac.in', mobileNumber: '9999999999' },
    items: [{ id: 'it_test_1', productName: 'Special Burger', quantity: 1, unitPrice: 180, totalPrice: 180 }]
  },
  {
    id: 'mock_ord_cod_zero_advance_180',
    orderNumber: 'CB-ORD-TEST-COD-180',
    studentId: 'student_123',
    providerId: 'prov_canteen',
    serviceType: 'FOOD',
    totalAmount: 180,
    subtotal: 180,
    advancePaidAmount: 0,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'CONFIRMED',
    providerAccepted: false,
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    student: { fullName: 'Test Student', email: 'test@nitdgp.ac.in', mobileNumber: '9999999999' },
    items: [{ id: 'it_test_2', productName: 'Special Burger', quantity: 1, unitPrice: 180, totalPrice: 180 }]
  },
  {
    id: 'mock_ord_cod_partial_20',
    orderNumber: 'CB-ORD-TEST-COD-20',
    studentId: 'student_123',
    providerId: 'prov_canteen',
    serviceType: 'FOOD',
    totalAmount: 180,
    subtotal: 180,
    advancePaidAmount: 20,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'CONFIRMED',
    providerAccepted: false,
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'COD_PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    student: { fullName: 'Test Student', email: 'test@nitdgp.ac.in', mobileNumber: '9999999999' },
    items: [{ id: 'it_test_3', productName: 'Special Burger', quantity: 1, unitPrice: 180, totalPrice: 180 }]
  },
  {
    id: 'mock_ord_accepted_food',
    orderNumber: 'CB-ORD-TEST-ACCEPTED',
    studentId: 'student_123',
    providerId: 'prov_canteen',
    serviceType: 'FOOD',
    totalAmount: 180,
    subtotal: 180,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'ACCEPTED',
    providerAccepted: true,
    providerAcceptedAt: new Date(),
    paymentMethod: 'ONLINE',
    paymentStatus: 'PAID',
    createdAt: new Date(),
    updatedAt: new Date(),
    student: { fullName: 'Test Student', email: 'test@nitdgp.ac.in', mobileNumber: '9999999999' },
    items: [{ id: 'it_test_4', productName: 'Special Burger', quantity: 1, unitPrice: 180, totalPrice: 180 }]
  },
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
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_17', productName: 'Kolkata Style Chicken Biryani', quantity: 1, unitPrice: 125, totalPrice: 125 }
    ]
  },
  // --- REALISTIC LIVE & HISTORICAL DEMO ORDERS ---
  {
    id: 'ord_201',
    orderNumber: 'NIT-ORD-9040',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 330,
    subtotal: 330,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(0, 1),
    updatedAt: pastDays(0, 0),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_201a', productName: 'Kolkata Style Chicken Biryani', quantity: 2, unitPrice: 140, totalPrice: 280 },
      { id: 'it_201b', productName: 'Campus Samosa & Masala Chai Combo', quantity: 2, unitPrice: 25, totalPrice: 50 }
    ]
  },
  {
    id: 'ord_202',
    orderNumber: 'NIT-ORD-9041',
    studentId: 'stud_rohit',
    providerId: 'prov_canteen',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    totalAmount: 250,
    subtotal: 250,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'PREPARING',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(0, 2),
    updatedAt: pastDays(0, 1),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'it_202a', productName: 'Kolkata Style Chicken Biryani', quantity: 1, unitPrice: 140, totalPrice: 140 },
      { id: 'it_202b', productName: 'Paneer Butter Masala Combo', quantity: 1, unitPrice: 110, totalPrice: 110 }
    ]
  },
  {
    id: 'ord_203',
    orderNumber: 'NIT-ORD-9042',
    studentId: 'stud_priya',
    providerId: 'prov_canteen',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    totalAmount: 160,
    subtotal: 160,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'READY_FOR_PICKUP',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(0, 3),
    updatedAt: pastDays(0, 2),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'it_203', productName: 'Egg Curry with Steamed Basmati Rice', quantity: 2, unitPrice: 80, totalPrice: 160 }
    ]
  },
  {
    id: 'ord_204',
    orderNumber: 'NIT-ORD-9043',
    studentId: 'stud_arun',
    providerId: 'prov_canteen',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    totalAmount: 160,
    subtotal: 160,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'OUT_FOR_DELIVERY',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(0, 4),
    updatedAt: pastDays(0, 3),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Arunav Roy', rollNumber: '22ME8003', email: 'arun.22me@nitdgp.ac.in', mobileNumber: '9876503456', hallName: 'Hall 5', roomNumber: 'B-201' },
    items: [
      { id: 'it_204', productName: 'Kolkata Double Egg Chicken Kathi Roll', quantity: 2, unitPrice: 80, totalPrice: 160 }
    ]
  },
  {
    id: 'ord_205',
    orderNumber: 'NIT-ORD-9044',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 130,
    subtotal: 130,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(0, 5),
    updatedAt: pastDays(0, 4),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_205', productName: 'South Indian Crispy Masala Dosa', quantity: 2, unitPrice: 65, totalPrice: 130 }
    ]
  },
  {
    id: 'ord_206',
    orderNumber: 'NIT-ORD-9045',
    studentId: 'stud_priya',
    providerId: 'prov_canteen',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    totalAmount: 420,
    subtotal: 420,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(1, 2),
    updatedAt: pastDays(1, 1),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'it_206', productName: 'Kolkata Style Chicken Biryani', quantity: 3, unitPrice: 140, totalPrice: 420 }
    ]
  },
  {
    id: 'ord_207',
    orderNumber: 'NIT-ORD-9046',
    studentId: 'stud_rohit',
    providerId: 'prov_canteen',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    totalAmount: 220,
    subtotal: 220,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(1, 4),
    updatedAt: pastDays(1, 3),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'it_207', productName: 'Paneer Butter Masala Combo', quantity: 2, unitPrice: 110, totalPrice: 220 }
    ]
  },
  {
    id: 'ord_208',
    orderNumber: 'NIT-ORD-9047',
    studentId: 'stud_arun',
    providerId: 'prov_canteen',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    totalAmount: 100,
    subtotal: 100,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(1, 6),
    updatedAt: pastDays(1, 5),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Arunav Roy', rollNumber: '22ME8003', email: 'arun.22me@nitdgp.ac.in', mobileNumber: '9876503456', hallName: 'Hall 5', roomNumber: 'B-201' },
    items: [
      { id: 'it_208', productName: 'Campus Samosa & Masala Chai Combo', quantity: 4, unitPrice: 25, totalPrice: 100 }
    ]
  },
  {
    id: 'ord_209',
    orderNumber: 'NIT-ORD-9048',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 240,
    subtotal: 240,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(1, 8),
    updatedAt: pastDays(1, 7),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_209', productName: 'Kolkata Double Egg Chicken Kathi Roll', quantity: 3, unitPrice: 80, totalPrice: 240 }
    ]
  },
  {
    id: 'ord_210',
    orderNumber: 'NIT-ORD-9049',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 560,
    subtotal: 560,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(2, 2),
    updatedAt: pastDays(2, 1),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_210', productName: 'Kolkata Style Chicken Biryani', quantity: 4, unitPrice: 140, totalPrice: 560 }
    ]
  },
  {
    id: 'ord_211',
    orderNumber: 'NIT-ORD-9050',
    studentId: 'stud_rohit',
    providerId: 'prov_canteen',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    totalAmount: 330,
    subtotal: 330,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(3, 4),
    updatedAt: pastDays(3, 3),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'it_211', productName: 'Paneer Butter Masala Combo', quantity: 3, unitPrice: 110, totalPrice: 330 }
    ]
  },
  {
    id: 'ord_212',
    orderNumber: 'NIT-ORD-9051',
    studentId: 'stud_priya',
    providerId: 'prov_canteen',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    totalAmount: 240,
    subtotal: 240,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(4, 5),
    updatedAt: pastDays(4, 4),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'it_212', productName: 'Egg Curry with Steamed Basmati Rice', quantity: 3, unitPrice: 80, totalPrice: 240 }
    ]
  },
  {
    id: 'ord_213',
    orderNumber: 'NIT-ORD-9052',
    studentId: 'stud_arun',
    providerId: 'prov_canteen',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    totalAmount: 320,
    subtotal: 320,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(5, 3),
    updatedAt: pastDays(5, 2),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Arunav Roy', rollNumber: '22ME8003', email: 'arun.22me@nitdgp.ac.in', mobileNumber: '9876503456', hallName: 'Hall 5', roomNumber: 'B-201' },
    items: [
      { id: 'it_213', productName: 'Kolkata Double Egg Chicken Kathi Roll', quantity: 4, unitPrice: 80, totalPrice: 320 }
    ]
  },
  {
    id: 'ord_214',
    orderNumber: 'NIT-ORD-9053',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 700,
    subtotal: 700,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(6, 6),
    updatedAt: pastDays(6, 5),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_214', productName: 'Kolkata Style Chicken Biryani', quantity: 5, unitPrice: 140, totalPrice: 700 }
    ]
  },
  {
    id: 'ord_215',
    orderNumber: 'NIT-ORD-9054',
    studentId: 'stud_rohit',
    providerId: 'prov_canteen',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    totalAmount: 260,
    subtotal: 260,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(7, 4),
    updatedAt: pastDays(7, 3),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'it_215', productName: 'South Indian Crispy Masala Dosa', quantity: 4, unitPrice: 65, totalPrice: 260 }
    ]
  },
  {
    id: 'ord_216',
    orderNumber: 'NIT-ORD-9055',
    studentId: 'stud_priya',
    providerId: 'prov_canteen',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    totalAmount: 560,
    subtotal: 560,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(9, 5),
    updatedAt: pastDays(9, 4),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'it_216', productName: 'Kolkata Style Chicken Biryani', quantity: 4, unitPrice: 140, totalPrice: 560 }
    ]
  },
  {
    id: 'ord_217',
    orderNumber: 'NIT-ORD-9056',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 440,
    subtotal: 440,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(11, 4),
    updatedAt: pastDays(11, 3),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_217', productName: 'Paneer Butter Masala Combo', quantity: 4, unitPrice: 110, totalPrice: 440 }
    ]
  },
  {
    id: 'ord_218',
    orderNumber: 'NIT-ORD-9057',
    studentId: 'stud_arun',
    providerId: 'prov_canteen',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    totalAmount: 520,
    subtotal: 520,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(14, 6),
    updatedAt: pastDays(14, 5),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Arunav Roy', rollNumber: '22ME8003', email: 'arun.22me@nitdgp.ac.in', mobileNumber: '9876503456', hallName: 'Hall 5', roomNumber: 'B-201' },
    items: [
      { id: 'it_218a', productName: 'Kolkata Style Chicken Biryani', quantity: 3, unitPrice: 140, totalPrice: 420 },
      { id: 'it_218b', productName: 'Campus Samosa & Masala Chai Combo', quantity: 4, unitPrice: 25, totalPrice: 100 }
    ]
  },
  {
    id: 'ord_219',
    orderNumber: 'NIT-ORD-9058',
    studentId: 'stud_rohit',
    providerId: 'prov_canteen',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    totalAmount: 840,
    subtotal: 840,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(18, 5),
    updatedAt: pastDays(18, 4),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'it_219', productName: 'Kolkata Style Chicken Biryani', quantity: 6, unitPrice: 140, totalPrice: 840 }
    ]
  },
  {
    id: 'ord_220',
    orderNumber: 'NIT-ORD-9059',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 400,
    subtotal: 400,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(21, 6),
    updatedAt: pastDays(21, 5),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_220', productName: 'Kolkata Double Egg Chicken Kathi Roll', quantity: 5, unitPrice: 80, totalPrice: 400 }
    ]
  },
  {
    id: 'ord_221',
    orderNumber: 'NIT-ORD-9060',
    studentId: 'stud_priya',
    providerId: 'prov_canteen',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    totalAmount: 700,
    subtotal: 700,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(24, 7),
    updatedAt: pastDays(24, 6),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'it_221', productName: 'Kolkata Style Chicken Biryani', quantity: 5, unitPrice: 140, totalPrice: 700 }
    ]
  },
  {
    id: 'ord_222',
    orderNumber: 'NIT-ORD-9061',
    studentId: 'stud_arun',
    providerId: 'prov_canteen',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    totalAmount: 200,
    subtotal: 200,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: pastDays(28, 5),
    updatedAt: pastDays(28, 4),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Arunav Roy', rollNumber: '22ME8003', email: 'arun.22me@nitdgp.ac.in', mobileNumber: '9876503456', hallName: 'Hall 5', roomNumber: 'B-201' },
    items: [
      { id: 'it_222', productName: 'Campus Samosa & Masala Chai Combo', quantity: 8, unitPrice: 25, totalPrice: 200 }
    ]
  },
  // --- HISTORICAL 2026 CALENDAR MONTH ORDERS FOR POWER BI 12-MONTH VISUALIZATION ---
  {
    id: 'ord_hist_jan',
    orderNumber: 'NIT-ORD-JAN01',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 3500,
    subtotal: 3500,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: new Date('2026-01-18T13:00:00Z'),
    updatedAt: new Date('2026-01-18T13:40:00Z'),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_hj1', productName: 'Kolkata Style Chicken Biryani', quantity: 25, unitPrice: 140, totalPrice: 3500 }
    ]
  },
  {
    id: 'ord_hist_feb',
    orderNumber: 'NIT-ORD-FEB01',
    studentId: 'stud_rohit',
    providerId: 'prov_canteen',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    totalAmount: 4200,
    subtotal: 4200,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: new Date('2026-02-15T14:00:00Z'),
    updatedAt: new Date('2026-02-15T14:35:00Z'),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'it_hf1', productName: 'Kolkata Style Chicken Biryani', quantity: 30, unitPrice: 140, totalPrice: 4200 }
    ]
  },
  {
    id: 'ord_hist_mar',
    orderNumber: 'NIT-ORD-MAR01',
    studentId: 'stud_priya',
    providerId: 'prov_canteen',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    totalAmount: 4900,
    subtotal: 4900,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: new Date('2026-03-20T12:30:00Z'),
    updatedAt: new Date('2026-03-20T13:10:00Z'),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'it_hm1', productName: 'Kolkata Style Chicken Biryani', quantity: 35, unitPrice: 140, totalPrice: 4900 }
    ]
  },
  {
    id: 'ord_hist_apr',
    orderNumber: 'NIT-ORD-APR01',
    studentId: 'stud_arun',
    providerId: 'prov_canteen',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    totalAmount: 3850,
    subtotal: 3850,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: new Date('2026-04-18T13:15:00Z'),
    updatedAt: new Date('2026-04-18T13:45:00Z'),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Arunav Roy', rollNumber: '22ME8003', email: 'arun.22me@nitdgp.ac.in', mobileNumber: '9876503456', hallName: 'Hall 5', roomNumber: 'B-201' },
    items: [
      { id: 'it_ha1', productName: 'Paneer Butter Masala Combo', quantity: 35, unitPrice: 110, totalPrice: 3850 }
    ]
  },
  {
    id: 'ord_hist_may',
    orderNumber: 'NIT-ORD-MAY01',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 5600,
    subtotal: 5600,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: new Date('2026-05-12T19:00:00Z'),
    updatedAt: new Date('2026-05-12T19:40:00Z'),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_hmay1', productName: 'Kolkata Style Chicken Biryani', quantity: 40, unitPrice: 140, totalPrice: 5600 }
    ]
  },
  {
    id: 'ord_hist_jun',
    orderNumber: 'NIT-ORD-JUN01',
    studentId: 'stud_rohit',
    providerId: 'prov_canteen',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    totalAmount: 2800,
    subtotal: 2800,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: new Date('2026-06-15T13:00:00Z'),
    updatedAt: new Date('2026-06-15T13:30:00Z'),
    deliveryBoyId: 'db_boy_2',
    deliveryBoy: { fullName: 'Rajesh Kumar (Express Runner)', mobileNumber: '9876543221' },
    student: { fullName: 'Rohit Sharma', rollNumber: '23CS8012', email: 'rohit.23cs@nitdgp.ac.in', mobileNumber: '9876505678', hallName: 'Hall 2', roomNumber: 'A-102' },
    items: [
      { id: 'it_hjun1', productName: 'Kolkata Style Chicken Biryani', quantity: 20, unitPrice: 140, totalPrice: 2800 }
    ]
  },
  {
    id: 'ord_hist_jul',
    orderNumber: 'NIT-ORD-JUL01',
    studentId: 'stud_priya',
    providerId: 'prov_canteen',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    totalAmount: 5600,
    subtotal: 5600,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: new Date('2026-07-22T14:00:00Z'),
    updatedAt: new Date('2026-07-22T14:40:00Z'),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Priya Mukherjee', rollNumber: '24EC8045', email: 'priya.24ec@nitdgp.ac.in', mobileNumber: '9876509012', hallName: 'Mother Teresa Hall', roomNumber: 'C-215' },
    items: [
      { id: 'it_hjul1', productName: 'Kolkata Style Chicken Biryani', quantity: 40, unitPrice: 140, totalPrice: 5600 }
    ]
  },
  {
    id: 'ord_hist_aug',
    orderNumber: 'NIT-ORD-AUG01',
    studentId: 'stud_sourav',
    providerId: 'prov_canteen',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    totalAmount: 6300,
    subtotal: 6300,
    deliveryFee: 0,
    discountAmount: 0,
    status: 'DELIVERED',
    paymentMethod: 'RAZORPAY',
    paymentStatus: 'SUCCESS',
    createdAt: new Date('2026-08-14T19:30:00Z'),
    updatedAt: new Date('2026-08-14T20:10:00Z'),
    deliveryBoyId: 'db_boy_1',
    deliveryBoy: { fullName: 'Bikash Mondal (Lead Runner)', mobileNumber: '9876543220' },
    student: { fullName: 'Sourav Senapati', rollNumber: '24U10227', email: 'ss.24u10227@nitdgp.ac.in', mobileNumber: '9876501234', hallName: 'Hall 11', roomNumber: 'B-304' },
    items: [
      { id: 'it_haug1', productName: 'Kolkata Style Chicken Biryani', quantity: 45, unitPrice: 140, totalPrice: 6300 }
    ]
  }
];

export const fallbackLaundryJobs = [
  {
    id: 'laundry_job_1',
    orderNumber: 'NIT-LND-501',
    trackingNumber: 'TRK-NIT-LND-501',
    qrCodeData: JSON.stringify({ trackingNumber: 'TRK-NIT-LND-501', orderNumber: 'NIT-LND-501', hall: 'Hall 11', room: 'B-304' }),
    studentId: 'stud_sourav',
    providerId: 'prov_laundry',
    hallName: 'Hall 11',
    roomNumber: 'B-304',
    serviceType: 'Wash & Steam Iron',
    totalClothesCount: 6,
    estimatedPrice: 120,
    finalPrice: 120,
    laundryBaseAmount: 114,
    serviceChargeAmount: 6,
    totalAmount: 120,
    onlinePaidAmount: 120,
    codAmount: 0,
    codCollectedAmount: 0,
    codStatus: 'NOT_APPLICABLE',
    paymentMethod: 'ONLINE',
    paymentStatus: 'PAID',
    settlementStatus: 'PENDING',
    refundStatus: 'NOT_APPLICABLE',
    serviceChargeRefundable: true,
    priceSnapshotJson: JSON.stringify({ providerPrice: 19, serviceCharge: 1, quantity: 6, baseTotal: 114, serviceChargeTotal: 6 }),
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
      { id: 'li_1', itemType: 'Shirt', quantity: 3, unitPrice: 20 },
      { id: 'li_2', itemType: 'Jeans', quantity: 3, unitPrice: 20 }
    ]
  },
  {
    id: 'laundry_job_2',
    orderNumber: 'NIT-LND-502',
    trackingNumber: 'TRK-NIT-LND-502',
    qrCodeData: JSON.stringify({ trackingNumber: 'TRK-NIT-LND-502', orderNumber: 'NIT-LND-502', hall: 'Hall 2', room: 'A-102' }),
    studentId: 'stud_rohit',
    providerId: 'prov_laundry',
    hallName: 'Hall 2',
    roomNumber: 'A-102',
    serviceType: 'Express Steam Iron',
    totalClothesCount: 4,
    estimatedPrice: 40,
    finalPrice: 40,
    laundryBaseAmount: 36,
    serviceChargeAmount: 4,
    totalAmount: 40,
    onlinePaidAmount: 4,
    codAmount: 36,
    codCollectedAmount: 0,
    codStatus: 'PENDING',
    paymentMethod: 'COD',
    paymentStatus: 'PARTIALLY_PAID',
    settlementStatus: 'NOT_ELIGIBLE',
    refundStatus: 'NOT_APPLICABLE',
    serviceChargeRefundable: true,
    priceSnapshotJson: JSON.stringify({ providerPrice: 9, serviceCharge: 1, quantity: 4, baseTotal: 36, serviceChargeTotal: 4 }),
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
      { id: 'li_3', itemType: 'Shirt', quantity: 4, unitPrice: 10 }
    ]
  },
  {
    id: 'laundry_job_3',
    orderNumber: 'NIT-LND-503',
    trackingNumber: 'TRK-NIT-LND-503',
    qrCodeData: JSON.stringify({ trackingNumber: 'TRK-NIT-LND-503', orderNumber: 'NIT-LND-503', hall: 'Mother Teresa Hall', room: 'C-215' }),
    studentId: 'stud_priya',
    providerId: 'prov_laundry',
    hallName: 'Mother Teresa Hall',
    roomNumber: 'C-215',
    serviceType: 'Linen & Bedding Care',
    totalClothesCount: 2,
    estimatedPrice: 80,
    finalPrice: 80,
    laundryBaseAmount: 76,
    serviceChargeAmount: 4,
    totalAmount: 80,
    onlinePaidAmount: 4,
    codAmount: 76,
    codCollectedAmount: 76,
    codStatus: 'COLLECTED',
    paymentMethod: 'COD',
    paymentStatus: 'PAID',
    settlementStatus: 'ELIGIBLE',
    refundStatus: 'NOT_APPLICABLE',
    serviceChargeRefundable: true,
    priceSnapshotJson: JSON.stringify({ providerPrice: 38, serviceCharge: 2, quantity: 2, baseTotal: 76, serviceChargeTotal: 4 }),
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
      { id: 'li_4', itemType: 'Bedsheet', quantity: 2, unitPrice: 40 }
    ]
  },
  {
    id: 'laundry_job_4',
    orderNumber: 'NIT-LND-504',
    trackingNumber: 'TRK-NIT-LND-504',
    qrCodeData: JSON.stringify({ trackingNumber: 'TRK-NIT-LND-504', orderNumber: 'NIT-LND-504', hall: 'Hall 5', room: 'B-201' }),
    studentId: 'stud_arun',
    providerId: 'prov_laundry',
    hallName: 'Hall 5',
    roomNumber: 'B-201',
    serviceType: 'Winter Comforter Wash',
    totalClothesCount: 1,
    estimatedPrice: 150,
    finalPrice: 150,
    laundryBaseAmount: 145,
    serviceChargeAmount: 5,
    totalAmount: 150,
    onlinePaidAmount: 150,
    codAmount: 0,
    codCollectedAmount: 0,
    codStatus: 'NOT_APPLICABLE',
    paymentMethod: 'ONLINE',
    paymentStatus: 'PAID',
    settlementStatus: 'PENDING',
    refundStatus: 'NOT_APPLICABLE',
    serviceChargeRefundable: true,
    priceSnapshotJson: JSON.stringify({ providerPrice: 145, serviceCharge: 5, quantity: 1, baseTotal: 145, serviceChargeTotal: 5 }),
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
      { id: 'li_5', itemType: 'Blanket', quantity: 1, unitPrice: 150 }
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
  { id: 'set_1', key: 'APP_NAME', value: 'Campus Basket', description: 'Campus marketplace title' },
  { id: 'set_2', key: 'ENABLE_CASH_ON_DELIVERY', value: 'true', description: 'Allow COD for hostel room drop' },
  { id: 'set_3', key: 'MAX_COD_AMOUNT', value: '1500', description: 'Maximum INR ceiling for Cash on Delivery' },
  { id: 'set_4', key: 'DELIVERY_FEE_FLAT', value: '15', description: 'Flat room delivery fee' },
  { id: 'set_5', key: 'FREE_DELIVERY_THRESHOLD', value: '250', description: 'Cart threshold for free delivery' },
  { id: 'set_6', key: 'MAINTENANCE_MODE', value: 'false', description: 'Emergency campus maintenance toggle' },
  { id: 'set_7', key: 'SUPPORT_EMAIL', value: 'support@campusbasket.in', description: 'Support email address' },
  { id: 'set_8', key: 'SUPPORT_PHONE', value: '+91 343 275 4000', description: 'Direct campus helpline' },
  { id: 'set_9', key: 'HOURS_FOOD', value: JSON.stringify({ open: '08:00', close: '23:30', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], isOpen: true, notice: 'Normal operation' }), description: 'Food & Meals Operating Timings' },
  { id: 'set_10', key: 'HOURS_FRUITS', value: JSON.stringify({ open: '07:00', close: '21:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], isOpen: true, notice: 'Fresh morning & evening batches' }), description: 'Fresh Fruits Operating Timings' },
  { id: 'set_11', key: 'HOURS_LAUNDRY', value: JSON.stringify({ open: '09:00', close: '19:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], isOpen: true, notice: 'Sunday batch maintenance' }), description: 'Express Laundry Operating Timings' },
  { id: 'set_12', key: 'HOURS_ESSENTIALS', value: JSON.stringify({ open: '09:00', close: '22:00', days: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], isOpen: true, notice: 'Stationery & personal care' }), description: 'Stationery & Essentials Timings' },
  { id: 'set_13', key: 'GEOFENCE_ENFORCED', value: 'true', description: 'Master GPS Geofencing perimeter restriction toggle' },
  { id: 'set_14', key: 'LAUNDRY_DEFAULT_SERVICE_CHARGE', value: '1.00', description: 'Default laundry service charge per unit in INR' },
  { id: 'set_15', key: 'LAUNDRY_SERVICE_CHARGE_REFUNDABLE', value: 'true', description: 'Whether Campus Basket laundry service charge is refundable upon order cancellation' },
  { id: 'set_16', key: 'LAUNDRY_COD_ENABLED', value: 'true', description: 'Allow COD for laundry orders with advance online service charge payment' },
  { id: 'set_17', key: 'LAUNDRY_PICKUP_OTP_EXPIRY_MINUTES', value: '60', description: 'Minutes before pickup OTP expires' },
  { id: 'set_18', key: 'LAUNDRY_DELIVERY_OTP_EXPIRY_MINUTES', value: '120', description: 'Minutes before return delivery OTP expires' },
  { id: 'set_19', key: 'COD_MIN_ADVANCE_AMOUNT', value: '10', description: 'Partial advance online payment in INR required to confirm Cash on Delivery orders' },
  { id: 'set_20', key: 'CANCELLATION_CUTOFF_STAGE', value: 'ACCEPTED', description: 'Order stage beyond which customer cannot modify or cancel order' },
  { id: 'set_21', key: 'RETURN_POLICY_FOOD', value: 'RESTRICTED', description: 'Return eligibility for cooked food: RESTRICTED | 30_MIN_DISPATCH | ALLOWED' },
  { id: 'set_22', key: 'RETURN_POLICY_PRODUCE', value: 'FRESHNESS_VERIFIED', description: 'Return eligibility for fruits & fresh produce: FRESHNESS_VERIFIED | 2_HOUR_WINDOW | ALLOWED' },
  { id: 'set_23', key: 'RETURN_POLICY_STATIONERY', value: 'ALLOWED_24HR', description: 'Return eligibility for stationery: ALLOWED_24HR | 7_DAYS | DEFECTIVE_ONLY' },
  { id: 'set_24', key: 'PROVIDER_ORDER_POLICIES', value: '{}', description: 'JSON dictionary of provider-specific COD and return rules' },
  { id: 'set_25', key: 'PRODUCT_ORDER_POLICIES', value: '{}', description: 'JSON dictionary of product-specific return rules' }
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

// ==========================================
// UNIFIED PLATFORM FINANCIAL & SERVICE STORES
// ==========================================

export const fallbackLaundryProviderConfigs = [
  {
    id: 'lpc_1',
    providerId: 'prov_laundry',
    minWeightKg: 2.0,
    turnaroundHours: 24,
    allowsIroningOnly: true,
    emergencyServiceActive: true,
    pricingConfig: JSON.stringify({
      washAndFold: 20,
      washAndIron: 35,
      steamIronOnly: 15,
      dryCleanSuit: 180,
      dryCleanJacket: 120,
      blanketHeavy: 150
    }),
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date()
  }
];

export const fallbackLaundryServiceConfigs = [
  {
    id: 'lsc_wash_iron',
    providerId: 'prov_laundry',
    serviceName: 'Wash & Iron',
    pricingUnit: 'per_dress',
    unitDisplayName: 'per garment',
    providerPricePerUnit: 15,
    serviceChargePerUnit: 1,
    minQuantity: 1,
    maxQuantity: 50,
    turnaroundHours: 24,
    isAvailable: true,
    itemRatesJson: JSON.stringify({
      Shirt: 15,
      'T-Shirt': 15,
      Pants: 20,
      Jeans: 25,
      Kurta: 20,
      Bedsheet: 35,
      Towel: 15,
      Blanket: 90
    }),
    tariffHeroTitle: 'Express Campus Laundry',
    tariffHeroSubtitle: 'Automated wash, fabric softening & steam iron with room-to-room pickup across Halls 1–14',
    tariffTag: 'DUAL-OTP',
    tariffBadge: 'SUBSIDIZED TARIFF',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'lsc_wash_fold',
    providerId: 'prov_laundry',
    serviceName: 'Wash & Fold',
    pricingUnit: 'per_kg',
    unitDisplayName: 'per kg',
    providerPricePerUnit: 60,
    serviceChargePerUnit: 5,
    minQuantity: 2,
    maxQuantity: 20,
    turnaroundHours: 48,
    isAvailable: true,
    itemRatesJson: JSON.stringify({
      'Mixed Regular Wear (per kg)': 60
    }),
    tariffHeroTitle: 'Bulk Wash & Fold',
    tariffHeroSubtitle: 'Economical bulk laundry washed, tumble-dried, and neatly folded by kilogram',
    tariffTag: 'KG-WEIGHT',
    tariffBadge: 'AFFORDABLE BULK',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'lsc_dry_clean',
    providerId: 'prov_laundry',
    serviceName: 'Dry Cleaning',
    pricingUnit: 'per_item',
    unitDisplayName: 'per item',
    providerPricePerUnit: 80,
    serviceChargePerUnit: 5,
    minQuantity: 1,
    maxQuantity: 10,
    turnaroundHours: 72,
    isAvailable: true,
    itemRatesJson: JSON.stringify({
      Blazer: 150,
      Suit: 200,
      Jacket: 120,
      Sweater: 80,
      Blanket: 120
    }),
    tariffHeroTitle: 'Premium Dry Clean',
    tariffHeroSubtitle: 'Gentle solvent care for blazers, winter wear, ethnic suits, and heavy blankets',
    tariffTag: 'CARE-PLUS',
    tariffBadge: 'PREMIUM CARE',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'lsc_steam_iron',
    providerId: 'prov_laundry',
    serviceName: 'Steam Iron Only',
    pricingUnit: 'per_piece',
    unitDisplayName: 'per piece',
    providerPricePerUnit: 10,
    serviceChargePerUnit: 1,
    minQuantity: 1,
    maxQuantity: 30,
    turnaroundHours: 12,
    isAvailable: true,
    itemRatesJson: JSON.stringify({
      Shirt: 10,
      Trousers: 10,
      Kurta: 12,
      Saree: 25
    }),
    tariffHeroTitle: 'Express Steam Iron',
    tariffHeroSubtitle: 'Wrinkle-free high-pressure steam pressing returned in 12-24 hours',
    tariffTag: 'FAST-PRESS',
    tariffBadge: 'EXPRESS PRESS',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date()
  }
];

export const fallbackLaundryCodCollections: Array<{
  id: string;
  collectionNumber: string;
  laundryOrderId: string;
  providerId: string | null;
  expectedAmount: number;
  collectedAmount: number;
  collectionStatus: string;
  collectedAt: Date | null;
  collectedBy: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}> = [
  {
    id: 'lcod_1',
    collectionNumber: 'CB-LCOD-2026-0001',
    laundryOrderId: 'laundry_job_3',
    providerId: 'prov_laundry',
    expectedAmount: 76,
    collectedAmount: 76,
    collectionStatus: 'COLLECTED',
    collectedAt: pastDays(2, 2),
    collectedBy: 'prov_laundry',
    notes: 'Collected cash from room C-215 upon delivery',
    createdAt: pastDays(2, 2),
    updatedAt: pastDays(2, 2)
  }
];

export const fallbackLaundryOtps: Array<{
  id: string;
  laundryOrderId: string;
  otpType: string;
  otpHash: string;
  encryptedOtp: string | null;
  isUsed: boolean;
  attempts: number;
  expiresAt: Date;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
}> = [
  {
    id: 'lotp_1',
    laundryOrderId: 'laundry_job_1',
    otpType: 'PICKUP',
    otpHash: 'hash_pickup_1',
    encryptedOtp: '123456',
    isUsed: true,
    attempts: 0,
    expiresAt: new Date(Date.now() + 3600000),
    verifiedAt: pastDays(1, 3),
    verifiedBy: 'prov_laundry',
    createdAt: pastDays(1, 4)
  }
];

export const fallbackProviderSettlementAccounts = [
  {
    id: 'psa_canteen',
    providerId: 'prov_canteen',
    accountType: 'BANK_ACCOUNT',
    beneficiaryName: 'Campus Food Vendor Operations',
    bankName: 'State Bank of India',
    accountNumberMasked: 'XXXXXXXX7890',
    accountNumberEncrypted: 'enc_acc_7890',
    ifscCode: 'SBIN0001234',
    upiIdMasked: 'can****@sbi',
    upiIdEncrypted: 'enc_can_upi',
    isVerified: true,
    isPrimary: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'psa_laundry',
    providerId: 'prov_laundry',
    accountType: 'UPI',
    beneficiaryName: 'Campus Laundry Services Cell',
    bankName: 'Punjab National Bank',
    accountNumberMasked: 'XXXXXXXX4521',
    accountNumberEncrypted: 'enc_acc_4521',
    ifscCode: 'PUNB0005678',
    upiIdMasked: 'lnd****@pnb',
    upiIdEncrypted: 'enc_lnd_upi',
    isVerified: true,
    isPrimary: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'psa_general',
    providerId: 'prov_general',
    accountType: 'BANK_ACCOUNT',
    beneficiaryName: 'Stationery & Essentials Hub',
    bankName: 'HDFC Bank',
    accountNumberMasked: 'XXXXXXXX9912',
    accountNumberEncrypted: 'enc_acc_9912',
    ifscCode: 'HDFC0000456',
    upiIdMasked: 'sta****@hdfc',
    upiIdEncrypted: 'enc_sta_upi',
    isVerified: true,
    isPrimary: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date()
  }
];

export const fallbackRefundAccounts = [
  {
    id: 'rfa_sourav',
    studentId: 'stud_sourav',
    accountType: 'UPI',
    accountHolderName: 'Sourav Senapati',
    bankName: 'State Bank of India',
    accountNumberMasked: 'XXXXXXXX1234',
    accountNumberEncrypted: 'enc_acc_1234',
    ifscCode: 'SBIN0009999',
    upiIdMasked: 'sou****@okaxis',
    upiIdEncrypted: 'enc_sou_upi',
    isVerified: true,
    isPrimary: true,
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date()
  },
  {
    id: 'rfa_rohit',
    studentId: 'stud_rohit',
    accountType: 'BANK_ACCOUNT',
    accountHolderName: 'Rohit Sharma',
    bankName: 'Canara Bank',
    accountNumberMasked: 'XXXXXXXX8831',
    accountNumberEncrypted: 'enc_acc_8831',
    ifscCode: 'CNRB0002345',
    upiIdMasked: 'roh****@upi',
    upiIdEncrypted: 'enc_roh_upi',
    isVerified: true,
    isPrimary: true,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date()
  }
];

export const fallbackSettlements = [
  {
    id: 'stl_101',
    settlementNumber: 'STL-202602-001',
    providerId: 'prov_canteen',
    periodStart: new Date('2026-02-01T00:00:00Z'),
    periodEnd: new Date('2026-02-15T23:59:59Z'),
    grossSales: 15420.00,
    discountsTotal: 350.00,
    refundsDeducted: 140.00,
    commissionDeducted: 771.00, // 5%
    netPayable: 14509.00,
    status: 'SETTLED',
    payoutReference: 'NEFT_SBI_892348123',
    notes: 'Bi-weekly canteen settlement completed via SBI Corporate Portal.',
    processedAt: new Date('2026-02-16T11:30:00Z'),
    createdAt: new Date('2026-02-16T10:00:00Z'),
    updatedAt: new Date('2026-02-16T11:30:00Z')
  },
  {
    id: 'stl_102',
    settlementNumber: 'STL-202602-002',
    providerId: 'prov_laundry',
    periodStart: new Date('2026-02-01T00:00:00Z'),
    periodEnd: new Date('2026-02-15T23:59:59Z'),
    grossSales: 6240.00,
    discountsTotal: 0.00,
    refundsDeducted: 0.00,
    commissionDeducted: 312.00, // 5%
    netPayable: 5928.00,
    status: 'SETTLED',
    payoutReference: 'UPI_PAYOUT_912839',
    notes: 'First fortnight laundry settlement transferred.',
    processedAt: new Date('2026-02-16T12:00:00Z'),
    createdAt: new Date('2026-02-16T10:30:00Z'),
    updatedAt: new Date('2026-02-16T12:00:00Z')
  },
  {
    id: 'stl_103',
    settlementNumber: 'STL-202603-001',
    providerId: 'prov_canteen',
    periodStart: new Date('2026-02-16T00:00:00Z'),
    periodEnd: new Date('2026-02-28T23:59:59Z'),
    grossSales: 18950.00,
    discountsTotal: 400.00,
    refundsDeducted: 265.00,
    commissionDeducted: 947.50,
    netPayable: 17737.50,
    status: 'PENDING',
    payoutReference: null,
    notes: 'Awaiting admin batch disbursement approval.',
    processedAt: null,
    createdAt: new Date('2026-03-01T09:00:00Z'),
    updatedAt: new Date('2026-03-01T09:00:00Z')
  }
];

export const fallbackSettlementItems = [
  {
    id: 'si_101a',
    settlementId: 'stl_101',
    orderId: 'ord_101',
    orderAmount: 265.00,
    refundDeducted: 0.00,
    commissionRate: 5.0,
    commissionAmount: 13.25,
    netPayable: 251.75
  },
  {
    id: 'si_101b',
    settlementId: 'stl_101',
    orderId: 'ord_105',
    orderAmount: 85.00,
    refundDeducted: 0.00,
    commissionRate: 5.0,
    commissionAmount: 4.25,
    netPayable: 80.75
  }
];

export const fallbackCodCollections = [
  {
    id: 'cod_col_1',
    orderId: 'ord_108',
    deliveryBoyId: 'db_boy_1',
    amountExpected: 180.00,
    amountCollected: 180.00,
    difference: 0.00,
    collectionStatus: 'HANDED_OVER',
    reconciliationStatus: 'RECONCILED',
    reconciliationNotes: 'Verified and matched with cash vault deposit.',
    collectedAt: pastDays(6, 11),
    createdAt: pastDays(6, 12),
    updatedAt: pastDays(6, 10)
  },
  {
    id: 'cod_col_2',
    orderId: 'ord_102',
    deliveryBoyId: 'db_boy_2',
    amountExpected: 1350.00,
    amountCollected: 1350.00,
    difference: 0.00,
    collectionStatus: 'COLLECTED',
    reconciliationStatus: 'PENDING',
    reconciliationNotes: 'Cash collected by runner; physical handover scheduled for evening reconciliation.',
    collectedAt: pastDays(1, 1),
    createdAt: pastDays(1, 2),
    updatedAt: pastDays(1, 1)
  },
  {
    id: 'cod_col_3',
    orderId: 'ord_110',
    deliveryBoyId: 'db_boy_2',
    amountExpected: 220.00,
    amountCollected: 200.00,
    difference: -20.00,
    collectionStatus: 'COLLECTED',
    reconciliationStatus: 'MISMATCH',
    reconciliationNotes: 'Runner reported student provided short change by ₹20; student agreed to adjust in next order.',
    collectedAt: pastDays(3, 2),
    createdAt: pastDays(3, 4),
    updatedAt: pastDays(3, 1)
  }
];

export const fallbackFinancialLedger = [
  {
    id: 'fl_001',
    orderId: 'ord_101',
    settlementId: null,
    entryType: 'ORDER_PAYMENT',
    debitAccount: 'CAMPUS_ESCROW_RAZORPAY',
    creditAccount: 'STUDENT_RECEIVABLES',
    amount: 265.00,
    currency: 'INR',
    referenceId: 'PAY_ORD_101_RAZORPAY',
    description: 'Online student checkout via Razorpay for Order NIT-ORD-9021',
    metadata: JSON.stringify({ method: 'UPI', orderNumber: 'NIT-ORD-9021' }),
    createdAt: pastDays(0, 2)
  },
  {
    id: 'fl_002',
    orderId: 'ord_101',
    settlementId: null,
    entryType: 'COMMISSION_EARNED',
    debitAccount: 'CAMPUS_ESCROW_RAZORPAY',
    creditAccount: 'PLATFORM_COMMISSION_REVENUE',
    amount: 13.25,
    currency: 'INR',
    referenceId: 'COMM_ORD_101',
    description: 'Platform 5.0% commission recognized on Order NIT-ORD-9021',
    metadata: JSON.stringify({ rate: 5.0, baseAmount: 265.00 }),
    createdAt: pastDays(0, 2)
  },
  {
    id: 'fl_003',
    orderId: 'ord_101',
    settlementId: null,
    entryType: 'PROVIDER_PAYABLE',
    debitAccount: 'CAMPUS_ESCROW_RAZORPAY',
    creditAccount: 'PROVIDER_PAYABLE_prov_canteen',
    amount: 251.75,
    currency: 'INR',
    referenceId: 'PAYABLE_ORD_101',
    description: 'Net payable allocated to Canteen Vendor for Order NIT-ORD-9021',
    metadata: JSON.stringify({ providerId: 'prov_canteen', gross: 265.00, commission: 13.25 }),
    createdAt: pastDays(0, 2)
  },
  {
    id: 'fl_004',
    orderId: 'ord_112',
    settlementId: null,
    entryType: 'REFUND_ISSUED',
    debitAccount: 'STUDENT_REFUND_LIABILITY',
    creditAccount: 'CAMPUS_ESCROW_RAZORPAY',
    amount: 75.00,
    currency: 'INR',
    referenceId: 'REF_ORD_112_SOURAV',
    description: 'Full refund credited for cancelled food order NIT-ORD-9032',
    metadata: JSON.stringify({ studentId: 'stud_arun', reason: 'Student cancelled before kitchen preparation' }),
    createdAt: pastDays(20, 8)
  },
  {
    id: 'fl_005',
    orderId: null,
    settlementId: 'stl_101',
    entryType: 'SETTLEMENT_PAYOUT',
    debitAccount: 'PROVIDER_PAYABLE_prov_canteen',
    creditAccount: 'CAMPUS_BANK_CURRENT_ACCOUNT',
    amount: 14509.00,
    currency: 'INR',
    referenceId: 'NEFT_SBI_892348123',
    description: 'Fortnightly provider settlement payout disbursed via NEFT',
    metadata: JSON.stringify({ settlementNumber: 'STL-202602-001', provider: 'Campus Food & Cafeteria Vendor' }),
    createdAt: new Date('2026-02-16T11:30:00Z')
  },
  {
    id: 'fl_006',
    orderId: 'ord_108',
    settlementId: null,
    entryType: 'COD_COLLECTION',
    debitAccount: 'RUNNER_CASH_IN_HAND_db_boy_1',
    creditAccount: 'STUDENT_RECEIVABLES_COD',
    amount: 180.00,
    currency: 'INR',
    referenceId: 'COD_ORD_108',
    description: 'Physical cash collected at Hall 5 gate for Order NIT-ORD-9028',
    metadata: JSON.stringify({ runner: 'Bikash Mondal (Lead Runner)', orderNumber: 'NIT-ORD-9028' }),
    createdAt: pastDays(6, 11)
  }
];

export const fallbackAdminStatusOverrides = [
  {
    id: 'aso_1',
    orderId: 'ord_112',
    adminUserId: 'user_admin_sourav',
    previousStatus: 'PENDING',
    newStatus: 'REFUNDED',
    statusType: 'REFUND',
    reason: 'Student cancelled order within permitted 60-second window before canteen accepted.',
    notes: 'Approved without penalty as per campus dining cancellation policy.',
    createdAt: pastDays(20, 8)
  }
];

export const fallbackCancellationRequests = [
  {
    id: 'cnl_1',
    orderId: 'ord_112',
    requestedByUserId: 'user_student_sourav',
    role: 'STUDENT',
    reason: 'Mistakenly ordered extra portion',
    status: 'APPROVED',
    adminNotes: 'Order was not yet preparing.',
    reviewedByUserId: 'user_admin_sourav',
    createdAt: pastDays(20, 9),
    reviewedAt: pastDays(20, 8)
  }
];

export const fallbackFoodOrderDetails = [
  {
    id: 'fod_101',
    orderId: 'ord_101',
    prepTimeMinutes: 20,
    dietaryFlag: 'REGULAR',
    kitchenNotes: 'Keep packaging sealed and deliver hot to room B-304',
    spicinessLevel: 'MEDIUM',
    acceptedAt: pastDays(0, 2),
    prepStartedAt: pastDays(0, 2),
    readyAt: pastDays(0, 1),
    createdAt: pastDays(0, 2),
    updatedAt: pastDays(0, 1)
  },
  {
    id: 'fod_201',
    orderId: 'ord_201',
    prepTimeMinutes: 15,
    dietaryFlag: 'HALAL',
    kitchenNotes: 'Add extra green chutney with samosas',
    spicinessLevel: 'MILD',
    acceptedAt: pastDays(0, 1),
    prepStartedAt: pastDays(0, 1),
    readyAt: pastDays(0, 0),
    createdAt: pastDays(0, 1),
    updatedAt: pastDays(0, 0)
  }
];

export const fallbackLaundryOrderDetails = [
  {
    id: 'lod_501',
    orderId: 'ord_lnd_501',
    serviceOption: 'WASH_STEAM_IRON',
    clothesCount: 6,
    weightKg: 2.5,
    expressDelivery: true,
    pickupOtp: '482910',
    deliveryOtp: '739182',
    pickupOtpVerified: true,
    deliveryOtpVerified: false,
    specialInstructions: 'White shirts - use gentle detergent and steam press collar',
    washCyclesApplied: 'Gentle Warm 40C',
    detergentPreference: 'Hypoallergenic Gentle',
    ironingTemperature: 'Medium Cotton',
    stainNotes: 'Light tea stain on blue polo - pretreated',
    weighingProofUrl: null,
    actualPickupTime: pastDays(1, 2),
    actualDeliveryTime: null,
    createdAt: pastDays(1, 4),
    updatedAt: pastDays(1, 1)
  }
];

export const fallbackProduceOrderDetails = [
  {
    id: 'pod_1',
    orderId: 'ord_produce_1',
    organicCertified: true,
    harvestDate: pastDays(1),
    storageTemperatureCelsius: 12.0,
    freshnessGuaranteeHours: 48,
    gradingTier: 'A_GRADE',
    createdAt: pastDays(0, 5),
    updatedAt: pastDays(0, 5)
  }
];

export const fallbackStationeryOrderDetails = [
  {
    id: 'sod_104',
    orderId: 'ord_104',
    isExamEssential: true,
    paperGsm: null,
    bindingType: null,
    printSpecJson: null,
    brandCertification: 'Camlin / Faber-Castell Engineering Certified',
    warrantyMonths: 6,
    createdAt: pastDays(1, 3),
    updatedAt: pastDays(1, 2)
  }
];

export const fallbackDeliveryBoyEarnings: any[] = [
  {
    id: 'earning_sample_1',
    deliveryBoyId: 'db_boy_1',
    orderId: 'ord_sample_delivered_1',
    amount: 10.00,
    paymentType: 'PER_DELIVERY',
    earningType: 'DELIVERY_PAYOUT',
    description: 'Order #CB10284 delivered',
    adminAdjustedBy: null,
    createdAt: new Date(Date.now() - 3600 * 1000 * 4)
  },
  {
    id: 'earning_sample_2',
    deliveryBoyId: 'db_boy_1',
    orderId: 'ord_sample_delivered_2',
    amount: 10.00,
    paymentType: 'PER_DELIVERY',
    earningType: 'DELIVERY_PAYOUT',
    description: 'Order #CB10285 delivered',
    adminAdjustedBy: null,
    createdAt: new Date(Date.now() - 3600 * 1000 * 2)
  }
];

export const fallbackDeliveryBoyPayoutAccounts: any[] = [
  {
    id: 'payout_acc_1',
    deliveryBoyId: 'db_boy_1',
    accountType: 'UPI',
    accountHolderName: 'Bikash Mondal (Lead Runner)',
    bankName: null,
    accountNumber: null,
    ifscCode: null,
    upiId: 'bikash.runner@okhdfcbank',
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 7),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 7)
  },
  {
    id: 'payout_acc_2',
    deliveryBoyId: 'db_boy_2',
    accountType: 'BANK_TRANSFER',
    accountHolderName: 'Rajesh Kumar (Express Runner)',
    bankName: 'State Bank of India (NIT Campus Branch)',
    accountNumber: '30492819203',
    ifscCode: 'SBIN0002108',
    upiId: null,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 14),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 14)
  }
];

export const fallbackDeliveryBoyWithdrawals: any[] = [
  {
    id: 'wdr_sample_1',
    withdrawalNumber: 'WDR-2026-0001',
    deliveryBoyId: 'db_boy_1',
    amount: 500.00,
    status: 'DISTRIBUTED',
    payoutMethod: 'UPI',
    accountDetails: JSON.stringify({
      accountType: 'UPI',
      accountHolderName: 'Bikash Mondal (Lead Runner)',
      upiId: 'bikash.runner@okhdfcbank'
    }),
    adminNotes: 'Weekly earnings disbursement approved by Campus Admin',
    processedBy: 'Sourav Senapati',
    utrReference: 'UPI/20260901/984729103948',
    requestedAt: new Date(Date.now() - 3600 * 1000 * 24 * 5),
    approvedAt: new Date(Date.now() - 3600 * 1000 * 24 * 4),
    distributedAt: new Date(Date.now() - 3600 * 1000 * 24 * 4),
    rejectedAt: null,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 5),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 4)
  },
  {
    id: 'wdr_sample_2',
    withdrawalNumber: 'WDR-2026-0002',
    deliveryBoyId: 'db_boy_1',
    amount: 250.00,
    status: 'PENDING',
    payoutMethod: 'UPI',
    accountDetails: JSON.stringify({
      accountType: 'UPI',
      accountHolderName: 'Bikash Mondal (Lead Runner)',
      upiId: 'bikash.runner@okhdfcbank'
    }),
    adminNotes: null,
    processedBy: null,
    utrReference: null,
    requestedAt: new Date(Date.now() - 3600 * 1000 * 6),
    approvedAt: null,
    distributedAt: null,
    rejectedAt: null,
    createdAt: new Date(Date.now() - 3600 * 1000 * 6),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 6)
  }
];


