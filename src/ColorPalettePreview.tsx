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
          <h1 className="text-4xl font-b
