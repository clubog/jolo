interface Props {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
              ${
                i <= currentStep
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-text-light"
              }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-sm font-semibold hidden sm:inline ${
              i <= currentStep ? "text-text" : "text-text-light"
            }`}
          >
            {label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 ${
                i < currentStep ? "bg-primary" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
