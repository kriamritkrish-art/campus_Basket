import { z } from 'zod';

export const checkoutOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive('Quantity must be at least 1')
      })
    )
    .min(1, 'Cart cannot be empty'),
  paymentMethod: z.enum(['RAZORPAY', 'CASH_ON_DELIVERY']),
  couponCode: z.string().optional(),
  hallName: z.string().min(1, 'Hall name is required'),
  hallNumber: z.string().optional(),
  roomNumber: z.string().min(1, 'Room number is required'),
  specialInstructions: z.string().max(500).optional(),
  // Geolocation for campus validation
  location: z
    .object({
      lat: z.number(),
      lng: z.number()
    })
    .optional()
});

export const laundryOrderSchema = z.object({
  hallName: z.string().min(1, 'Hall name is required'),
  hallNumber: z.string().optional(),
  roomNumber: z.string().min(1, 'Room number is required'),
  pickupDate: z.string().min(1, 'Pickup date is required'),
  preferredPickupTime: z.string().min(1, 'Preferred pickup time is required'),
  preferredReturnTime: z.string().min(1, 'Preferred return time is required'),
  specialInstructions: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        itemType: z.string().min(1, 'Item type is required'),
        quantity: z.number().int().positive('Quantity must be at least 1')
      })
    )
    .min(1, 'At least one clothing item is required'),
  location: z
    .object({
      lat: z.number(),
      lng: z.number()
    })
    .optional(),
  clothPhotos: z.array(z.string()).optional(),
  photos: z
    .array(
      z.object({
        url: z.string(),
        description: z.string().optional()
      })
    )
    .optional()
});

export const verifyLaundryOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'Must be numeric OTP')
});

export const laundryConditionSchema = z.object({
  conditionNote: z.string().max(1000).optional(),
  damages: z.array(z.string()).optional() // e.g. ["Torn seam", "Existing oil stain", "Missing button"]
});

export const createReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional()
});

export const createSupportTicketSchema = z.object({
  orderId: z.string().optional(),
  category: z.enum(['PAYMENT', 'LAUNDRY', 'FOOD', 'DELIVERY', 'ACCOUNT', 'OTHER']),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM')
});
