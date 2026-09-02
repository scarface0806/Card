import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { sanitizePhoneValue } from "@/lib/validations/common";

/**
 * Indian mobile number, normalised to the bare 10 digits we store.
 *
 * The rules are copied from personalDetails.mobile in
 * src/lib/validations/createCardFormSchema.ts on purpose: an account created at
 * signup and an order placed at checkout must agree on what a valid number is,
 * or guest orders stop matching accounts by phone. sanitizePhoneValue strips a
 * +91 / 91 / 0 prefix and every separator first, so "+91 78713 61025",
 * "078713 61025" and "7871361025" all normalise to the same stored value.
 */
const mobileRegex = /^[6-9]\d{9}$/;

export const indianMobileSchema = z
  .string()
  .transform((value) => sanitizePhoneValue(value))
  .pipe(
    z
      .string()
      .min(1, "Mobile number is required")
      .refine((value) => value.length === 10, {
        message: "Enter a valid 10-digit mobile number",
      })
      .refine((value) => mobileRegex.test(value), {
        message: "Mobile number must start with 6, 7, 8 or 9",
      })
      // 1111111111 and friends pass the two checks above but are never real.
      .refine((value) => !/^([0-9])\1{9}$/.test(value), {
        message: "Enter a valid mobile number",
      })
  );

/**
 * User registration.
 *
 * `phone` is REQUIRED. The whole point of an account here is that the business
 * can reach the customer about their order - primarily on WhatsApp - so an
 * account with no mobile number cannot do the one job it exists for. It used
 * to be `z.string().optional()` with no format check at all.
 */
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2, "Please enter your full name"),
  phone: indianMobileSchema,
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
/**
 * Order creation.
 *
 * NOTE WHAT IS NOT HERE: there is no `price`, and no `cardType`. Both used to
 * be accepted and `price` was written straight to Order.total, which made the
 * amount charged a client-supplied value. They are now derived server-side from
 * `productId`, and because the fields are absent from this schema zod strips
 * them - so a request that sends a price cannot have it read by accident.
 *
 * `productId` is required: every order is for a product row that exists.
 */
export const createOrderSchema = z.object({
  productId: z
    .string({ error: "A product must be selected" })
    .min(1, "A product must be selected"),
  quantity: z.number().int().positive().max(50).optional().default(1),
  address: z.string().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  designation: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  paymentMethod: z.string().optional(),
  profileData: z.unknown().optional(),
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

// ==================== PAYMENT ADAPTER LAYER SCHEMAS ====================

// Razorpay order creation request.
// NOTE: `amount` is intentionally absent. The price is read from Order.total
// server-side, so a client-supplied amount would be a tampering vector.
export const createPaymentOrderSchema = z.object({
  existingOrderId: z.string().min(1, "Order ID is required"),
  userEmail: z.string().email("Invalid email").optional(),
  userPhone: z.string().min(6, "Invalid phone number").optional(),
  userName: z.string().min(1).optional(),
});

/** @deprecated use createPaymentOrderSchema */
export const createRazorpayOrderSchema = createPaymentOrderSchema;

// Payment verification request
export const verifyPaymentSchema = z.object({
  existingOrderId: z.string().min(1, "Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Payment ID is required"),
  razorpayOrderId: z.string().min(1, "Razorpay Order ID is required"),
  razorpaySignature: z.string().min(1, "Signature is required"),
});

const optionalDate = z
  .union([z.literal(""), z.coerce.date()])
  .optional()
  .nullable();

// Courier / tracking fields, set by an admin before an order is marked SHIPPED.
// Every field is optional so the admin can save progressively, but an empty
// string clears the field rather than storing "" - the shipped email treats
// null and "" the same and refuses to send either way.
export const orderShippingSchema = z.object({
  courierName: z.string().max(120).optional().nullable(),
  trackingNumber: z.string().max(120).optional().nullable(),
  trackingUrl: z
    .union([z.string().url("Tracking URL must be a full URL"), z.literal("")])
    .optional()
    .nullable(),
  // "" comes from an emptied <input type="date">, and means "clear this".
  // Anything else is coerced, so both "2026-09-12" and a full ISO string work.
  expectedDeliveryFrom: optionalDate,
  expectedDeliveryTo: optionalDate,
});

// Public order tracking lookup. Both fields are required and both must match
// the same order - see src/lib/track-order.ts. Lengths are capped so a huge
// body cannot be used to burn rate-limit budget cheaply.
export const trackOrderSchema = z.object({
  ref: z.string().min(1, "Order reference is required").max(64),
  mobile: z.string().min(1, "Mobile number is required").max(24),
});

// Admin transactional email resend. The type must be one of the three known
// email types; see src/lib/emails/types.ts.
export const resendOrderEmailSchema = z.object({
  type: z.enum(["confirmation", "shipped", "delivered"]),
});

// Add additional schemas as needed for other endpoints
