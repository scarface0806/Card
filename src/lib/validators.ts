import { z } from "zod";
import { OrderStatus } from "@prisma/client";

// User registration validation
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["CUSTOMER"]).optional(), // ✅ Only CUSTOMER allowed for public registration
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
  productId: z.string().uuid().or(z.string().min(1)).optional(),
  quantity: z.number().int().positive().optional().default(1),
  address: z.string().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  designation: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  cardType: z.string().optional(),
  price: z.preprocess(
    (val) => (val === undefined || val === null || val === "" ? undefined : parseFloat(String(val))),
    z.number().nonnegative().optional()
  ),
  paymentMethod: z.string().optional(),
  templateSlug: z.string().optional(),
  profileData: z.unknown().optional(),
}).superRefine((data, ctx) => {
  const hasProductCheckout = Boolean(data.productId);
  const hasFormCheckout = Boolean(data.name && data.email && data.phone && data.cardType && data.price !== undefined);

  if (!hasProductCheckout && !hasFormCheckout) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either product checkout data or card purchase form data is required",
      path: ["productId"],
    });
  }
});

// Card update schema allows partial details
export const updateCardSchema = z.object({
  imageUrl: z.string().url().optional(),
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

export const customerCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  designation: z.string().trim().max(120).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  about: z.string().trim().max(3000).optional().or(z.literal("")),
  phone: z.string().trim().min(6, "Phone is required").max(30),
  email: z.string().trim().email("A valid email is required"),
  mailApiEndpoint: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().trim().max(255).optional().or(z.literal("")),
  websiteEnabled: z.boolean().optional().default(false),
  linkedin: z.string().trim().max(255).optional().or(z.literal("")),
  linkedinEnabled: z.boolean().optional().default(false),
  whatsapp: z.string().trim().max(255).optional().or(z.literal("")),
  whatsappEnabled: z.boolean().optional().default(false),
  instagram: z.string().trim().max(255).optional().or(z.literal("")),
  instagramEnabled: z.boolean().optional().default(false),
  facebook: z.string().trim().max(255).optional().or(z.literal("")),
  facebookEnabled: z.boolean().optional().default(false),
  behance: z.string().trim().max(255).optional().or(z.literal("")),
  behanceEnabled: z.boolean().optional().default(false),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  mapEmbedUrl: z.string().trim().max(2000).optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
});

export const customerUpdateSchema = customerCreateSchema.extend({
  id: z.string().min(1),
});

export const customerLeadSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(6, "Phone is required").max(30),
  email: z.string().trim().email("Please enter a valid email").optional().or(z.literal("")),
  subject: z.string().trim().max(250).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(2000),
  skipEmail: z.boolean().optional().default(false),
});

export const mainWebsiteLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(6, "Phone is required").max(30),
  email: z.string().trim().email("Please enter a valid email").optional().or(z.literal("")),
  subject: z.string().trim().max(250).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  service: z.string().trim().max(120).optional().or(z.literal("")),
});

// Add additional schemas as needed for other endpoints
