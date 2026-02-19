import React, { useState } from 'react';

interface FormData {
  email: string;
  name: string;
  company?: string;
  teamSize?: string;
  currentAIUse?: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
}

const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
  switch (field) {
    case 'name':
      return value.trim() ? undefined : 'Name is required.';
    case 'email':
      if (!value.trim()) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address.';
      return undefined;
    default:
      return undefined;
  }
};

const EarlyAccessForm: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    company: '',
    teamSize: '',
    currentAIUse: ''
  });

  const handleBlur = (field: keyof FieldErrors) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

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

  const inputClass = "w-full px-3 py-2 bg-white border border-ev-default rounded-md text-ev-text focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:border-sprout transition-all";
  const inputErrorClass = "w-full px-3 py-2 bg-white border border-coral rounded-md text-ev-text focus:outline-none focus:ring-2 focus:ring-coral/50 focus:border-coral transition-all";

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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {successMessage && (
        <div role="status" className="p-3 rounded-md bg-sprout/5 border border-sprout/8 text-sprout text-sm">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="p-3 rounded-md bg-coral/5 border border-coral/8 text-coral text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span><span className="font-semibold">Error:</span> {errorMessage}</span>
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
          className={getInputClass('name')}
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          onBlur={() => handleBlur('name')}
          aria-invalid={touched.name && !!fieldErrors.name}
        />
        <FieldError field="name" />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ev-text mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          required
          className={getInputClass('email')}
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          onBlur={() => handleBlur('email')}
          aria-invalid={touched.email && !!fieldErrors.email}
        />
        <FieldError field="email" />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-ev-text mb-1">
          Company
        </label>
        <input
          type="text"
          id="company"
          className={inputClass}
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
          className={inputClass}
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
          className={`${inputClass} placeholder:text-ev-text-muted resize-none`}
          value={formData.currentAIUse}
          onChange={(e) => setFormData(prev => ({ ...prev, currentAIUse: e.target.value }))}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-sprout hover:bg-sprout/90 text-ev-text-inverse px-4 py-3 rounded-md font-semibold transition-all cursor-pointer hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-sprout/50 focus:ring-offset-2 focus:ring-offset-ev-void"
      >
        {isSubmitting ? 'Joining Waitlist...' : 'Join the Waitlist'}
      </button>
    </form>
  );
};

export default EarlyAccessForm;
