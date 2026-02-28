'use client';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';

export default function TermsPage() {
  const sections = [
    {
      title: '1. Agreement to Terms',
      content:
        'These Terms and Conditions constitute a legally binding agreement made between you and Tapvyo. By accessing and using this service, you accept and agree to be bound by and comply with these terms and conditions.',
    },
    {
      title: '2. Use License',
      content:
        'Permission is granted to temporarily download one copy of the materials (information or software) on Tapvyo\' (the "Site") for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose or for any public display; attempt to decompile or reverse engineer any software contained on the Site; remove any copyright or other proprietary notations from the materials; or transfer the materials to another person or "mirror" the materials on any other server.',
    },
    {
      title: '3. Disclaimer',
      content:
        'The materials on Tapvyo\'s Site are provided on an \'as is\' basis. Tapvyo makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.',
    },
    {
      title: '4. Limitations',
      content:
        'In no event shall Tapvyo or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Tapvyo\'s Site.',
    },
    {
      title: '5. Accuracy of Materials',
      content:
        'The materials appearing on Tapvyo\'s Site could include technical, typographical, or photographic errors. Tapvyo does not warrant that any of the materials on the Site are accurate, complete, or current. Tapvyo may make changes to the materials contained on its Site at any time without notice.',
    },
    {
      title: '6. Links',
      content:
        'Tapvyo has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Tapvyo of the site. Use of any such linked website is at the user\'s own risk.',
    },
    {
      title: '7. Modifications',
      content:
        'Tapvyo may revise these terms and conditions for its Site at any time without notice. By using this Site, you are agreeing to be bound by the then current version of these terms and conditions.',
    },
    {
      title: '8. Governing Law',
      content:
        'These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.',
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 min-h-screen bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff]">
        <div className="site-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#0f2e25] mb-4 font-space-grotesk">
              Terms &amp; Conditions
            </h1>
            <p className="text-[#4b635d]">
              Last updated: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </motion.div>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 border border-teal-100 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-[#0f2e25] mb-4 font-space-grotesk">
                  {section.title}
                </h2>
                <p className="text-[#4b635d] leading-relaxed">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
