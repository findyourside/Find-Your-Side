import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';

interface WaitlistSignupProps {
  userEmail?: string;
  onClose: () => void;
  reason: 'playbook_limit' | 'monthly_limit';
}

export default function WaitlistSignup({ userEmail, onClose, reason }: WaitlistSignupProps) {
  const [email, setEmail] = useState(userEmail || '');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [urgency, setUrgency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const features = [
    'More playbook generations',
    '60-90 day extended playbooks',
    'Weekly check-in emails',
    'Community access',
    'Expert coaching',
    'Templates & resources',
  ];

  const urgencyOptions = [
    'Immediately - I want to start now',
    'Within a week',
    'Within a month',
    'Just exploring options',
  ];

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('waitlist').insert({
        email: email,
        reason: reason,
        requested_features: selectedFeatures,
        urgency: urgency,
        source: reason === 'playbook_limit' ? 'playbook_limit_reached' : 'monthly_cap_reached',
      });

      if (error) throw error;

      analytics.waitlistJoined();
      selectedFeatures.forEach((feature) => analytics.waitlistFeatureSelected(feature));
      if (urgency) analytics.waitlistUrgency(urgency);

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error joining waitlist:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">You're on the list!</h2>
          <p className="text-gray-600">
            We'll email you when we launch paid plans with unlimited generations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {reason === 'playbook_limit'
              ? "You've used your 2 free playbooks!"
              : 'Monthly generation limit reached'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <p className="text-lg text-gray-700 mb-4">
              {reason === 'playbook_limit'
                ? "We limit free users to 2 playbooks to keep costs sustainable. Join our waitlist to get early access to unlimited generations!"
                : "We've hit our monthly spending cap to keep the service free. Join the waitlist for priority access when we launch paid plans!"}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3">
              What features would you pay for?
            </label>
            <div className="space-y-2">
              {features.map((feature) => (
                <label
                  key={feature}
                  className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="ml-3 text-gray-800">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3">
              How soon do you need this?
            </label>
            <div className="space-y-2">
              {urgencyOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-all"
                >
                  <input
                    type="radio"
                    name="urgency"
                    checked={urgency === option}
                    onChange={() => setUrgency(option)}
                    className="w-5 h-5 text-indigo-600"
                  />
                  <span className="ml-3 text-gray-800">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full px-6 py-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </button>

          <p className="text-sm text-gray-500 mt-4 text-center">
            We'll email you when paid plans launch. Expected: Q1 2026
          </p>
        </form>
      </div>
    </div>
  );
}
