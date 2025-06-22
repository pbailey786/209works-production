import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  className = '',
}) => (
  <label
    className={`flex cursor-pointer select-none items-center gap-2 ${className}`}
  >
    <span>{label}</span>
    <span className="relative inline-block h-6 w-10">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`block h-6 w-10 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      ></span>
      <span
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`}
      ></span>
    </span>
  </label>
);

export default Switch;
