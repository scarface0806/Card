'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, Globe } from 'lucide-react';

export default function GlassProfileCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="backdrop-blur-2xl bg-gradient-to-br from-white/5 to-white/[0.02] 
                 border border-white/10 rounded-2xl p-6 md:p-8
                 shadow-2xl hover:border-cyan-400/30 transition-all duration-300"
    >
      {/* Animated glow background on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-teal-500/0 
                      opacity-0 hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />

      {/* Profile Header */}
      <div className="flex items-start justify-between mb-6 pb-6 border-b border-white/5">
        <div>
          <h3 className="text-white font-bold text-lg">John Doe</h3>
          <p className="text-white/60 text-sm">Product Designer @ Creative Studio</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-500/20 
                        flex items-center justify-center border border-cyan-400/20">
          <span className="text-lg font-bold text-cyan-300">JD</span>
        </div>
      </div>

      {/* Profile Links */}
      <div className="space-y-3">
        {/* Phone */}
        <motion.div
          className="flex items-center gap-3 group cursor-pointer"
          whileHover={{ x: 3 }}
          transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/10 to-teal-500/10 
                          flex items-center justify-center border border-cyan-400/20
                          group-hover:border-cyan-400/40 transition-colors duration-300">
            <Phone className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wide">Phone</p>
            <p className="text-sm text-white/90 font-medium">+1 234 567 890</p>
          </div>
        </motion.div>

        {/* Email */}
        <motion.div
          className="flex items-center gap-3 group cursor-pointer"
          whileHover={{ x: 3 }}
          transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/10 to-teal-500/10 
                          flex items-center justify-center border border-cyan-400/20
                          group-hover:border-cyan-400/40 transition-colors duration-300">
            <Mail className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wide">Email</p>
            <p className="text-sm text-white/90 font-medium">john@example.com</p>
          </div>
        </motion.div>

        {/* Website */}
        <motion.div
          className="flex items-center gap-3 group cursor-pointer"
          whileHover={{ x: 3 }}
          transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/10 to-teal-500/10 
                          flex items-center justify-center border border-cyan-400/20
                          group-hover:border-cyan-400/40 transition-colors duration-300">
            <Globe className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wide">Website</p>
            <p className="text-sm text-white/90 font-medium">johndoe.com</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

