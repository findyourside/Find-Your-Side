import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { supabase } from './lib/supabase';
import { analytics } from './lib/analytics';

interface IdeaFormData {
  businessType: string;
  businessTypeOther: string;
  problemSolving: string;
  targetCustomer: string;
  timeCommitment: string;
  skillsExperience: string;
  email: string;
}

interface IdeaFormProps {
  onComplete: (data: IdeaFormData) => void;
  onBack: () => void;
}

interface ValidationErrors {
  businessType?: string;
  businessTypeOther?: string;
  problemSolving?: string;
  targetCustomer?: string;
  timeCommitment?: string;
  skillsExperience?: string;
  email?: string;
}

export default function IdeaForm({ onComplete, onBack }: IdeaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<IdeaFormData>({
    businessType: '',
    businessTypeOther: '',
    problemSolving: '',
    targetCustomer: '',
    timeCommitment: '',
    skillsExperience: '',
    email: '',
  });

  const getCharacterCount = (text: string) => text.length;

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.businessType) {
      newErrors.businessType = 'Please select a business type';
    }

    if (formData.businessType === 'Other' && !formData.businessTypeOther.trim()) {
      newErrors.businessTypeOther = 'Please describe your business type';
    }
    if (formData.businessTypeOther.trim().length > 50) {
      newErrors.businessTypeOther = 'Maximum 50 characters allowed';
    }

    if (!formData.problemSolving.trim()) {
      newErrors.problemSolving = 'Please describe the problem you\'re solving';
    }
    if (formData.problemSolving.trim().length > 150) {
      newErrors.problemSolving = 'Maximum 150 characters allowed';
    }

    if (!formData.targetCustomer.trim()) {
      newErrors.targetCustomer = 'Please describe your target customer';
    }

    if (!formData.timeCommitment) {
      newErrors.timeCommitment = 'Please select your time commitment';
    }

    if (formData.skillsExperience.trim().length > 300) {
      newErrors.skillsExperience = 'Maximum 300 characters allowed';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const businessTypeValue = formData.businessType === 'Other'
        ? formData.businessTypeOther
        : formData.businessType;

      const { error } = await supabase.from('idea_submissions').insert({
        business_idea: `Business Type: ${businessTypeValue}\nProblem: ${formData.problemSolving}\nTarget Customer: ${formData.targetCustomer}`,
        time_commitment: formData.timeCommitment,
        budget: null,
        skills_experience: formData.skillsExperience || null,
        email: formData.email,
      });

      if (error) {
        console.error('Error saving idea submission:', error);
      }

      analytics.emailCaptured('idea_form');
      analytics.ideaFormCompleted();
      onComplete(formData);
    } catch (err) {
      console.error('Error:', err);
      setIsSubmitting(false);
    }
  };

  const problemCharCount = getCharacterCount(formData.problemSolving);
  const skillsCharCount = getCharacterCount(formData.skillsExperience);
  const otherTypeCharCount = getCharacterCount(formData.businessTypeOther);

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
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Home
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Tell Us About Your Business
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Answer a few questions and we'll create your personalized 30-day launch plan.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field 1: Business Type */}
            <div>
              <label htmlFor="businessType" className="block text-lg font-semibold text-gray-900 mb-2">
                Business type <span className="text-red-500">*</span>
              </label>
              <select
                id="businessType"
                value={formData.businessType}
                onChange={(e) => {
                  setFormData({ ...formData, businessType: e.target.value, businessTypeOther: '' });
                  if (errors.businessType) {
                    setErrors({ ...errors, businessType: undefined });
                  }
                }}
                className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white ${
                  errors.businessType ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="">Select business type</option>
                <option value="Service-based">Service-based</option>
                <option value="Product-based">Product-based</option>
                <option value="Content/Creator">Content/Creator</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Consulting/Coaching">Consulting/Coaching</option>
                <option value="Software/App">Software/App</option>
                <option value="Other">Other</option>
              </select>
              {errors.businessType && (
                <p className="mt-2 text-sm text-red-600">{errors.businessType}</p>
              )}
            </div>

            {/* Field 1b: Other Business Type (conditional) */}
            {formData.businessType === 'Other' && (
              <div>
                <input
                  type="text"
                  value={formData.businessTypeOther}
                  onChange={(e) => {
                    if (e.target.value.length <= 50) {
                      setFormData({ ...formData, businessTypeOther: e.target.value });
                      if (errors.businessTypeOther) {
                        setErrors({ ...errors, businessTypeOther: undefined });
                      }
                    }
                  }}
                  placeholder="Describe your business type..."
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.businessTypeOther ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-sm ${errors.businessTypeOther ? 'text-red-600' : 'text-gray-500'}`}>
                    {errors.businessTypeOther || `${otherTypeCharCount}/50 characters`}
                  </span>
                </div>
              </div>
            )}

            {/* Field 2: Problem Solving */}
            <div>
              <label htmlFor="problemSolving" className="block text-lg font-semibold text-gray-900 mb-2">
                What problem does your business solve? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="problemSolving"
                value={formData.problemSolving}
                onChange={(e) => {
                  if (e.target.value.length <= 150) {
                    setFormData({ ...formData, problemSolving: e.target.value });
                    if (errors.problemSolving) {
                      setErrors({ ...errors, problemSolving: undefined });
                    }
                  }
                }}
                placeholder="e.g., Help busy professionals manage their finances, Teach people photography skills..."
                rows={2}
                className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
                  errors.problemSolving ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              <div className="flex justify-between items-center mt-2">
                <span className={`text-sm ${errors.problemSolving ? 'text-red-600' : 'text-gray-500'}`}>
                  {errors.problemSolving || `${problemCharCount}/150 characters`}
                </span>
              </div>
            </div>

            {/* Field 3: Target Customer */}
            <div>
              <label htmlFor="targetCustomer" className="block text-lg font-semibold text-gray-900 mb-2">
                Who are you helping? <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="targetCustomer"
                value={formData.targetCustomer}
                onChange={(e) => {
                  setFormData({ ...formData, targetCustomer: e.target.value });
                  if (errors.targetCustomer) {
                    setErrors({ ...errors, targetCustomer: undefined });
                  }
                }}
                placeholder="e.g., Small business owners, New parents, College students..."
                className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.targetCustomer ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.targetCustomer && (
                <p className="mt-2 text-sm text-red-600">{errors.targetCustomer}</p>
              )}
            </div>

            {/* Field 4: Time Commitment */}
            <div>
              <label htmlFor="timeCommitment" className="block text-lg font-semibold text-gray-900 mb-2">
                How much time can you dedicate weekly? <span className="text-red-500">*</span>
              </label>
              <select
                id="timeCommitment"
                value={formData.timeCommitment}
                onChange={(e) => {
                  setFormData({ ...formData, timeCommitment: e.target.value });
                  if (errors.timeCommitment) {
                    setErrors({ ...errors, timeCommitment: undefined });
                  }
                }}
                className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white ${
                  errors.timeCommitment ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="">Select time commitment</option>
                <option value="5 hours/week">5 hours/week</option>
                <option value="10 hours/week">10 hours/week</option>
                <option value="15+ hours/week">15+ hours/week</option>
              </select>
              {errors.timeCommitment && (
                <p className="mt-2 text-sm text-red-600">{errors.timeCommitment}</p>
              )}
            </div>

            {/* Field 5: Skills/Experience */}
            <div>
              <label htmlFor="skillsExperience" className="block text-lg font-semibold text-gray-900 mb-1">
                What skills or experience do you bring? <span className="text-gray-500 text-base font-normal">(Optional but helps us customize)</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">We'll tailor your playbook to leverage your strengths and skip what you already know</p>
              <textarea
                id="skillsExperience"
                value={formData.skillsExperience}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setFormData({ ...formData, skillsExperience: e.target.value });
                    if (errors.skillsExperience) {
                      setErrors({ ...errors, skillsExperience: undefined });
                    }
                  }
                }}
                placeholder="e.g., 5 years in marketing, built websites before, strong writer..."
                rows={3}
                className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
                  errors.skillsExperience ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              <div className="flex justify-between items-center mt-2">
                <span className={`text-sm ${errors.skillsExperience ? 'text-red-600' : 'text-gray-500'}`}>
                  {errors.skillsExperience || `${skillsCharCount}/300 characters`}
                </span>
              </div>
            </div>

            {/* Field 6: Email */}
            <div>
              <label htmlFor="email" className="block text-lg font-semibold text-gray-900 mb-2">
                Email (to receive your playbook) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                placeholder="your.email@example.com"
                className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 text-white text-xl font-semibold rounded-lg transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              style={{ backgroundColor: isSubmitting ? '#9CA3AF' : '#4F46E5' }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#4338CA')}
              onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#4F46E5')}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating your playbook...
                </span>
              ) : (
                'Get My Playbook'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
