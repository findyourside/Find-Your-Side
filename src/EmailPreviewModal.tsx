import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface EmailPreviewModalProps {
  businessName: string;
  taskTitle: string;
  taskDescription: string;
  timeEstimate: string;
  userEmail?: string;
  onClose: () => void;
}

function generateEmailHTML(businessName: string, taskTitle: string, taskDescription: string, timeEstimate: string): string {
  const sentences = taskDescription.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const shortDescription = sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '.' : '');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ready to start Day 1?</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4f46e5, #6366f1); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
    <h1 style="margin: 0 0 10px 0; font-size: 28px;">Ready to start Day 1? 🚀</h1>
  </div>

  <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
    You got your 30-day launch plan for <strong>${businessName}</strong> yesterday. Today is Day 1!
  </p>

  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
    <h3 style="margin: 0 0 5px 0; color: #92400e; font-size: 18px;">📋 Day 1: ${taskTitle}</h3>
    <p style="margin: 10px 0 0 0; color: #78350f; font-size: 14px;">
      ⏱️ Time needed: ${timeEstimate}
    </p>
  </div>

  <p style="font-size: 15px; color: #374151; line-height: 1.8; margin-bottom: 25px;">
    ${shortDescription}
  </p>

  <div style="background-color: #eff6ff; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
    <p style="color: #1e40af; font-size: 16px; margin: 0; text-align: center;">
      <strong>Reply to this email if you complete it - we'd love to hear how it goes!</strong>
    </p>
  </div>

  <p style="font-size: 15px; color: #374151; margin-bottom: 10px;">
    - The Find Your Side Team
  </p>

  <p style="font-size: 14px; color: #6b7280; font-style: italic;">
    P.S. This is the only reminder we'll send unless you ask for more. You've got this! 💪
  </p>

  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 12px; margin: 0;">
      Find Your Side - Idea to Execution
    </p>
  </div>
</body>
</html>
  `.trim();
}

export default function EmailPreviewModal({ businessName, taskTitle, taskDescription, timeEstimate, userEmail, onClose }: EmailPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const emailHTML = generateEmailHTML(businessName, taskTitle, taskDescription, timeEstimate);

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(emailHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Day 1 Email Preview</h2>
            <p className="text-indigo-100 text-sm">This is how your reminder email will look</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="font-semibold text-gray-600 w-16">To:</span>
                <span className="text-gray-800">{userEmail || 'user@example.com'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-16">From:</span>
                <span className="text-gray-800">Find Your Side &lt;onboarding@resend.dev&gt;</span>
              </div>
              <div className="flex">
                <span className="font-semibold text-gray-600 w-16">Subject:</span>
                <span className="text-gray-800">Ready to start Day 1? 🚀</span>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm">
            <div
              dangerouslySetInnerHTML={{ __html: emailHTML }}
              style={{
                fontFamily: 'Arial, sans-serif',
                maxWidth: '600px',
                margin: '0 auto'
              }}
            />
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end items-center">
          <div className="flex gap-3">
            <button
              onClick={handleCopyHTML}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy HTML
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
