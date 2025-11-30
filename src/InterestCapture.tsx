import { useState } from 'react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';

type InterestType = 'extended_playbook' | 'newsletter' | 'complete_satisfied';

interface InterestCaptureProps {
  userEmail?: string;
}

export default function InterestCapture({ userEmail }: InterestCaptureProps) {
  const [showExtendedForm, setShowExtendedForm] = useState(false);
  const [showNewsletterForm, setShowNewsletterForm] = useState(false);
  const [showAllSetMessage, setShowAllSetMessage] = useState(false);
  const [email, setEmail] = useState(userEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInterestSubmit = async (type: InterestType, metadata?: Record<string, unknown>) => {
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('user_interests')
        .insert({
          email: email,
          interest_type: type,
          metadata: metadata || {}
        });

      if (error) throw error;

      if (email && !userEmail) {
        analytics.emailCaptured(type === 'extended_playbook' ? 'extended_playbook' :
                               type === 'newsletter' ? 'newsletter' : 'complete');
      }

      if (type === 'extended_playbook') {
        setSuccessMessage("Thanks! We're building extended playbooks. You'll be first to know when they launch. Expected: Q1 2026");
        setShowExtendedForm(false);
      } else if (type === 'newsletter') {
        setSuccessMessage("You're on the list!");
        setShowNewsletterForm(false);
      }

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error submitting interest:', error);
      setSuccessMessage('Something went wrong. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtendedPlaybook = () => {
    setSuccessMessage('');
    setShowAllSetMessage(false);
    
    if (userEmail) {
      handleInterestSubmit('extended_playbook');
    } else {
      setShowExtendedForm(true);
      setShowNewsletterForm(false);
    }
  };

  const handleNewsletter = () => {
    setSuccessMessage('');
    setShowAllSetMessage(false);
    
    if (userEmail) {
      handleInterestSubmit('newsletter');
    } else {
      setShowNewsletterForm(true);
      setShowExtendedForm(false);
    }
  };

  const handleAllSet = () => {
    setSuccessMessage('');
    setShowExtendedForm(false);
    setShowNewsletterForm(false);
    setShowAllSetMessage(true);
    
    if (userEmail) {
      handleInterestSubmit('complete_satisfied');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          You've got your 4-week launch plan. What's next?
        </h2>
        <p className="text-lg text-gray-600">
          Let us know how we can support you beyond 4 weeks
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">
          {successMessage}
        </div>
      )}

      {showAllSetMessage && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center">
          Awesome! We're here if you need anything. Good luck with your launch! 🚀
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
        <button
          onClick={handleExtendedPlaybook}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
        >
          I want a 30-60 day growth plan
        </button>

        <button
          onClick={handleNewsletter}
          className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all"
        >
          Send me updates
        </button>

        <button
          onClick={handleAllSet}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-all"
        >
          I'm all set
        </button>
      </div>

      {showExtendedForm && (
        <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Get on the waitlist</h3>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            onClick={() => handleInterestSubmit('extended_playbook')}
            disabled={!email || isSubmitting}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Notify Me'}
          </button>
        </div>
      )}

      {showNewsletterForm && (
        <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Stay in the loop</h3>
          <p className="text-gray-600 mb-4">Get tips, tools, and updates for side business builders</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            onClick={() => handleInterestSubmit('newsletter')}
            disabled={!email || isSubmitting}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
      )}
    </div>
  );
}
