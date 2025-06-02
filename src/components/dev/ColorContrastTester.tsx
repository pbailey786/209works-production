import React, { useState } from 'react';
import { 
  checkContrast, 
  validateColorCombination, 
  accessibleCombinations,
  accessibleColors 
} from '@/utils/colorContrast';

interface ColorContrastTesterProps {
  isDevelopment?: boolean;
}

export default function ColorContrastTester({ isDevelopment = process.env.NODE_ENV === 'development' }: ColorContrastTesterProps) {
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [textSize, setTextSize] = useState<'normal' | 'large'>('normal');

  if (!isDevelopment) return null;

  const result = checkContrast(foreground, background, textSize === 'large');
  const validation = validateColorCombination(foreground, background, textSize);

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'AAA': return '#15803d'; // Green
      case 'AA': return '#d97706';  // Orange
      case 'fail': return '#dc2626'; // Red
      default: return '#6b7280';    // Gray
    }
  };

  const presetCombinations = [
    { name: 'Primary Text', fg: accessibleCombinations.textOnWhite.primary, bg: '#ffffff' },
    { name: 'Secondary Text', fg: accessibleCombinations.textOnWhite.secondary, bg: '#ffffff' },
    { name: 'Muted Text', fg: accessibleCombinations.textOnWhite.muted, bg: '#ffffff' },
    { name: 'Primary Button', fg: '#ffffff', bg: accessibleColors.primary[600] },
    { name: 'Success Text', fg: accessibleCombinations.textOnWhite.success, bg: '#ffffff' },
    { name: 'Warning Text', fg: accessibleCombinations.textOnWhite.warning, bg: '#ffffff' },
    { name: 'Error Text', fg: accessibleCombinations.textOnWhite.error, bg: '#ffffff' },
    { name: 'Link Default', fg: accessibleCombinations.links.default, bg: '#ffffff' },
  ];

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Color Contrast Tester</h3>
        <span className="text-xs text-gray-500">Dev Only</span>
      </div>

      {/* Color Inputs */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Foreground Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              className="w-12 h-8 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Background Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-12 h-8 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Text Size</label>
          <select
            value={textSize}
            onChange={(e) => setTextSize(e.target.value as 'normal' | 'large')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="normal">Normal Text (14px+)</option>
            <option value="large">Large Text (18px+ or 14px+ bold)</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div 
        className="p-3 rounded mb-4 border"
        style={{ 
          color: foreground, 
          backgroundColor: background,
          borderColor: '#d1d5db'
        }}
      >
        <p className={textSize === 'large' ? 'text-lg font-bold' : 'text-sm'}>
          Sample text with current colors
        </p>
        <p className="text-xs mt-1">
          This is how the text will appear
        </p>
      </div>

      {/* Results */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Contrast Ratio:</span>
          <span className="text-sm font-mono">{result.ratio.toFixed(2)}:1</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">WCAG Level:</span>
          <span 
            className="text-sm font-bold px-2 py-1 rounded text-white"
            style={{ backgroundColor: getStatusColor(result.level) }}
          >
            {result.level}
          </span>
        </div>

        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>AA Compliant:</span>
            <span className={result.isAACompliant ? 'text-green-600' : 'text-red-600'}>
              {result.isAACompliant ? '✓ Pass' : '✗ Fail'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>AAA Compliant:</span>
            <span className={result.isAAACompliant ? 'text-green-600' : 'text-red-600'}>
              {result.isAAACompliant ? '✓ Pass' : '✗ Fail'}
            </span>
          </div>
        </div>

        {validation.recommendation && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {validation.recommendation}
          </div>
        )}
      </div>

      {/* Preset Combinations */}
      <div>
        <h4 className="text-sm font-medium mb-2">Preset Combinations</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {presetCombinations.map((combo, index) => {
            const comboResult = checkContrast(combo.fg, combo.bg, false);
            return (
              <button
                key={index}
                onClick={() => {
                  setForeground(combo.fg);
                  setBackground(combo.bg);
                }}
                className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 flex justify-between items-center"
              >
                <span>{combo.name}</span>
                <span 
                  className="px-1 rounded text-white text-xs"
                  style={{ backgroundColor: getStatusColor(comboResult.level) }}
                >
                  {comboResult.level}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Requirements Reference */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-xs font-medium mb-1">WCAG 2.1 Requirements</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <div>Normal text: 4.5:1 (AA), 7:1 (AAA)</div>
          <div>Large text: 3:1 (AA), 4.5:1 (AAA)</div>
          <div>UI components: 3:1 minimum</div>
        </div>
      </div>
    </div>
  );
} 