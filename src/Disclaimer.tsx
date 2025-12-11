export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white">
      <section style={{ backgroundColor: '#1a1f3a', paddingTop: '8px', paddingBottom: '24px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center" style={{ marginBottom: '20px' }}>
              <img src="/Find your side.svg" alt="Find Your Side - Idea to Execution" className="w-[240px] sm:w-[340px] h-auto" />
            </div>
            <h1 className="font-bold text-white tracking-tight" style={{ marginBottom: '12px', fontSize: '48px' }}>
              Disclaimer
            </h1>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ backgroundColor: '#EEF2FF' }} className="p-8 rounded-lg">
            <p className="text-gray-700 text-sm leading-relaxed">
              Find Your Side is an AI-generated tool that provides a 4-week launch plan to help busy professionals launch their side business or hobby. Its intent is for informational purposes only. Your personalized action plan is not professional advice. Before launching your business, you should: (1) Validate your idea with real customers, (2) Consult a business attorney regarding legal structure and compliance, (3) Meet with an accountant about taxes and financial planning, (4) Research local regulations in your area. Find Your Side makes no guarantees about business success or viability, or even that executing your action plan will yield any immediate economic or positive results. We are not responsible for any financial, legal, or business outcomes resulting from use of this service.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200" style={{ backgroundColor: '#1a1f3a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center mb-3">
            <img
              src="/Find your side.svg"
              alt="Find Your Side"
              className="w-[240px] h-auto mx-auto"
            />
          </div>
          <div className="text-center">
            <p className="text-gray-300 text-sm mb-2">
              Privacy Policy | Terms | Cookie Policy | Disclaimer |{' '}
              <a
                href="mailto:hello.findyourside.com"
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
