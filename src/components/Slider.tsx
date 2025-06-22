import React from 'react';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className = '',
}) => (
  <div className={`w-full ${className}`}>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
    />
    <div className="mt-1 text-right text-xs text-gray-700">{value}</div>
  </div>
);

export default Slider;
