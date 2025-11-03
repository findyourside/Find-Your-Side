import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';

interface WaitlistSignupProps {
  userEmail?: string;
  onClose: () => void;
  reason?: 'playbook_limit' | 'monthly_limit';
}

export default function WaitlistSignup({ userEmail, onClose, reason = 'playbook_limit' }: WaitlistSignupProps) {
  const [email, setEmail] = useState(userEmail || '');
  const [features, setFeatures] = useState<string[]>([]);
  const [urgency, setUrgency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const featureOptions = [
    'More playbook generations',
    'Extended 60-90 day plans',
    'Weekly accountability emails',
    'Community access',
    'Templates & tools'
  ];

  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev =>
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
        .from('waitlist')
        .insert({
          email,
          features_interested: features,
          urgency_level: urgency
        });

      if (error) throw error;

      analytics.waitlistJoined();
      features.forEach(feature => analytics.waitlistFeatureSelected(feature));
      if (urgency) analytics.waitlistUrgency(urgency);

      setIsSuccess(true);
    } catch (err) {
      console.error('Error joining waitlist:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              You're on the list!
            </h2>
            <p className="text-gray-600 mb-6">
              We'll email you as soon as new features launch.
            </p>
            <p className="text-gray-700 font-semibold">
              In the meantime, start working on your 2 playbooks - that's where the magic happens! 💪
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          {reason === 'monthly_limit' ? (
            <>
              <div className="text-5xl mb-4">⚡</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                We've reached capacity this month
              </h2>
              <p className="text-gray-600 mb-2">
                To keep Find Your Side free, we cap monthly usage.
              </p>
              <p className="text-gray-600">
                Access reopens on the 1st of next month. Join our waitlist for priority access when we reopen + early access to premium features.
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                You've found your top ideas!
              </h2>
              <p className="text-gray-600">
                Want to explore more opportunities? Join our early access waitlist.
              </p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              What would help you most? (select all that apply)
            </label>
            <div className="space-y-2">
              {featureOptions.map((feature) => (
                <label
                  key={feature}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              When would you want this?
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="urgency"
                  value="immediate"
                  checked={urgency === 'immediate'}
                  onChange={(e) => setUrgency(e.target.value)}
                  required
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-gray-700">Immediately - I'd pay now</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="urgency"
                  value="3months"
                  checked={urgency === '3months'}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-gray-700">Within 3 months</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="urgency"
                  value="updates"
                  checked={urgency === 'updates'}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-gray-700">Just keeping me updated</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </button>
        </form>
      </div>
    </div>
  );
}
