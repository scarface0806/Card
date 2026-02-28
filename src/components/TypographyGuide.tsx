'use client';

import Heading from '@/components/Heading';
import Text from '@/components/Text';

export default function TypographyGuide() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <Heading as="h1" className="mb-12">
          Typography System
        </Heading>

        {/* Headings */}
        <div className="mb-20">
          <Heading as="h2" className="mb-8">
            Headings
          </Heading>

          <div className="space-y-12">
            <div>
              <Heading as="h1">H1: 56px Bold</Heading>
              <Text variant="body-sm" className="text-slate-400 mt-2">
                Space Grotesk • Weight: 700 • Line height: 1.1 • Letter spacing: -0.5px
              </Text>
            </div>

            <div>
              <Heading as="h2">H2: 40px Semibold</Heading>
              <Text variant="body-sm" className="text-slate-400 mt-2">
                Space Grotesk • Weight: 600 • Line height: 1.2 • Letter spacing: -0.25px
              </Text>
            </div>

            <div>
              <Heading as="h3">H3: 28px Semibold</Heading>
              <Text variant="body-sm" className="text-slate-400 mt-2">
                Space Grotesk • Weight: 600 • Line height: 1.3
              </Text>
            </div>
          </div>
        </div>

        {/* Body Text */}
        <div className="mb-20">
          <Heading as="h2" className="mb-8">
            Body Text
          </Heading>

          <div className="space-y-8">
            <div>
              <Text variant="body-lg">
                This is Body Large text (18px). It's used for prominent body content like feature descriptions or introductory paragraphs. Perfect for hero sections and key messaging.
              </Text>
              <Text variant="body-sm" className="text-slate-400 mt-2">
                Inter • Weight: 400 • Size: 18px • Line height: 1.6
              </Text>
            </div>

            <div>
              <Text variant="body">
                This is Body Regular text (16px). It's the standard font for most body copy, paragraphs, and UI content. Highly optimized for readability across all devices.
              </Text>
              <Text variant="body-sm" className="text-slate-400 mt-2">
                Inter • Weight: 400 • Size: 16px • Line height: 1.6
              </Text>
            </div>

            <div>
              <Text variant="body-sm">
                This is Small text (14px). Use for labels, captions, secondary information, and UI supporting text. Maintains excellent readability even at smaller sizes.
              </Text>
              <Text variant="body-sm" className="text-slate-400 mt-2">
                Inter • Weight: 400 • Size: 14px • Line height: 1.5
              </Text>
            </div>
          </div>
        </div>

        {/* Button Text */}
        <div className="mb-20">
          <Heading as="h2" className="mb-8">
            Button Text
          </Heading>

          <div>
            <button className="px-6 py-2 bg-blue-500 text-white font-sans text-button uppercase rounded-lg hover:bg-blue-600 transition-colors">
              Click Me
            </button>
            <Text variant="body-sm" className="text-slate-400 mt-2">
              Inter • Weight: 500 • Size: 16px • Uppercase • Letter spacing: 0.5px
            </Text>
          </div>
        </div>

        {/* Combined Example */}
        <div className="mb-20">
          <Heading as="h2" className="mb-8">
            Sample Component
          </Heading>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <Heading as="h3" className="mb-4">
              Premium NFC Cards
            </Heading>
            <Text variant="body-lg" className="mb-6">
              Share your professional information with a single tap using our premium NFC digital business cards.
            </Text>
            <Text variant="body">
              Our cards integrate seamlessly with your existing workflow, providing a modern solution for professional networking.
            </Text>
          </div>
        </div>
      </div>
    </section>
  );
}
