/**
 * Login Form Handler
 * Integrates with backend API for user authentication
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form') || document.querySelector('form');
  const emailInput = document.getElementById('login-email') || loginForm?.querySelector('input[type="email"]') || loginForm?.querySelector('input[type="text"]');
  const passwordInput = document.getElementById('login-password') || loginForm?.querySelector('input[type="password"]');
  const submitButton = document.getElementById('login-submit-btn') || loginForm?.querySelector('button[type="submit"]');

  if (!loginForm) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Login form not found');
    }
    return;
  }

  // Create error container if it doesn't exist
  let errorContainer = document.getElementById('login-error');
  if (!errorContainer && loginForm) {
    errorContainer = document.createElement('div');
    errorContainer.id = 'login-error';
    errorContainer.style.color = '#ef4444';
    errorContainer.style.fontSize = '14px';
    errorContainer.style.marginTop = '8px';
    errorContainer.style.minHeight = '20px';
    loginForm.insertBefore(errorContainer, loginForm.firstChild);
  }

  /**
   * Clear error message
   */
  const clearError = () => {
    if (errorContainer) {
      errorContainer.textContent = '';
    }
  };

  /**
   * Show error message
   * @param {string} message - Error message
   */
  const showError = (message) => {
    if (errorContainer) {
      errorContainer.textContent = message;
    }
  };

  /**
   * Validate form inputs
   * @returns {boolean} - Is valid
   */
  const validateForm = () => {
    clearError();
    let isValid = true;

    // Validate email
    const email = emailInput?.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      showError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      showError('Please provide a valid email address');
      isValid = false;
    }

    // Validate password
    const password = passwordInput?.value;
    if (!password) {
      showError('Password is required');
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
    clearError();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Get form data
    const credentials = {
      email: emailInput.value.trim().toLowerCase(),
      password: passwordInput.value,
    };

    // Get submit button
    const button = submitButton || loginForm.querySelector('button[type="submit"]');
    const buttonElement = button?.tagName === 'A' ? button.parentElement : button;

    try {
      // Set loading state
      if (buttonElement) {
        LoadingState.setButtonLoading(buttonElement, true, 'Sign in');
      }
      LoadingState.setFormLoading(loginForm, true);

      // Make API request
      const response = await api.auth.login(credentials);

      if (response.success && response.data) {
        // Store tokens
        if (response.data.tokens) {
          api.storeTokens(
            response.data.tokens.accessToken,
            response.data.tokens.refreshToken
          );
        }

        // Store user data
        if (response.data.user) {
          try {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } catch (e) {
            // Ignore storage errors
          }
        }

        // Show success message
        toast.success('Login successful! Redirecting...');

        // Redirect to dashboard after short delay
        setTimeout(() => {
          window.location.href = './reg-users/homepage/home.html';
        }, 1000);
      }
    } catch (error) {
      // Handle errors
      let errorMessage = 'Login failed. Please check your credentials and try again.';

      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      showError(errorMessage);
      toast.error(errorMessage);
    } finally {
      // Reset loading state
      if (buttonElement) {
        LoadingState.setButtonLoading(buttonElement, false);
      }
      LoadingState.setFormLoading(loginForm, false);
    }
  };

  // Attach event listener
  loginForm.addEventListener('submit', handleSubmit);

  // Real-time validation
  if (emailInput) {
    emailInput.addEventListener('blur', () => {
      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) {
        showError('Please provide a valid email address');
      } else {
        clearError();
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      clearError();
    });
  }
});
