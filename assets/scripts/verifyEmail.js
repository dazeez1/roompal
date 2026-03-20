/**
 * Email Verification Handler
 * Handles email verification from URL token
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Get token from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const verifyForm = document.querySelector('form');
  const verifyButton = verifyForm?.querySelector('.verifyBtn');
  const codeInput = document.getElementById('verification-code') || verifyForm?.querySelector('input[type="text"]');
  const verifyInfoContainer = document.querySelector('.verify-info-container');
  const verifyEmailOverlay = document.getElementById('verify-email');
  const emailDisplay = document.getElementById('email-display');

  // Get email from localStorage or URL
  const userData = localStorage.getItem('user');
  let userEmail = '';
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userEmail = user.email || '';
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Update email display if available
  if (emailDisplay && userEmail) {
    emailDisplay.textContent = `We sent the verification code to your email, ${userEmail}`;
  }

  // Hide success overlay initially
  if (verifyEmailOverlay) {
    verifyEmailOverlay.style.display = 'none';
  }

  // If token is in URL, verify automatically
  if (token) {
    await verifyEmailToken(token);
    return;
  }

  // Manual verification form handler (if 6-digit code input exists)
  if (verifyForm && codeInput && verifyButton) {
    verifyButton.addEventListener('click', async (e) => {
      e.preventDefault();
      const code = codeInput.value.trim();

      if (!code) {
        toast.error('Please enter the verification code');
        return;
      }

      if (code.length !== 6) {
        toast.error('Verification code must be 6 digits');
        return;
      }

      await verifyEmailToken(code);
    });
  }
});

/**
 * Verify email token
 * @param {string} token - Verification token
 */
const verifyEmailToken = async (token) => {
  const verifyInfoContainer = document.querySelector('.verify-info-container');
  const verifyEmailOverlay = document.getElementById('verify-email');

  try {
    // Show loading state
    toast.info('Verifying your email...');

    // Make API request
    const response = await api.auth.verifyEmail(token);

    if (response.success) {
      // Store tokens if provided (some backends return tokens on verification)
      if (response.data?.tokens) {
        api.storeTokens(
          response.data.tokens.accessToken,
          response.data.tokens.refreshToken
        );
      }

      // Update user data if provided
      if (response.data?.user) {
        try {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (e) {
          // Ignore storage errors
        }
      }
      // Hide verification form
      if (verifyInfoContainer) {
        verifyInfoContainer.style.display = 'none';
      }

      // Show success overlay
      if (verifyEmailOverlay) {
        verifyEmailOverlay.style.display = 'block';
        const successMessage = verifyEmailOverlay.querySelector('p');
        if (successMessage) {
          successMessage.textContent = 'Your email has been verified successfully!';
        }
      }

      toast.success('Email verified successfully!');

      // Redirect based on authentication status
      const continueBtn = document.getElementById('continue-btn');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => {
          // Check if user has tokens (is logged in)
          const token = api.getAuthToken();
          if (token) {
            // User is logged in, redirect to homepage
            window.location.href = '../../reg-users/homepage/home.html';
          } else {
            // User not logged in, redirect to login
            window.location.href = '../login.html';
          }
        });
      } else {
        // Fallback: redirect after delay
        setTimeout(() => {
          const token = api.getAuthToken();
          if (token) {
            window.location.href = '../../reg-users/homepage/home.html';
          } else {
            window.location.href = '../login.html';
          }
        }, 3000);
      }
    }
  } catch (error) {
    let errorMessage = 'Email verification failed. Please try again.';

    if (error.message) {
      errorMessage = error.message;
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    }

    toast.error(errorMessage);

    // Show resend verification option
    const resendButton = document.createElement('button');
    resendButton.textContent = 'Resend Verification Email';
    resendButton.className = 'resend-verification-btn';
    resendButton.style.cssText = `
      margin-top: 16px;
      padding: 10px 20px;
      background: #223448;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    `;

    resendButton.addEventListener('click', async () => {
      // Get email from localStorage or prompt user
      const userData = localStorage.getItem('user');
      let email = '';

      if (userData) {
        try {
          const user = JSON.parse(userData);
          email = user.email || '';
        } catch (e) {
          // Ignore parse errors
        }
      }

      if (!email) {
        email = prompt('Please enter your email address:');
        if (!email) return;
      }

      try {
        await api.auth.resendVerification(email);
        toast.success('Verification email sent! Please check your inbox.');
        resendButton.remove();
      } catch (error) {
        toast.error(error.message || 'Failed to resend verification email');
      }
    });

    const resendContainer = document.getElementById('resend-container');
    if (resendContainer) {
      resendContainer.innerHTML = '';
      resendContainer.appendChild(resendButton);
    } else if (verifyInfoContainer) {
      const existingResend = verifyInfoContainer.querySelector('.resend-verification-btn');
      if (!existingResend) {
        verifyInfoContainer.appendChild(resendButton);
      }
    }
  }
};
