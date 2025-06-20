import { Clock, MapPin, Calendar } from 'lucide-react';

'use client';


interface AvailabilityStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

const SHIFTS = [
  { id: 'morning', label: 'Morning (6 AM - 12 PM)' },
  { id: 'afternoon', label: 'Afternoon (12 PM - 6 PM)' },
  { id: 'evening', label: 'Evening (6 PM - 12 AM)' },
  { id: 'overnight', label: 'Overnight (12 AM - 6 AM)' },
];

export default function AvailabilityStep({ formData, setFormData, onNext, onPrev }: AvailabilityStepProps) {
  const handleDayToggle = (dayId: string) => {
    const currentDays = formData.availabilityDays || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter((day: string) => day !== dayId)
      : [...currentDays, dayId];
    
    setFormData((prev: any) => ({
      ...prev,
      availabilityDays: newDays,
    }));
  };

  const handleShiftToggle = (shiftId: string) => {
    const currentShifts = formData.availabilityShifts || [];
    const newShifts = currentShifts.includes(shiftId)
      ? currentShifts.filter((shift: string) => shift !== shiftId)
      : [...currentShifts, shiftId];
    
    setFormData((prev: any) => ({
      ...prev,
      availabilityShifts: newShifts,
    }));
  };

  const canContinue = (formData.availabilityDays?.length > 0) && (formData.availabilityShifts?.length > 0);

  return (
    <div className="space-y-8">
      {/* Days Available */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-4">
          <Calendar className="w-5 h-5 inline mr-2" />
          Which days can you work? *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = formData.availabilityDays?.includes(day.id);
            return (
              <button
                key={day.id}
                onClick={() => handleDayToggle(day.id)}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <div className="font-medium">{day.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shifts Available */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-4">
          <Clock className="w-5 h-5 inline mr-2" />
          Which shifts can you work? *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SHIFTS.map((shift) => {
            const isSelected = formData.availabilityShifts?.includes(shift.id);
            return (
              <button
                key={shift.id}
                onClick={() => handleShiftToggle(shift.id)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }
                `}
              >
                <div className="font-medium">{shift.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Distance */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-4">
          <MapPin className="w-5 h-5 inline mr-2" />
          How far are you willing to travel? (miles)
        </label>
        <input
          type="range"
          min="5"
          max="50"
          value={formData.distanceWillingToTravel || 25}
          onChange={(e) => setFormData((prev: any) => ({
            ...prev,
            distanceWillingToTravel: parseInt(e.target.value)
          }))}
          className="w-full"
        />
        <div className="text-center mt-2">
          <span className="text-lg font-medium text-blue-600">
            {formData.distanceWillingToTravel || 25} miles
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrev}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
        
        <button
          onClick={onNext}
          disabled={!canContinue}
          className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
            canContinue
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Continue</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
