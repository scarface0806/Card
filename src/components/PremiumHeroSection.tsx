'use client';

import { motion, easeOut } from 'framer-motion';
import { ArrowRight, CreditCard, Smartphone, TrendingUp } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

export default function PremiumHeroSection() {
  return (
    <div className="relative min-h-screen bg-slate-950 pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      
      {/* Subtle background elements */}
      <div className="absolute top-40 right-20 w-96 h-96 bg-primary/100/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="relative container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/100/20 border border-primary/30 rounded-full mb-8"
            >
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">World best platform</span>
            </motion.div>

            {/* Heading */}
            <motion.div variants={itemVariants} className="mb-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight text-white">
                Card issuing
                <br />
                and <span className="text-primary">spending</span>
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              variants={itemVariants}
              className="text-lg text-gray-300 leading-relaxed mb-8 max-w-md"
            >
              Card issuing and spending platform that helps create, launch, and scale payment solutions in weeks.
            </motion.p>

            {/* CTA Button */}
            <motion.div variants={itemVariants} className="mb-12">
              <button className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-secondary text-[#0f2e25] font-semibold rounded-lg transition-all duration-300 hover:from-[#28A428] hover:to-[#e6e600] hover:shadow-lg active:scale-[0.98]">
                Get Started
                <ArrowRight size={20} />
              </button>
            </motion.div>

            {/* Features Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-3 gap-6"
            >
              {[
                { icon: CreditCard, label: 'Physical Card' },
                { icon: Smartphone, label: 'Virtual Card' },
                { icon: TrendingUp, label: 'Spending' },
              ].map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={i} variants={itemVariants} className="text-center">
                    <div className="flex justify-center mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-white">{feature.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="relative flex justify-center items-center"
          >
            {/* Card visual with gradient */}
            <div className="relative w-80 h-96">
              {/* Background gradient glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-cyan-500/10 to-transparent rounded-3xl blur-2xl" />

              {/* Card container */}
              <div className="relative">
                {/* Main card */}
                <div className="absolute top-0 left-0 w-64 h-80 bg-gradient-to-br from-teal-600 to-teal-800 rounded-3xl shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500">
                  <div className="p-8 h-full flex flex-col justify-between text-white">
                    <div>
                      <div className="text-2xl font-bold mb-8">Tapvyo</div>
                      <div className="flex gap-2 mb-8">
                        <div className="w-12 h-8 bg-white/30 rounded-lg" />
                        <div className="w-12 h-8 bg-white/30 rounded-lg" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 mb-2">Card Number</p>
                      <p className="text-lg font-mono tracking-wider">4532 7739 3507</p>
                      <div className="flex justify-between mt-4 text-xs">
                        <div>
                          <p className="opacity-70">Valid Thru</p>
                          <p className="font-semibold">12/26</p>
                        </div>
                        <div>
                          <p className="opacity-70">CVV</p>
                          <p className="font-semibold">***</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating accent card */}
                <div className="absolute bottom-12 right-0 w-48 h-32 bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/10 p-4 transform rotate-12 hover:rotate-0 transition-transform duration-500">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg mb-3"></div>
                  <p className="text-sm font-semibold text-white">Premium Account</p>
                  <p className="text-xs text-gray-400 mt-1">Unlock exclusive features</p>
                </div>

                {/* Hand visual indicator */}
                <div className="absolute bottom-0 right-8 w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-amber-500/40 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
