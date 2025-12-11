import { useState } from 'react';
import jsPDF from 'jspdf';
import { ChevronLeft, Download, Mail, CheckCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';
import FeatureValidation from './FeatureValidation';
import EmailPreviewModal from './EmailPreviewModal';

interface DailyTask {
  day: number;
  title: string;
  description: string;
}

interface Week {
  week: number;
  title: string;
  focusArea: string;
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

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // Title
    doc.setFontSize(20);
    doc.text('Your 4-Week Action Plan', margin, y);
    y += 10;

    // Business name
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text(playbook.businessName, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 8;

    // Overview
    doc.setFontSize(10);
    const overviewLines = doc.splitTextToSize(playbook.overview, maxWidth);
    doc.text(overviewLines, margin, y);
    y += overviewLines.length * 5 + 5;

    // Weeks
    playbook.weeks.forEach((week) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }

      // Week header
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Week ${week.week}: ${week.title}`, margin, y);
      doc.setFont(undefined, 'normal');
      y += 6;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Focus: ${week.focusArea}`, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 7;

      // Daily tasks
      week.dailyTasks.forEach((task) => {
        if (y > pageHeight - 60) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(`Day ${task.day}: ${task.title}`, margin, y);
        doc.setFont(undefined, 'normal');
        y += 5;

        doc.setFontSize(10);
        const descLines = doc.splitTextToSize(task.description, maxWidth - 5);
        doc.text(descLines, margin + 5, y);
        y += descLines.length * 4 + 5;
      });

      // Reflection section
      if (y > pageHeight - 80) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Week ${week.week} Reflection`, margin, y);
      doc.setFont(undefined, 'normal');
      y += 7;

      doc.setFontSize(10);
      doc.text('What was your biggest win this week? What lessons did you learn?', margin, y);
      y += 5;
      doc.rect(margin, y, maxWidth, 25);
      y += 30;

      doc.text('In addition to the goals outlined for next week, what else would you focus on?', margin, y);
      y += 5;
      doc.rect(margin, y, maxWidth, 25);
      y += 35;
    });

    doc.save(`${playbook.businessName}-Action-Plan.pdf`);
    analytics.playbookDownloaded();
  };

  const handleSendEmail = async () => {
    if (!userEmail) {
      alert('Email address not found. Please download the action plan instead.');
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Your 4-Week Action Plan</h1>
          <h2 className="text-2xl font-semibold text-indigo-600 mb-4">{playbook.businessName}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{playbook.overview}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={generatePDF}
            className="flex items-center justify-center px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Plan
          </button>
          <button
            onClick={() => setShowEmailPreview(true)}
            disabled={isSendingEmail || !userEmail}
            className="flex items-center justify-center px-8 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

        <FeatureValidation userEmail={userEmail} />
      </div>
    </div>
  );
}
