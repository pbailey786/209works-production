import React, { useState } from 'react';
import {
  checkContrast,
  validateColorCombination,
  accessibleCombinations,
  accessibleColors,
} from '@/utils/colorContrast';

interface ColorContrastTesterProps {
  isDevelopment?: boolean;
}

export default function ColorContrastTester({
  isDevelopment = process.env.NODE_ENV === 'development',
}: ColorContrastTesterProps) {
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [textSize, setTextSize] = useState<'normal' | 'large'>('normal');

  if (!isDevelopment) return null;

  const result = checkContrast(foreground, background, textSize === 'large');
  const validation = validateColorCombination(foreground, background, textSize);

  const getStatusColor = (level: string) => {
    switch (level) {
      case 'AAA':
        return '#15803d'; // Green
      case 'AA':
        return '#d97706'; // Orange
      case 'fail':
        return '#dc2626'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const presetCombinations = [
    {
      name: 'Primary Text',
      fg: accessibleCombinations.textOnWhite.primary,
      bg: '#ffffff',
    },
    {
      name: 'Secondary Text',
      fg: accessibleCombinations.textOnWhite.secondary,
      bg: '#ffffff',
    },
    {
      name: 'Muted Text',
      fg: accessibleCombinations.textOnWhite.muted,
      bg: '#ffffff',
    },
    {
      name: 'Primary Button',
      fg: '#ffffff',
      bg: accessibleColors.primary[600],
    },
    {
      name: 'Success Text',
      fg: accessibleCombinations.textOnWhite.success,
      bg: '#ffffff',
    },
    {
      name: 'Warning Text',
      fg: accessibleCombinations.textOnWhite.warning,
      bg: '#ffffff',
    },
    {
      name: 'Error Text',
      fg: accessibleCombinations.textOnWhite.error,
      bg: '#ffffff',
    },
    {
      name: 'Link Default',
      fg: accessibleCombinations.links.default,
      bg: '#ffffff',
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-h-96 w-96 overflow-y-auto rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Color Contrast Tester</h3>
        <span className="text-xs text-gray-500">Dev Only</span>
      </div>

      {/* Color Inputs */}
      <div className="mb-4 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Foreground Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={foreground}
              onChange={e => setForeground(e.target.value)}
              className="h-8 w-12 rounded border border-gray-300"
            />
            <input
              type="text"
              value={foreground}
              onChange={e => setForeground(e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Background Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={background}
              onChange={e => setBackground(e.target.value)}
              className="h-8 w-12 rounded border border-gray-300"
            />
            <input
              type="text"
              value={background}
              onChange={e => setBackground(e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Text Size</label>
          <select
            value={textSize}
            onChange={e => setTextSize(e.target.value as 'normal' | 'large')}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="normal">Normal Text (14px+)</option>
            <option value="large">Large Text (18px+ or 14px+ bold)</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div
        className="mb-4 rounded border p-3"
        style={{
          color: foreground,
          backgroundColor: background,
          borderColor: '#d1d5db',
        }}
      >
        <p className={textSize === 'large' ? 'text-lg font-bold' : 'text-sm'}>
          Sample text with current colors
        </p>
        <p className="mt-1 text-xs">This is how the text will appear</p>
      </div>

      {/* Results */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Contrast Ratio:</span>
          <span className="font-mono text-sm">{result.ratio.toFixed(2)}:1</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">WCAG Level:</span>
          <span
            className="rounded px-2 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: getStatusColor(result.level) }}
          >
            {result.level}
          </span>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>AA Compliant:</span>
            <span
              className={
                result.isAACompliant ? 'text-green-600' : 'text-red-600'
              }
            >
              {result.isAACompliant ? '✓ Pass' : '✗ Fail'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>AAA Compliant:</span>
            <span
              className={
                result.isAAACompliant ? 'text-green-600' : 'text-red-600'
              }
            >
              {result.isAAACompliant ? '✓ Pass' : '✗ Fail'}
            </span>
          </div>
        </div>

        {validation.recommendation && (
          <div className="rounded bg-red-50 p-2 text-xs text-red-600">
            {validation.recommendation}
          </div>
        )}
      </div>

      {/* Preset Combinations */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Preset Combinations</h4>
        <div className="max-h-32 space-y-1 overflow-y-auto">
          {presetCombinations.map((combo, index) => {
            const comboResult = checkContrast(combo.fg, combo.bg, false);
            return (
              <button
                key={index}
                onClick={() => {
                  setForeground(combo.fg);
                  setBackground(combo.bg);
                }}
                className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-gray-100"
              >
                <span>{combo.name}</span>
                <span
                  className="rounded px-1 text-xs text-white"
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
      <div className="mt-4 border-t border-gray-200 pt-3">
        <h4 className="mb-1 text-xs font-medium">WCAG 2.1 Requirements</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div>Normal text: 4.5:1 (AA), 7:1 (AAA)</div>
          <div>Large text: 3:1 (AA), 4.5:1 (AAA)</div>
          <div>UI components: 3:1 minimum</div>
        </div>
      </div>
    </div>
  );
}
