import { useState } from 'react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';

type InterestType = 'extended_roadmap' | 'newsletter' | 'feature_feedback';

interface UnifiedFeedbackProps {
  userEmail?: string;
}

export default function UnifiedFeedback({ userEmail }: UnifiedFeedbackProps) {
  const [selectedInterest, setSelectedInterest] = useState<InterestType | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const FEATURE_OPTIONS = [
    'Extended action plan (30-60 days)',
    'Weekly check-in emails to stay accountable',
    'Community of other builders',
    'One-on-one coaching or expert support',
    'Templates and resources (contracts, pricing sheets, etc.)',
    'Industry-specific action plans',
    'Progress tracking dashboard'
  ];

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
        .from('user_feedback')
        .insert({
          email: email || null,
          interest_type: selectedInterest || 'feature_feedback',
          selected_features: selectedFeatures,
          custom_feedback: customFeedback || null
        });

      if (error) throw error;

      analytics.feedbackSubmitted(selectedFeatures.length);
      setIsSubmitted(true);

      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedInterest(null);
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
          <h3 className="text-2xl font-bold text-green-800 mb-2">Thank you!</h3>
          <p className="text-green-700">Your feedback helps us build what you need. Let's build this together.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 border-t border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Now that you have your action plan, what's next?
        </h2>
        <p className="text-lg text-gray-600">
          We want to hear from you. Let's build this together.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        
        {/* What's Next Section */}
        <div className="mb-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What would help you most?</h3>
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-all">
              <input
                type="radio"
                name="interest"
                value="extended_roadmap"
                checked={selectedInterest === 'extended_roadmap'}
                onChange={(e) => setSelectedInterest(e.target.value as InterestType)}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="ml-3 text-gray-800">
                <strong>Extended action plan</strong> - I want 30-60 days of guidance
              </span>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-all">
              <input
                type="radio"
                name="interest"
                value="newsletter"
                checked={selectedInterest === 'newsletter'}
                onChange={(e) => setSelectedInterest(e.target.value as InterestType)}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="ml-3 text-gray-800">
                <strong>Stay in the loop</strong> - Send me updates and tips
              </span>
            </label>
            <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-white cursor-pointer transition-all">
              <input
                type="radio"
                name="interest"
                value="feature_feedback"
                checked={selectedInterest === 'feature_feedback'}
                onChange={(e) => setSelectedInterest(e.target.value as InterestType)}
                className="w-4 h-4 text-indigo-600"
              />
              <span className="ml-3 text-gray-800">
                <strong>Share feedback</strong> - I have suggestions to help
              </span>
            </label>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What features would help you build faster?</h3>
          <div className="space-y-3">
            {FEATURE_OPTIONS.map((feature) => (
              <label
                key={feature}
                className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all"
              >
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feature)}
                  onChange={() => handleFeatureToggle(feature)}
                  className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-800">{feature}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Feedback Section */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Anything else you'd like to share?
          </label>
          <textarea
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value.slice(0, 500))}
            placeholder="Your ideas help us build better. What would make this even more valuable?"
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className="text-sm text-gray-500 mt-1">
            {customFeedback.length}/500 characters
          </p>
        </div>

        {/* Email Section */}
        {!userEmail && (
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Your email (so we can follow up):
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || (!selectedInterest && selectedFeatures.length === 0 && !customFeedback)}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Let\'s Build Together'}
        </button>
      </form>
    </div>
  );
}
