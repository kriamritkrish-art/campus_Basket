export type Role = 'STUDENT' | 'ADMIN' | 'SERVICE_PROVIDER';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED';

export type LaundryStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'PICKUP_SCHEDULED'
  | 'PICKUP_VERIFIED'
  | 'CLOTHES_COLLECTED'
  | 'IN_LAUNDRY'
  | 'WASHING'
  | 'DRYING'
  | 'IRONING'
  | 'READY'
  | 'DELIVERY_SCHEDULED'
  | 'DELIVERY_VERIFIED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Hall {
  id: string;
  name: string;
  hallNumber: string;
  isActive: boolean;
  isServiceable: boolean;
}

export interface Student {
  id: string;
  userId: string;
  fullName: string;
  rollNumber: string;
  registrationNumber: string;
  mobileNumber: string;
  hallId?: string;
  hallNumber?: string;
  roomNumber: string;
  isVerified: boolean;
  hall?: Hall;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  student?: Student;
  admin?: { fullName: string; permissions: string };
  provider?: { fullName: string; serviceCategory: string; mobileNumber: string };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  productsCount?: number;
}

export interface ProductImage {
  id: string;
  googleDriveFileId: string;
  googleDriveUrl: string;
  fileName: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  unit: string;
  stock: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  availableToday: boolean;
  category?: Category;
  primaryImage?: string | null;
  images?: ProductImage[];
  rating: number;
  reviewsCount: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  itemTotal: number;
  stock: number;
  isOutOfStock: boolean;
  unit: string;
  image?: string | null;
}

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  paymentMethod: 'RAZORPAY' | 'CASH_ON_DELIVERY';
  paymentStatus: string;
  hallName: string;
  roomNumber: string;
  createdAt: string;
  items: OrderItem[];
  receiptNumber?: string;
}

export interface LaundryItem {
  id: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
}

export interface LaundryPhoto {
  id: string;
  googleDriveUrl: string;
  description?: string | null;
  uploadedBy?: string;
  createdAt?: string;
}

export interface LaundryOrder {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  status: LaundryStatus;
  estimatedPrice: number;
  finalPrice?: number | null;
  hallName: string;
  roomNumber: string;
  pickupDate: string;
  preferredPickupTime: string;
  preferredReturnTime: string;
  pickupOtp?: string;
  deliveryOtp?: string;
  items: LaundryItem[];
  photos?: LaundryPhoto[];
  createdAt: string;
}
