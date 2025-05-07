import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface FormData {
  email: string;
  name: string;
  company?: string;
  role?: string;
}

const EarlyAccessForm: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    company: '',
    role: ''
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
              'Role': formData.role || ''
            }
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to submit form');
      }
      
      toast.success('Thanks for your interest! We\'ll be in touch soon.');
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
          Company (Optional)
        </label>
        <input
          type="text"
          id="company"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.company}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
        />
      </div>
      
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-1">
          Role (Optional)
        </label>
        <input
          type="text"
          id="role"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={formData.role}
          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Request Early Access'}
      </button>
    </form>
  );
};

export default EarlyAccessForm;