import { useState } from 'react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';

type InterestType = 'extended_plan' | 'newsletter' | 'complete_satisfied';

interface InterestCaptureProps {
  userEmail?: string;
}

export default function InterestCapture({ userEmail }: InterestCaptureProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInterest = async (interestType: InterestType) => {
    setSuccessMessage(null);

    try {
      const { error } = await supabase
        .from('user_interest')
        .insert({
          email: userEmail || null,
          interest_type: interestType,
        });

      if (error) throw error;

      if (interestType === 'extended_plan') {
        setSuccessMessage('✅ We\'ll let you know when extended plans are available!');
        analytics.interestRecorded('extended_plan');
      } else if (interestType === 'newsletter') {
        setSuccessMessage('✅ Great! Check your email for updates and tips.');
        analytics.interestRecorded('newsletter');
      } else if (interestType === 'complete_satisfied') {
        setSuccessMessage('✅ Awesome! Go build something amazing.');
        analytics.interestRecorded('complete_satisfied');
      }

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error recording interest:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-semibold">{successMessage}</p>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">What's next for you?</h3>
        <p className="text-gray-600">Let us know how we can support you.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <button
          onClick={() => handleInterest('extended_plan')}
          className="p-6 border-2 border-indigo-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-all text-center"
        >
          <h4 className="font-semibold text-gray-900 mb-2">I want a 30-60 day growth plan</h4>
          <p className="text-sm text-gray-600">Extended guidance for scaling</p>
        </button>

        <button
          onClick={() => handleInterest('newsletter')}
          className="p-6 border-2 border-indigo-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-all text-center"
        >
          <h4 className="font-semibold text-gray-900 mb-2">Send me updates</h4>
          <p className="text-sm text-gray-600">Weekly tips and builder stories</p>
        </button>

        <button
          onClick={() => handleInterest('complete_satisfied')}
          className="p-6 border-2 border-indigo-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-all text-center"
        >
          <h4 className="font-semibold text-gray-900 mb-2">I'm all set</h4>
          <p className="text-sm text-gray-600">Ready to build on my own</p>
        </button>
      </div>
    </div>
  );
}
