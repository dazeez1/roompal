/**
 * Property Details Page Handler
 * Fetches and displays property details from API
 */

console.log('🚀 propertyDetails.js loaded');

document.addEventListener('DOMContentLoaded', async () => {
  console.log('📋 DOM ready - Property Details');
  
  // Get property ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = urlParams.get('id');

  if (!propertyId) {
    console.error('❌ No property ID in URL');
    showError('Property ID not found in URL');
    return;
  }

  console.log('✅ Property ID:', propertyId);

  // Load property details
  await loadPropertyDetails(propertyId);
});

/**
 * Load property details from API
 * @param {string} propertyId - Property ID
 */
const loadPropertyDetails = async (propertyId) => {
  try {
    console.log('📤 Fetching property details...');
    
    // Show loading state
    showLoadingState();

    // Get token (optional for public properties)
    const token = localStorage.getItem('accessToken');
    
    // Fetch property directly
    const baseURL = typeof getAPIBaseURL === 'function' ? getAPIBaseURL() : (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io') ? 'https://roompal-wrgn.onrender.com/api' : 'http://localhost:5002/api');
    const response = await fetch(`${baseURL}/properties/${propertyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 Response:', response.status, data);

    if (data.success && data.data) {
      const property = data.data.property || data.data;
      console.log('✅ Property loaded:', property.title);
      console.log('📸 Property images:', property.images);
      console.log('📦 Full property object:', property);
      renderPropertyDetails(property);
    } else {
      console.error('❌ Invalid response format:', data);
      throw new Error(data.message || 'Property not found');
    }
  } catch (error) {
    console.error('❌ Error loading property:', error);
    console.error('❌ Error stack:', error.stack);
    showError(error.message || 'Failed to load property details');
    
    if (error.message && (error.message.includes('404') || error.message.includes('not found'))) {
      show404Error();
    }
  }
};

/**
 * Show loading state
 */
const showLoadingState = () => {
  const container = document.querySelector('.property-container');
  if (!container) {
    console.error('❌ .property-container not found!');
    return;
  }
  console.log('⏳ Showing loading state...');
  
  // Hide existing content but keep structure
  const existingContent = container.querySelector('.image-gallery, .property-content');
  if (existingContent) {
    existingContent.style.display = 'none';
  }
  
  // Add loading overlay
  let loadingDiv = container.querySelector('.loading-overlay');
  if (!loadingDiv) {
    loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: white; z-index: 1000; display: flex; align-items: center; justify-content: center; flex-direction: column;';
    container.style.position = 'relative';
    container.appendChild(loadingDiv);
  }
  
  loadingDiv.innerHTML = `
    <div style="text-align: center;">
      <div style="display: inline-block; margin-bottom: 1rem;">
        <svg style="animation: spin 1s linear infinite; width: 3rem; height: 3rem; color: #223448;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <p style="color: #4b5563; font-size: 1rem;">Loading property details...</p>
    </div>
    <style>
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
  `;
};

/**
 * Render property details
 * @param {Object} property - Property object
 */
const renderPropertyDetails = (property) => {
  console.log('🎨 Rendering property details for:', property.title);
  console.log('📸 Images array:', property.images);
  
  // Remove loading overlay
  const container = document.querySelector('.property-container');
  if (container) {
    const loadingOverlay = container.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
    // Show content again
    const existingContent = container.querySelector('.image-gallery, .property-content');
    if (existingContent) {
      existingContent.style.display = '';
    }
  }
  
  // Extract images - handle both array and single image
  let images = [];
  if (property.images) {
    if (Array.isArray(property.images)) {
      images = property.images;
    } else if (typeof property.images === 'string') {
      images = [property.images];
    }
  }
  
  console.log('🖼️ Processed images:', images);
  
  // Render image gallery
  renderImageGallery(images);

  // Render property title
  const titleSection = document.querySelector('.property-section:first-of-type .property-title-text');
  if (titleSection) {
    titleSection.textContent = property.title || 'Untitled Property';
  }

  // Update page title
  document.title = `${property.title || 'Property'} - Roompal`;

  // Render features
  renderFeatures(property);

  // Render amenities
  renderAmenities(property.amenities || []);

  // Render rent details
  renderRentDetails(property);

  // Render location
  renderLocation(property.location);

  // Render agent/owner information
  renderAgentInfo(property.owner);

  // Render agent phone number (pass both owner and property to check contactPhone)
  renderAgentPhone(property.owner, property);

  // Setup contact button
  setupContactButton(property);

  // Render availability
  renderAvailability(property);
};

/**
 * Render image gallery
 * @param {Array} images - Property images
 */
const renderImageGallery = (images) => {
  console.log('🖼️ renderImageGallery called with:', images);
  
  // Ensure images is an array
  if (!Array.isArray(images)) {
    images = [];
  }
  
  // Filter out any null/undefined/empty strings
  images = images.filter(img => img && typeof img === 'string' && img.trim().length > 0);
  
  // If no valid images, use placeholder
  if (images.length === 0) {
    console.warn('⚠️ No valid images found, using placeholder');
    const placeholder = propertyUtils?.getPropertyImage ? propertyUtils.getPropertyImage([]) : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23e9e0cf%22 width=%22400%22 height=%22300%22/%3E%3Cpath fill=%22%23d4c5a8%22 d=%22M200 120h-60v60h60v-60zm-40 20h20v20h-20v-20z%22/%3E%3Ctext x=%22200%22 y=%22180%22 text-anchor=%22middle%22 fill=%22%23999%22 font-family=%22Arial%22 font-size=%2216%22%3ENo Image%3C/text%3E%3C/svg%3E';
    images = [placeholder];
  }
  
  console.log('✅ Final images to render:', images);

  // Update main image
  const mainImage = document.getElementById('mainImage');
  if (mainImage) {
    mainImage.src = images[0];
    mainImage.alt = 'Property main view';
  }

  // Update global propertyData
  window.propertyData = { images, currentImageIndex: 0 };

  // Render thumbnails
  const thumbnailGrid = document.getElementById('thumbnailGrid');
  if (!thumbnailGrid) {
    console.warn('⚠️ thumbnailGrid element not found');
    return;
  }

  if (!images || images.length === 0) {
    console.warn('⚠️ No images to render');
    thumbnailGrid.innerHTML = '<div class="text-center text-gray-500 py-4">No images available</div>';
    return;
  }

  console.log(`🎨 Rendering ${images.length} images`);
  
  thumbnailGrid.innerHTML = images
    .slice(0, 5)
    .map(
      (img, index) => `
    <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
      <img src="${img}" alt="Property view ${index + 1}" onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23e9e0cf%22 width=%22400%22 height=%22300%22/%3E%3Cpath fill=%22%23d4c5a8%22 d=%22M200 120h-60v60h60v-60zm-40 20h20v20h-20v-20z%22/%3E%3Ctext x=%22200%22 y=%22180%22 text-anchor=%22middle%22 fill=%22%23999%22 font-family=%22Arial%22 font-size=%2216%22%3ENo Image%3C/text%3E%3C/svg%3E'">
    </div>
  `
    )
    .join('');

  // Initialize gallery controller after rendering
  setTimeout(() => {
    if (window.ImageGallery) {
      console.log('✅ Initializing ImageGallery');
      window.ImageGallery.attachEventListeners();
    } else {
      console.warn('⚠️ ImageGallery not found on window');
    }
  }, 100);
};

/**
 * Render property features
 * @param {Object} property - Property object
 */
const renderFeatures = (property) => {
  const featuresList = document.querySelector('.features-list');
  if (!featuresList) return;

  const features = [];

  if (property.bedrooms) {
    features.push(`${property.bedrooms} bedroom${property.bedrooms !== 1 ? 's' : ''}`);
  }
  if (property.bathrooms) {
    features.push(`${property.bathrooms} bathroom${property.bathrooms !== 1 ? 's' : ''}`);
  }
  if (property.apartmentType) {
    features.push(`Type: ${property.apartmentType}`);
  }
  if (property.totalArea) {
    features.push(`Total area: ${property.totalArea}M²`);
  }

  featuresList.innerHTML = features.map((feature) => `<li>${feature}</li>`).join('');

  // Add description if available
  if (property.description) {
    const description = document.createElement('div');
    description.className = 'property-description mt-4';
    description.innerHTML = `<p class="text-gray-700 leading-relaxed">${property.description}</p>`;
    featuresList.parentElement.appendChild(description);
  }
};

/**
 * Render amenities
 * @param {Array} amenities - Amenities array
 */
const renderAmenities = (amenities) => {
  const amenitiesList = document.querySelector('.amenities-list');
  if (!amenitiesList) return;

  if (amenities.length === 0) {
    amenitiesList.innerHTML = '<li>No amenities listed</li>';
    return;
  }

  amenitiesList.innerHTML = amenities.map((amenity) => `<li>${amenity}</li>`).join('');
};

/**
 * Render rent details
 * @param {Object} property - Property object
 */
const renderRentDetails = (property) => {
  const detailsList = document.getElementById('rent-details-list') || document.querySelector('.details-list');
  if (!detailsList) {
    console.warn('⚠️ rent-details-list not found');
    return;
  }

  console.log('💰 Rendering rent details for price:', property.price);

  // Ensure price is a number
  const monthlyPrice = property.price ? parseFloat(property.price) : 0;
  const yearlyPrice = monthlyPrice * 12;

  const priceFormatted = monthlyPrice > 0 ? `₦${monthlyPrice.toLocaleString('en-NG')}` : 'Price on request';
  const yearlyPriceFormatted = monthlyPrice > 0 ? `₦${yearlyPrice.toLocaleString('en-NG')}` : 'N/A';

  detailsList.innerHTML = `
    <li><strong>Monthly rent:</strong> ${priceFormatted}</li>
    <li><strong>Yearly rent:</strong> ${yearlyPriceFormatted}</li>
    ${property.totalArea ? `<li><strong>Total area:</strong> ${property.totalArea}M²</li>` : ''}
    ${property.apartmentType ? `<li><strong>Type:</strong> ${property.apartmentType}</li>` : ''}
    ${property.bedrooms ? `<li><strong>Bedrooms:</strong> ${property.bedrooms}</li>` : ''}
    ${property.bathrooms ? `<li><strong>Bathrooms:</strong> ${property.bathrooms}</li>` : ''}
  `;
  
  console.log('✅ Rent details rendered:', { monthlyPrice, yearlyPrice, priceFormatted, yearlyPriceFormatted });
};

/**
 * Render location
 * @param {string} location - Property location
 */
const renderLocation = (location) => {
  const locationText = document.getElementById('property-location') || document.querySelector('.location-text');
  if (locationText) {
    if (location) {
      locationText.textContent = location;
    } else {
      locationText.textContent = 'Location not specified';
    }
  }
};

/**
 * Render availability
 * @param {Object} property - Property object
 */
const renderAvailability = (property) => {
  const availabilityText = document.getElementById('property-availability') || document.querySelector('.availability-text');
  if (availabilityText) {
    if (property.availableFrom) {
      const date = new Date(property.availableFrom);
      availabilityText.textContent = `Available from ${date.toLocaleDateString()}`;
    } else if (property.isAvailable !== false) {
      availabilityText.textContent = 'Available now';
    } else {
      availabilityText.textContent = 'Not available';
    }
  }
};

/**
 * Render agent information
 * @param {Object} owner - Owner/agent object
 */
const renderAgentInfo = (owner) => {
  const agentSection = document.getElementById('agent-info-list');
  if (!agentSection) return;

  if (owner) {
    agentSection.innerHTML = `
      ${owner.fullName ? `<li>Owner: ${owner.fullName}</li>` : '<li>Owner: Not specified</li>'}
      ${owner.email ? `<li>Email: <a href="mailto:${owner.email}">${owner.email}</a></li>` : ''}
      ${owner.phone ? `<li>Phone: <a href="tel:${owner.phone}">${owner.phone}</a></li>` : ''}
    `;
  } else {
    agentSection.innerHTML = '<li>Agent information not available</li>';
  }
};

/**
 * Render agent phone number link
 * @param {Object} owner - Owner/agent object
 * @param {Object} property - Property object (to get contactPhone)
 */
const renderAgentPhone = (owner, property) => {
  const agentPhoneLink = document.getElementById('agent-phone-link');
  if (!agentPhoneLink) {
    console.warn('⚠️ agent-phone-link element not found');
    return;
  }

  console.log('📞 Rendering agent phone for owner:', owner);
  console.log('📞 Property contactPhone:', property?.contactPhone);

  // Priority: property.contactPhone > owner.phone > owner.phoneNumber
  const phone = property?.contactPhone || owner?.phone || owner?.phoneNumber || null;

  if (phone) {
    console.log('✅ Phone found:', phone);
    agentPhoneLink.textContent = phone;
    agentPhoneLink.href = `tel:${phone}`;
    agentPhoneLink.style.pointerEvents = 'auto';
    agentPhoneLink.style.color = '';
    agentPhoneLink.style.cursor = 'pointer';
  } else {
    console.warn('⚠️ No phone number found');
    agentPhoneLink.textContent = 'Phone not available';
    agentPhoneLink.href = '#';
    agentPhoneLink.style.pointerEvents = 'none';
    agentPhoneLink.style.color = '#999';
    agentPhoneLink.style.cursor = 'not-allowed';
  }
};

/**
 * Setup contact button
 * @param {Object} property - Property object
 */
const setupContactButton = (property) => {
  const contactBtn = document.getElementById('contactBtn');
  if (contactBtn && property.owner) {
    // Remove existing listeners by cloning
    const newBtn = contactBtn.cloneNode(true);
    contactBtn.parentNode.replaceChild(newBtn, contactBtn);
    
    newBtn.addEventListener('click', () => {
      if (property.owner.email) {
        window.location.href = `mailto:${property.owner.email}?subject=Inquiry about ${property.title || 'Property'}`;
      } else if (property.owner.phone) {
        window.location.href = `tel:${property.owner.phone}`;
      } else {
        if (typeof toast !== 'undefined') {
          toast.info('Contact information not available');
        } else {
          alert('Contact information not available');
        }
      }
    });
  }
};

/**
 * Show error message
 * @param {string} message - Error message
 */
const showError = (message) => {
  const container = document.querySelector('.property-container');
  if (container) {
    container.innerHTML = `
      <div class="text-center py-20">
        <div class="error-icon mb-4">
          <svg class="w-24 h-24 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Error</h2>
        <p class="text-gray-600 mb-6">${message}</p>
        <a href="./home.html" class="inline-block px-6 py-3 bg-[#223448] text-white rounded-full hover:bg-[#1a2838] transition">
          Back to Listings
        </a>
      </div>
    `;
  }

  if (toast) {
    toast.error(message);
  }
};

/**
 * Show 404 error
 */
const show404Error = () => {
  const container = document.querySelector('.property-container');
  if (container) {
    container.innerHTML = `
      <div class="text-center py-20">
        <div class="error-icon mb-4">
          <svg class="w-24 h-24 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Property Not Found</h2>
        <p class="text-gray-600 mb-6">The property you're looking for doesn't exist or has been removed.</p>
        <a href="./home.html" class="inline-block px-6 py-3 bg-[#223448] text-white rounded-full hover:bg-[#1a2838] transition">
          Back to Listings
        </a>
      </div>
    `;
  }
};

// Update existing ImageGallery to use propertyData from window
if (typeof window !== 'undefined') {
  window.loadPropertyDetails = loadPropertyDetails;
}
