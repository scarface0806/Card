import Link from 'next/link';

import BrandLogo from '@/components/common/BrandLogo';
import { SITE_URL, whatsappLink } from '@/lib/site-config';

interface CardInactiveScreenProps {
	/** The slug from the URL, shown as text and embedded in the WhatsApp message. */
	slug: string;
}

/**
 * Shared "this card is inactive" screen for both the inactive-Customer and
 * inactive-Card branches of app/(frontend)/card/[slug]/page.tsx.
 *
 * A card/profile that EXISTS but is marked inactive (isActive=false, or status
 * not ACTIVE) falls back to this screen. A slug that does NOT exist continues to
 * use notFound() → not-found.tsx (HTTP 404) so random URLs and bots see a plain
 * 404 without a "contact" call-to-action.
 *
 * HTTP status: 200 (same as today). notFound() would force not-found.tsx and
 * prevent this custom JSX from rendering. robots: noindex,nofollow is set in
 * generateMetadata on the page.
 */
export default function CardInactiveScreen({ slug }: CardInactiveScreenProps) {
	const cardUrl = `${SITE_URL}/card/${slug}`;
	const waMessage = `Hi Tapvyo, my card is showing as inactive. Card link: ${cardUrl}`;

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-center text-white">
			<div className="w-full max-w-md space-y-8">
				<BrandLogo size="medium" variant="light" className="mx-auto" />

				<div className="space-y-3">
					<h1 className="text-2xl font-semibold">Your card is inactive</h1>
					<p className="text-sm text-[#A9B5B0]">
						Please contact the Tapvyo team to reactivate your card.
					</p>
				</div>

				<a
					href={whatsappLink(waMessage)}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={`Contact Tapvyo on WhatsApp about card ${slug}`}
					className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-6 rounded-xl bg-[#4CAE89] text-[#070A09] font-medium text-sm hover:opacity-90 transition-opacity"
				>
					Contact admin
					<span className="sr-only"> (opens WhatsApp in a new tab)</span>
				</a>

				<p className="text-xs text-[#6b7280] break-all">
					Card link: {slug}
				</p>

				<Link
					href="/"
					className="inline-block text-sm text-[#A9B5B0] hover:text-[#F1F3F1] transition-colors"
				>
					Go to Tapvyo home
				</Link>
			</div>
		</main>
	);
}
