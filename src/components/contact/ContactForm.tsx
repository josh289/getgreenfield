import React, { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  company: string;
  role: string;
  message: string;
  referral: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  company?: string;
  role?: string;
  message?: string;
}

const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
  switch (field) {
    case 'name':
      return value.trim() ? undefined : 'Name is required.';
    case 'email':
      if (!value.trim()) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address.';
      return undefined;
    case 'company':
      return value.trim() ? undefined : 'Company is required.';
    case 'role':
      return value.trim() ? undefined : 'Role is required.';
    case 'message':
      return value.trim() ? undefined : 'Project description is required.';
    default:
      return undefined;
  }
};

const ContactForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    role: '',
    message: '',
    referral: '',
  });

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

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
      <div role="status" className="text-center py-12 px-6 rounded-xl bg-ev-primary border border-sprout/8">
        <div className="w-16 h-16 rounded-full bg-sprout/5 border border-sprout/8 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-sprout" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-ev-text mb-2">Message sent!</h3>
        <p className="text-ev-text-secondary">We will review your submission and respond within 24 hours.</p>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-white border border-ev-default rounded-md text-ev-text placeholder:text-ev-text-muted focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:border-sprout transition-all";
  const inputErrorClass = "w-full px-4 py-3 bg-white border border-coral rounded-md text-ev-text placeholder:text-ev-text-muted focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all";
  const labelClass = "block text-sm font-medium text-ev-text mb-1.5";

  const getInputClass = (field: keyof FieldErrors) =>
    touched[field] && fieldErrors[field] ? inputErrorClass : inputClass;

  const FieldError = ({ field }: { field: keyof FieldErrors }) => {
    if (!touched[field] || !fieldErrors[field]) return null;
    return (
      <p role="alert" className="text-coral text-xs mt-1 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        {fieldErrors[field]}
      </p>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>Name *</label>
          <input type="text" id="name" required className={getInputClass('name')} placeholder="Your name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} onBlur={() => handleBlur('name')} aria-invalid={touched.name && !!fieldErrors.name} aria-describedby={fieldErrors.name ? 'name-error' : undefined} />
          <FieldError field="name" />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email *</label>
          <input type="email" id="email" required className={getInputClass('email')} placeholder="you@company.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} onBlur={() => handleBlur('email')} aria-invalid={touched.email && !!fieldErrors.email} aria-describedby={fieldErrors.email ? 'email-error' : undefined} />
          <FieldError field="email" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="company" className={labelClass}>Company *</label>
          <input type="text" id="company" required className={getInputClass('company')} placeholder="Company name" value={formData.company} onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))} onBlur={() => handleBlur('company')} aria-invalid={touched.company && !!fieldErrors.company} aria-describedby={fieldErrors.company ? 'company-error' : undefined} />
          <FieldError field="company" />
        </div>
        <div>
          <label htmlFor="role" className={labelClass}>Your Role *</label>
          <input type="text" id="role" required className={getInputClass('role')} placeholder="e.g. CTO, VP Engineering" value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))} onBlur={() => handleBlur('role')} aria-invalid={touched.role && !!fieldErrors.role} aria-describedby={fieldErrors.role ? 'role-error' : undefined} />
          <FieldError field="role" />
        </div>
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>Tell us about your project *</label>
        <textarea id="message" required rows={5} className={`${getInputClass('message')} resize-none`} placeholder="What are you building? What does your current codebase look like? What does production need to look like?" value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} onBlur={() => handleBlur('message')} aria-invalid={touched.message && !!fieldErrors.message} aria-describedby={fieldErrors.message ? 'message-error' : undefined} />
        <FieldError field="message" />
      </div>
      <div>
        <label htmlFor="referral" className={labelClass}>How did you hear about us? <span className="text-ev-text-muted">(optional)</span></label>
        <input type="text" id="referral" className={inputClass} placeholder="" value={formData.referral} onChange={(e) => setFormData(prev => ({ ...prev, referral: e.target.value }))} />
      </div>
      {error && <p role="alert" className="text-coral text-sm flex items-center gap-1.5"><svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg><span><span className="font-semibold">Error:</span> {error}</span></p>}
      <button type="submit" disabled={isSubmitting} className="w-full bg-sprout text-ev-text-inverse px-6 py-3 rounded-md font-semibold transition-all cursor-pointer hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:ring-offset-2 focus:ring-offset-ev-void">
        {isSubmitting ? 'Sending...' : 'Get Started'}
      </button>
    </form>
  );
};

export default ContactForm;
