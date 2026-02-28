export interface CardTemplate {
  id: number;
  name: string;
  slug: string;
  type: 'basic' | 'premium' | 'custom';
  price: string;
  priceValue: number;
  color: string;
  description?: string;
}

export const cardTemplates: CardTemplate[] = [
  {
    id: 1,
    name: 'Modern Minimalist',
    slug: 'modern-minimalist',
    type: 'basic',
    price: '₹599',
    priceValue: 599,
    color: 'linear-gradient(135deg, #e0e0e0 0%, #9e9e9e 100%)',
  },
  {
    id: 2,
    name: 'Professional Blue',
    slug: 'professional-blue',
    type: 'basic',
    price: '₹599',
    priceValue: 599,
    color: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
  },
  {
    id: 3,
    name: 'Executive Black',
    slug: 'executive-black',
    type: 'basic',
    price: '₹599',
    priceValue: 599,
    color: 'linear-gradient(135deg, #424242 0%, #212121 100%)',
  },
  {
    id: 4,
    name: 'Creative Gradient',
    slug: 'creative-gradient',
    type: 'premium',
    price: '₹799',
    priceValue: 799,
    color: 'linear-gradient(135deg, #7c4dff 0%, #18ffff 100%)',
  },
  {
    id: 5,
    name: 'Corporate Gold',
    slug: 'corporate-gold',
    type: 'premium',
    price: '₹799',
    priceValue: 799,
    color: 'linear-gradient(135deg, #ffd54f 0%, #ff8f00 100%)',
  },
  {
    id: 6,
    name: 'Custom Design',
    slug: 'custom-design',
    type: 'custom',
    price: '',
    priceValue: 0,
    color: 'linear-gradient(135deg, #0f2e25 0%, #14532d 100%)',
    description: 'Want a fully personalized NFC card? Contact our team.',
  },
];

export function getTemplateBySlug(slug: string): CardTemplate | undefined {
  return cardTemplates.find((t) => t.slug === slug);
}

export function getDefaultTemplate(): CardTemplate {
  return cardTemplates[0];
}
