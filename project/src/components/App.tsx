import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import Hero from './Hero';
import Problem from './Problem';
import HowItWorks from './HowItWorks';
import UseCases from './UseCases';
import Features from './Features';
import BetaProgram from './AlphaProgram';
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Navbar onEarlyAccess={handleOpenModal} />
      <main>
        <Hero onEarlyAccess={handleOpenModal} />
        <Problem />
        <HowItWorks />
        <UseCases />
        <Features />
        <BetaProgram onJoinWaitlist={handleOpenModal} />
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
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155'
          }
        }}
      />
    </div>
  );
};

export default App;