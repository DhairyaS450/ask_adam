import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepNames?: string[]; // Optional: Names for each step for tooltips or labels
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps, stepNames }) => {
  // Basic validation
  if (currentStep < 1 || currentStep > totalSteps || totalSteps <= 0) {
    console.warn('Invalid step values for ProgressIndicator');
    return null; // Don't render if props are invalid
  }

  return (
    <div className="w-full px-4 sm:px-0 mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-primary dark:text-primary-light">Step {currentStep} of {totalSteps}</span>
        {stepNames && stepNames[currentStep - 1] && (
             <span className="text-sm text-gray-600 dark:text-gray-400">{stepNames[currentStep - 1]}</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressIndicator;
