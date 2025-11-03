import { useState } from 'react';
import { ChevronLeft, Calendar, Clock, DollarSign, Download, Mail, Eye } from 'lucide-react';
import InterestCapture from './InterestCapture';
import FeatureValidation from './FeatureValidation';
import EmailPreviewModal from './EmailPreviewModal';
import { analytics } from './lib/analytics';

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
  playbookId?: string;
}

interface PlaybookDisplayProps {
  playbook: Playbook;
  onBack: () => void;
  userEmail?: string;
  timeCommitment?: string;
  budget?: string;
}

export default function PlaybookDisplay({ playbook, onBack, userEmail, timeCommitment, budget }: PlaybookDisplayProps) {
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [accountabilityOptIn, setAccountabilityOptIn] = useState(false);
  const [accountabilitySubmitting, setAccountabilitySubmitting] = useState(false);
  const [accountabilitySubmitted, setAccountabilitySubmitted] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    analytics.playbookDownloaded();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playbook: {
              ...playbook,
              timeCommitment,
              budget,
            },
          }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const sanitizedBusinessName = playbook.businessName
          .replace(/[^a-z0-9]/gi, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 50);
        a.download = `FindYourSide-${sanitizedBusinessName}-30DayPlan.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate PDF. Please try again.');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleEmailPlaybook = async () => {
    if (!userEmail) {
      alert('Email address not available');
      return;
    }

    setEmailSending(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-playbook`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            playbook: {
              ...playbook,
              timeCommitment,
              budget,
            },
          }),
        }
      );

      if (response.ok) {
        setEmailSent(true);
        analytics.playbookEmailSent();
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  const handleAccountabilityOptIn = async () => {
    if (!userEmail || !accountabilityOptIn || accountabilitySubmitted || !playbook.playbookId) {
      return;
    }

    setAccountabilitySubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accountability-optin`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            playbookId: playbook.playbookId,
          }),
        }
      );

      if (response.ok) {
        setAccountabilitySubmitted(true);
      } else {
        alert('Failed to save reminder preference. Please try again.');
      }
    } catch (err) {
      console.error('Error saving accountability opt-in:', err);
      alert('Failed to save reminder preference. Please try again.');
    } finally {
      setAccountabilitySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center">
            <img
              src="/Find your side dark.svg"
              alt="Find Your Side - Idea to Execution"
              className="w-[280px] h-auto"
            />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 print:hidden">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Ideas
          </button>
        </div>

        <div className="rounded-2xl p-8 text-white mb-8" style={{ backgroundImage: 'linear-gradient(to right, #4F46E5, #4338CA)' }}>
          <h1 className="text-4xl font-bold mb-4">Your 30-Day Launch Plan</h1>
          <h2 className="text-3xl mb-4">{playbook.businessName}</h2>
          <p className="text-lg mb-6" style={{ color: '#E0E7FF' }}>{playbook.overview}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {timeCommitment && (
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Weekly Time Commitment</span>
                </div>
                <p style={{ color: '#E0E7FF' }}>{timeCommitment}</p>
              </div>
            )}
            {budget && (
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <DollarSign className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Total Budget Needed</span>
                </div>
                <p style={{ color: '#E0E7FF' }}>{budget}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {playbook.weeks.map((week) => (
            <div
              key={week.week}
              className="bg-white border-2 border-gray-200 rounded-2xl p-8 print:break-inside-avoid"
            >
              <div className="flex items-center mb-6 pb-4 border-b-2 border-gray-100">
                <Calendar className="w-8 h-8 mr-3" style={{ color: '#4F46E5' }} />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Week {week.week}</h3>
                  <p className="text-xl font-semibold" style={{ color: '#4F46E5' }}>{week.title}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="mb-4">
                  <p className="text-gray-700 text-sm">{week.focusArea}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-bold text-green-900 mb-1">Success Metric for Week {week.week}</h4>
                  <p className="text-green-800">{week.successMetric}</p>
                  <div className="flex items-center mt-2 text-sm text-green-700">
                    <Clock className="w-3 h-3 mr-1" />
                    Total time this week: {week.totalTime}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Daily Tasks</h4>
                  <div className="space-y-4">
                    {week.dailyTasks.map((task, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-5">
                        <div className="flex items-start mb-3">
                          <div className="flex-shrink-0 bg-indigo-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">
                            {task.day}
                          </div>
                          <h5 className="text-lg font-bold text-gray-900 flex-1">{task.title}</h5>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed mb-3 ml-11">{task.description}</p>
                        <div className="ml-11 flex flex-wrap gap-4 items-center">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-1.5" style={{ color: '#4F46E5' }} />
                            <span className="font-semibold">Time:</span>
                            <span className="ml-1">{task.timeEstimate}</span>
                          </div>
                          {task.resources.length > 0 && (
                            <div className="flex items-start text-sm text-gray-600">
                              <span className="font-semibold mr-1.5">📋 Resources:</span>
                              <span>{task.resources.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 space-y-8 print:hidden">
          <div className="rounded-2xl p-8" style={{ backgroundColor: '#EEF2FF' }}>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Get Your Playbook</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                className="flex items-center justify-center px-8 py-4 text-white text-lg font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#4F46E5' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4338CA')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
              >
                <Download className="w-5 h-5 mr-2" />
                {pdfGenerating ? 'Generating PDF...' : 'Download as PDF'}
              </button>
              <button
                onClick={handleEmailPlaybook}
                disabled={emailSending || emailSent || !userEmail}
                className="flex items-center justify-center px-8 py-4 border-2 text-lg font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: '#4F46E5', color: '#4F46E5' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#EEF2FF')}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Mail className="w-5 h-5 mr-2" />
                {emailSent ? 'Email Sent!' : emailSending ? 'Sending...' : 'Email Me This Playbook'}
              </button>
            </div>
          </div>

          {userEmail && !accountabilitySubmitted && (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Want help staying on track?</h3>
              <div className="flex items-start mb-6">
                <input
                  type="checkbox"
                  id="accountability-optin"
                  checked={accountabilityOptIn}
                  onChange={(e) => setAccountabilityOptIn(e.target.checked)}
                  className="mt-1 mr-3 w-5 h-5 cursor-pointer"
                  style={{ accentColor: '#4F46E5' }}
                />
                <label htmlFor="accountability-optin" className="text-gray-700 cursor-pointer">
                  Email me a reminder to start Day 1 tomorrow (we'll check in once to help you get started)
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                {accountabilityOptIn && (
                  <button
                    onClick={handleAccountabilityOptIn}
                    disabled={accountabilitySubmitting}
                    className="px-6 py-3 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#4F46E5' }}
                    onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4338CA')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
                  >
                    {accountabilitySubmitting ? 'Saving...' : 'Yes, remind me tomorrow'}
                  </button>
                )}
                <button
                  onClick={() => setShowEmailPreview(true)}
                  className="flex items-center gap-2 px-6 py-3 border-2 font-semibold rounded-lg transition-all hover:bg-gray-50"
                  style={{ borderColor: '#4F46E5', color: '#4F46E5' }}
                >
                  <Eye className="w-5 h-5" />
                  Preview Day 1 Email
                </button>
              </div>
            </div>
          )}

          {accountabilitySubmitted && (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-green-900 mb-2">Reminder set!</h3>
              <p className="text-green-800">We'll email you tomorrow to help you get started on Day 1.</p>
            </div>
          )}
        </div>

        <InterestCapture userEmail={userEmail} />

        <FeatureValidation userEmail={userEmail} />
      </div>

      {showEmailPreview && playbook.weeks[0]?.dailyTasks[0] && (
        <EmailPreviewModal
          businessName={playbook.businessName}
          taskTitle={playbook.weeks[0].dailyTasks[0].title}
          taskDescription={playbook.weeks[0].dailyTasks[0].description}
          timeEstimate={playbook.weeks[0].dailyTasks[0].timeEstimate}
          userEmail={userEmail}
          onClose={() => setShowEmailPreview(false)}
        />
      )}
    </div>
  );
}
