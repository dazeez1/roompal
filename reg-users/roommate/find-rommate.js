const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const form = document.querySelector(".propertyForm");
// Use selector-group instead of selector for roommate form
const steps = document.querySelectorAll(".selector-group");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const stepCounter = document.querySelector(".step-counter span");
const successMessage = document.getElementById("successMessage");

// Add click event to each tab button
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Get the data-tab attribute value
    const targetTab = button.getAttribute("data-tab");

    // Remove active class from all buttons
    tabButtons.forEach((btn) => btn.classList.remove("active"));

    // Add active class to clicked button
    button.classList.add("active");

    // Hide all tab contents
    tabContents.forEach((content) => content.classList.remove("active"));

    // Show the target tab content
    const targetContent = document.getElementById(`${targetTab}-tab`);
    targetContent.classList.add("active");
  });
});

// Get all the DOM elements

// Only handle tabs - let roommateIntegration.js handle form steps
// This prevents conflicts between multiple form handlers

function initialize() {
  // Show first step, hide others
  steps.forEach((step, index) => {
    if (index === 0) {
      step.style.display = 'block';
    } else {
      step.style.display = 'none';
    }
  });
  updateUI(); // Update buttons and counter
}

// Show a specific step
function showStep(stepIndex) {
  if (stepIndex < 0 || stepIndex >= steps.length) {
    console.warn('Invalid step index:', stepIndex);
    return;
  }
  
  steps.forEach((step, index) => {
    if (step) {
      if (index === stepIndex) {
        step.style.display = 'block';
      } else {
        step.style.display = 'none';
      }
    }
  });
}

// Update the step counter
document.addEventListener("DOMContentLoaded", () => {
  const element = document.getElementById("my-element");
  if (element) {
    element.textContent = "New Content";
  }
});

// Update button states
function updateButtons() {
  if (!prevBtn || !nextBtn) return;
  
  if (currentStep === 0) {
    prevBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'block';
    prevBtn.disabled = false;
  }

  const isLastStep = currentStep === totalSteps - 1;
  if (isLastStep) {
    nextBtn.textContent = 'Submit';
  } else {
    nextBtn.textContent = 'Next';
  }
  nextBtn.style.display = "block";
}

// Update step counter
function updateStepCounter() {
  const stepCounterElement = document.querySelector('.step-counter span');
  if (stepCounterElement && steps.length > 0) {
    stepCounterElement.textContent = `${currentStep + 1}/${steps.length}`;
  }
}

// Update everything
function updateUI() {
  updateStepCounter();
  updateButtons();
}

// Simulate async operation
async function simulateAsyncOperation(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

// Hide current step with animation
async function hideCurrentStep() {
  return new Promise((resolve) => {
    const currentStepElement = steps[currentStep];
    currentStepElement.classList.add("hiding");

    setTimeout(() => {
      currentStepElement.classList.remove("active", "hiding");
      resolve();
    }, 300);
  });
}

// Show current step with animation
async function showCurrentStep() {
  return new Promise((resolve) => {
    if (currentStep < 0 || currentStep >= steps.length) {
      console.warn('Invalid step index:', currentStep);
      resolve();
      return;
    }
    
    const currentStepElement = steps[currentStep];
    if (!currentStepElement) {
      console.warn('Step element not found at index:', currentStep);
      resolve();
      return;
    }
    
    if (currentStepElement.classList) {
      currentStepElement.classList.add("active");
    }

    setTimeout(() => {
      resolve();
    }, 400);
  });
}

// Handle "Next" button click
async function handleNext() {
  if (!nextBtn || !form) return;
  
  // Check if we're on the last step
  if (currentStep >= totalSteps - 1) {
    // On last step - let roommateIntegration.js handle submission
    console.log('On last step, submitting form...');
    if (typeof submitRegistrationForm === 'function') {
      await submitRegistrationForm();
    } else {
      console.warn('submitRegistrationForm not found');
    }
    return;
  }
  
  nextBtn.classList.add("loading");
  nextBtn.disabled = true;

  try {
    await simulateAsyncOperation(300);
    await hideCurrentStep();
    
    // Move to next step
    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
      updateUI();
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (nextBtn) {
      nextBtn.classList.remove("loading");
      nextBtn.disabled = false;
    }
  }
}

// Handle "Previous" button click
async function handlePrevious() {
  if (!prevBtn || currentStep <= 0) return;
  
  prevBtn.classList.add("loading");
  prevBtn.disabled = true;

  try {
    await simulateAsyncOperation(200);
    await hideCurrentStep();
    
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
      updateUI();
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (prevBtn) {
      prevBtn.classList.remove("loading");
      prevBtn.disabled = false;
    }
  }
}

// Handle form submission
async function handleSubmit(e) {
  e.preventDefault();

  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Simulate API call
    await simulateAsyncOperation(1500);

    // Hide form, show success
    steps[currentStep].style.display = "none";
    document.querySelector(".button-group").style.display = "none";
    successMessage.classList.add("show");

    console.log("Form submitted:", data);
  } catch (error) {
    console.error("Submission error:", error);
    alert("Failed to submit. Please try again.");
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
}

// Form step handling is now done by roommateIntegration.js
// This file only handles tab switching
