const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock user data
export interface OrderData {
  personalDetails: {
    name: string;
    designation: string;
    company: string;
    mobile: string;
    email: string;
  };
  businessDetails: {
    address: string;
    website: string;
    about: string;
    services: string;
  };
  socialLinks: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
  };
  uploads: {
    profileImage?: File;
    logo?: File;
    coverImage?: File;
    gallery?: File[];
  };
  /**
   * The product being bought. Required.
   *
   * There is deliberately no price, template name or template slug on this
   * type any more. The server reads the product row by this id and computes
   * the amount from it, so nothing the browser sends can change what gets
   * charged.
   */
  productId: string;
  payment?: {
    method?: string;
    terms?: boolean;
  };
}

// Mock API functions
/**
 * Create the order row. It lands PENDING and unpaid.
 *
 * The body carries the customer's details and `productId` - and NO price.
 *
 * It used to send `price: data.templatePrice ?? priceMap[...] ?? 599`, which
 * the API then wrote straight to Order.total. That made the amount charged a
 * client-supplied value: a crafted request could buy a 999 rupee card for 1
 * rupee. The price is now looked up server-side from productId.
 */
export const createOrder = async (data: OrderData) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId: data.productId,
      name: data.personalDetails.name,
      email: data.personalDetails.email,
      phone: data.personalDetails.mobile,
      designation: data.personalDetails.designation,
      company: data.personalDetails.company,
      website: data.businessDetails.website,
      address: data.businessDetails.address,
      paymentMethod: data.payment?.method || 'card',
      profileData: data,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || payload.message || 'Failed to create order');
  }

  return {
    success: true,
    orderId: payload.orderId,
    message: payload.message || 'Order created successfully',
    data: payload.order,
  };
};

export const fetchTemplates = async () => {
  await delay(600);
  return [
    {
      id: 1,
      name: 'Modern Minimalist',
      plan: 'basic',
      image: '/placeholder-template-1.jpg',
    },
    {
      id: 2,
      name: 'Professional Blue',
      plan: 'pro',
      image: '/placeholder-template-2.jpg',
    },
    {
      id: 3,
      name: 'Creative Gradient',
      plan: 'premium',
      image: '/placeholder-template-3.jpg',
    },
    {
      id: 4,
      name: 'Elegant Black',
      plan: 'basic',
      image: '/placeholder-template-4.jpg',
    },
    {
      id: 5,
      name: 'Tech Futuristic',
      plan: 'pro',
      image: '/placeholder-template-5.jpg',
    },
    {
      id: 6,
      name: 'Luxury Gold',
      plan: 'premium',
      image: '/placeholder-template-6.jpg',
    },
  ];
};

export const fetchPricingPlans = async () => {
  await delay(500);
  return [
    {
      id: 'basic',
      name: 'Basic',
      price: 2999,
      currency: 'INR',
      period: 'year',
      description: 'Perfect for getting started',
      features: [
        'Digital Business Card',
        '1 Template',
        'Basic Customization',
        'Mobile Preview',
        '1 Year Access',
      ],
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 4999,
      currency: 'INR',
      period: 'year',
      description: 'Best for professionals',
      features: [
        'Digital Business Card',
        '10 Templates',
        'Advanced Customization',
        'Multiple Designs',
        'Analytics Dashboard',
        '3 Special Links',
        '1 Year Access',
      ],
      highlighted: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 7999,
      currency: 'INR',
      period: 'year',
      description: 'For enterprises',
      features: [
        'Unlimited Digital Cards',
        'All Templates',
        'Full Customization',
        'White Label Options',
        'Advanced Analytics',
        'Unlimited Links',
        'Priority Support',
        'Team Management',
        '1 Year Access',
      ],
      highlighted: false,
    },
  ];
};


