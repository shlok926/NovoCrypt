import React from 'react';
import { motion } from 'framer-motion';
import { HeroSection } from '../components/features/HeroSection';
import { FeaturesGrid } from '../components/features/FeaturesGrid';
import { QDayCounter } from '../components/features/QDayCounter';
import { ThreatsSection } from '../components/features/ThreatsSection';
import { CTASection } from '../components/features/CTASection';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col gap-16 py-12">
      <HeroSection />
      
      <motion.div 
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
      >
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Why Novocrypt?</h2>
        <FeaturesGrid />
      </motion.div>

      <motion.div 
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
      >
        <QDayCounter />
      </motion.div>

      <motion.div 
        className="bg-slate-900/50 py-16 w-full"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 1 } }
        }}
      >
        <motion.div 
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
        >
          <ThreatsSection />
        </motion.div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInUp}
      >
        <CTASection />
      </motion.div>
    </div>
  );
};
