import { useState } from 'react';
import { Check } from 'lucide-react';

const FEATURE_OPTIONS = [
  'Extended action plan (30-60 days)',
  'Community of other entrepreneurs',
  'One-on-one coaching or expert support',
  'Monthly webinars featuring entrepreneurs and thought leaders',
  'Progress tracking dashboard'
];

interface FeatureValidationProps {
  userEmail?: string;
}

export default function FeatureValidation({ userEmail }: FeatureValidationProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
      // Save EACH selected feedback as a SEPARATE record in Airtable
      const feedbackToSave = selectedFeatures.length > 0 ? selectedFeatures : ['Other'];
      
      // Create array of promises - one for each selected feedback
      const savePromises = feedbackToSave.map(feedback =>
        fetch('/api/save-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'action_plan_feedback',
            email: userEmail,
            data: {
              selectedFeedback: feedback,
              otherFeedback: customFeedback || ''
            }
          }),
        })
      );

      // Wait for all records to save
      const results = await Promise.all(savePromises);
      
      // Check if all saves were successful
      const allSuccessful = results.every(response => response.ok);

      if (!allSuccessful) {
        throw new Error('Failed to save some feedback records');
      }

      console.log(`✅ Saved ${feedbackToSave.length} feedback record(s) to Airtable`);
      
      // Show success message
      setShowSuccess(true);
      
      // Clear form
      setSelectedFeatures([]);
      setCustomFeedback('');

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 border-t border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          What features would help you launch faster?
        </h2>
        <p className="text-lg text-gray-600">
          Your feedback helps us build what you need.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="mb-8">
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

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Anything else you'd like to share? Let us know how we can support you.
          </label>
          <textarea
            value={customFeedback}
            onChange={(e) => setCustomFeedback(e.target.value.slice(0, 500))}
            placeholder="Your ideas help us build better..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className="text-sm text-gray-500 mt-1">
            {customFeedback.length}/500 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || (selectedFeatures.length === 0 && !customFeedback)}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Submit Feedback'}
        </button>

        {/* Success Toast - Appears at bottom after form submission */}
        {showSuccess && (
          <div className="mt-8 p-4 bg-white border-l-4 border-indigo-600 rounded-lg shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-indigo-600" strokeWidth={3} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Thank you for your feedback!</p>
                <p className="text-sm text-gray-600 mt-1">Your input helps us build better features.</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
