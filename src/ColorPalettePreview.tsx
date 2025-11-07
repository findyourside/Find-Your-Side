import { Check } from 'lucide-react';

const palettes = [
  {
    name: 'Logo Colors (Teal & Orange)',
    primary: '#14b8a6',
    secondary: '#f97316',
    description: 'Matches your logo perfectly - modern and energetic'
  },
  {
    name: 'Emerald Green',
    primary: '#10b981',
    secondary: '#059669',
    description: 'Growth, money, and success'
  },
  {
    name: 'Bold Orange',
    primary: '#f97316',
    secondary: '#ea580c',
    description: 'Energetic, creative, action-oriented'
  },
  {
    name: 'Ocean Teal',
    primary: '#14b8a6',
    secondary: '#0d9488',
    description: 'Modern, professional, trustworthy'
  },
  {
    name: 'Classic Blue',
    primary: '#3b82f6',
    secondary: '#2563eb',
    description: 'Professional and timeless'
  },
  {
    name: 'Vibrant Rose',
    primary: '#f43f5e',
    secondary: '#e11d48',
    description: 'Bold and memorable'
  }
];

interface ColorPalettePreviewProps {
  onSelectPalette: (primary: string) => void;
  selectedPrimary?: string;
}

function ColorPalettePreview({ onSelectPalette, selectedPrimary }: ColorPalettePreviewProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/1000022094.png"
              alt="Find Your Side Logo"
              className="h-16"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Color Palette
          </h1>
          <p className="text-xl text-gray-600">
            Select a color scheme that represents your brand
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {palettes.map((palette) => (
            <button
              key={palette.name}
              onClick={() => onSelectPalette(palette.primary)}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl hover:scale-105 text-left ${
                selectedPrimary === palette.primary ? 'ring-4 ring-offset-2' : ''
              }`}
              style={selectedPrimary === palette.primary ? {
                borderColor: palette.primary
              } : undefined}
            >
              {selectedPrimary === palette.primary && (
                <div
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: palette.primary }}
                >
                  <Check className="w-5 h-5" />
                </div>
              )}

              <div className="h-32 flex">
                <div
                  className="flex-1"
                  style={{ backgroundColor: palette.primary }}
                />
                <div
                  className="flex-1"
                  style={{ backgroundColor: palette.secondary }}
                />
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {palette.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {palette.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg shadow-sm"
                      style={{ backgroundColor: palette.primary }}
                    />
                    <span className="text-xs font-mono text-gray-500">
                      {palette.primary}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg shadow-sm"
                      style={{ backgroundColor: palette.secondary }}
                    />
                    <span className="text-xs font-mono text-gray-500">
                      {palette.secondary}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <div
                      className="h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: palette.primary }}
                    >
                      Primary Button
                    </div>
                    <div
                      className="h-12 rounded-lg flex items-center justify-center font-semibold border-2"
                      style={{
                        borderColor: palette.primary,
                        color: palette.primary
                      }}
                    >
                      Secondary Button
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <img
              src="/1000022094.png"
              alt="Find Your Side Logo"
              className="h-12 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Your Logo's Natural Colors
            </h2>
            <p className="text-gray-600 mb-6">
              Your logo features teal (#14b8a6) and orange (#f97316) - a perfect combination of trust and energy.
              I recommend using these colors to create a cohesive brand identity.
            </p>
            <div className="flex gap-4 justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-xl shadow-lg mx-auto mb-2" style={{ backgroundColor: '#14b8a6' }} />
                <p className="text-sm font-mono text-gray-600">#14b8a6</p>
                <p className="text-xs text-gray-500">Teal</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-xl shadow-lg mx-auto mb-2" style={{ backgroundColor: '#f97316' }} />
                <p className="text-sm font-mono text-gray-600">#f97316</p>
                <p className="text-xs text-gray-500">Orange</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColorPalettePreview;
