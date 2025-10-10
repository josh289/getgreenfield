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
      // For Astro, client-side env vars need PUBLIC_ prefix
      const apiKey = import.meta.env.PUBLIC_AIRTABLE_API_KEY;

      // Log for debugging (remove in production)
      console.log('Environment check:', {
        hasApiKey: !!apiKey,
        envKeys: Object.keys(import.meta.env)
      });

      if (!apiKey) {
        throw new Error('Airtable API key is missing. Please set PUBLIC_AIRTABLE_API_KEY in Railway.');
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
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        console.error('Airtable API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error?.message || `Failed to submit form (Status: ${response.status})`);
      }
      
      toast.success('Welcome to the Greenfield Platform waitlist! We\'ll notify you when early access is available.');
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-100 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-[#00d9ff] transition-all"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-100 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-[#00d9ff] transition-all"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-100 mb-1">
          Company
        </label>
        <input
          type="text"
          id="company"
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-[#00d9ff] transition-all"
          value={formData.company}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="teamSize" className="block text-sm font-medium text-gray-100 mb-1">
          Team Size
        </label>
        <select
          id="teamSize"
          required
          className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-[#00d9ff] transition-all"
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
        <label htmlFor="currentAIUse" className="block text-sm font-medium text-gray-100 mb-1">
          Current AI Use
        </label>
        <textarea
          id="currentAIUse"
          required
          rows={3}
          placeholder="Tell us how your team currently uses AI tools..."
          className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-md text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-[#00d9ff] transition-all resize-none"
          value={formData.currentAIUse}
          onChange={(e) => setFormData(prev => ({ ...prev, currentAIUse: e.target.value }))}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#00d9ff] hover:bg-[#00d9ff]/90 text-black px-4 py-3 rounded-md font-semibold transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        {isSubmitting ? 'Joining Waitlist...' : 'Join the Waitlist'}
      </button>
    </form>
  );
};

export default EarlyAccessForm;