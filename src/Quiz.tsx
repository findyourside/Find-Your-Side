import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';

interface QuizData {
  skills: string[];
  skillsOther: string;
  timeCommitment: string;
  timeCommitmentOther: string;
  interests: string[];
  interestsOther: string;
  goal: string;
  goalOther: string;
  experience: string;
  email: string;
}

interface QuizProps {
  onComplete: (data: QuizData) => void;
  onBack: () => void;
}

export default function Quiz({ onComplete, onBack }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<QuizData>({
    skills: [],
    skillsOther: '',
    timeCommitment: '',
    timeCommitmentOther: '',
    interests: [],
    interestsOther: '',
    goal: '',
    goalOther: '',
    experience: '',
    email: '',
  });

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => {
      const newSkills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];

      return {
        ...prev,
        skills: newSkills,
        skillsOther: skill === 'Other' && !newSkills.includes('Other') ? '' : prev.skillsOther,
      };
    });
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];

      return {
        ...prev,
        interests: newInterests,
        interestsOther: interest === 'Other' && !newInterests.includes('Other') ? '' : prev.interestsOther,
      };
    });
  };

  const handleNext = async () => {
    if (currentQuestion < 6) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsSubmitting(true);
      try {
        const { error } = await supabase.from('quiz_responses').insert({
          email: formData.email,
          skills: formData.skills,
          skills_other: formData.skillsOther || null,
          time_commitment: formData.timeCommitment,
          time_commitment_other: formData.timeCommitmentOther || null,
          budget: null,
          interests: formData.interests,
          interests_other: formData.interestsOther || null,
          goal: formData.goal,
          goal_other: formData.goalOther || null,
          experience: formData.experience,
        });

        if (error) {
          console.error('Error saving quiz response:', error);
        }

        analytics.emailCaptured('quiz');
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsSubmitting(false);
        analytics.quizCompleted();
        onComplete(formData);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      onBack();
    }
  };

  const canProceed = () => {
    switch (currentQuestion) {
      case 1:
        if (formData.skills.length === 0) return false;
        if (formData.skills.includes('Other') && formData.skillsOther.trim().length === 0) return false;
        return true;
      case 2:
        if (formData.timeCommitment === '') return false;
        if (formData.timeCommitment === 'Other' && formData.timeCommitmentOther.trim().length === 0) return false;
        return true;
      case 3:
        if (formData.interests.length === 0) return false;
        if (formData.interests.includes('Other') && formData.interestsOther.trim().length === 0) return false;
        return true;
      case 4:
        if (formData.goal === '') return false;
        if (formData.goal === 'Other' && formData.goalOther.trim().length === 0) return false;
        return true;
      case 5:
        return formData.experience !== '';
      case 6:
        return formData.email !== '' && formData.email.includes('@');
      default:
        return false;
    }
  };

  const skillOptions = [
    'Writing',
    'Design',
    'Coding',
    'Marketing',
    'Sales',
    'Teaching',
    'Management',
    'Consulting',
    'Other',
  ];

  const interestOptions = [
    'Fitness',
    'Food',
    'Tech',
    'Education',
    'Fashion',
    'Finance',
    'Health',
    'Creative Arts',
    'Other',
  ];

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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-600">Question {currentQuestion} of 6</p>
            <p className="text-sm text-gray-600">{Math.round((currentQuestion / 6) * 100)}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ backgroundColor: '#4F46E5', width: `${(currentQuestion / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          {currentQuestion === 1 && (
            <fieldset>
              <legend className="text-3xl font-bold text-gray-900 mb-2">
                What skills do you have?
              </legend>
              <p className="text-gray-600 mb-6">Select all that apply</p>
              <div className="space-y-3">
                {skillOptions.map((skill) => (
                  <div key={skill}>
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer transition-colors hover:border-[#4F46E5]">
                      <input
                        type="checkbox"
                        checked={formData.skills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        className="w-5 h-5 rounded"
                        style={{ accentColor: '#4F46E5' }}
                      />
                      <span className="ml-3 text-lg text-gray-900">{skill}</span>
                    </label>
                    {skill === 'Other' && formData.skills.includes('Other') && (
                      <div className="mt-2 ml-6">
                        <textarea
                          value={formData.skillsOther}
                          onChange={(e) => {
                            if (e.target.value.length <= 200) {
                              setFormData({ ...formData, skillsOther: e.target.value });
                            }
                          }}
                          placeholder="Describe your other skills..."
                          rows={3}
                          className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                          style={{ '--tw-ring-color': '#4F46E5' } as React.CSSProperties}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          {formData.skillsOther.length}/200 characters
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          {currentQuestion === 2 && (
            <fieldset>
              <legend className="text-3xl font-bold text-gray-900 mb-6">
                How much time can you dedicate weekly?
              </legend>
              <select
                value={formData.timeCommitment}
                onChange={(e) => setFormData({
                  ...formData,
                  timeCommitment: e.target.value,
                  timeCommitmentOther: e.target.value === 'Other' ? formData.timeCommitmentOther : ''
                })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-lg"
                style={{ '--tw-ring-color': '#4F46E5' } as React.CSSProperties}
              >
                <option value="">Select time commitment</option>
                <option value="2-5 hours/week">2-5 hours/week</option>
                <option value="10+ hours/week">10+ hours/week</option>
                <option value="15+ hours/week">15+ hours/week</option>
                <option value="Other">Other</option>
              </select>

              {formData.timeCommitment === 'Other' && (
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Please specify your availability"
                    value={formData.timeCommitmentOther}
                    onChange={(e) => setFormData({
                      ...formData,
                      timeCommitmentOther: e.target.value.slice(0, 50)
                    })}
                    maxLength={50}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#4F46E5] text-lg"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.timeCommitmentOther.length}/50 characters
                  </p>
                </div>
              )}
            </fieldset>
          )}

          {currentQuestion === 3 && (
            <fieldset>
              <legend className="text-3xl font-bold text-gray-900 mb-2">
                What are you interested in?
              </legend>
              <p className="text-gray-600 mb-6">Select all that apply</p>
              <div className="space-y-3">
                {interestOptions.map((interest) => (
                  <div key={interest}>
                    <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer transition-colors hover:border-[#4F46E5]">
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest)}
                        onChange={() => handleInterestToggle(interest)}
                        className="w-5 h-5 rounded"
                        style={{ accentColor: '#4F46E5' }}
                      />
                      <span className="ml-3 text-lg text-gray-900">{interest}</span>
                    </label>
                    {interest === 'Other' && formData.interests.includes('Other') && (
                      <div className="mt-2 ml-6">
                        <textarea
                          value={formData.interestsOther}
                          onChange={(e) => {
                            if (e.target.value.length <= 200) {
                              setFormData({ ...formData, interestsOther: e.target.value });
                            }
                          }}
                          placeholder="Describe your other interests..."
                          rows={3}
                          className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                          style={{ '--tw-ring-color': '#4F46E5' } as React.CSSProperties}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          {formData.interestsOther.length}/200 characters
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          {currentQuestion === 4 && (
            <fieldset>
              <legend className="text-3xl font-bold text-gray-900 mb-6">
                What's your main goal?
              </legend>
              <div className="space-y-3">
                {[
                  'Generate extra income',
                  'Eventually replace my full-time job',
                  'Creative outlet (income is secondary)',
                  'Learn new skills and test ideas',
                  'Other',
                ].map((option) => (
                  <label
                    key={option}
                    className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer transition-colors hover:border-[#4F46E5]"
                  >
                    <input
                      type="radio"
                      name="goal"
                      checked={formData.goal === option}
                      onChange={() => setFormData({
                        ...formData,
                        goal: option,
                        goalOther: option === 'Other' ? formData.goalOther : ''
                      })}
                      className="w-5 h-5"
                      style={{ accentColor: '#4F46E5' }}
                    />
                    <span className="ml-3 text-lg text-gray-900">{option}</span>
                  </label>
                ))}

                {formData.goal === 'Other' && (
                  <div className="mt-4 ml-8">
                    <input
                      type="text"
                      placeholder="Describe your goal..."
                      value={formData.goalOther}
                      onChange={(e) => setFormData({
                        ...formData,
                        goalOther: e.target.value.slice(0, 100)
                      })}
                      maxLength={100}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#4F46E5] text-lg"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.goalOther.length}/100 characters
                    </p>
                  </div>
                )}
              </div>
            </fieldset>
          )}

          {currentQuestion === 5 && (
            <fieldset>
              <legend className="text-3xl font-bold text-gray-900 mb-6">
                What's your entrepreneurial experience?
              </legend>
              <div className="space-y-3">
                {[
                  "I've never started a business before",
                  "I've tried a side business but stopped",
                  "I currently run a side business",
                  "I've successfully exited a business",
                ].map((option) => (
                  <label
                    key={option}
                    className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer transition-colors hover:border-[#4F46E5]"
                  >
                    <input
                      type="radio"
                      name="experience"
                      checked={formData.experience === option}
                      onChange={() => setFormData({ ...formData, experience: option })}
                      className="w-5 h-5"
                      style={{ accentColor: '#4F46E5' }}
                    />
                    <span className="ml-3 text-lg text-gray-900">{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {currentQuestion === 6 && (
            <div>
              <label htmlFor="email" className="block text-3xl font-bold text-gray-900 mb-6">
                Email address
              </label>
              <input
                type="email"
                id="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#4F46E5' } as React.CSSProperties}
              />
            </div>
          )}


          <div className="flex gap-4 mt-8">
            <button
              onClick={handlePrevious}
              className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 flex items-center justify-center px-6 py-3 text-white text-lg font-semibold rounded-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              style={{ backgroundColor: '#4F46E5' }}
              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4338CA')}
              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4F46E5')}
            >
              {isSubmitting ? 'Submitting...' : currentQuestion === 6 ? 'Generate My Ideas' : 'Next'}
              {currentQuestion < 6 && !isSubmitting && <ChevronRight className="w-5 h-5 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
