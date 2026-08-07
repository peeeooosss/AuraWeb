import React from 'react';
import { motion } from 'framer-motion';

const products = [
  {
    tag: 'Hospitality',
    name: 'AURA Restro',
    description: 'Stop losing repeat customers. AI-driven inventory, customer retention SMS, and daily profit tracking.',
    url: 'https://tablely.tryauraai.in',
    cta: 'Try Restro CRM',
    emoji: '🍽️',
    color: 'from-amber-500 to-orange-600',
  },
  {
    tag: 'Education & Fitness',
    name: 'AURA Coach',
    description: 'For independent tutors and coaches. Instantly generate syllabi, track student progress, and automate stakeholder communication.',
    url: 'https://coach.tryauraai.in',
    cta: 'Try Coach AI',
    emoji: '💪',
    color: 'from-green-500 to-emerald-600',
  },
  {
    tag: 'Job Market',
    name: 'AURA Career',
    description: 'Beat the ATS algorithms. Transform your raw skills into a perfectly formatted, professional profile.',
    url: 'https://career.tryauraai.in',
    cta: 'Build Resume',
    emoji: '📄',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    tag: 'Presentation AI',
    name: 'AURA Slides',
    description: 'Create stunning presentations in seconds. AI-powered outlines, designs, and content generation.',
    url: 'https://arena.tryauraai.in',
    cta: 'Try Arena',
    emoji: '✨',
    color: 'from-purple-500 to-pink-600',
  },
  {
    tag: 'Artist Community',
    name: 'CYPHR',
    description: 'The underground dance battle platform. Live judging, tournament brackets, artist profiles, and a gig marketplace — all in real-time.',
    url: 'https://joincyphr.vercel.app',
    cta: 'Join the Battle',
    emoji: '⚔️',
    color: 'from-red-500 to-pink-600',
  },
];

export default function SaaSCards() {
  return (
    <section id="tools" className="py-24 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 mb-4">
            AURA Products
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            AI Tools & Playgrounds
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Specialized SaaS tools and AI-powered creative playgrounds for high-growth businesses.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.a
              key={product.name}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -4 }}
              className="group p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-2xs text-zinc-400 font-medium mb-4">
                {product.tag}
              </span>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center text-2xl mb-4`}>
                {product.emoji}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">{product.description}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors">
                {product.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
