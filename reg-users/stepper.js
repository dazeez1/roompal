/**
 * Stepper Component for Multi-Step Forms
 * Handles step navigation and form submission
 */

(function() {
  'use strict';
  
  let currentStep = 0;
  let totalSteps = 0;
  let steps = [];
  let form, prevBtn, nextBtn, submitBtn, stepCounter, successMessage;

  // Wait for DOM to be ready
  function init() {
    // Try to find form by ID first, then by class
    form = document.getElementById("propertyForm") || 
           document.querySelector(".propertyForm") ||
           document.querySelector('form.propertyForm');
    if (!form) {
      // Only warn if we're not on a page that uses this stepper
      const isPropertyPage = window.location.pathname.includes('list-a-house');
      if (!isPropertyPage) {
        // Silently return - this stepper is only for property listing page
        return;
      }
      console.warn('Property form not found');
      return;
    }

    steps = Array.from(document.querySelectorAll(".selector"));
    prevBtn = document.getElementById("prevBtn");
    nextBtn = document.getElementById("nextBtn");
    submitBtn = document.getElementById("submitBtn");
    stepCounter = document.getElementById("stepCounter");
    successMessage = document.getElementById("successMessage");

    if (!steps || steps.length === 0) {
      console.warn('No steps found');
      return;
    }

    totalSteps = steps.length;
    currentStep = 0;

    // Initialize
    initialize();
    attachEventListeners();
  }

  function initialize() {
    // Hide all steps initially, show first one
    steps.forEach((step, index) => {
      if (!step) return;
      
      step.classList.remove("active", "hiding");
      if (index === 0) {
        step.style.display = 'block';
        step.classList.add("active");
      } else {
        step.style.display = 'none';
      }
    });
    updateUI();
  }

  function showStep(stepIndex) {
    // Validate step index
    if (stepIndex < 0 || stepIndex >= totalSteps) {
      console.warn(`Invalid step index: ${stepIndex}, total steps: ${totalSteps}`);
      return;
    }

    const targetStep = steps[stepIndex];
    if (!targetStep) {
      console.warn(`Step at index ${stepIndex} not found`);
      return;
    }

    // Hide all steps
    steps.forEach((step, index) => {
      if (!step) return;
      
      step.classList.remove("active", "hiding");
      if (index === stepIndex) {
        step.style.display = 'block';
        step.classList.add("active");
      } else {
        step.style.display = 'none';
      }
    });
  }

  function updateStepCounter() {
    if (stepCounter) {
      stepCounter.textContent = `${currentStep + 1}/${totalSteps}`;
    }
  }

  function updateUI() {
    updateStepCounter();
    
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;
    
    // Update Previous button
    if (prevBtn) {
      if (isFirstStep) {
        prevBtn.style.display = 'none';
      } else {
        prevBtn.style.display = 'inline-block';
        prevBtn.disabled = false;
      }
    }
    
    // Update Next/Submit button
    if (nextBtn) {
      if (isLastStep) {
        // On last step, change Next to Submit
        nextBtn.style.display = 'inline-block';
        nextBtn.textContent = 'List Now';
        nextBtn.classList.add('btn-submit');
        nextBtn.type = 'button';
      } else {
        // On other steps, show Next
        nextBtn.style.display = 'inline-block';
        nextBtn.textContent = 'Next';
        nextBtn.classList.remove('btn-submit');
        nextBtn.type = 'button';
      }
    }
    
    // Hide separate submit button (we use Next button instead)
    if (submitBtn) {
      submitBtn.style.display = 'none';
    }
  }

  async function simulateAsyncOperation(delay) {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  // Hide current step with animation
  async function hideCurrentStep() {
    return new Promise((resolve) => {
      if (currentStep < 0 || currentStep >= totalSteps) {
        resolve();
        return;
      }
      
      const currentStepElement = steps[currentStep];
      if (currentStepElement && currentStepElement.classList) {
        currentStepElement.classList.add("hiding");
        setTimeout(() => {
          if (currentStepElement.classList) {
            currentStepElement.classList.remove("active", "hiding");
            currentStepElement.style.display = 'none';
          }
          resolve();
        }, 300);
      } else {
        resolve();
      }
    });
  }

  // Show current step with animation
  async function showCurrentStep() {
    return new Promise((resolve) => {
      if (currentStep < 0 || currentStep >= totalSteps) {
        resolve();
        return;
      }
      
      const currentStepElement = steps[currentStep];
      if (currentStepElement && currentStepElement.classList) {
        currentStepElement.style.display = 'block';
        currentStepElement.classList.add("active");
        setTimeout(() => {
          resolve();
        }, 400);
      } else {
        resolve();
      }
    });
  }

  // Handle Next button click
  async function handleNext(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // CRITICAL: Check if we're on the last step BEFORE doing anything
    if (currentStep >= totalSteps - 1) {
      // We're on the last step - submit the form
      console.log('On last step, submitting form...');
      
      // Disable button to prevent double submission
      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.classList.add("loading");
      }
      
      // Trigger form submission directly
      if (form && typeof handleFormSubmit !== 'undefined') {
        const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {} };
        handleFormSubmit(fakeEvent);
      } else if (form) {
        // Fallback: dispatch submit event
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);
      }
      return;
    }

    // Not on last step - proceed to next step
    if (nextBtn) {
      nextBtn.classList.add("loading");
      nextBtn.disabled = true;
    }

    try {
      await simulateAsyncOperation(300);
      await hideCurrentStep();
      
      // Increment step
      currentStep++;
      
      // Safety check - prevent going beyond total steps
      if (currentStep >= totalSteps) {
        console.warn('Attempted to go beyond total steps, submitting instead');
        currentStep = totalSteps - 1;
        // Trigger submit
        if (form && typeof handleFormSubmit !== 'undefined') {
          const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {} };
          handleFormSubmit(fakeEvent);
        } else if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
        return;
      }
      
      await showCurrentStep();
      updateUI();
    } catch (error) {
      console.error("Error navigating to next step:", error);
    } finally {
      if (nextBtn) {
        nextBtn.classList.remove("loading");
        nextBtn.disabled = false;
      }
    }
  }

  // Handle Previous button click
  async function handlePrevious(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Can't go back from first step
    if (currentStep <= 0) {
      return;
    }

    if (prevBtn) {
      prevBtn.classList.add("loading");
      prevBtn.disabled = true;
    }

    try {
      await simulateAsyncOperation(200);
      await hideCurrentStep();
      
      // Decrement step
      currentStep--;
      
      // Safety check
      if (currentStep < 0) {
        currentStep = 0;
      }
      
      await showCurrentStep();
      updateUI();
    } catch (error) {
      console.error("Error navigating to previous step:", error);
    } finally {
      if (prevBtn) {
        prevBtn.classList.remove("loading");
        prevBtn.disabled = false;
      }
    }
  }

  // Handle form submission (from submit button or form submit event)
  async function handleSubmit(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Let listProperty.js handle the actual submission
    if (typeof handleFormSubmit !== 'undefined') {
      handleFormSubmit(e);
    } else {
      // Fallback if listProperty.js isn't loaded
      console.warn('handleFormSubmit not found, using fallback');
      if (submitBtn) {
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;
      }
      
      try {
        await simulateAsyncOperation(1500);
        if (steps[currentStep]) {
          steps[currentStep].style.display = "none";
        }
        const buttonGroup = document.querySelector(".button-group");
        if (buttonGroup) {
          buttonGroup.style.display = "none";
        }
        if (successMessage) {
          successMessage.classList.add("show");
        }
      } catch (error) {
        console.error("Submission error:", error);
        if (typeof toast !== 'undefined') {
          toast.error("Failed to submit. Please try again.");
        } else {
          alert("Failed to submit. Please try again.");
        }
        if (submitBtn) {
          submitBtn.classList.remove("loading");
          submitBtn.disabled = false;
        }
      }
    }
  }

  function attachEventListeners() {
    // Attach event listeners
    if (nextBtn) {
      nextBtn.addEventListener("click", handleNext);
    }
    
    if (prevBtn) {
      prevBtn.addEventListener("click", handlePrevious);
    }
    
    if (form) {
      form.addEventListener("submit", handleSubmit);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already ready
    init();
  }
})();
