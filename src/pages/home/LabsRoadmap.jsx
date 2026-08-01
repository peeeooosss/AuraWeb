import React from 'react';
import { motion } from 'framer-motion';

const milestones = [
  {
    quarter: 'Q3',
    title: 'AI Cybersecurity Scans',
    description: 'Automated code audits for SMEs. Detect vulnerabilities before they become breaches.',
    status: 'in-progress',
    progress: 65,
  },
  {
    quarter: 'Q4',
    title: 'No-Code Commerce Engine',
    description: 'Upload a photo, get an instant digital storefront. AI-powered product listings.',
    status: 'upcoming',
    progress: 20,
  },
];

export default function LabsRoadmap() {
  return (
    <section id="labs" className="py-24 bg-zinc-950">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 mb-4">
            AURA Labs
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            What We're Building Next
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            We are aggressively expanding. See what is launching by December.
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-transparent" />

          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.quarter}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative pl-20"
              >
                {/* Timeline dot */}
                <div className="absolute left-6 top-6 w-4 h-4 rounded-full border-2 border-cyan-500 bg-zinc-950 z-10">
                  <div className="absolute inset-1 rounded-full bg-cyan-500 animate-pulse" />
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-xs font-mono text-cyan-400">
                      {milestone.quarter}
                    </span>
                    <span className={`text-xs ${
                      milestone.status === 'in-progress' ? 'text-green-400' : 'text-zinc-500'
                    }`}>
                      {milestone.status === 'in-progress' ? '● In Progress' : '○ Upcoming'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{milestone.title}</h3>
                  <p className="text-sm text-zinc-400 mb-4">{milestone.description}</p>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${milestone.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-zinc-600">Progress</span>
                    <span className="text-xs text-zinc-500">{milestone.progress}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Email capture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row gap-3 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
            <input
              type="email"
              placeholder="Enter your email for early beta access"
              className="px-4 py-2.5 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none min-w-[300px]"
            />
            <button className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity">
              Join Waitlist
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-3">
            Join 2,400+ founders already on the waitlist
          </p>
        </motion.div>
      </div>
    </section>
  );
}
