import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.info('Seeding NIT Durgapur Campus Services Platform data...');

  const passwordHash = await bcrypt.hash('CampusAdmin@2026', 10);
  const providerPassHash = await bcrypt.hash('Provider@2026', 10);
  const studentPassHash = await bcrypt.hash('Student@2026', 10);

  // 1. Service Zones
  console.info('Creating Campus Service Zones...');
  const zoneA = await prisma.serviceZone.upsert({
    where: { name: 'Zone A - Academic & Central Complex' },
    update: {},
    create: {
      name: 'Zone A - Academic & Central Complex',
      polygonCoordinates: JSON.stringify([
        { lat: 23.5505, lng: 87.2910 },
        { lat: 23.5535, lng: 87.2970 },
        { lat: 23.5480, lng: 87.3000 },
        { lat: 23.5460, lng: 87.2930 }
      ]),
      isActive: true,
      availableServices: '["FOOD","FRUITS","LAUNDRY","ESSENTIALS"]'
    }
  });

  const zoneB = await prisma.serviceZone.upsert({
    where: { name: 'Zone B - Halls 1 to 8 & Sports Grounds' },
    update: {},
    create: {
      name: 'Zone B - Halls 1 to 8 & Sports Grounds',
      polygonCoordinates: JSON.stringify([
        { lat: 23.5420, lng: 87.2880 },
        { lat: 23.5470, lng: 87.2950 },
        { lat: 23.5430, lng: 87.2980 },
        { lat: 23.5400, lng: 87.2900 }
      ]),
      isActive: true,
      availableServices: '["FOOD","FRUITS","LAUNDRY","ESSENTIALS"]'
    }
  });

  const zoneC = await prisma.serviceZone.upsert({
    where: { name: 'Zone C - New Halls 11, 12, 13, 14 & Girls Hostels' },
    update: {},
    create: {
      name: 'Zone C - New Halls 11, 12, 13, 14 & Girls Hostels',
      polygonCoordinates: JSON.stringify([
        { lat: 23.5520, lng: 87.2850 },
        { lat: 23.5550, lng: 87.2920 },
        { lat: 23.5510, lng: 87.2940 },
        { lat: 23.5480, lng: 87.2870 }
      ]),
      isActive: true,
      availableServices: '["FOOD","FRUITS","LAUNDRY","ESSENTIALS"]'
    }
  });

  // 2. NIT Durgapur Halls
  console.info('Creating NIT Durgapur Residence Halls...');
  const halls = [
    { name: 'Hall 1', number: '1', zoneId: zoneB.id },
    { name: 'Hall 2', number: '2', zoneId: zoneB.id },
    { name: 'Hall 3', number: '3', zoneId: zoneB.id },
    { name: 'Hall 4', number: '4', zoneId: zoneB.id },
    { name: 'Hall 5', number: '5', zoneId: zoneB.id },
    { name: 'Hall 7', number: '7', zoneId: zoneB.id },
    { name: 'Hall 8', number: '8', zoneId: zoneB.id },
    { name: 'Hall 9', number: '9', zoneId: zoneB.id },
    { name: 'Hall 10', number: '10', zoneId: zoneB.id },
    { name: 'Hall 11', number: '11', zoneId: zoneC.id },
    { name: 'Hall 12', number: '12', zoneId: zoneC.id },
    { name: 'Hall 13', number: '13', zoneId: zoneC.id },
    { name: 'Hall 14', number: '14', zoneId: zoneC.id },
    { name: 'Mother Teresa Hall', number: 'MTH', zoneId: zoneC.id },
    { name: 'Sister Nivedita Hall', number: 'SNH', zoneId: zoneC.id },
    { name: 'Gargi Hall', number: 'GH', zoneId: zoneC.id }
  ];

  const createdHalls = [];
  for (const h of halls) {
    const hall = await prisma.hall.upsert({
      where: { name: h.name },
      update: {},
      create: {
        name: h.name,
        hallNumber: h.number,
        serviceZoneId: h.zoneId,
        isActive: true,
        isServiceable: true,
        deliveryInstructions: 'Delivery at Hostel Security Gate / Wing Common Room'
      }
    });
    createdHalls.push(hall);
  }

  // 3. Admin Account
  console.info('Bootstrapping Admin Account (souravsenapati408@gmail.com)...');
  const adminPassHash = await bcrypt.hash('Sourav@12345', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'souravsenapati408@gmail.com' },
    update: { passwordHash: adminPassHash },
    create: {
      email: 'souravsenapati408@gmail.com',
      passwordHash: adminPassHash,
      role: 'ADMIN',
      isActive: true,
      admin: {
        create: {
          fullName: 'Sourav Senapati',
          permissions: 'ALL'
        }
      }
    }
  });

  // Secondary admin
  await prisma.user.upsert({
    where: { email: 'admin@nitdgp.ac.in' },
    update: { passwordHash: adminPassHash },
    create: {
      email: 'admin@nitdgp.ac.in',
      passwordHash: adminPassHash,
      role: 'ADMIN',
      isActive: true,
      admin: {
        create: {
          fullName: 'Campus Operations Administrator',
          permissions: 'ALL'
        }
      }
    }
  });

  // 4. Service Providers
  console.info('Creating Campus Service Providers...');
  const vendorPassHash = await bcrypt.hash('Vendor@12345', 10);
  await prisma.user.upsert({
    where: { email: 'vendor@nitdgp.ac.in' },
    update: { passwordHash: vendorPassHash },
    create: {
      email: 'vendor@nitdgp.ac.in',
      passwordHash: vendorPassHash,
      role: 'SERVICE_PROVIDER',
      isActive: true,
      provider: {
        create: {
          fullName: 'Campus Services Dispatch & Vendor Cell',
          mobileNumber: '9876543200',
          serviceCategory: 'ALL',
          assignedZones: 'ALL',
          activeStatus: true
        }
      }
    }
  });

  const laundryProviderUser = await prisma.user.upsert({
    where: { email: 'laundry.vendor@nitdgp.ac.in' },
    update: {},
    create: {
      email: 'laundry.vendor@nitdgp.ac.in',
      passwordHash: providerPassHash,
      role: 'SERVICE_PROVIDER',
      isActive: true,
      provider: {
        create: {
          fullName: 'NIT Durgapur Campus Laundry Cell',
          mobileNumber: '9876543210',
          serviceCategory: 'LAUNDRY',
          assignedZones: 'ALL',
          activeStatus: true
        }
      }
    }
  });

  const foodProviderUser = await prisma.user.upsert({
    where: { email: 'canteen.vendor@nitdgp.ac.in' },
    update: {},
    create: {
      email: 'canteen.vendor@nitdgp.ac.in',
      passwordHash: providerPassHash,
      role: 'SERVICE_PROVIDER',
      isActive: true,
      provider: {
        create: {
          fullName: 'Campus Food & Cafeteria Vendor',
          mobileNumber: '9876543211',
          serviceCategory: 'FOOD',
          assignedZones: 'ALL',
          activeStatus: true
        }
      }
    }
  });

  // 5. Test Student Account
  console.info('Creating Verified Test Student...');
  const sampleStudent = await prisma.user.upsert({
    where: { email: 'ss.24u10227@nitdgp.ac.in' },
    update: {},
    create: {
      email: 'ss.24u10227@nitdgp.ac.in',
      passwordHash: studentPassHash,
      role: 'STUDENT',
      isActive: true,
      student: {
        create: {
          fullName: 'Sourav Senapati',
          rollNumber: '24U10227',
          registrationNumber: '202410227',
          mobileNumber: '9876501234',
          hallId: createdHalls[9].id, // Hall 11
          hallNumber: '11',
          roomNumber: 'B-304',
          isVerified: true
        }
      }
    },
    include: { student: true }
  });

  if (sampleStudent.student) {
    await prisma.cart.upsert({
      where: { studentId: sampleStudent.student.id },
      update: {},
      create: { studentId: sampleStudent.student.id }
    });
  }

  // 6. Categories
  console.info('Creating Categories...');
  const catFood = await prisma.category.upsert({
    where: { slug: 'food' },
    update: {},
    create: {
      name: 'Food & Meals',
      slug: 'food',
      description: 'Hot, freshly prepared campus meals, biryani, snacks, and cafeteria specials',
      displayOrder: 1
    }
  });

  const catFruits = await prisma.category.upsert({
    where: { slug: 'fruits' },
    update: {},
    create: {
      name: 'Fresh Fruits',
      slug: 'fruits',
      description: 'Handpicked fresh seasonal fruits delivered directly to your hostel room',
      displayOrder: 2
    }
  });

  const catLaundry = await prisma.category.upsert({
    where: { slug: 'laundry' },
    update: {},
    create: {
      name: 'Laundry Services',
      slug: 'laundry',
      description: 'Doorstep room pickup, automated wash, steam iron, and dual-OTP verified return',
      displayOrder: 3
    }
  });

  const catEssentials = await prisma.category.upsert({
    where: { slug: 'essentials' },
    update: {},
    create: {
      name: 'Stationery & Essentials',
      slug: 'essentials',
      description: 'Calculators, engineering notebooks, pens, print paper, and dorm essentials',
      displayOrder: 4
    }
  });

  // 7. Products
  console.info('Creating Products...');
  const products = [
    // Food
    {
      name: 'Kolkata Style Chicken Biryani',
      slug: 'kolkata-chicken-biryani',
      categoryId: catFood.id,
      description: 'Fragrant basmati rice cooked with succulent chicken piece, boiled egg, and golden spiced potato.',
      price: 140,
      discountPrice: 125,
      unit: 'plate',
      stock: 45,
      lowStockThreshold: 10,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800'
    },
    {
      name: 'Egg Curry with Steamed Basmati Rice',
      slug: 'egg-curry-rice',
      categoryId: catFood.id,
      description: 'Two spiced eggs in home-style tomato-onion gravy served with piping hot steamed rice.',
      price: 80,
      discountPrice: 75,
      unit: 'meal',
      stock: 35,
      lowStockThreshold: 5,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800'
    },
    {
      name: 'Paneer Butter Masala Combo',
      slug: 'paneer-butter-masala-combo',
      categoryId: catFood.id,
      description: 'Rich cottage cheese cubes in buttery creamy tomato gravy served with 3 butter rotis and salad.',
      price: 110,
      discountPrice: 99,
      unit: 'combo',
      stock: 25,
      lowStockThreshold: 5,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800'
    },
    {
      name: 'Campus Samosa & Masala Chai Combo',
      slug: 'samosa-chai-combo',
      categoryId: catFood.id,
      description: 'Two crisp golden aloo samosas served with tangy chutney and a steaming cup of ginger masala tea.',
      price: 25,
      discountPrice: null,
      unit: 'combo',
      stock: 80,
      lowStockThreshold: 15,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800'
    },
    // Fruits
    {
      name: 'Kashmiri Crisp Apples',
      slug: 'kashmiri-apples',
      categoryId: catFruits.id,
      description: 'Sweet, crisp, and nutrient-dense fresh Kashmiri red apples.',
      price: 150,
      discountPrice: 135,
      unit: 'kg',
      stock: 30,
      lowStockThreshold: 5,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800'
    },
    {
      name: 'Robusta Ripe Bananas',
      slug: 'robusta-bananas',
      categoryId: catFruits.id,
      description: 'Naturally ripened, potassium-rich fresh bananas.',
      price: 60,
      discountPrice: 50,
      unit: 'dozen',
      stock: 50,
      lowStockThreshold: 10,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800'
    },
    {
      name: 'Nagpur Sweet Oranges',
      slug: 'nagpur-oranges',
      categoryId: catFruits.id,
      description: 'Juicy, vitamin-C packed sweet oranges from Nagpur orchards.',
      price: 90,
      discountPrice: 80,
      unit: 'kg',
      stock: 25,
      lowStockThreshold: 5,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800'
    },
    // Essentials
    {
      name: 'Casio fx-991EX Classwiz Scientific Calculator',
      slug: 'casio-fx-991ex-calculator',
      categoryId: catEssentials.id,
      description: 'High-resolution LCD display, 552 functions, matrix, vector, integration for engineering students.',
      price: 1350,
      discountPrice: 1250,
      unit: 'piece',
      stock: 12,
      lowStockThreshold: 3,
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800'
    },
    {
      name: 'Classmate Hardbound Long Exercise Notebook (180 pgs)',
      slug: 'classmate-long-notebook',
      categoryId: catEssentials.id,
      description: 'Smooth ozone-treated elemental chlorine-free paper, ruled, ideal for engineering lectures.',
      price: 70,
      discountPrice: 60,
      unit: 'book',
      stock: 100,
      lowStockThreshold: 20,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800'
    },
    {
      name: 'A4 75 GSM High-Speed Copier Paper (Pack of 100)',
      slug: 'a4-copier-paper-100',
      categoryId: catEssentials.id,
      description: 'Bright white 75 GSM paper for laboratory reports, term papers, and thesis printing.',
      price: 95,
      discountPrice: 85,
      unit: 'pack',
      stock: 40,
      lowStockThreshold: 8,
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800'
    }
  ];

  for (const p of products) {
    const createdProduct = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice,
        unit: p.unit,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        availability: true,
        isFeatured: p.isFeatured,
        availableToday: true,
        inventory: {
          create: {
            currentStock: p.stock,
            lowStockThreshold: p.lowStockThreshold,
            isOutOfStock: p.stock <= 0
          }
        },
        images: {
          create: {
            googleDriveFileId: `seed_${p.slug}`,
            googleDriveUrl: p.imageUrl,
            fileName: `${p.slug}.jpg`,
            mimeType: 'image/jpeg',
            fileSize: 102400,
            isPrimary: true,
            uploadedBy: 'ADMIN'
          }
        }
      }
    });
  }

  // 8. Coupons
  console.info('Creating Coupons...');
  await prisma.coupon.upsert({
    where: { code: 'NITFRESH' },
    update: {},
    create: {
      code: 'NITFRESH',
      description: 'Welcome offer for NIT Durgapur students - 20% off up to ₹50',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderAmount: 100,
      maxDiscountAmount: 50,
      perUserLimit: 2,
      isActive: true
    }
  });

  await prisma.coupon.upsert({
    where: { code: 'EXAM2026' },
    update: {},
    create: {
      code: 'EXAM2026',
      description: 'Semester Exam Booster - Flat ₹30 off on midnight snacks & essentials',
      discountType: 'FIXED',
      discountValue: 30,
      minOrderAmount: 150,
      perUserLimit: 3,
      isActive: true
    }
  });

  // 9. Admin Settings
  console.info('Configuring Admin Settings...');
  const settings = [
    { key: 'APP_NAME', value: 'NIT Durgapur Campus Services' },
    { key: 'APP_TAGLINE', value: 'Food, Fruits, Laundry & Essentials — Made for Campus Life' },
    { key: 'ENABLE_CASH_ON_DELIVERY', value: 'true' },
    { key: 'MAX_COD_AMOUNT', value: '1500' },
    { key: 'DELIVERY_FEE_FLAT', value: '15' },
    { key: 'FREE_DELIVERY_THRESHOLD', value: '250' },
    { key: 'MAINTENANCE_MODE', value: 'false' },
    { key: 'SUPPORT_EMAIL', value: 'services@nitdgp.ac.in' },
    { key: 'SUPPORT_PHONE', value: '+91 343 275 4000' }
  ];

  for (const s of settings) {
    await prisma.adminSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value }
    });
  }

  // 10. Announcements
  console.info('Creating Campus Announcements...');
  await prisma.announcement.create({
    data: {
      title: 'Welcome to NIT Durgapur Campus Marketplace',
      message: 'Verified student services are now live across all 14 residence halls! Order meals, fresh fruits, express laundry, and academic essentials with direct room delivery.',
      targetService: 'ALL',
      targetZone: 'ALL',
      isActive: true
    }
  });

  console.info('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
