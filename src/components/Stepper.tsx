import React from 'react';

interface StepperProps {
  steps: string[];
  activeStep: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  className = '',
}) => (
  <div className={`flex items-center gap-4 ${className}`}>
    {steps.map((label, idx) => (
      <div key={label} className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-bold transition-colors ${idx < activeStep ? 'border-blue-600 bg-blue-600 text-white' : idx === activeStep ? 'border-blue-600 bg-white text-blue-600' : 'border-gray-300 bg-white text-gray-400'}`}
        >
          {idx + 1}
        </div>
        <span
          className={`text-sm ${idx <= activeStep ? 'text-blue-600' : 'text-gray-400'}`}
        >
          {label}
        </span>
        {idx < steps.length - 1 && <span className="h-0.5 w-8 bg-gray-300" />}
      </div>
    ))}
  </div>
);

export default Stepper;
