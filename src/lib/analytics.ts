export const analytics = {
  quizStarted: () => {
    console.log('Analytics: Quiz started');
  },

  quizCompleted: (data?: any) => {
    console.log('Analytics: Quiz completed', data);
  },

  ideasGenerated: (count: number) => {
    console.log('Analytics: Ideas generated', count);
  },

  ideaSelected: (ideaTitle: string) => {
    console.log('Analytics: Idea selected', ideaTitle);
  },

  playbookGenerated: (source: string) => {
    console.log('Analytics: Playbook generated', source);
  },

  playbookDownloaded: () => {
    console.log('Analytics: Playbook downloaded');
  },

  playbookEmailed: () => {
    console.log('Analytics: Playbook emailed');
  },

  playbookEmailSent: () => {
    console.log('Analytics: Playbook email sent');
  },

  feedbackSubmitted: (rating: number) => {
    console.log('Analytics: Feedback submitted', rating);
  },

  interestCaptured: (email: string) => {
    console.log('Analytics: Interest captured', email);
  },

  ideaSubmitted: (idea: any) => {
    console.log('Analytics: Idea submitted', idea);
  },

  featureValidated: (feature: string) => {
    console.log('Analytics: Feature validated', feature);
  },

  ideaFormStarted: () => {
    console.log('Analytics: Idea form started');
  },

  ideaFormCompleted: () => {
    console.log('Analytics: Idea form completed');
  },

  emailCaptured: (source: string) => {
    console.log('Analytics: Email captured', source);
  },

  ideaLimitReached: () => {
    console.log('Analytics: Idea limit reached');
  },

  playbookLimitReached: () => {
    console.log('Analytics: Playbook limit reached');
  },

  waitlistJoined: () => {
    console.log('Analytics: Waitlist joined');
  },

  waitlistFeatureSelected: (feature: string) => {
    console.log('Analytics: Waitlist feature selected', feature);
  },

  waitlistUrgency: (urgency: string) => {
    console.log('Analytics: Waitlist urgency', urgency);
  },

  monthlyCapReached: () => {
    console.log('Analytics: Monthly spending cap reached');
  }
};
