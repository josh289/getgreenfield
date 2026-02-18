import React, { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  company: string;
  role: string;
  message: string;
  referral: string;
}

const ContactForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    role: '',
    message: '',
    referral: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12 px-6 rounded-lg bg-ev-primary border border-sprout/20">
        <div className="w-16 h-16 rounded-full bg-sprout/10 border border-sprout/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-sprout" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-ev-text mb-2">Message sent!</h3>
        <p className="text-ev-text-secondary">We will review your submission and respond within 24 hours.</p>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-ev-void border border-ev-default rounded-md text-ev-text placeholder:text-ev-text-muted focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:border-sprout transition-all";
  const labelClass = "block text-sm font-medium text-ev-text mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>Name *</label>
          <input type="text" id="name" required className={inputClass} placeholder="Your name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email *</label>
          <input type="email" id="email" required className={inputClass} placeholder="you@company.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="company" className={labelClass}>Company *</label>
          <input type="text" id="company" required className={inputClass} placeholder="Company name" value={formData.company} onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="role" className={labelClass}>Your Role *</label>
          <input type="text" id="role" required className={inputClass} placeholder="e.g. CTO, VP Engineering" value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))} />
        </div>
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>Tell us about your project *</label>
        <textarea id="message" required rows={5} className={`${inputClass} resize-none`} placeholder="What are you building? What does your current codebase look like? What does production need to look like?" value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} />
      </div>
      <div>
        <label htmlFor="referral" className={labelClass}>How did you hear about us? <span className="text-ev-text-muted">(optional)</span></label>
        <input type="text" id="referral" className={inputClass} placeholder="" value={formData.referral} onChange={(e) => setFormData(prev => ({ ...prev, referral: e.target.value }))} />
      </div>
      {error && <p className="text-coral text-sm">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="w-full bg-sprout text-ev-text-inverse px-6 py-3 rounded-md font-semibold transition-all hover:shadow-[0_0_30px_rgba(80,200,120,0.5)] disabled:opacity-50 disabled:cursor-not-allowed">
        {isSubmitting ? 'Sending...' : 'Get Started'}
      </button>
    </form>
  );
};

export default ContactForm;
