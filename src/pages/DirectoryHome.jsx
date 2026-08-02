import React from 'react';
import Navbar from './home/Navbar';
import Hero from './home/Hero';
import VoiceProduct from './home/VoiceProduct';
import SaaSCards from './home/SaaSCards';
import AgencySection from './home/AgencySection';
import LabsRoadmap from './home/LabsRoadmap';
import Testimonials from './home/Testimonials';
import Footer from './home/Footer';

export default function DirectoryHome() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <Hero />
      <VoiceProduct />
      <SaaSCards />
      <AgencySection />
      <LabsRoadmap />
      <Testimonials />
      <Footer />
    </div>
  );
}
