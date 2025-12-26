import { X } from 'lucide-react';

interface DailyTask {
  day: number;
  title: string;
  description: string;
  timeEstimate: string;
  resources: string[];
}

interface Week {
  week: number;
  title: string;
  focusArea: string;
  successMetric: string;
  totalTime: string;
  dailyTasks: DailyTask[];
}

interface Playbook {
  businessName: string;
  overview: string;
  weeks: Week[];
}

interface EmailPreviewModalProps {
  playbook: Playbook;
  userEmail: string;
  onClose: () => void;
  onSend: () => void;
  isSending: boolean;
  optInDay1: boolean;
  setOptInDay1: (value: boolean) => void;
}

export default function EmailPreviewModal({
  playbook,
  userEmail,
  onClose,
  onSend,
  isSending,
  optInDay1,
  setOptInDay1,
}: EmailPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Email Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Email Header */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">To:</p>
            <p className="text-gray-900 font-semibold">{userEmail}</p>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Subject:</p>
            <p className="text-gray-900 font-semibold">
              Your 30-Day Launch Action Plan: {playbook.businessName}
            </p>
          </div>

          {/* Email Content */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 mb-6">
            <p className="text-gray-800 mb-4">Hi there!</p>
            
            <p className="text-gray-800 mb-4">
              Your personalized 30-day launch action plan for <strong className="text-indigo-600">{playbook.businessName}</strong> is ready!
            </p>
            
            <p className="text-gray-800 mb-4">{playbook.overview}</p>
            
            <p className="text-gray-800 mb-4">
              Your action plan includes {playbook.weeks.length} weeks of tasks to help you launch successfully.
            </p>
            
            <div className="bg-white border-l-4 border-indigo-600 p-4 mb-4">
              <p className="text-gray-900 font-bold mb-1">
                Week 1: {playbook.weeks[0]?.title}
              </p>
              <p className="text-gray-600 text-sm">
                Focus: {playbook.weeks[0]?.focusArea}
              </p>
            </div>
            
            <p className="text-gray-800 mb-4">
              Download your complete action plan and start building today!
            </p>
            
            <p className="text-gray-800">
              Good luck with your launch!
              <br />
              The Find Your Side Team
            </p>
          </div>

          {/* Optional Section */}
          <div className="mb-6 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={optInDay1}
                onChange={(e) => setOptInDay1(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded mt-1 mr-3"
              />
              <div>
                <p className="text-gray-900 font-semibold mb-1">
                  Send me Day 1 tasks via email (Optional)
                </p>
                <p className="text-sm text-gray-600">
                  We'll email you tomorrow with your Day 1 tasks to help you get started. You can unsubscribe anytime.
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={isSending}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
