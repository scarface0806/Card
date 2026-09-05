'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import HeroSection from '@/sections/HeroSection';
import type { ContactSource } from '@/components/ContactModal';
import StickyMobileCTA from '@/components/StickyMobileCTA';
import type { CardDesign } from '@/lib/products/cardDesign';

const HowItWorksSection = dynamic(() => import('@/sections/HowItWorksSection'));
const InteractiveCardShowcaseSection = dynamic(() => import('@/sections/InteractiveCardShowcaseSection'));
const FeaturesSection = dynamic(() => import('@/sections/FeaturesSection'));
const CardDesignsHomeSection = dynamic(() => import('@/sections/CardDesignsHomeSection'));
const OtherCardsSolutionsSection = dynamic(() => import('@/sections/OtherCardsSolutionsSection'));
const TestimonialsSection = dynamic(() => import('@/sections/TestimonialsSection'));
const FAQSection = dynamic(() => import('@/sections/FAQSection'));
const ContactModal = dynamic(() => import('@/components/ContactModal'), {
	ssr: false,
});

interface HomeClientProps {
	/**
	 * The catalogue, loaded and cached on the server by app/(frontend)/page.tsx
	 * and threaded down to CardDesignsHomeSection. Without it that section
	 * fetched on mount and showed "Loading card designs" on every visit.
	 */
	initialDesigns: CardDesign[];
}

function HomeContent({ initialDesigns }: HomeClientProps) {
	const [isContactModalOpen, setIsContactModalOpen] = useState(false);
	const [contactModalSource, setContactModalSource] = useState<ContactSource>('general');

	const handleContactClick = (source: ContactSource) => {
		setContactModalSource(source);
		setIsContactModalOpen(true);
	};

	return (
		<>
			<Navbar />
			<main className="pt-20">
				<HeroSection />
				<HowItWorksSection />			<InteractiveCardShowcaseSection />				<FeaturesSection />
				<CardDesignsHomeSection onContactClick={handleContactClick} initialDesigns={initialDesigns} />
				<TestimonialsSection />
				<OtherCardsSolutionsSection onContactClick={handleContactClick} />
				<FAQSection />
			</main>
			<Footer />

			{/* Sticky Mobile CTA */}
			<StickyMobileCTA />

			{/* Contact Modal */}
			{isContactModalOpen ? (
				<ContactModal
					isOpen={isContactModalOpen}
					onClose={() => setIsContactModalOpen(false)}
					source={contactModalSource}
				/>
			) : null}
		</>
	);
}

export default function HomeClient({ initialDesigns }: HomeClientProps) {
	return <HomeContent initialDesigns={initialDesigns} />;
}
