import { ChevronLeft, Timer, Lightbulb } from 'lucide-react';
import GenerationCounter from './GenerationCounter';

interface BusinessIdea {
  name: string;
  whyItFits: string;
  timeRequired: string;
  firstStep: string;
}

interface BusinessIdeasResultsProps {
  ideas: BusinessIdea[];
  onSelectIdea: (idea: BusinessIdea) => void;
  onBack: () => void;
  ideaSetsRemaining: number;
  playbooksRemaining: number;
}

export default function BusinessIdeasResults({ ideas, onSelectIdea, onBack, ideaSetsRemaining, playbooksRemaining }: BusinessIdeasResultsProps) {
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Home
          </button>
        </div>

        <GenerationCounter
          ideaSetsRemaining={ideaSetsRemaining}
          playbooksRemaining={playbooksRemaining}
        />

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Personalized Business Ideas
          </h1>
          <p className="text-xl text-gray-600">
            Select an idea to get your 30-day launch playbook
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {ideas.map((idea, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full"
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4F46E5'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">{idea.name}</h3>

              <div className="mb-4 flex-grow">
                <p className="text-sm font-semibold text-gray-700 mb-2">Why this fits you:</p>
                <p className="text-gray-600 text-sm leading-relaxed">{idea.whyItFits}</p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-gray-500">Time: </span>
                    <span className="text-sm text-gray-700">{idea.timeRequired}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: '#FEF3C7' }}>
                <div className="flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-900 mb-1">First step to validate:</p>
                    <p className="text-sm text-yellow-800">{idea.firstStep}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectIdea(idea)}
                className="w-full flex items-center justify-center px-6 py-3 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg mt-auto"
                style={{ backgroundColor: '#4F46E5' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4338CA'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
              >
                Select This Idea
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
