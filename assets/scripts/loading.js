/**
 * Loading Spinner Utility
 * Provides loading states for buttons and forms
 */

class LoadingState {
  /**
   * Set loading state on a button
   * @param {HTMLElement} button - Button element
   * @param {boolean} isLoading - Loading state
   * @param {string} originalText - Original button text
   */
  static setButtonLoading(button, isLoading, originalText = null) {
    if (!button) return;

    if (isLoading) {
      // Store original text if not provided
      if (originalText === null) {
        button.dataset.originalText = button.textContent || button.innerText;
      } else {
        button.dataset.originalText = originalText;
      }

      // Disable button
      button.disabled = true;
      button.style.opacity = '0.7';
      button.style.cursor = 'not-allowed';

      // Add spinner
      const spinner = document.createElement('span');
      spinner.className = 'loading-spinner';
      spinner.innerHTML = `
        <svg class="spinner-icon" viewBox="0 0 24 24" fill="none">
          <circle class="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="32" stroke-dashoffset="32">
            <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
          </circle>
        </svg>
      `;
      button.insertBefore(spinner, button.firstChild);

      // Update text
      const textSpan = button.querySelector('.button-text') || document.createElement('span');
      if (!button.querySelector('.button-text')) {
        textSpan.className = 'button-text';
        button.appendChild(textSpan);
      }
      textSpan.textContent = 'Loading...';
    } else {
      // Re-enable button
      button.disabled = false;
      button.style.opacity = '1';
      button.style.cursor = 'pointer';

      // Remove spinner
      const spinner = button.querySelector('.loading-spinner');
      if (spinner) {
        spinner.remove();
      }

      // Restore original text
      const originalText = button.dataset.originalText || 'Submit';
      const textSpan = button.querySelector('.button-text');
      if (textSpan) {
        textSpan.textContent = originalText;
      } else {
        button.textContent = originalText;
      }
    }
  }

  /**
   * Set loading state on form inputs
   * @param {HTMLElement} form - Form element
   * @param {boolean} isLoading - Loading state
   */
  static setFormLoading(form, isLoading) {
    if (!form) return;

    const inputs = form.querySelectorAll('input, button, textarea, select');
    inputs.forEach((input) => {
      if (isLoading) {
        input.disabled = true;
        input.style.opacity = '0.6';
      } else {
        input.disabled = false;
        input.style.opacity = '1';
      }
    });
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.LoadingState = LoadingState;
}
