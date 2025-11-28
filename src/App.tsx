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
  skillsExperience: string;
  email: string;
  businessIdea?: string;
  budget?: string;
}

interface BusinessIdea {
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

type ViewType = 'home' | 'quiz' | 'ideaForm' | 'generatingIdeas' | 'showingIdeas' | 'generatingPlaybook' | 'showingPlaybook';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [ideaData, setIdeaData] = useState<IdeaFormData | null>(null);
  const [businessIdeas, setBusinessIdeas] = useState<BusinessIdea[]>([]);
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ideaSetsRemaining, setIdeaSetsRemaining] = useState(2);
  const [playbooksRemaining, setPlaybooksRemaining] = useState(2);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistReason, setWaitlistReason] = useState<'playbook_limit' | 'monthly_limit'>('playbook_limit');
  const [showIdeaLimitModal, setShowIdeaLimitModal] = useState(false);

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

    console.log('Starting business ideas generation...');
    console.log('Quiz data:', data);

    const startTime = Date.now();

    try {
      const url = '/api/generate-ideas';
      console.log('Calling API:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizData: data }),
      });

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 30000) {
        console.log('High traffic - request was queued');
      }

      console.log('Response status:', response.status);

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok) {
        if (result.blocked && result.reason === 'monthly_limit') {
          analytics.monthlyCapReached();
          setWaitlistReason('monthly_limit');
          setShowWaitlist(true);
          setCurrentView('home');
          return;
        }
        if (result.blocked && result.reason === 'idea_limit') {
          analytics.ideaLimitReached();
          setShowIdeaLimitModal(true);
          setCurrentView('home');
          return;
        }
        console.error('API Error:', result);
        throw new Error(result.error || `API returned status ${response.status}`);
      }

      if (!result.ideas || !Array.isArray(result.ideas)) {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response format from API');
      }

      setBusinessIdeas(result.ideas);
      analytics.ideasGenerated(result.ideas.length);

      const newIdeaSetsRemaining = ideaSetsRemaining - 1;
      setIdeaSetsRemaining(newIdeaSetsRemaining);

      if (newIdeaSetsRemaining === 1) {
        setSuccessMessage('✅ Ideas generated! You have 1 more idea set remaining.');
      } else if (newIdeaSetsRemaining === 0) {
        setSuccessMessage('✅ This is your final idea set. Select your best idea for a playbook!');
      }

      setTimeout(() => setSuccessMessage(null), 5000);
      setCurrentView('showingIdeas');
    } catch (err) {
      console.error('Error generating ideas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate business ideas: ${errorMessage}`);
      setCurrentView('home');
    }
  };

  const handleIdeaFormComplete = async (data: IdeaFormData) => {
    setIdeaData(data);
    setCurrentView('generatingPlaybook');
    setError(null);

    console.log('Starting playbook generation from idea form...');
    console.log('Idea form data:', data);

    const startTime = Date.now();

    try {
      const url = '/api/generate-playbook';
      console.log('Calling API:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaFormData: data,
          userEmail: data.email,
        }),
      });

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 30000) {
        console.log('High traffic - request was queued');
      }

      console.log('Response status:', response.status);

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok) {
        if (result.blocked && result.reason === 'monthly_limit') {
          analytics.monthlyCapReached();
          setWaitlistReason('monthly_limit');
          setShowWaitlist(true);
          setCurrentView('home');
          return;
        }
        if (result.blocked && result.reason === 'playbook_limit') {
          analytics.playbookLimitReached();
          setWaitlistReason('playbook_limit');
          setShowWaitlist(true);
          setCurrentView('home');
          return;
        }
        console.error('API Error:', result);
        throw new Error(result.error || `API returned status ${response.status}`);
      }

      if (!result.playbook) {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response format from API');
      }

      setPlaybook({ ...result.playbook, playbookId: result.playbookId });
      analytics.playbookGenerated('idea_form');

      const newPlaybooksRemaining = playbooksRemaining - 1;
      setPlaybooksRemaining(newPlaybooksRemaining);

      if (newPlaybooksRemaining === 1) {
        setSuccessMessage('✅ Playbook created! You have 1 more playbook remaining. Choose your next idea carefully!');
      } else if (newPlaybooksRemaining === 0) {
        setSuccessMessage("✅ Playbook created! You've used both free playbooks.");
      }

      setTimeout(() => setSuccessMessage(null), 6000);
      setCurrentView('showingPlaybook');
    } catch (err) {
      console.error('Error generating playbook:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate playbook: ${errorMessage}`);
      setCurrentView('ideaForm');
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  const handleSelectIdea = async (idea: BusinessIdea) => {
    analytics.ideaSelected(idea.name);
    setCurrentView('generatingPlaybook');
    setError(null);

    console.log('Starting playbook generation from quiz...');
    console.log('Selected idea:', idea);
    console.log('Quiz data:', quizData);

    const startTime = Date.now();

    try {
      const url = '/api/generate-playbook';
      console.log('Calling API:', url);

      const response = await fetch(url, {
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

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > 30000) {
        console.log('High traffic - request was queued');
      }

      console.log('Response status:', response.status);

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok) {
        if (result.blocked && result.reason === 'monthly_limit') {
          analytics.monthlyCapReached();
          setWaitlistReason('monthly_limit');
          setShowWaitlist(true);
          setCurrentView('showingIdeas');
          return;
        }
        if (result.blocked && result.reason === 'playbook_limit') {
          analytics.playbookLimitReached();
          setWaitlistReason('playbook_limit');
          setShowWaitlist(true);
          setCurrentView('showingIdeas');
          return;
        }
        console.error('API Error:', result);
        throw new Error(result.error || `API returned status ${response.status}`);
      }

      if (!result.playbook) {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response format from API');
      }

      setPlaybook({ ...result.playbook, playbookId: result.playbookId });
      analytics.playbookGenerated('quiz');

      const newPlaybooksRemaining = playbooksRemaining - 1;
      setPlaybooksRemaining(newPlaybooksRemaining);

      if (newPlaybooksRemaining === 1) {
        setSuccessMessage('✅ Playbook created! You have 1 more playbook remaining. Choose your next idea carefully!');
      } else if (newPlaybooksRemaining === 0) {
        setSuccessMessage("✅ Playbook created! You've used both free playbooks.");
      }

      setTimeout(() => setSuccessMessage(null), 6000);
      setCurrentView('showingPlaybook');
    } catch (err) {
      console.error('Error generating playbook:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate playbook: ${errorMessage}`);
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
      {showWaitlist && (
        <WaitlistSignup
          userEmail={quizData?.email || ideaData?.email}
          onClose={() => setShowWaitlist(false)}
          reason={waitlistReason}
        />
      )}

      {showIdeaLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              You've generated your 2 idea sets!
            </h2>
            <p className="text-gray-600 mb-4">
              That's 10 personalized ideas total! Want to generate playbooks for your favorite ideas?
            </p>
            <p className="text-gray-700 font-semibold mb-6">
              You have {playbooksRemaining} playbook generations remaining.
            </p>
            <button
              onClick={() => setShowIdeaLimitModal(false)}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
            >
              Back to Ideas
            </button>
          </div>
        </div>
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

      {/* Rest of home page content - keeping as-is */}
      <section className="relative" style={{ backgroundColor: '#1a1f3a', paddingTop: '30px', paddingBottom: '60px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center" style={{ marginBottom: '30px' }}>
              <img
                src="/Find your side.svg"
                alt="Find Your Side - Idea to Execution"
                className="w-[240px] sm:w-[340px] h-auto"
              />
            </div>

            <h1 className="font-bold text-white tracking-tight" style={{ marginBottom: '16px', fontSize: '48px' }}>
              <style>{`
                @media (max-width: 640px) {
                  h1 { font-size: 36px !important; }
                }
              `}</style>
              Turn Your Side Business<br />Dream Into Reality
            </h1>

            <p className="mx-auto" style={{ color: '#CBD5E1', marginBottom: '32px', maxWidth: '700px', fontSize: '20px' }}>
              <style>{`
                @media (max-width: 640px) {
                  p { font-size: 18px !important; }
                }
              `}</style>
              Get a personalized 4-week launch plan - whether you're exploring ideas or ready to execute.
            </p>

            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
                <button
                  onClick={handleStartQuiz}
                  className="w-full sm:w-auto px-10 text-lg font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                    height: '56px',
                    borderRadius: '12px'
                  }}
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
                  style={{
                    backgroundColor: 'transparent',
                    color: '#FFFFFF',
                    border: '2px solid #FFFFFF',
                    height: '56px',
                    borderRadius: '12px'
                  }}
                >
                  I Have An Idea
                </button>
              </div>
              <p className="text-sm mt-2" style={{ color: '#94A3B8' }}>
                Get 2 personalized idea sets + 2 detailed playbooks free
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Two Paths */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Choose your path to launch
          </p>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
                  <Lightbulb className="w-7 h-7" style={{ color: '#4F46E5' }} />
                </div>
                <h3 className="ml-4 text-2xl font-bold text-gray-900">
                  Finding Your Idea
                </h3>
              </div>

              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#4F46E5' }}>
                    1
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Answer 6 questions</h4>
                    <p className="text-gray-600">Share your skills and goals with us</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#4F46E5' }}>
                    2
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Get 5 AI-matched ideas</h4>
                    <p className="text-gray-600">Receive personalized business suggestions</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#4F46E5' }}>
                    3
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Pick your favorite</h4>
                    <p className="text-gray-600">Choose the idea that excites you most</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#4F46E5' }}>
                    4
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Get your launch playbook</h4>
                    <p className="text-gray-600">Receive your personalized 4-week plan</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
                  <Target className="w-7 h-7" style={{ color: '#4F46E5' }} />
                </div>
                <h3 className="ml-4 text-2xl font-bold text-gray-900">
                  Already Have an Idea
                </h3>
              </div>

              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#4F46E5' }}>
                    1
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Tell us your idea</h4>
                    <p className="text-gray-600">Describe your business concept in a few sentences</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#4F46E5' }}>
                    2
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Share your constraints</h4>
                    <p className="text-gray-600">Let us know your available time and experience level</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#4F46E5' }}>
                    3
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Get your launch playbook</h4>
                    <p className="text-gray-600">Receive your personalized 4-week action plan</p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0 w-10 h-10 text-white rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: '#4F46E5' }}>
                    4
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Start building</h4>
                    <p className="text-gray-600">Follow your customized roadmap to launch</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Playbook Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-4">
            See What You'll Get
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            A sample 4-week playbook
          </p>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
  <h3 className="text-2xl font-bold text-gray-900 mb-4">Sample: Custom Furniture Refinishing Business</h3>
  <p className="text-gray-600 mb-6">A 4-week action plan to launch your furniture refinishing service</p>
  
  <div className="space-y-6">
    <div className="border-2 border-indigo-200 rounded-lg p-6">
      <h4 className="text-lg font-bold text-gray-900 mb-4">Week 1: Foundation & Skills</h4>
      <div className="space-y-3">
        <div className="pl-4 border-l-2 border-indigo-400">
          <p className="font-semibold text-gray-900">Day 1: Learn restoration techniques</p>
          <p className="text-sm text-gray-600">Watch tutorials on furniture stripping, sanding, and refinishing. Practice on a test piece.</p>
        </div>
        <div className="pl-4 border-l-2 border-indigo-400">
          <p className="font-semibold text-gray-900">Day 2: Source your first pieces</p>
          <p className="text-sm text-gray-600">Visit thrift stores and garage sales. Find 3 pieces to refinish for your portfolio.</p>
        </div>
        <div className="pl-4 border-l-2 border-indigo-400">
          <p className="font-semibold text-gray-900">Day 3: Buy tools and supplies</p>
          <p className="text-sm text-gray-600">Purchase sandpaper, stain, polyurethane, brushes. Budget: $150-200.</p>
        </div>
        <div className="pl-4 border-l-2 border-indigo-400">
          <p className="font-semibold text-gray-900">Day 4: Complete first refinish</p>
          <p className="text-sm text-gray-600">Refinish your first piece start to finish. Document with before/after photos.</p>
        </div>
        <div className="pl-4 border-l-2 border-indigo-400">
          <p className="font-semibold text-gray-900">Day 5: Set up social media</p>
          <p className="text-sm text-gray-600">Create Instagram and Facebook accounts. Post your first before/after transformation.</p>
        </div>
      </div>
    </div>

    <div className="border-2 border-indigo-200 rounded-lg p-6">
      <h4 className="text-lg font-bold text-gray-900 mb-4">Week 2: Build Portfolio & Pricing</h4>
      <div className="space-y-3">
        <div className="pl-4 border-l-2 border-indigo-400">
          <p className="font-semibold text-gray-900">Day 6: Complete pieces 2 & 3</p>
          <p className="text-sm text-gray-600">Finish two more pieces for portfolio. Vary styles (modern, rustic, vintage).</p>
        </div>
        <div className="pl-4 border-l-2 border-indigo-400">
          <p className="font-semibold text-gray-900">Day 7: Research pricing</p>
          <p className="text-sm text-gray-600">Check Etsy, Facebook Marketplace, local competitors. Set your pricing structure.</p>
        </div>
        <div className="pl-4 border-l-2 border-indigo-400">
          <p className="font-semibold text-gray-900">Day 8: Create portfolio page</p>
          <p className="text-sm text-gray-600">Build simple website on Wix or Squarespace showcasing your 3 completed pieces.</p>
        </div>
        <div className="pl-4 border-l-2 border-indigo-400">
          <p className="font-semibold text-gray-900">Day 9: List first piece for sale</p>
          <p className="text-sm text-gray-600">Post your best piece on Facebook Marketplace and Craigslist with pricing.</p>
        </div>
        <div className="pl-4 border-l-2 border-indigo-400">
          <p className="font-semibold text-gray-900">Day 10: Network locally</p>
          <p className="text-sm text-gray-600">Visit 3 antique shops or consignment stores. Offer to refinish pieces on commission.</p>
        </div>
      </div>
    </div>

    <div className="text-center mt-6 p-4 bg-indigo-50 rounded-lg">
      <p className="text-sm text-gray-700">+ Week 3: Customer Acquisition & Week 4: First Sales</p>
    </div>
  </div>
</div>
        </div>
      </section>
 
      {/* What You Get */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-4">
            What You Get
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Everything you need to launch in 4 weeks
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF2FF' }}>
                <BookOpen className="w-8 h-8" style={{ color: '#4F46E5' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Week-by-week action plan</h3>
              <p className="text-gray-600">Clear roadmap broken down into manageable weekly goals</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF2FF' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#4F46E5' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Specific daily tasks</h3>
              <p className="text-gray-600">Actionable steps you can complete each day</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF2FF' }}>
                <Clock className="w-8 h-8" style={{ color: '#4F46E5' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Time estimates for each step</h3>
              <p className="text-gray-600">Get a time estimate to complete key tasks</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF2FF' }}>
                <Target className="w-8 h-8" style={{ color: '#4F46E5' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Resources needed for each task</h3>
              <p className="text-gray-600">Suggested tools and platforms for each step</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF2FF' }}>
                <TrendingUp className="w-8 h-8" style={{ color: '#4F46E5' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Success metrics to track progress</h3>
              <p className="text-gray-600">Clear milestones so you know you're on track</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF2FF' }}>
                <Lightbulb className="w-8 h-8" style={{ color: '#4F46E5' }} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Customized to your situation</h3>
              <p className="text-gray-600">Tasks adapted to your skills, time, and experience level</p>
            </div>
          </div>
        </div>
      </section>

      <FAQ />

      <section className="bg-amber-50 border-t border-b border-amber-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-700 leading-relaxed text-center">
            <strong>Disclaimer:</strong> Find Your Side provides AI-generated suggestions for informational purposes only. These suggestions do not constitute professional business, financial, or legal advice. Find Your Side makes no warranties regarding accuracy, completeness, or suitability of the information provided and disclaims all liability for any decisions made based on this information. Always conduct your own research and consult qualified professionals before making business decisions.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-12">
            Ready to start your side business?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleStartQuiz}
              className="w-full sm:w-auto px-10 py-5 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Find My Idea
            </button>
            <button
              onClick={handleStartIdeaForm}
              className="w-full sm:w-auto px-10 py-5 border-2 border-indigo-600 text-indigo-600 text-lg font-semibold rounded-lg hover:bg-indigo-50 transition-all"
            >
              I Have An Idea
            </button>
          </div>
        </div>
      </section>

      <footer style={{ backgroundColor: '#1a1f3a', paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center" style={{ marginBottom: '24px' }}>
              <img
                src="/Find your side.svg"
                alt="Find Your Side - Idea to Execution"
                className="w-[280px] h-auto"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-3 items-center" style={{ marginBottom: '20px', color: '#94A3B8' }}>
              <a href="#privacy" className="hover:text-white transition-colors text-sm">Privacy Policy</a>
              <span>|</span>
              <a href="#terms" className="hover:text-white transition-colors text-sm">Terms</a>
              <span>|</span>
              <a href="#cookies" className="hover:text-white transition-colors text-sm">Cookie Policy</a>
              <span>|</span>
              <a href="mailto:hello.findyourside@gmail.com?subject=Question about Find Your Side" className="hover:text-white transition-colors text-sm">Contact</a>
            </div>

            <p className="text-sm" style={{ marginBottom: '12px', color: '#94A3B8' }}>
              © 2025 Find Your Side. All rights reserved.
            </p>

            <p className="text-sm max-w-3xl mx-auto" style={{ color: '#94A3B8', fontSize: '14px' }}>
              Find Your Side is not responsible for business outcomes. Must be 18+ to use. AI-generated content may contain errors.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );

// Loading view components
function GeneratingIdeasView() {
  const [showWaitMessage, setShowWaitMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowWaitMessage(true), 20000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-4 max-w-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: '#4F46E5' }}></div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">✨ Generating Your Ideas...</h1>
        <p className="text-xl text-gray-600 mb-4">This may take a moment. We're creating personalized business ideas just for you.</p>
        {showWaitMessage && (
          <p className="text-sm text-amber-600 mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            ⏳ High traffic detected. Your request is queued and will process shortly...
          </p>
        )}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 mt-6">
          <p className="text-sm text-gray-700">
            You can generate <strong className="text-indigo-600">2 idea sets</strong> and <strong className="text-indigo-600">2 detailed playbooks</strong>. Make them count!
          </p>
        </div>
      </div>
    </div>
  );
}

function GeneratingPlaybookView() {
  const [showWaitMessage, setShowWaitMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowWaitMessage(true), 25000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: '#4F46E5' }}></div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Creating Your Playbook...</h1>
        <p className="text-xl text-gray-600">Building your personalized 4-week launch plan.</p>
        {showWaitMessage && (
          <p className="text-sm text-amber-600 mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            ⏳ High traffic detected. This is taking longer than usual. Please wait...
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
