import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function CardNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 px-4">
      <div className="text-center max-w-md">
        {/* 404 Visual */}
        <div className="relative mb-8">
          <div className="text-[120px] md:text-[150px] font-bold text-white/5 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Search className="w-10 h-10 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Card Not Found
        </h1>
        <p className="text-white/60 mb-8">
          The digital business card you&apos;re looking for doesn&apos;t exist or may have been deactivated by its owner.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Go to Homepage
          </Link>
          <Link
            href="/create-card"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/80 hover:bg-white/10 transition-colors"
          >
            Create Your Card
          </Link>
        </div>

        {/* Help text */}
        <p className="text-white/40 text-sm mt-8">
          Need help? <Link href="/contact" className="text-cyan-400 hover:underline">Contact us</Link>
        </p>
      </div>
    </div>
  );
}
