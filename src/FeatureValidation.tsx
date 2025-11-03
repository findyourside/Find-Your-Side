import { useState } from 'react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';

const FEATURE_OPTIONS = [
  'Longer playbook (60-90 days to scale)',
  'Weekly check-in emails to stay accountable',
  'Community of other builders',
  'One-on-one coaching or expert support',
  'Templates and resources (contracts, pricing sheets, etc.)',
  'Industry-specific playbooks (e.g., e-commerce, services, content)',
  'Progress tracking dashboard'
];

interface FeatureValidationProps {
  userEmail?: string;
}

export default function FeatureValidation({ userEmail }: FeatureValidationProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('feature_feedback')
        .insert({
          email: email || null,
          selected_features: selectedFeatures,
          custom_feedback: customFeedback || null
        });

      if (error) throw error;

      analytics.feedbackSubmitted(selectedFeatures.length);

      setIsSubmitted(true);

      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedFeatures([]);
        setCustomFeedback('');
        setEmail(userEmail || '');
      }, 5000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-8 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-5xl mb-4">✓</div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">Thanks!</h3>
          <p className="text-green-700">Your input helps us build what you actually need.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 border-t border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Found this helpful? What would make it even better?
        </h2>
        <p className="text-lg text-gray-600">
          Your feedback shapes what we build next (takes 30 seconds)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="space-y-3 mb-6">
          {FEATURE_OPTIONS.map((feature) => (
            <label
              key={feature}
              className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
            >
              <input
                type="checkbox"
                checked={selectedFeatures.includes(feature)}
                onChange={() => handleFeatureToggle(feature)}
                className="mt-1 mr-3 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-800">{feature}</span>
            </label>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Something else? Tell us what you'd love to see:
          </label>
          <textarea
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value.slice(0, 500))}
            placeholder="Any other features, tools, or support that would help..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className="text-sm text-gray-500 mt-1">
            {customFeedback.length}/500 characters
          </p>
        </div>

        {!userEmail && (
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Email (optional - but helps us follow up):
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (selectedFeatures.length === 0 && !customFeedback)}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Send Feedback'}
        </button>
      </form>
    </div>
  );
}
