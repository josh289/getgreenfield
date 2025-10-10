import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import Hero from './Hero';
import Problem from './Problem';
import Solution from './Solution';
import UniversalBenefits from './UniversalBenefits';
import ActorDemo from './ActorDemo';
import HowItWorks from './HowItWorks';
import UseCases from './UseCases';
import Features from './Features';
import PatternShowcase from './PatternShowcase';
import Philosophy from './Philosophy';
import AlphaProgram from './AlphaProgram';
import CallToAction from './CallToAction';
import Footer from './Footer';
import Modal from './ui/Modal';
import EarlyAccessForm from './ui/EarlyAccessForm';

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar onEarlyAccess={handleOpenModal} />
      <main>
        <Hero onEarlyAccess={handleOpenModal} />
        <Problem />
        <Solution />
        <UniversalBenefits />
        <ActorDemo />
        <HowItWorks />
        <UseCases />
        <Features />
        <PatternShowcase />
        <Philosophy />
        <AlphaProgram onJoinWaitlist={handleOpenModal} />
        <CallToAction onJoinWaitlist={handleOpenModal} />
      </main>
      <Footer />
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title="Join the Waitlist"
      >
        <EarlyAccessForm onClose={handleCloseModal} />
      </Modal>
      
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#0a0a0a',
            color: '#ffffff',
            border: '1px solid #252525'
          }
        }}
      />
    </div>
  );
};

export default App;