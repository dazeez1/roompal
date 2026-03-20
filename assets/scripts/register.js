/**
 * Registration Form Handler
 * Integrates with backend API for user registration
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const submitButton = document.getElementById('register-submit-btn') || registerForm?.querySelector('button[type="submit"]');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const termsCheckbox = registerForm?.querySelector('input[type="checkbox"]');

  // Error display elements
  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const confirmPasswordError = document.getElementById('confirmPasswordError');

  if (!registerForm) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Register form not found');
    }
    return;
  }

  /**
   * Clear all error messages
   */
  const clearErrors = () => {
    [nameError, emailError, passwordError, confirmPasswordError].forEach(
      (el) => {
        if (el) el.textContent = '';
      }
    );
  };

  /**
   * Display error message
   * @param {HTMLElement} element - Error element
   * @param {string} message - Error message
   */
  const showError = (element, message) => {
    if (element) {
      element.textContent = message;
      element.style.color = '#ef4444';
      element.style.fontSize = '14px';
      element.style.marginTop = '4px';
    }
  };

  /**
   * Validate form inputs
   * @returns {boolean} - Is valid
   */
  const validateForm = () => {
    clearErrors();
    let isValid = true;

    // Validate full name
    const fullName = nameInput?.value.trim();
    if (!fullName) {
      showError(nameError, 'Full name is required');
      isValid = false;
    } else if (fullName.length < 2) {
      showError(nameError, 'Full name must be at least 2 characters');
      isValid = false;
    } else if (fullName.length > 100) {
      showError(nameError, 'Full name cannot exceed 100 characters');
      isValid = false;
    }

    // Validate email
    const email = emailInput?.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      showError(emailError, 'Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      showError(emailError, 'Please provide a valid email address');
      isValid = false;
    }

    // Validate password
    const password = passwordInput?.value;
    if (!password) {
      showError(passwordError, 'Password is required');
      isValid = false;
    } else if (password.length < 6) {
      showError(passwordError, 'Password must be at least 6 characters');
      isValid = false;
    }

    // Validate confirm password
    const confirmPassword = confirmPasswordInput?.value;
    if (!confirmPassword) {
      showError(confirmPasswordError, 'Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      showError(confirmPasswordError, 'Passwords do not match');
      isValid = false;
    }

    // Validate terms checkbox
    if (!termsCheckbox?.checked) {
      toast.error('Please agree to the terms and conditions');
      isValid = false;
    }

    return isValid;
  };

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    clearErrors();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Get form data
    const formData = {
      fullName: nameInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      password: passwordInput.value,
    };

    // Get submit button
    const buttonElement = submitButton;

    try {
      // Set loading state
      if (buttonElement) {
        LoadingState.setButtonLoading(buttonElement, true, 'Create Account');
      }
      LoadingState.setFormLoading(registerForm, true);

      // Make API request
      const response = await api.auth.register(formData);

      if (response.success) {
        // Store tokens if provided
        if (response.data?.tokens) {
          api.storeTokens(
            response.data.tokens.accessToken,
            response.data.tokens.refreshToken
          );
        }

        // Store user data
        if (response.data?.user) {
          try {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } catch (e) {
            // Ignore storage errors
          }
        }

        // Show success message
        toast.success(
          response.message || 'Registration successful! Please check your email to verify your account.'
        );

        // Redirect to login after short delay
        setTimeout(() => {
          window.location.href = './login.html';
        }, 2000);
      }
    } catch (error) {
      // Handle errors
      let errorMessage = 'Registration failed. Please try again.';

      if (error.data?.errors && Array.isArray(error.data.errors)) {
        // Display field-specific errors
        error.data.errors.forEach((err) => {
          switch (err.field) {
            case 'fullName':
              showError(nameError, err.message);
              break;
            case 'email':
              showError(emailError, err.message);
              break;
            case 'password':
              showError(passwordError, err.message);
              break;
            default:
              errorMessage = err.message;
          }
        });
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      // Reset loading state
      if (buttonElement) {
        LoadingState.setButtonLoading(buttonElement, false);
      }
      LoadingState.setFormLoading(registerForm, false);
    }
  };

  // Attach event listener
  registerForm.addEventListener('submit', handleSubmit);

  // Real-time validation (optional)
  if (nameInput) {
    nameInput.addEventListener('blur', () => {
      const fullName = nameInput.value.trim();
      if (fullName && (fullName.length < 2 || fullName.length > 100)) {
        showError(nameError, 'Full name must be between 2 and 100 characters');
      } else if (nameError) {
        nameError.textContent = '';
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        showError(emailError, 'Please provide a valid email address');
      } else if (emailError) {
        emailError.textContent = '';
      }
    });
  }

  if (passwordInput && confirmPasswordInput) {
    confirmPasswordInput.addEventListener('blur', () => {
      if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
        showError(confirmPasswordError, 'Passwords do not match');
      } else if (confirmPasswordError) {
        confirmPasswordError.textContent = '';
      }
    });
  }
});
