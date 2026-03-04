import { z } from "zod";
import { OrderStatus } from "@prisma/client";

// User registration validation
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "CUSTOMER"]).optional(),
});

// Product create / update schema (partial for update)
export const productCreateSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  price: z.preprocess((val) => parseFloat(String(val)), z.number().nonnegative()),
  salePrice: z.preprocess((val) => (val === undefined ? undefined : parseFloat(String(val))), z.number().nonnegative().optional()),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sku: z.string().optional(),
  stock: z.preprocess((val) => (val === undefined ? undefined : parseInt(String(val), 10)), z.number().int().nonnegative().optional()),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  cardType: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
});

export const productUpdateSchema = productCreateSchema.partial();

// Order status update for admin
export const orderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Order creation
export const createOrderSchema = z.object({
  productId: z.string().uuid().or(z.string().min(1)),
  quantity: z.number().int().positive().optional().default(1),
  address: z.string().optional(),
  // add other fields as needed
});

// Card update schema allows partial details
export const updateCardSchema = z.object({
  details: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    title: z.string().optional(),
    company: z.string().optional(),
    bio: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    profileImage: z.string().url().optional(),
    coverImage: z.string().url().optional(),
    logo: z.string().url().optional(),
    socialLinks: z.record(z.string(), z.string().nullable()).optional(),
    customFields: z.array(z.object({
      label: z.string(),
      value: z.string(),
      type: z.string().optional(),
      icon: z.string().optional(),
    })).optional(),
    theme: z.string().optional(),
    primaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
  }).optional(),
  status: z.string().optional(),
  isActive: z.boolean().optional(),
}).partial();

// Newsletter send schema
export const newsletterSchema = z.object({
  subject: z.string().min(1),
  content: z.string().min(1),
  previewText: z.string().optional(),
});

// Lead/contact submission schema
export const leadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().max(2000).optional(),
  source: z.string().optional(),
  website: z.string().optional(), // honeypot
});

// Add additional schemas as needed for other endpoints
