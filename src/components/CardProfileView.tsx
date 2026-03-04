'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Github,
  MessageCircle,
  Send,
  Download,
  Share2,
  ExternalLink,
} from 'lucide-react';
import CardContactForm from './CardContactForm';

// Card detail types matching Prisma schema
interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  github?: string;
  whatsapp?: string;
  telegram?: string;
  snapchat?: string;
}

interface CustomField {
  label: string;
  value: string;
  type?: string;
}

interface CardDetail {
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  bio?: string;
  email?: string;
  phone?: string;
  website?: string;
  profileImage?: string;
  coverImage?: string;
  logo?: string;
  socialLinks?: SocialLinks;
  customFields?: CustomField[];
  theme?: string;
  primaryColor?: string;
  backgroundColor?: string;
}

interface CardData {
  id: string;
  slug: string;
  cardType?: string;
  status: string;
  details: CardDetail | null;
  views: number;
  taps: number;
  createdAt: string;
}

interface CardProfileViewProps {
  card: CardData;
}

// Social icon mapping
const socialIcons: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  github: Github,
  whatsapp: MessageCircle,
  telegram: Send,
};

// Social link colors
const socialColors: Record<string, string> = {
  linkedin: 'hover:bg-[#0077B5] hover:border-[#0077B5]',
  twitter: 'hover:bg-[#1DA1F2] hover:border-[#1DA1F2]',
  facebook: 'hover:bg-[#1877F2] hover:border-[#1877F2]',
  instagram: 'hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737]',
  youtube: 'hover:bg-[#FF0000] hover:border-[#FF0000]',
  github: 'hover:bg-[#333] hover:border-[#333]',
  whatsapp: 'hover:bg-[#25D366] hover:border-[#25D366]',
  telegram: 'hover:bg-[#0088CC] hover:border-[#0088CC]',
};

export default function CardProfileView({ card }: CardProfileViewProps) {
  const details = card.details;
  
  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white/60">Card details not available</p>
      </div>
    );
  }

  const fullName = [details.firstName, details.lastName].filter(Boolean).join(' ') || 'Unknown';
  const primaryColor = details.primaryColor || '#06b6d4';
  const backgroundColor = details.backgroundColor || '#0f172a';

  // Generate vCard for download
  const generateVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:${details.lastName || ''};${details.firstName || ''};;;
FN:${fullName}
TITLE:${details.title || ''}
ORG:${details.company || ''}
TEL;TYPE=CELL:${details.phone || ''}
EMAIL:${details.email || ''}
URL:${details.website || ''}
NOTE:${details.bio || ''}
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fullName.replace(/\s+/g, '_')}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Share card
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} - Digital Business Card`,
          text: `Connect with ${fullName}${details.title ? ` - ${details.title}` : ''}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor }}
    >
      {/* Cover Image / Header */}
      <div className="relative h-48 md:h-64">
        {details.coverImage ? (
          <Image
            src={details.coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div 
            className="absolute inset-0"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}20 100%)` 
            }}
          />
        )}
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
          style={{ backgroundColor: `${backgroundColor}80` }}
        />
      </div>

      {/* Profile Section */}
      <div className="relative px-4 pb-8 -mt-20 max-w-lg mx-auto">
        {/* Profile Image */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-4"
        >
          <div 
            className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 overflow-hidden shadow-2xl"
            style={{ borderColor: primaryColor }}
          >
            {details.profileImage ? (
              <Image
                src={details.profileImage}
                alt={fullName}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </motion.div>

        {/* Name & Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {fullName}
          </h1>
          {details.title && (
            <p className="text-white/70 text-lg">{details.title}</p>
          )}
          {details.company && (
            <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" />
              {details.company}
            </p>
          )}
        </motion.div>

        {/* Company Logo */}
        {details.logo && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex justify-center mb-6"
          >
            <Image
              src={details.logo}
              alt="Company Logo"
              width={120}
              height={40}
              className="object-contain opacity-80"
            />
          </motion.div>
        )}

        {/* Bio */}
        {details.bio && (
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/60 text-center text-sm mb-8 px-4"
          >
            {details.bio}
          </motion.p>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex justify-center gap-3 mb-8"
        >
          <button
            onClick={generateVCard}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: primaryColor }}
          >
            <Download className="w-4 h-4" />
            Save Contact
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-3 rounded-full border border-white/20 text-white/80 hover:bg-white/10 transition-all duration-300"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="mb-8"
        >
          <CardContactForm cardSlug={card.slug} primaryColor={primaryColor} />
        </motion.div>

        {/* Contact Links */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-3 mb-8"
        >
          {details.phone && (
            <Link
              href={`tel:${details.phone}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Phone className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1">
                <p className="text-white/50 text-xs uppercase tracking-wide">Phone</p>
                <p className="text-white font-medium">{details.phone}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </Link>
          )}

          {details.email && (
            <Link
              href={`mailto:${details.email}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Mail className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1">
                <p className="text-white/50 text-xs uppercase tracking-wide">Email</p>
                <p className="text-white font-medium break-all">{details.email}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </Link>
          )}

          {details.website && (
            <Link
              href={details.website.startsWith('http') ? details.website : `https://${details.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Globe className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1">
                <p className="text-white/50 text-xs uppercase tracking-wide">Website</p>
                <p className="text-white font-medium">{details.website.replace(/^https?:\/\//, '')}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </Link>
          )}
        </motion.div>

        {/* Social Links */}
        {details.socialLinks && Object.entries(details.socialLinks).some(([, value]) => value) && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-8"
          >
            <h3 className="text-white/50 text-xs uppercase tracking-wide text-center mb-4">
              Connect
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {Object.entries(details.socialLinks).map(([platform, url]) => {
                if (!url) return null;
                const Icon = socialIcons[platform] || ExternalLink;
                const colorClass = socialColors[platform] || 'hover:bg-white/20';
                
                return (
                  <Link
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all duration-300 ${colorClass}`}
                    title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Custom Fields */}
        {details.customFields && details.customFields.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-3 mb-8"
          >
            {details.customFields.map((field, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
                  {field.label}
                </p>
                <p className="text-white font-medium">{field.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Powered by */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center pt-8 border-t border-white/10"
        >
          <Link
            href="/"
            className="text-white/30 text-xs hover:text-white/50 transition-colors"
          >
            Powered by <span className="font-semibold">Tapvyo</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
