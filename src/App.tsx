import { useState, useEffect } from 'react';
import { Lightbulb, Target, CheckCircle, TrendingUp, Clock, BookOpen } from 'lucide-react';
import Quiz from './Quiz';
import IdeaForm from './IdeaForm';
import BusinessIdeasResults from './BusinessIdeasResults';
import PlaybookDisplay from './PlaybookDisplay';
import FAQ from './FAQ';
import WaitlistSignup from './WaitlistSignup';
import { analytics } from './lib/analytics';

interface QuizData {
  skills: string[];
  skillsOther: string;
  timeCommitment: string;
  timeCommitmentOther: string;
  budget?: string;
  interests: string[];
  interestsOther: string;
  goal: string;
  goalOther: string;
  experience: string;
  email: string;
}

interface IdeaFormData {
  businessType: string;
  businessTypeOther: string;
  problemSolving: string;
  targetCustomer: string;
  timeCommitment: string;
  timeCommitmentOther: string;
  skillsExperience: string;
  email: string;
  businessIdea?: string;
  budget?: string;
}

// NEW: Track idea form submissions
interface IdeaFormSubmission {
  businessType: string;
  problemSolving: string;
  targetCustomer: string;
  timeCommitment: string;
  skillsExperience: string;
}

interface BusinessIdea {
  id?: number;
  name: string;
  whyItFits: string;
  timeRequired: string;
  firstStep: string;
}

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

// UPDATED: Add flowType to track which flow triggered limit
interface LimitModalState {
  show: boolean;
  type: 'ideas' | 'playbooks' | null;
  reason: 'ip_limit' | 'email_limit' | null;
  userEmail?: string;
  flowType?: 'quiz' | 'idea_form';
}

