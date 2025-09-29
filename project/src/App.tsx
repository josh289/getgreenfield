import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Problem from './components/Problem';
import Breakthrough from './components/Breakthrough';
import HowItWorks from './components/HowItWorks';
import Philosophy from './components/Philosophy';
import CallToAction from './components/CallToAction';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Breakthrough />
        <HowItWorks />
        <Philosophy />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}

export default App;