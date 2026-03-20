/**
 * List Property Form - SINGLE PAGE VERSION
 * All fields on one page with toast notifications
 */

console.log('🚀 listProperty.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('📋 DOM ready');
  init();
});

function init() {
  const form = document.getElementById('propertyForm');
  if (!form) {
    console.error('❌ Form not found');
    return;
  }

  console.log('✅ Form found');

  // Check auth
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error('❌ No token');
    if (typeof toast !== 'undefined') {
      toast.error('Please login first');
    } else {
      alert('Please login first');
    }
    setTimeout(() => {
      window.location.href = '../../login.html';
    }, 1500);
    return;
  }

  console.log('✅ Token found');
  
  // Check if token is expired (basic check - JWT tokens have exp claim)
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      if (Date.now() >= exp) {
        console.warn('⚠️ Token expired');
        if (typeof toast !== 'undefined') {
          toast.error('Your session has expired. Please login again.');
        } else {
          alert('Your session has expired. Please login again.');
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setTimeout(() => {
          window.location.href = '../../login.html';
        }, 1500);
        return;
      }
    }
  } catch (e) {
    console.warn('Could not parse token, continuing anyway');
  }

  // Setup file upload labels
  setupFileUploads();

  // Setup phone number formatting
  setupPhoneFormatting();

  // Submit handler
  form.addEventListener('submit', handleSubmit);

  console.log('✅ Form initialized');
}

function setupPhoneFormatting() {
  const phoneInput = document.getElementById('contactPhone');
  if (!phoneInput) return;

  // Format phone number as user types
  phoneInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
    
    // If starts with 234, add + prefix
    if (value.startsWith('234')) {
      value = '+' + value;
    } else if (value.startsWith('0')) {
      // If starts with 0, replace with +234
      value = '+234' + value.substring(1);
    } else if (value.length > 0 && !value.startsWith('+')) {
      // If doesn't start with + and has digits, add +234
      value = '+234' + value;
    }
    
    // Format: +234 801 234 5678
    if (value.startsWith('+234') && value.length > 4) {
      const digits = value.substring(4).replace(/\D/g, '');
      if (digits.length > 0) {
        // Format as +234 801 234 5678
        let formatted = '+234';
        if (digits.length > 0) {
          formatted += ' ' + digits.substring(0, 3);
        }
        if (digits.length > 3) {
          formatted += ' ' + digits.substring(3, 6);
        }
        if (digits.length > 6) {
          formatted += ' ' + digits.substring(6, 10);
        }
        value = formatted;
      }
    }
    
    e.target.value = value;
  });

  // Validate on blur
  phoneInput.addEventListener('blur', (e) => {
    const value = e.target.value.trim();
    if (value && !value.startsWith('+234')) {
      // Auto-add +234 if missing
      const digits = value.replace(/\D/g, '');
      if (digits.startsWith('234')) {
        e.target.value = '+' + digits;
      } else if (digits.startsWith('0')) {
        e.target.value = '+234' + digits.substring(1);
      } else if (digits.length >= 10) {
        e.target.value = '+234' + digits;
      }
    }
  });
}

function setupFileUploads() {
  // Property images
  const imagesInput = document.getElementById('property-images-upload');
  const imagesLabel = imagesInput?.closest('.upload-file-box')?.querySelector('label.upload-box');
  if (imagesInput && imagesLabel) {
    imagesLabel.addEventListener('click', (e) => {
      e.preventDefault();
      imagesInput.click();
    });
    
    // Show selected files
    imagesInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const fileCount = files.length;
        const fileText = fileCount === 1 ? '1 file selected' : `${fileCount} files selected`;
        if (imagesLabel.querySelector('span:last-child')) {
          imagesLabel.querySelector('span:last-child').textContent = fileText;
        }
      }
    });
  }

  // ID upload
  const idInput = document.getElementById('id-upload');
  const idLabel = idInput?.closest('.upload-file-box')?.querySelector('label.upload-box');
  if (idInput && idLabel) {
    idLabel.addEventListener('click', (e) => {
      e.preventDefault();
      idInput.click();
    });
  }

  // Ownership upload
  const ownershipInput = document.getElementById('ownership-upload');
  const ownershipLabel = ownershipInput?.closest('.upload-file-box')?.querySelector('label.upload-box');
  if (ownershipInput && ownershipLabel) {
    ownershipLabel.addEventListener('click', (e) => {
      e.preventDefault();
      ownershipInput.click();
    });
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  console.log('🎯 Form submit');

  const btn = document.getElementById('submitBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    btn.classList.add('loading');
  }

  try {
    // Get all form values
    const apartmentType = document.getElementById('apartmentType').value;
    const bedrooms = document.getElementById('bedrooms').value;
    const bathrooms = document.getElementById('bathrooms').value;
    const state = document.getElementById('state').value;
    const city = document.getElementById('city').value;
    const landmark = document.getElementById('landmark').value;
    const price = document.getElementById('price').value;
    const description = document.getElementById('description').value;
    const contactPhone = document.getElementById('contactPhone')?.value?.trim() || '';
    const imagesInput = document.getElementById('property-images-upload');

    // Build location
    const locationParts = [state, city];
    if (landmark && landmark !== 'None / Skip' && landmark !== '') {
      locationParts.push(landmark);
    }
    const location = locationParts.filter(Boolean).join(', ');

    // Generate title
    const title = `${apartmentType} ${bedrooms}-Bedroom in ${city}`;

    console.log('📦 Collected:', { title, location, price, apartmentType, bedrooms, bathrooms, contactPhone });

    // Validate
    if (!apartmentType || !bedrooms || !bathrooms || !state || !city || !price || !description) {
      throw new Error('Please fill all required fields');
    }

    if (description.trim().length < 20) {
      throw new Error('Description must be at least 20 characters');
    }

    if (!imagesInput || !imagesInput.files || imagesInput.files.length === 0) {
      throw new Error('Please upload at least one property image');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description.trim());
    formData.append('location', location);
    formData.append('price', price);
    formData.append('apartmentType', apartmentType);
    formData.append('bedrooms', bedrooms);
    formData.append('bathrooms', bathrooms);
    
    // Add contact phone if provided
    if (contactPhone) {
      formData.append('contactPhone', contactPhone);
    }

    // Add images
    for (let i = 0; i < imagesInput.files.length; i++) {
      formData.append('images', imagesInput.files[i]);
    }

    console.log('📤 Sending to API...');

    // Get token
    const token = localStorage.getItem('accessToken');

    // Submit
    const baseURL = typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api');
    const response = await fetch(`${baseURL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    console.log('📥 Response:', response.status, data);

    // Handle token expiration
    if (response.status === 401) {
      if (typeof toast !== 'undefined') {
        toast.error('Your session has expired. Please login again.');
      } else {
        alert('Your session has expired. Please login again.');
      }
      
      // Clear expired token
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      setTimeout(() => {
        window.location.href = '../../login.html';
      }, 2000);
      return;
    }

    if (response.ok && data.success) {
      if (typeof toast !== 'undefined') {
        toast.success(data.message || 'Property listed successfully! Your property is now live.');
      } else {
        alert('✅ Property listed successfully! Your property is now live.');
      }
      
      setTimeout(() => {
        window.location.href = '../homepage/my-properties.html';
      }, 2000);
    } else {
      throw new Error(data.message || 'Submission failed');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (typeof toast !== 'undefined') {
      toast.error(error.message || 'Failed to submit property. Please try again.');
    } else {
      alert('Error: ' + error.message);
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'List Now';
      btn.classList.remove('loading');
    }
  }
}
