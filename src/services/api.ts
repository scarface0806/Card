import axios from 'axios';

// Mock API instance
const API_BASE_URL = 'https://api.nfc-business-card.local';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock API responses
export const mockApiCall = async (delay: number = 800): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, delay));
};

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
  template?: string;
}

export interface PaymentData {
  amount: number;
  plan: string;
  status: 'pending' | 'completed' | 'failed';
}

// Mock API functions
export const createOrder = async (data: OrderData) => {
  await mockApiCall(1000);
  return {
    success: true,
    orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    message: 'Order created successfully',
    data,
  };
};

export const uploadImage = async (file: File, type: 'profile' | 'logo' | 'cover' | 'gallery') => {
  await mockApiCall(800);
  return {
    success: true,
    url: URL.createObjectURL(file),
    filename: file.name,
    type,
    size: file.size,
  };
};

export const verifyPayment = async (orderId: string, paymentMethod: string): Promise<PaymentData> => {
  await mockApiCall(1200);
  return {
    amount: 4999, // In cents
    plan: 'premium',
    status: 'completed',
  };
};

export const fetchTemplates = async () => {
  await mockApiCall(600);
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
  await mockApiCall(500);
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

export default apiClient;
