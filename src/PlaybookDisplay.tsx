import { useState } from 'react';
import jsPDF from 'jspdf';
import { ChevronLeft, Download, Mail, CheckCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';
import UnifiedFeedback from './UnifiedFeedback';
import EmailPreviewModal from './EmailPreviewModal';

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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [optInDay1, setOptInDay1] = useState(false);

  const handleDownload = () => {
    const doc = new jsPDF();
    let y = 20;
    
    doc.setFontSize(18);
    doc.text(playbook.businessName, 20, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.text(playbook.overview, 20, y, { maxWidth: 170 });
    y += 20;
    
    playbook.weeks.forEach(week => {
      doc.setFontSize(14);
      doc.text('Week ' + week.week + ': ' + week.title, 20, y);
      y += 7;
      
      week.dailyTasks.forEach(task => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.text('Day ' + task.day + ': ' + task.title, 20, y);
        y += 5;
        doc.setFontSize(9);
        doc.text(task.description, 25, y, { maxWidth: 165 });
        y += 10;
      });
      y += 5;
    });
    
    doc.save(playbook.businessName + '-Playbook.pdf');
    analytics.playbookDownloaded();
  };

  const handleSendEmail = async () => {
    if (!userEmail) {
      alert('Email address not found. Please download the playbook instead.');
      return;
    }

    setIsSendingEmail(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-playbook-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          playbook: playbook,
          timeCommitment: timeCommitment,
          budget: budget,
          optInDay1: optInDay1,
          playbookId: playbook.playbookId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      setEmailSent(true);
      analytics.playbookEmailSent();

      if (optInDay1) {
        const { error } = await supabase.from('day1_emails').insert({
          email: userEmail,
          playbook_id: playbook.playbookId,
          business_name: playbook.businessName,
        });

        if (error) {
          console.error('Error saving Day 1 opt-in:', error);
        }
      }

      setTimeout(() => setEmailSent(false), 5000);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try downloading instead.');
    } finally {
      setIsSendingEmail(false);
      setShowEmailPreview(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
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
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Home
          </button>
        </div>

        {emailSent && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Action plan sent to {userEmail}!</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Your 4-Week Action Plan
            </h1>
            <h2 className="text-2xl font-semibold text-indigo-600 mb-4">
              {playbook.businessName}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {playbook.overview}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Plan
            </button>
            <button
              onClick={() => setShowEmailPreview(true)}
              disabled={isSendingEmail || !userEmail}
              className="flex items-center justify-center px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-5 h-5 mr-2" />
              {isSendingEmail ? 'Sending...' : 'Email Me This Plan'}
            </button>
          </div>

          {showEmailPreview && (
            <EmailPreviewModal
              playbook={playbook}
              userEmail={userEmail || ''}
              onClose={() => setShowEmailPreview(false)}
              onSend={handleSendEmail}
              isSending={isSendingEmail}
              optInDay1={optInDay1}
              setOptInDay1={setOptInDay1}
            />
          )}
        </div>

        <UnifiedFeedback userEmail={userEmail} />
      </div>
    </div>
  );
}
