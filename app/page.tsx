'use client';

import { useState } from 'react';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import HeroSection from '@/sections/HeroSection';
import HowItWorksSection from '@/sections/HowItWorksSection';
import InteractiveCardShowcaseSection from '@/sections/InteractiveCardShowcaseSection';
import FeaturesSection from '@/sections/FeaturesSection';
import CardDesignsHomeSection from '@/sections/CardDesignsHomeSection';
import OtherCardsSolutionsSection from '@/sections/OtherCardsSolutionsSection';
import TestimonialsSection from '@/sections/TestimonialsSection';
import FAQSection from '@/sections/FAQSection';
import ContactModal, { ContactSource } from '@/components/ContactModal';

function HomeContent() {
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
				<CardDesignsHomeSection onContactClick={handleContactClick} />
				<OtherCardsSolutionsSection onContactClick={handleContactClick} />
				<TestimonialsSection />
				<FAQSection />
			</main>
			<Footer />

			{/* Contact Modal */}
			<ContactModal
				isOpen={isContactModalOpen}
				onClose={() => setIsContactModalOpen(false)}
				source={contactModalSource}
			/>
		</>
	);
}

export default function Home() {
	return <HomeContent />;
}
