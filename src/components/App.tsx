import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import CodeComparison from './CodeComparison';
import Metrics from './Metrics';
import ActorDemo from './ActorDemo';
import AlphaProgram from './AlphaProgram';
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
        <Features />
        <CodeComparison />
        <Metrics />
        <ActorDemo />
        <AlphaProgram onJoinWaitlist={handleOpenModal} />
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