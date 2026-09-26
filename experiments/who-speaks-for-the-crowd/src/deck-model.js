export function nextSlideStep(currentStep, stepCount) {
  return Math.min(Math.max(0, stepCount - 1), currentStep + 1);
}

export function previousSlideStep(currentStep) {
  return Math.max(0, currentStep - 1);
}

export function hasNextSlideStep(currentStep, stepCount) {
  return currentStep < Math.max(0, stepCount - 1);
}
