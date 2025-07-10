import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface FormData {
  email: string;
  name: string;
  company?: string;
  teamSize?: string;
  currentAIUse?: string;
}

const EarlyAccessForm: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    try {
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
      if (!apiKey) {
        throw new Error('Airtable API key is missing');
      }

      const response = await fetch(`https://api.airtable.com/v0/app1Ls9AR0d1AeOo5/Table%201`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: [{
            fields: {
              'Full Name': formData.name,
              'Email': formData.email,
              'Company': formData.company || '',
              'Team Size': formData.teamSize || '',
              'Current AI Use': formData.currentAIUse || ''
            }
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to submit form');
      }
      
      toast.success('You\'re on the waitlist! We\'ll notify you when beta access is available.');
      onClose?.();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          required
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          required
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>
      
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-1">
          Company
        </label>
        <input
          type="text"
          id="company"
          required
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.company}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
        />
      </div>
      
      <div>
        <label htmlFor="teamSize" className="block text-sm font-medium text-slate-300 mb-1">
          Team Size
        </label>
        <select
          id="teamSize"
          required
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <label htmlFor="currentAIUse" className="block text-sm font-medium text-slate-300 mb-1">
          Current AI Use
        </label>
        <textarea
          id="currentAIUse"
          required
          rows={3}
          placeholder="Tell us how your team currently uses AI tools..."
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={formData.currentAIUse}
          onChange={(e) => setFormData(prev => ({ ...prev, currentAIUse: e.target.value }))}
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Joining Waitlist...' : 'Join the Waitlist'}
      </button>
    </form>
  );
};

export default EarlyAccessForm;