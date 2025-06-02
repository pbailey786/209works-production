import React from 'react';

interface StepperProps {
  steps: string[];
  activeStep: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, activeStep, className = '' }) => (
  <div className={`flex items-center gap-4 ${className}`}>
    {steps.map((label, idx) => (
      <div key={label} className="flex items-center gap-2">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold transition-colors
            ${idx < activeStep ? 'bg-blue-600 border-blue-600 text-white' : idx === activeStep ? 'bg-white border-blue-600 text-blue-600' : 'bg-white border-gray-300 text-gray-400'}`}
        >
          {idx + 1}
        </div>
        <span className={`text-sm ${idx <= activeStep ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
        {idx < steps.length - 1 && <span className="w-8 h-0.5 bg-gray-300" />}
      </div>
    ))}
  </div>
);

export default Stepper; 