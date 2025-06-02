import React from 'react';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({ value, min = 0, max = 100, step = 1, onChange, className = '' }) => (
  <div className={`w-full ${className}`}>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
    />
    <div className="text-xs text-gray-700 mt-1 text-right">{value}</div>
  </div>
);

export default Slider; 