type ViewType = 'home' | 'quiz' | 'ideaForm' | 'generatingIdeas' | 'showingIdeas' | 'generatingPlaybook' | 'showingPlaybook';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [ideaData, setIdeaData] = useState<IdeaFormData | null>(null);
  const [businessIdeas, setBusinessIdeas] = useState<BusinessIdea[]>([]);
  const [allBusinessIdeas, setAllBusinessIdeas] = useState<BusinessIdea[]>([]);
  const [allIdeaFormIdeas, setAllIdeaFormIdeas] = useState<IdeaFormSubmission[]>([]); // NEW
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ideaSetsRemaining, setIdeaSetsRemaining] = useState(2);
  const [playbooksRemaining, setPlaybooksRemaining] = useState(2);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistReason, setWaitlistReason] = useState<'playbook_limit' | 'monthly_limit'>('playbook_limit');
  const [limitModal, setLimitModal] = useState<LimitModalState>({
    show: false,
    type: null,
    reason: null,
  });

  const handleStartQuiz = () => {
    analytics.quizStarted();
    setCurrentView('quiz');
  };

  const handleStartIdeaForm = () => {
    console.log('I Have An Idea button clicked');
    analytics.ideaFormStarted();
    setCurrentView('ideaForm');
  };

  const handleQuizComplete = async (data: QuizData) => {
    setQuizData(data);
    setCurrentView('generatingIdeas');
    setError(null);

    try {
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizData: data }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle 429 limit errors
        if (response.status === 429) {
          if (result.reason === 'ip_limit') {
            setLimitModal({ show: true, type: 'ideas', reason: 'ip_limit', userEmail: data.email, flowType: 'quiz' });
            setCurrentView('home');
            return;
          } else if (result.reason === 'email_limit') {
            setLimitModal({ show: true, type: 'ideas', reason: 'email_limit', userEmail: data.email, flowType: 'quiz' });
            setCurrentView('home');
            return;
          }
        }
        if (result.blocked && result.reason === 'monthly_limit') {
          analytics.monthlyCapReached();
          setWaitlistReason('monthly_limit');
          setShowWaitlist(true);
          setCurrentView('home');
          return;
        }
        if (result.blocked && result.reason === 'idea_limit') {
          analytics.ideaLimitReached();
          setLimitModal({ show: true, type: 'ideas', reason: 'email_limit', userEmail: data.email, flowType: 'quiz' });
          setCurrentView('home');
          return;
        }
        throw new Error(result.error || `API returned status ${response.status}`);
      }

      if (!result.ideas || !Array.isArray(result.ideas)) {
        throw new Error('Invalid response format from API');
      }

      setBusinessIdeas(result.ideas);
      setAllBusinessIdeas(prev => [...prev, ...result.ideas]);
      analytics.ideasGenerated(result.ideas.length);

      const newIdeaSetsRemaining = ideaSetsRemaining - 1;
      setIdeaSetsRemaining(newIdeaSetsRemaining);

      if (newIdeaSetsRemaining === 1) {
        setSuccessMessage('✅ Ideas generated! You have 1 more idea set remaining.');
      } else if (newIdeaSetsRemaining === 0) {
        setSuccessMessage('✅ This is your final idea set. Select your best idea for an action plan!');
      }

      setTimeout(() => setSuccessMessage(null), 5000);
      setCurrentView('showingIdeas');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate business ideas: ${errorMessage}`);
      setCurrentView('home');
    }
  };

  const handleIdeaFormComplete = async (data: IdeaFormData) => {
    setIdeaData(data);
    setCurrentView('generatingPlaybook');
    setError(null);

    // NEW: Save form submission for tracking
    const formSubmission: IdeaFormSubmission = {
      businessType: data.businessType === 'Other' ? data.businessTypeOther : data.businessType,
      problemSolving: data.problemSolving,
      targetCustomer: data.targetCustomer,
      timeCommitment: data.timeCommitment === 'Other' ? data.timeCommitmentOther : data.timeCommitment,
      skillsExperience: data.skillsExperience,
    };
    setAllIdeaFormIdeas(prev => [...prev, formSubmission]);

    try {
      const response = await fetch('/api/generate-playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaFormData: data,
          userEmail: data.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle 429 limit errors
        if (response.status === 429) {
          if (result.reason === 'ip_limit') {
            setLimitModal({ show: true, type: 'playbooks', reason: 'ip_limit', userEmail: data.email, flowType: 'idea_form' });
            setCurrentView('home');
            return;
          } else if (result.reason === 'email_limit') {
            setLimitModal({ show: true, type: 'playbooks', reason: 'email_limit', userEmail: data.email, flowType: 'idea_form' });
            setCurrentView('home');
            return;
          }
        }
        if (result.blocked && result.reason === 'monthly_limit') {
          analytics.monthlyCapReached();
          setWaitlistReason('monthly_limit');
          setShowWaitlist(true);
          setCurrentView('home');
          return;
        }
        if (result.blocked && result.reason === 'playbook_limit') {
          analytics.playbookLimitReached();
          setLimitModal({ show: true, type: 'playbooks', reason: 'email_limit', userEmail: data.email, flowType: 'idea_form' });
          setCurrentView('home');
          return;
        }
        throw new Error(result.error || `API returned status ${response.status}`);
      }

      if (!result.playbook) {
        throw new Error('Invalid response format from API');
      }

      setPlaybook({ ...result.playbook, playbookId: result.playbookId });
      analytics.playbookGenerated('idea_form');

      const newPlaybooksRemaining = playbooksRemaining - 1;
      setPlaybooksRemaining(newPlaybooksRemaining);

      if (newPlaybooksRemaining === 1) {
        setSuccessMessage('✅ Action plan created! You have 1 more action plan remaining.');
      } else if (newPlaybooksRemaining === 0) {
        setSuccessMessage("✅ Action plan created! You've used both free action plans.");
      }

      setTimeout(() => setSuccessMessage(null), 6000);
      setCurrentView('showingPlaybook');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate action plan: ${errorMessage}`);
      setCurrentView('ideaForm');
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setAllBusinessIdeas([]);
    setAllIdeaFormIdeas([]); // NEW: Clear idea form ideas
  };

  const handleSelectIdea = async (idea: BusinessIdea) => {
    analytics.ideaSelected(idea.name);
    setCurrentView('generatingPlaybook');
    setError(null);

    try {
      const response = await fetch('/api/generate-playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          timeCommitment: quizData?.timeCommitment,
          budget: quizData?.budget,
          skills: quizData?.skills,
          userEmail: quizData?.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle 429 limit errors
        if (response.status === 429) {
          if (result.reason === 'ip_limit') {
            setLimitModal({ show: true, type: 'playbooks', reason: 'ip_limit', userEmail: quizData?.email, flowType: 'quiz' });
            setCurrentView('showingIdeas');
            return;
          } else if (result.reason === 'email_limit') {
            setLimitModal({ show: true, type: 'playbooks', reason: 'email_limit', userEmail: quizData?.email, flowType: 'quiz' });
            setCurrentView('showingIdeas');
            return;
          }
        }
        if (result.blocked && result.reason === 'monthly_limit') {
          analytics.monthlyCapReached();
          setWaitlistReason('monthly_limit');
          setShowWaitlist(true);
          setCurrentView('showingIdeas');
          return;
        }
        if (result.blocked && result.reason === 'playbook_limit') {
          analytics.playbookLimitReached();
          setLimitModal({ show: true, type: 'playbooks', reason: 'email_limit', userEmail: quizData?.email, flowType: 'quiz' });
          setCurrentView('showingIdeas');
          return;
        }
        throw new Error(result.error || `API returned status ${response.status}`);
      }

      if (!result.playbook) {
        throw new Error('Invalid response format from API');
      }

      setPlaybook({ ...result.playbook, playbookId: result.playbookId });
      analytics.playbookGenerated('quiz');

      const newPlaybooksRemaining = playbooksRemaining - 1;
      setPlaybooksRemaining(newPlaybooksRemaining);

      if (newPlaybooksRemaining === 1) {
        setSuccessMessage('✅ Action plan created! You have 1 more action plan remaining.');
      } else if (newPlaybooksRemaining === 0) {
        setSuccessMessage("✅ Action plan created! You've used both free action plans.");
      }

      setTimeout(() => setSuccessMessage(null), 6000);
      setCurrentView('showingPlaybook');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate action plan: ${errorMessage}`);
      setCurrentView('showingIdeas');
    }
  };

  if (currentView === 'quiz') {
    return <Quiz onComplete={handleQuizComplete} onBack={handleBackToHome} />;
  }

  if (currentView === 'ideaForm') {
    return <IdeaForm onComplete={handleIdeaFormComplete} onBack={handleBackToHome} />;
  }

  if (currentView === 'generatingIdeas') {
    return <GeneratingIdeasView />;
  }

  if (currentView === 'showingIdeas') {
    return (
      <BusinessIdeasResults
        ideas={businessIdeas}
        onSelectIdea={handleSelectIdea}
        onBack={handleBackToHome}
        ideaSetsRemaining={ideaSetsRemaining}
        playbooksRemaining={playbooksRemaining}
      />
    );
  }

  if (currentView === 'generatingPlaybook') {
    return <GeneratingPlaybookView />;
  }

  if (currentView === 'showingPlaybook' && playbook) {
    return (
      <PlaybookDisplay
        playbook={playbook}
        onBack={handleBackToHome}
        userEmail={quizData?.email || ideaData?.email}
        timeCommitment={quizData?.timeCommitment || ideaData?.timeCommitment}
        budget={quizData?.budget}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {limitModal.show && (
        <LimitModal 
          type={limitModal.type} 
          reason={limitModal.reason}
          userEmail={limitModal.userEmail}
          ideas={limitModal.flowType === 'idea_form' ? [] : allBusinessIdeas}
          ideaFormIdeas={limitModal.flowType === 'idea_form' ? allIdeaFormIdeas : []}
          flowType={limitModal.flowType}
          onSelectIdea={handleSelectIdea}
          onClose={() => setLimitModal({ show: false, type: null, reason: null })}
        />
      )}

      {showWaitlist && (
        <WaitlistSignup
          userEmail={quizData?.email || ideaData?.email}
          onClose={() => setShowWaitlist(false)}
          reason={waitlistReason}
        />
      )}

      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      <section className="relative" style={{ backgroundColor: '#1a1f3a', paddingTop: '8px', paddingBottom: '16px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center" style={{ marginBottom: '12px' }}>
              <img src="/Find your side.svg" alt="Find Your Side - Idea to Execution" className="w-[240px] sm:w-[340px] h-auto" />
            </div>

            <h1 className="font-bold text-white tracking-tight" style={{ marginBottom: '12px', fontSize: '48px' }}>
              <style>{`@media (max-width: 640px) { h1 { font-size: 36px !important; } }`}</style>
              Turn Your Side Business<br />Dream Into Reality
            </h1>

            <p className="mx-auto" style={{ color: '#CBD5E1', marginBottom: '24px', maxWidth: '700px', fontSize: '20px' }}>
              <style>{`@media (max-width: 640px) { p { font-size: 18px !important; } }`}</style>
              Get a personalized 4-week action plan - whether you're exploring ideas or ready to execute.
            </p>

            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
                <button
                  onClick={handleStartQuiz}
                  className="w-full sm:w-auto px-10 text-lg font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{ backgroundColor: '#4F46E5', color: '#FFFFFF', height: '56px', borderRadius: '12px' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
                >
                  Find My Idea
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStartIdeaForm();
                  }}
                  className="w-full sm:w-auto px-10 text-lg font-bold transition-all cursor-pointer hover:bg-white hover:bg-opacity-10"
                  style={{ backgroundColor: 'transparent', color: '#FFFFFF', border: '2px solid #FFFFFF', height: '56px', borderRadius: '12px' }}
                >
                  I Have An Idea
                </button>
              </div>
              <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>
                Get 2 personalized idea sets + 2 detailed action plans free
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-3">How It Works</h2>
          <p className="text-xl text-gray-600 text-center mb-12">Choose your path to launch</p>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
                  <Lightbulb className="w-7 h-7" style={{ color: '#4F46E5' }} />
                </div>
                <h3 className="ml-4 text-2xl font-bold text-gray-900">Finding Your Idea</h3>
              </div>
              <div className="space-y-6">
                {[
                  { num: '1', title: 'Answer 6 questions', desc: 'Share your skills and goals with us' },
                  { num: '2', title: 'Get 5 AI-matched ideas', desc: 'Receive personalized business suggestions' },
                  { num: '3', title: 'Pick your favorite', desc: 'Choose the idea that excites you most' },
                  { num: '4', title: 'Get your action plan', desc: 'Receive your personalized 4-week action plan' },
                ].map((step) => (
                  <div key={step.num} className="flex">
                    <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#4F46E5' }}>
                      {step.num}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                      <p className="text-gray-600">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
                  <Target className="w-7 h-7" style={{ color: '#4F46E5' }} />
                </div>
                <h3 className="ml-4 text-2xl font-bold text-gray-900">Already Have an Idea</h3>
              </div>
              <div className="space-y-6">
                {[
                  { num: '1', title: 'Tell us your idea', desc: 'Describe your business concept in a few sentences' },
                  { num: '2', title: 'Share your constraints', desc: 'Let us know your available time and experience level' },
                  { num: '3', title: 'Get your action plan', desc: 'Receive your personalized 4-week action plan' },
                  { num: '4', title: 'Start building', desc: 'Follow your customized roadmap to launch' },
                ].map((step) => (
                  <div key={step.num} className="flex">
                    <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#4F46E5' }}>
                      {step.num}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                      <p className="text-gray-600">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-3">See What You'll Get</h2>
          <p className="text-xl text-gray-600 text-center mb-10">A sample 4-week action plan</p>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Sample: Custom Furniture Refinishing Business</h3>
            <p className="text-gray-600 mb-6">A 4-week action plan to launch your furniture refinishing service</p>
            
            <div className="space-y-6">
              <div className="border-2 border-indigo-200 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Week 1: Foundation & Skills</h4>
                <div className="space-y-3">
                  {[
                    { day: 1, title: 'Learn restoration techniques', desc: 'Watch tutorials on furniture stripping, sanding, and refinishing. Practice on a test piece.' },
                    { day: 2, title: 'Source your first pieces', desc: 'Visit thrift stores and garage sales. Find 3 pieces to refinish for your portfolio.' },
                    { day: 3, title: 'Buy tools and supplies', desc: 'Purchase sandpaper, stain, polyurethane, brushes. Budget: $150-200.' },
                    { day: 4, title: 'Complete first refinish', desc: 'Refinish your first piece start to finish. Document with before/after photos.' },
                    { day: 5, title: 'Set up social media', desc: 'Create Instagram and Facebook accounts. Post your first before/after transformation.' },
                  ].map((task) => (
                    <div key={task.day} className="pl-4 border-l-2 border-indigo-400">
                      <p className="font-semibold text-gray-900">Day {task.day}: {task.title}</p>
                      <p className="text-sm text-gray-600">{task.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-indigo-200 rounded-lg p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Week 2: Build Portfolio & Pricing</h4>
                <div className="space-y-3">
                  {[
                    { day: 6, title: 'Complete pieces 2 & 3', desc: 'Finish two more pieces for portfolio. Vary styles (modern, rustic, vintage).' },
                    { day: 7, title: 'Research pricing', desc: 'Check Etsy, Facebook Marketplace, local competitors. Set your pricing structure.' },
                    { day: 8, title: 'Create portfolio page', desc: 'Build simple website on Wix or Squarespace showcasing your 3 completed pieces.' },
                    { day: 9, title: 'List first piece for sale', desc: 'Post your best piece on Facebook Marketplace and Craigslist with pricing.' },
                    { day: 10, title: 'Network locally', desc: 'Visit 3 antique shops or consignment stores. Offer to refinish pieces on commission.' },
                  ].map((task) => (
                    <div key={task.day} className="pl-4 border-l-2 border-indigo-400">
                      <p className="font-semibold text-gray-900">Day {task.day}: {task.title}</p>
                      <p className="text-sm text-gray-600">{task.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center mt-6 p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-gray-700">+ Week 3: Customer Acquisition & Week 4: First Sales</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQ />

      <footer className="border-t border-gray-200" style={{ backgroundColor: '#1a1f3a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center mb-3">
            <img
              src="/Find your side.svg"
              alt="Find Your Side"
              className="w-[200px] h-auto mx-auto"
            />
          </div>
          <div className="text-center">
            <p className="text-gray-300 text-xs mb-1">
              <a href="/privacy" className="text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</a> | 
              <a href="/terms" className="text-indigo-400 hover:text-indigo-300 transition-colors"> Terms</a> | 
              <a href="/cookies" className="text-indigo-400 hover:text-indigo-300 transition-colors"> Cookie Policy</a> | 
              <a href="/disclaimer" className="text-indigo-400 hover:text-indigo-300 transition-colors"> Disclaimer</a> |{' '}
              <a
                href="mailto:hello.findyourside@gmail.com"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Contact
              </a>
            </p>
            <p className="text-gray-500 text-xs">
              © 2025 Find Your Side. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function GeneratingIdeasView() {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex justify-center mb-6">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" style={{ animation: 'spin 1s linear infinite' }}></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Finding your perfect ideas</h2>
        <p className="text-center text-gray-600">Your ideas are being created...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function GeneratingPlaybookView() {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex justify-center mb-6">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" style={{ animation: 'spin 1s linear infinite' }}></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Creating your action plan</h2>
        <p className="text-center text-gray-600 mb-4">This won't take long.</p>
        {elapsedTime > 15 && <p className="text-center text-sm text-gray-500">Still working... ({elapsedTime}s)</p>}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// UPDATED: LimitModal with full logic for both flows
interface LimitModalProps {
  type: 'ideas' | 'playbooks' | null;
  reason: 'ip_limit' | 'email_limit' | null;
  userEmail?: string;
  ideas: BusinessIdea[];
  ideaFormIdeas?: IdeaFormSubmission[];
  flowType?: 'quiz' | 'idea_form';
  onSelectIdea: (idea: BusinessIdea) => void;
  onClose: () => void;
}

function LimitModal({ type, reason, userEmail, ideas, ideaFormIdeas, flowType, onSelectIdea, onClose }: LimitModalProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<BusinessIdea | null>(null);
  const [selectedIdeaFormIdea, setSelectedIdeaFormIdea] = useState<IdeaFormSubmission | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    selectedFeedback: [] as string[],
    otherFeedback: '',
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  if (!type || !reason) return null;

  const isIPLimit = reason === 'ip_limit';
  const isIdeas = type === 'ideas';
  const isIdeaFormFlow = flowType === 'idea_form';
  const ideaCount = isIdeaFormFlow ? ideaFormIdeas?.length : ideas.length;
  const ideaText = isIdeaFormFlow ? 'great ideas' : 'great ideas';

  // IP Limit Message
  if (isIPLimit) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Daily Limit Reached</h2>
          <p className="text-gray-700 mb-8 leading-relaxed text-center">You've reached your 10 daily requests from this location. Please try again tomorrow. If you have questions, we'd love to hear from you.</p>
          <div className="space-y-3">
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
            >
              Send Feedback
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Email Limit - View Ideas Flow
  if (!showIdeas) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Monthly Limit Reached</h2>
          <p className="text-gray-700 mb-8 leading-relaxed text-center">
            You've used your 2 free {isIdeas ? 'idea sets' : 'action plans'} for this month. 
            You have <strong>{ideaCount} {ideaText}</strong> to choose from. 
            Pick one{isIdeaFormFlow ? ' and download your action plan' : ', create an action plan'}, 
            or come back next month for more {isIdeas ? 'ideas' : 'action plans'}.
          </p>
          <div className="space-y-3">
            {ideaCount && ideaCount > 0 ? (
              <button
                onClick={() => setShowIdeas(true)}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
              >
                View My Ideas
              </button>
            ) : null}
            <button
              onClick={() => setShowFeedback(true)}
              className="w-full px-6 py-3 text-indigo-600 font-semibold rounded-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-all"
            >
              Send Feedback
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show Ideas View - QUIZ FLOW
  if (showIdeas && !selectedIdea && !selectedIdeaFormIdea && !isIdeaFormFlow) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[85vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Select an Idea for Your Action Plan</h2>
          <p className="text-gray-600 text-center mb-6 text-sm">Click on any idea to create a detailed 4-week action plan</p>
          
          <div className="space-y-3 mb-6">
            {ideas.map((idea, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdea(idea)}
                className="w-full text-left border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
              >
                <h4 className="font-semibold text-gray-900 mb-1">{idea.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{idea.whyItFits}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowIdeas(false)}
              className="w-full px-6 py-3 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show Ideas View - IDEA FORM FLOW
  if (showIdeas && !selectedIdea && !selectedIdeaFormIdea && isIdeaFormFlow) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[85vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Select an Idea to Download Your Action Plan</h2>
          <p className="text-gray-600 text-center mb-6 text-sm">Click on any idea to download your action plan</p>
          
          <div className="space-y-3 mb-6">
            {ideaFormIdeas?.map((idea, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIdeaFormIdea(idea)}
                className="w-full text-left border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
              >
                <h4 className="font-semibold text-gray-900 mb-2">{idea.businessType} business that {idea.problemSolving} for {idea.targetCustomer}</h4>
                <p className="text-sm text-gray-600">Time commitment: {idea.timeCommitment}</p>
                {idea.skillsExperience && <p className="text-sm text-gray-600">Your experience: {idea.skillsExperience}</p>}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowIdeas(false)}
              className="w-full px-6 py-3 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Create Action Plan from Selected Idea (QUIZ FLOW)
  if (selectedIdea && !isIdeaFormFlow) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Creating Action Plan</h3>
          <p className="text-gray-700 mb-6">{selectedIdea.name}</p>
          <p className="text-sm text-gray-600 mb-6">{selectedIdea.whyItFits}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                onSelectIdea(selectedIdea);
                onClose();
              }}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
            >
              Create Action Plan
            </button>
            <button
              onClick={() => setSelectedIdea(null)}
              className="w-full px-6 py-3 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all"
            >
              Choose Different Idea
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Download Action Plan (IDEA FORM FLOW)
  if (selectedIdeaFormIdea && isIdeaFormFlow) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Download Your Action Plan</h3>
          <p className="text-gray-700 mb-2">{selectedIdeaFormIdea.businessType} business</p>
          <p className="text-sm text-gray-600 mb-4">{selectedIdeaFormIdea.problemSolving} for {selectedIdeaFormIdea.targetCustomer}</p>
          <p className="text-sm text-gray-600 mb-6">Time commitment: {selectedIdeaFormIdea.timeCommitment}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                alert('✓ Downloading your action plan PDF...');
                onClose();
              }}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
            >
              Download Plan
            </button>
            <button
              onClick={() => setSelectedIdeaFormIdea(null)}
              className="w-full px-6 py-3 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all"
            >
              Choose Different Idea
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Feedback Form
  if (showFeedback) {
    const feedbackOptions = [
      'Ideas weren\'t relevant',
      'Process was confusing',
      'Want to try again next month',
      'Would pay for more',
      'Other'
    ];

    const handleFeedbackSubmit = async () => {
      if (!userEmail?.trim()) {
        alert('Please enter your email');
        return;
      }

      setIsSubmittingFeedback(true);
      try {
        const response = await fetch('/api/save-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'idea_limit_feedback',
            email: userEmail,
            data: feedbackData
          }),
        });

        if (response.ok) {
          alert('Thank you for your feedback!');
          onClose();
        } else {
          alert('Error saving feedback. Please try again.');
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Error saving feedback. Please try again.');
      } finally {
        setIsSubmittingFeedback(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-[85vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Help Us Improve</h2>
          <p className="text-gray-600 text-center mb-6 text-sm">We'd love to hear what you think about Find Your Side</p>

          <div className="space-y-3 mb-6">
            {feedbackOptions.map((option) => (
              <label key={option} className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
                <input
                  type="checkbox"
                  checked={feedbackData.selectedFeedback.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFeedbackData(prev => ({
                        ...prev,
                        selectedFeedback: [...prev.selectedFeedback, option]
                      }));
                    } else {
                      setFeedbackData(prev => ({
                        ...prev,
                        selectedFeedback: prev.selectedFeedback.filter(f => f !== option)
                      }));
                    }
                  }}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#4F46E5' }}
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {feedbackData.selectedFeedback.includes('Other') && (
            <textarea
              value={feedbackData.otherFeedback}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, otherFeedback: e.target.value }))}
              placeholder="Please tell us more..."
              rows={3}
              className="w-full px-4 py-3 mb-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
            />
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={userEmail || ''}
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50"
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleFeedbackSubmit}
              disabled={isSubmittingFeedback}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button
              onClick={() => setShowFeedback(false)}
              className="w-full px-6 py-3 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-all"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
