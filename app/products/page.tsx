'use client';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';
import { Check, Zap, Palette, Shield, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ROUTES } from '@/utils/constants';
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const sessionState = useSession();
  const status = sessionState?.status ?? 'unauthenticated';
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?limit=6');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        const transformedProducts: Product[] = (data.products || []).slice(0, 6).map((product: any) => ({
          id: product.id,
          name: product.name || 'Untitled product',
          price: Number(product.price || 0),
          description: product.description || 'Premium NFC digital business card',
          image: product.image || '',
        }));

        setProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleBuyNow = async (productId: string) => {
    // Check if user is logged in
    if (status === 'unauthenticated') {
      // Redirect to login with return URL
      router.push(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(ROUTES.PRODUCTS)}`);
      return;
    }

    // If still loading session, wait
    if (status === 'loading') {
      return;
    }

    try {
      setBuyingProductId(productId);

      // POST to Order API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const data = await response.json();

      // Redirect to order success page
      if (data.order?.id) {
        router.push(`${ROUTES.ORDER_SUCCESS}?orderId=${data.order.id}`);
      } else {
        router.push(ROUTES.ORDER_SUCCESS);
      }
    } catch (error) {
      console.error('Order error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create order. Please try again.');
    } finally {
      setBuyingProductId(null);
    }
  };

  const features = [
    {
      icon: Zap,
      title: 'Ultra-Fast Sharing',
      description: 'Share your complete profile in milliseconds with a single tap',
    },
    {
      icon: Palette,
      title: 'Beautiful Designs',
      description: 'Choose from 50+ professionally designed templates',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Enterprise-grade encryption protects your information',
    },
  ];

  return (
    <>
      <Navbar />
      <main className="bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff] min-h-screen">
        {/* Hero */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
          </div>

          <div className="site-container text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                <Sparkles className="w-4 h-4" />
                Simple & Transparent Pricing
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold mb-6 text-[#0f2e25] font-space-grotesk"
            >
              Choose Your{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Plan
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-[#4b635d] max-w-3xl mx-auto leading-relaxed"
            >
              Find the perfect plan for your professional needs. No hidden fees, cancel anytime.
            </motion.p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20 md:py-32 bg-white">
          <div className="site-container">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 p-12 text-center">
                <h3 className="text-2xl font-bold text-[#0f2e25] font-space-grotesk">No products available</h3>
                <p className="text-[#4b635d] mt-2">Admin can add products from the dashboard to display them here.</p>
              </div>
            ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {products.map((product, index) => {
                const isPopular = index === 1;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                    onMouseEnter={() => setHoveredProduct(product.id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                    whileHover={{ y: -6 }}
                    className={`relative group rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isPopular
                        ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-xl bg-white md:scale-105'
                        : 'border-teal-100 bg-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isPopular && (
                      <div className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white text-center py-2 text-sm font-semibold">
                        Most Popular
                      </div>
                    )}

                    <div className="p-6">
                      <div className="h-44 w-full overflow-hidden rounded-xl bg-teal-50 mb-6 border border-teal-100">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-[#6b7f78]">No image</div>
                        )}
                      </div>

                      <h3 className="text-2xl font-bold mb-2 text-[#0f2e25] font-space-grotesk">{product.name}</h3>
                      <p className="text-[#6b7f78] text-sm mb-6">{product.description}</p>

                      <div className="mb-8">
                        <div className="text-4xl font-bold text-[#0f2e25] mb-2">₹{product.price.toLocaleString()}</div>
                        <p className="text-[#6b7f78] text-sm">One-time</p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBuyNow(product.id)}
                        disabled={buyingProductId === product.id || status === 'loading'}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          isPopular
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                        }`}
                      >
                        {buyingProductId === product.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Buy Now
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>

                      <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <span className="text-[#4b635d] text-sm">Premium NFC chip</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <span className="text-[#4b635d] text-sm">Free lifetime website</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <span className="text-[#4b635d] text-sm">Instant profile sharing</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            )}
          </div>
        </section>

        {/* Features Showcase */}
        <section className="py-20 md:py-32">
          <div className="site-container">
            <motion.div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0f2e25] font-space-grotesk">Why Choose Tapvyo?</h2>
              <p className="text-lg text-[#4b635d] max-w-2xl mx-auto">
                The most advanced NFC digital business card platform on the market
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 }}
                    whileHover={{ y: -6 }}
                    className="p-8 rounded-2xl border border-teal-100 bg-white shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-[#0f2e25] font-space-grotesk">{feature.title}</h3>
                    <p className="text-[#4b635d]">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 md:py-32 bg-white">
          <div className="site-container">
            <motion.div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0f2e25] font-space-grotesk">Detailed Comparison</h2>
            </motion.div>

            <div className="overflow-x-auto rounded-2xl border border-teal-100 shadow-md bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-teal-100 bg-teal-50">
                    <th className="px-6 py-4 text-left text-[#0f2e25] font-semibold">Feature</th>
                    <th className="px-6 py-4 text-center text-[#0f2e25] font-semibold">Starter</th>
                    <th className="px-6 py-4 text-center text-[#0f2e25] font-semibold">Professional</th>
                    <th className="px-6 py-4 text-center text-[#0f2e25] font-semibold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'NFC Chip', starter: '✓', pro: '✓', enterprise: '✓' },
                    { feature: 'Templates', starter: '10', pro: '50+', enterprise: 'Unlimited' },
                    { feature: 'Analytics', starter: '-', pro: '✓', enterprise: 'Advanced' },
                    { feature: 'Multiple Profiles', starter: '-', pro: '✓', enterprise: '✓' },
                    { feature: 'API Access', starter: '-', pro: '-', enterprise: '✓' },
                    { feature: 'Support', starter: 'Email', pro: 'Priority', enterprise: '24/7' },
                  ].map((row, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                      className={`border-b border-teal-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'}`}
                    >
                      <td className="px-6 py-4 text-[#0f2e25] font-medium">{row.feature}</td>
                      <td className="px-6 py-4 text-center text-[#4b635d]">{row.starter}</td>
                      <td className="px-6 py-4 text-center text-[#4b635d]">{row.pro}</td>
                      <td className="px-6 py-4 text-center text-[#4b635d]">{row.enterprise}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-32">
          <div className="site-container">
            <motion.div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0f2e25] font-space-grotesk">Common Questions</h2>
            </motion.div>

            <div className="space-y-4">
              {[
                {
                  q: 'Can I switch plans anytime?',
                  a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'Yes, we offer a 7-day free trial with full access to Professional features.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards, UPI, and net banking through our secure payment gateway.',
                },
                {
                  q: 'Do you offer refunds?',
                  a: "30-day money-back guarantee if you're not satisfied with your purchase.",
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-xl border border-teal-100 bg-white shadow-sm hover:border-teal-200 transition-all"
                >
                  <h3 className="font-semibold text-lg text-[#0f2e25] mb-2">{faq.q}</h3>
                  <p className="text-[#4b635d]">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 md:py-32 bg-white">
          <div className="site-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center relative p-12 md:p-20 rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl -z-10" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0f2e25] font-space-grotesk relative z-10">Ready to Stand Out?</h2>
              <p className="text-lg text-[#4b635d] mb-8 max-w-2xl mx-auto relative z-10">
                Choose your plan and start sharing professionally today
              </p>
              <Link href={ROUTES.CREATE_CARD}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-semibold transition-all duration-300"
                >
                  Get Your Card Now
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
