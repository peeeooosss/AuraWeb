import React from 'react';
import { motion } from 'framer-motion';

const projects = [
  {
    tag: 'Web Platform',
    name: 'ApexDrive',
    client: 'ApexDrive Guwahati',
    description: 'Self-drive car rental platform for Guwahati, Assam. Features fleet browsing, date-based availability, online booking, and a full admin dashboard with revenue analytics.',
    tech: ['React 18', 'Supabase', 'Tailwind CSS', 'Recharts', 'Vite'],
    features: [
      '14-vehicle fleet with category filters',
      '30-day availability calendar per vehicle',
      'Admin dashboard with revenue charts',
      'Booking management with status tracking',
    ],
    color: 'from-amber-500 to-orange-600',
    emoji: '🚗',
    url: 'https://apexdriveghy.netlify.app',
  },
  {
    tag: 'SaaS Platform',
    name: 'UniLinkAI',
    client: 'Education Consultancy',
    description: 'AI-powered international education admissions platform with student CRM, agent portal, university search across 7 regions, and a full LMS with courses, assignments, and quizzes.',
    tech: ['Next.js 16', 'TypeScript', 'Tailwind CSS', 'Drizzle ORM', 'PostgreSQL'],
    features: [
      '5-stage application pipeline (Kanban board)',
      '50+ partner universities database',
      'Student & agent dashboards with analytics',
      'Automated commission tracking',
    ],
    color: 'from-green-500 to-emerald-600',
    emoji: '🎓',
    url: 'https://unilinkai.netlify.app',
  },
  {
    tag: 'LMS / EdTech',
    name: 'Nitai AI Student LMS',
    client: 'Nitai Group',
    description: 'Gamified 90-day learn-to-earn LMS with three phases (Hustler → Automation Agency → Enterprise). Students earn Nitai Credits redeemable for digital assets and SaaS vouchers.',
    tech: ['React 19', 'Vite', 'TypeScript', 'Prisma', 'Netlify Functions', 'PostgreSQL'],
    features: [
      '90 structured modules across 3 phases',
      'Credit-based gamification economy',
      'Admin command center with analytics',
      'Digital storefront with 1,200+ assets',
    ],
    color: 'from-purple-500 to-pink-600',
    emoji: '🧠',
    url: 'https://aistudent.nitaigroup.com',
  },
  {
    tag: 'Landing Page',
    name: 'Project Chakna',
    client: 'Food Business (Zoo Road, Guwahati)',
    description: 'Late-night food delivery landing page with classified/mission theme. WhatsApp-only ordering, 11-item menu, live status widget, and 15-minute delivery guarantee.',
    tech: ['HTML5', 'CSS3', 'Vanilla JS', 'Google Fonts', 'DALL-E Images'],
    features: [
      'Mission-themed brand identity',
      'Live open/close countdown timer',
      'WhatsApp deep-link ordering flow',
      'Free delivery above ₹149',
    ],
    color: 'from-red-500 to-rose-600',
    emoji: '🍔',
    url: 'https://project-chakna.netlify.app',
  },
  {
    tag: 'EdTech / Coding',
    name: 'Nitai LMS',
    client: 'Nitai (Educational Organization)',
    description: 'Coding education LMS with in-browser Python execution via Pyodide. Features CodeMirror 6 editor, course management, real-time collaboration via Convex, and OIDC authentication.',
    tech: ['React 19', 'TypeScript', 'Vite', 'Prisma', 'Express', 'Pyodide', 'Convex'],
    features: [
      'In-browser Python execution (Pyodide)',
      'CodeMirror 6 with Python support',
      'Resizable panel layouts for coding',
      'Real-time features via Convex',
    ],
    color: 'from-blue-500 to-indigo-600',
    emoji: '💻',
    url: 'https://ailab.nitaigroup.com',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-zinc-950 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto px-6 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 mb-4">
            Our Work
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Projects We've Built
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            From AI-powered platforms to niche landing pages — custom solutions delivered for Indian SMEs and startups.
          </p>
        </motion.div>

        {/* Project Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.a
              key={project.name}
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 flex flex-col h-full"
            >
              {/* Tag & Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-2xs text-zinc-400 font-medium shrink-0">
                  {project.tag}
                </span>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${project.color} flex items-center justify-center text-2xl shrink-0`}>
                  {project.emoji}
                </div>
              </div>

              {/* Project Name & Client */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
                <p className="text-xs text-zinc-500">{project.client}</p>
              </div>

              {/* Description */}
              <p className="text-sm text-zinc-400 leading-relaxed mb-4 flex-1">
                {project.description}
              </p>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {project.tech.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300"
                  >
                    {tech}
                  </span>
                ))}
                {project.tech.length > 4 && (
                  <span className="px-2 py-0.5 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-500">
                    +{project.tech.length - 4} more
                  </span>
                )}
              </div>

              {/* Key Features */}
              <ul className="space-y-2 text-sm text-zinc-400 border-t border-white/5 pt-4">
                {project.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Visit Project */}
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 group-hover:text-cyan-300 transition-colors">
                Visit Project
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </span>
            </motion.a>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-zinc-400 mb-6 max-w-xl mx-auto">
            Have a project in mind? Let's build something great together.
          </p>
          <a
            href="https://wa.me/919864854481"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-sm font-medium text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            Start a Project
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}