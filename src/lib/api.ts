const API_BASE_URL = '/api';

export interface QuizData {
  email: string;
  skills: string[];
  timeAvailable: string;
  budget?: string;
  interests: string[];
  goal: string;
  experienceLevel: string;
}

export interface BusinessIdea {
  name: string;
  description: string;
  whyItFits: string;
  startupCost: string;
  timeToRevenue: string;
  incomePotential: string;
}

export interface PlaybookRequest {
  email: string;
  businessIdea: string;
  i
