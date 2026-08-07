import React from 'react';
import { motion } from 'framer-motion';

const footerLinks = {
  Product: [
    { name: 'AURA Voice', href: '#voice' },
    { name: 'AURA Restro', href: 'https://tablely.tryauraai.in' },
    { name: 'AURA Coach', href: 'https://coach.tryauraai.in' },
    { name: 'AURA Career', href: 'https://career.tryauraai.in' },
    { name: 'AURA Slides', href: 'https://arena.tryauraai.in' },
    { name: 'CYPHR', href: 'https://joincyphr.vercel.app' },
  ],
  Company: [
    { name: 'About Us', href: '#agency' },
    { name: 'AURA Labs', href: '#labs' },
    { name: 'Our Work', href: '#testimonials' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '#contact' },
  ],
  Legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  Connect: [
    { name: 'Twitter', href: 'https://twitter.com/auraai' },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/auraai' },
    { name: 'Instagram', href: 'https://instagram.com/auraai' },
  ],
};

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="border-t border-white/5 bg-zinc-950"
    >
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-400 hover:text-cyan-400 transition-colors"
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              AURA AI
            </span>
          </div>
          <p className="text-sm text-zinc-600">
            © 2026 AURA AI. Digitalizing India.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
