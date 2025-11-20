import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { analytics } from './lib/analytics';

interface QuizProps {
  onComplete: (answers: QuizAnswers, ideas: BusinessIdea[]) => void;
  onBack: () => void;
}

interface QuizAnswers {
  interests: string[];
  skills: string[];
  timeCommitment: string;
  budget: string;
  goals: string[];
}

interface BusinessIdea {
  id: number;
  name: string;
  description: string;
  whyMatch: string;
  startupCost: string;
  timeToRevenue: string;
  difficulty: string;
  category: string;
}

const questions = [
  {
    id: 'interests',
    question: "What are you passionate about?",
    description: "Select all that apply",
    type: 'multiple',
    options: [
      'Technology & Innovation',
      'Health & Wellness',
      'Creative Arts & Design',
      'Food & Cooking',
      'Education & Teaching',
      'Finance & Investing',
      'Sports & Fitness',
      'Travel & Adventure',
      'Fashion & Beauty',
      'Home & Garden',
      'Entertainment & Media',
      'Social Impact & Sustainability'
    ]
  },
  {
    id: 'skills',
    question: "What skills do you have?",
    description: "Select all that apply",
    type: 'multiple',
    options: [
      'Writing & Communication',
      'Design & Creativity',
      'Technical & Programming',
      'Sales & Marketing',
      'Teaching & Training',
      'Problem Solving',
      'Project Management',
      'Social Media',
      'Data Analysis',
      'Customer Service',
      'Photography & Video',
      'Public Speaking'
    ]
  },
  {
    id: 'timeCommitment',
    question: "How much time can you commit weekly?",
    description: "Choose one",
    type: 'single',
    options: [
      '5-10 hours (Side hustle)',
      '10-20 hours (Part-time)',
      '20-40 hours (Full-time)',
      '40+ hours (All in)'
    ]
  },
  {
    id: 'budget',
    question: "What's your startup budget?",
    description: "Choose one",
    type: 'single',
    options: [
      'Under $500 (Bootstrap)',
      '$500-$2,000 (Small investment)',
      '$2,000-$10,000 (Moderate investment)',
      '$10,000+ (Significant investment)'
    ]
  },
  {
    id: 'goals',
    question: "What are your goals?",
    description: "Select all that apply",
    type: 'multiple',
    options: [
      'Generate extra income',
      'Replace full-time job',
      'Build wealth long-term',
      'Help others/make impact',
      'Work remotely/travel',
      'Be my own boss',
      'Learn new skills',
      'Create passive income'
    ]
  }
];

export default function Quiz({ onComplete, onBack }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    interests: [],
    skills: [],
    timeCommitment: '',
    budget: '',
    goals: []
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (option: string) => {
    const questionId = question.id as keyof QuizAnswers;
    
    if (question.type === 'multiple') {
      const currentAnswers = answers[questionId] as string[];
      const newAnswers = currentAnswers.includes(option)
        ? currentAnswers.filter(a => a !== option)
        : [...currentAnswers, option];
      
      setAnswers({ ...answers, [questionId]: newAnswers });
    } else {
      setAnswers({ ...answers, [questionId]: option });
    }
  };

  const canProceed = () => {
    const questionId = question.id as keyof QuizAnswers;
    const answer = answers[questionId];
    
    if (question.type === 'multiple') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return typeof answer === 'string' && answer.length > 0;
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      analytics.quizQuestionAnswered(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    setError(null);
    analytics.quizCompleted();

    console.log('Starting business ideas generation...');
    console.log('Quiz data:', answers);

    try {
      console.log('Calling API: /api/generate-ideas');
      
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answers),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || `Failed to generate ideas: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Ideas received:', data);

      if (!data.ideas || !Array.isArray(data.ideas)) {
        throw new Error('Invalid response format from API');
      }

      analytics.ideasGenerated(data.ideas.length);
      onComplete(answers, data.ideas);
    } catch (err) {
      console.error('Error generating ideas:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate business ideas');
      setIsGenerating(false);
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

        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-indigo-600">
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={handleSubmit}
                className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          )}

          {isGenerating ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mb-4"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Generating Your Business Ideas...
              </h3>
              <p className="text-gray-600">
                Our AI is analyzing your profile and creating personalized recommendations
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  {question.question}
                </h2>
                <p className="text-gray-600">{question.description}</p>
              </div>

              <div className="space-y-3 mb-8">
                {question.options.map((option) => {
                  const questionId = question.id as keyof QuizAnswers;
                  const isSelected = question.type === 'multiple'
                    ? (answers[questionId] as string[]).includes(option)
                    : answers[questionId] === option;

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`w-full text-left px-6 py-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={handleBack}
                  disabled={currentQuestion === 0}
                  className="flex items-center px-6 py-3 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentQuestion === questions.length - 1 ? 'Generate Ideas' : 'Next'}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
