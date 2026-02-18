import React, { useState } from 'react';

interface FormData {
  email: string;
  name: string;
  company?: string;
  teamSize?: string;
  currentAIUse?: string;
}

const EarlyAccessForm: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    company: '',
    teamSize: '',
    currentAIUse: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company || '',
          teamSize: formData.teamSize || '',
          currentAIUse: formData.currentAIUse || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit form');
      }

      setSuccessMessage("Welcome to the Greenfield Platform waitlist! We'll notify you when early access is available.");
      setTimeout(() => {
        onClose?.();
      }, 2500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <div className="p-3 rounded-md bg-sprout/20 border border-sprout/40 text-sprout text-sm">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-md bg-coral/20 border border-coral/40 text-coral text-sm">
          {errorMessage}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ev-text mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          required
          className="w-full px-3 py-2 bg-ev-void border border-ev-default rounded-md text-ev-text focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:border-sprout transition-all"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ev-text mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          required
          className="w-full px-3 py-2 bg-ev-void border border-ev-default rounded-md text-ev-text focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:border-sprout transition-all"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-ev-text mb-1">
          Company
        </label>
        <input
          type="text"
          id="company"
          className="w-full px-3 py-2 bg-ev-void border border-ev-default rounded-md text-ev-text focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:border-sprout transition-all"
          value={formData.company}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="teamSize" className="block text-sm font-medium text-ev-text mb-1">
          Team Size
        </label>
        <select
          id="teamSize"
          className="w-full px-3 py-2 bg-ev-void border border-ev-default rounded-md text-ev-text focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:border-sprout transition-all"
          value={formData.teamSize}
          onChange={(e) => setFormData(prev => ({ ...prev, teamSize: e.target.value }))}
        >
          <option value="">Select team size</option>
          <option value="1-5">1-5 people</option>
          <option value="6-10">6-10 people</option>
          <option value="11-20">11-20 people</option>
          <option value="21+">21+ people</option>
        </select>
      </div>

      <div>
        <label htmlFor="currentAIUse" className="block text-sm font-medium text-ev-text mb-1">
          Current AI Use
        </label>
        <textarea
          id="currentAIUse"
          rows={3}
          placeholder="Tell us how your team currently uses AI tools..."
          className="w-full px-3 py-2 bg-ev-void border border-ev-default rounded-md text-ev-text placeholder:text-ev-text-muted focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:border-sprout transition-all resize-none"
          value={formData.currentAIUse}
          onChange={(e) => setFormData(prev => ({ ...prev, currentAIUse: e.target.value }))}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-sprout hover:bg-sprout/90 text-ev-text-inverse px-4 py-3 rounded-md font-semibold transition-all hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        {isSubmitting ? 'Joining Waitlist...' : 'Join the Waitlist'}
      </button>
    </form>
  );
};

export default EarlyAccessForm;
