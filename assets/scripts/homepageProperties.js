/**
 * Homepage Properties Handler
 * Handles property listing and filtering on homepage
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check if API is available
  if (typeof api === 'undefined') {
    console.error('API helper not loaded');
    return;
  }

  // Initialize property listings
  await initHomepageProperties();

  // Setup search/filter functionality
  setupSearchFilters();
});

/**
 * Initialize homepage properties
 */
const initHomepageProperties = async () => {
  console.log('Initializing homepage properties...');
  
  // Find property container
  let propertyContainer = document.getElementById('property-listings') ||
                         document.querySelector('.apartment-frame') ||
                         document.querySelector('.apartment-section .grid');

  if (!propertyContainer) {
    // Try to find by looking for property cards
    const sections = document.querySelectorAll('section');
    for (const section of sections) {
      if (section.querySelector('.explore-box') || section.querySelector('.explore-prop')) {
        propertyContainer = section;
        break;
      }
    }
  }

  if (!propertyContainer) {
    console.error('Property container not found on homepage');
    return;
  }
  
  console.log('Property container found:', propertyContainer.id || propertyContainer.className);
  
  // Clear any existing static content
  propertyContainer.innerHTML = '';

  // Get initial filters - only use if they have actual values
  const rawFilters = getFiltersFromForm();
  
  // Filter out empty values to show all properties by default
  const filters = {};
  Object.keys(rawFilters).forEach((key) => {
    if (rawFilters[key] !== undefined && rawFilters[key] !== null && rawFilters[key] !== '') {
      filters[key] = rawFilters[key];
    }
  });
  
  console.log('Initial filters (cleaned):', filters);

  // Load properties (page 1, limit 6 for initial load if no filters)
  await loadHomepageProperties(propertyContainer, filters, 1);
};

/**
 * Get filters from search form
 * @returns {Object} - Filter object
 */
const getFiltersFromForm = () => {
  const filters = {};

  // Get location from search form
  const locationSelect = document.getElementById('search-location') ||
                        document.querySelector('.find-container:first-of-type select') ||
                        document.querySelector('select[name="location"]');
  if (locationSelect && locationSelect.value) {
    filters.location = locationSelect.value;
  }

  // Get price range from search form
  const priceSelect = document.getElementById('search-price-range') ||
                      document.querySelector('.find-container:nth-of-type(2) select') ||
                      document.querySelector('select[name="priceRange"]');
  if (priceSelect && priceSelect.value) {
    const priceRange = parsePriceRange(priceSelect.value);
    if (priceRange.min) filters.minPrice = priceRange.min;
    if (priceRange.max) filters.maxPrice = priceRange.max;
  }

  // Get apartment type from search form
  const typeSelect = document.getElementById('search-apartment-type') ||
                    document.querySelector('.find-container:nth-of-type(3) select') ||
                    document.querySelector('select[name="apartmentType"]');
  if (typeSelect && typeSelect.value) {
    filters.apartmentType = typeSelect.value;
  }

  // Get filters from sidebar (if available)
  const sidebarFilters = getSidebarFilters();
  Object.assign(filters, sidebarFilters);

  return filters;
};

/**
 * Get filters from sidebar checkboxes
 * @returns {Object} - Filter object from sidebar
 */
const getSidebarFilters = () => {
  const filters = {};

  // Get selected filters from sidebar (check window.selectedFilters first, then global)
  const sidebarSelectedFilters = (typeof window !== 'undefined' && window.selectedFilters) 
    ? window.selectedFilters 
    : (typeof selectedFilters !== 'undefined' ? selectedFilters : null);
  
  if (sidebarSelectedFilters && typeof sidebarSelectedFilters === 'object' && Object.keys(sidebarSelectedFilters).length > 0) {
    // Property type (apartmentType)
    if (sidebarSelectedFilters['Property type'] && sidebarSelectedFilters['Property type'].length > 0) {
      // Map to backend enum values
      const typeMap = {
        'Apartment / Flat': 'Apartments / Flats',
        'Duplexes': 'Duplexes',
        'Serviced apartment': 'Serviced Apartments',
        'Shared apartment': 'Shared Apartments',
        'self-contained rooms': 'Self-contained rooms',
      };
      const selectedType = sidebarSelectedFilters['Property type'][0];
      filters.apartmentType = typeMap[selectedType] || selectedType;
    }

    // Bedrooms
    if (sidebarSelectedFilters['Bedrooms'] && sidebarSelectedFilters['Bedrooms'].length > 0) {
      const bedrooms = sidebarSelectedFilters['Bedrooms'][0];
      if (bedrooms === 'Studio') {
        filters.bedrooms = 0;
      } else if (bedrooms === '5+') {
        filters.bedrooms = 5;
      } else {
        filters.bedrooms = parseInt(bedrooms);
      }
    }

    // Bathrooms
    if (sidebarSelectedFilters['Bathrooms'] && sidebarSelectedFilters['Bathrooms'].length > 0) {
      const bathrooms = sidebarSelectedFilters['Bathrooms'][0];
      if (bathrooms === '5+') {
        filters.bathrooms = 5;
      } else {
        filters.bathrooms = parseInt(bathrooms);
      }
    }

    // Rent Price (if not already set from search form)
    if (!filters.minPrice && !filters.maxPrice && sidebarSelectedFilters['Rent Price, Yearly, N'] && sidebarSelectedFilters['Rent Price, Yearly, N'].length > 0) {
      const priceRange = parsePriceRange(sidebarSelectedFilters['Rent Price, Yearly, N'][0]);
      if (priceRange.min) filters.minPrice = priceRange.min;
      if (priceRange.max) filters.maxPrice = priceRange.max;
    }
  }

  return filters;
};

/**
 * Parse price range string to min/max
 * @param {string} range - Price range string (e.g., "200k - 400k", "100 - 200k", "5M and above")
 * @returns {Object} - {min, max}
 */
const parsePriceRange = (range) => {
  const result = { min: null, max: null };

  if (!range) return result;

  // Handle "and above" format first
  if (range.toLowerCase().includes('above')) {
    const cleanRange = range.toLowerCase().replace(/\s/g, '').replace('andabove', '').replace('above', '');
    result.min = convertPriceToNumber(cleanRange);
    return result;
  }

  // Handle range with dash (e.g., "200k - 400k" or "100 - 200k")
  if (range.includes('-')) {
    const parts = range.split('-').map(part => part.trim());
    result.min = convertPriceToNumber(parts[0]);
    result.max = convertPriceToNumber(parts[1]);
  } else {
    // Single value
    const num = convertPriceToNumber(range);
    if (num) {
      result.min = num;
    }
  }

  return result;
};

/**
 * Convert price string to number
 * @param {string} priceStr - Price string (e.g., "200k", "1M", "100")
 * @returns {number} - Price number
 */
const convertPriceToNumber = (priceStr) => {
  if (!priceStr) return null;

  const clean = priceStr.trim().toLowerCase();
  
  // Extract number part
  const numMatch = clean.match(/[\d.]+/);
  if (!numMatch) return null;
  
  const num = parseFloat(numMatch[0]);
  if (isNaN(num)) return null;

  // Check for multiplier
  if (clean.includes('m')) {
    return num * 1000000;
  } else if (clean.includes('k')) {
    return num * 1000;
  }

  // If no multiplier and number is small (< 1000), assume it's in thousands (e.g., "100" means "100k")
  // This handles cases like "100 - 200k" where "100" should be treated as "100k"
  if (num < 1000 && !clean.includes('m')) {
    return num * 1000;
  }

  // Otherwise, assume it's already in the base unit (naira)
  return num;
};

// Track current page and filters for pagination
let currentPage = 1;
let currentFilters = {};

/**
 * Load properties for homepage
 * @param {HTMLElement} container - Container element
 * @param {Object} filters - Filter object
 * @param {number} page - Page number (default: 1)
 * @param {boolean} showSpinner - Whether to show spinner (true) or skeletons (false)
 */
const loadHomepageProperties = async (container, filters = {}, page = 1, showSpinner = false) => {
  try {
    // Store current filters and page
    currentFilters = filters;
    currentPage = page;

    // Show loading state (spinner for search/filter, skeletons for initial load)
    if (propertyUtils && propertyUtils.renderLoadingState) {
      container.innerHTML = propertyUtils.renderLoadingState(6, showSpinner);
    } else {
      container.innerHTML = '<div class="text-center py-10">Loading properties...</div>';
    }

    // Determine limit: Use consistent limit for pagination
    // No filters: 6 per page (shows 6 on first page as requested)
    // With filters: 12 per page
    const hasFilters = Object.keys(filters).length > 0;
    const limit = hasFilters ? 12 : 6;

    // Fetch properties
    console.log('Fetching properties with filters:', { ...filters, page, limit });
    const response = await api.properties.getAll({ ...filters, page, limit });
    console.log('API response:', response);

    if (response.success && response.data) {
      const properties = response.data.properties || [];
      const pagination = response.data.pagination || {};

      if (properties.length > 0) {
        renderHomepageProperties(container, properties);
        
        // Render pagination if available and more than one page
        if (pagination.totalPages > 1) {
          renderPagination(container, pagination, filters);
        } else {
          // Remove any existing pagination
          const existingPagination = container.parentElement.querySelector('.pagination-container');
          if (existingPagination) {
            existingPagination.remove();
          }
        }
      } else {
        // Show empty state
        if (propertyUtils && propertyUtils.renderEmptyState) {
          container.innerHTML = propertyUtils.renderEmptyState('No properties found matching your search criteria.');
        } else {
          container.innerHTML = '<div class="text-center py-10 text-gray-500">No properties found.</div>';
        }
        
        // Remove pagination if exists
        const existingPagination = container.parentElement.querySelector('.pagination-container');
        if (existingPagination) {
          existingPagination.remove();
        }
      }
    } else {
      throw new Error('Failed to load properties');
    }
  } catch (error) {
    console.error('Error loading properties:', error);
    container.innerHTML = `
      <div class="text-center py-10">
        <p class="text-red-500 mb-4">Failed to load properties. Please try again later.</p>
        <button onclick="location.reload()" class="px-4 py-2 bg-[#223448] text-white rounded-full">
          Retry
        </button>
      </div>
    `;

    if (toast) {
      toast.error('Failed to load properties');
    }
  }
};

/**
 * Render properties on homepage
 * @param {HTMLElement} container - Container element
 * @param {Array} properties - Properties array
 */
const renderHomepageProperties = (container, properties) => {
  // Check if we need to replace existing structure
  const existingCards = container.querySelectorAll('.explore-box');
  
  if (existingCards.length > 0) {
    // Replace existing cards
    existingCards.forEach((card, index) => {
      if (properties[index]) {
        const newCard = createHomepagePropertyCard(properties[index]);
        card.outerHTML = newCard;
      } else {
        card.remove();
      }
    });

    // Add remaining properties
    if (properties.length > existingCards.length) {
      const remaining = properties.slice(existingCards.length);
      remaining.forEach((property) => {
        const card = createHomepagePropertyCard(property);
        container.insertAdjacentHTML('beforeend', card);
      });
    }
  } else {
    // Create new structure
    container.innerHTML = properties
      .map((property) => createHomepagePropertyCard(property))
      .join('');
  }
};

/**
 * Create homepage property card HTML
 * @param {Object} property - Property object
 * @returns {string} - Property card HTML
 */
const createHomepagePropertyCard = (property) => {
  const imageUrl = propertyUtils?.getPropertyImage(property.images);
  const price = propertyUtils?.formatPrice(property.price) || 'Price on request';
  const propertyId = property._id || property.id;

  return `
    <div class="explore-box">
      <div class="display-img">
        <img 
          src="${imageUrl}" 
          alt="${property.title || 'Property'}"
          onerror="this.onerror=null;this.src=propertyUtils?.getPropertyImage?.([])||'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20fill%3D%22%23e9e0cf%22%20width%3D%22400%22%20height%3D%22300%22/%3E%3Cpath%20fill%3D%22%23d4c5a8%22%20d%3D%22M200%20120h-60v60h60v-60zm-40%2020h20v20h-20v-20z%22/%3E%3Ctext%20x%3D%22200%22%20y%3D%22180%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999%22%20font-family%3D%22Arial%22%20font-size%3D%2216%22%3ENo%20Image%3C/text%3E%3C/svg%3E'"
        />
      </div>
      <div class="explore-prop">
        <div class="explore-property-text">
          <h2>${price}</h2>
          ${property.totalArea ? `<p>total area: ${property.totalArea}M²</p>` : ''}
        </div>
        <p class="house-ad">
          <img class="w-4 h-3.5" src="../images/Vector-(7).png" alt="Location" />
          ${property.location || 'Location not specified'}
        </p>
        <div class="bedroom-qty">
          ${property.bedrooms ? `
            <p class="flex items-center gap-2">
              <img src="../images/Vector-(8).png" alt="Bedrooms" />
              ${property.bedrooms} bedroom${property.bedrooms !== 1 ? 's' : ''}
            </p>
          ` : ''}
          ${property.bathrooms ? `
            <p class="flex items-center gap-2">
              <img src="../images/Vector-(9).png" alt="Bathrooms" />
              ${property.bathrooms} bathroom${property.bathrooms !== 1 ? 's' : ''}
            </p>
          ` : ''}
        </div>
        <div class="agent-info">
          <a 
            target="_blank"
            href="property-details.html?id=${propertyId}"
          >
            <img src="../images/message.png" alt="" />Message agent
          </a>
          <a 
            target="_blank"
            href="property-details.html?id=${propertyId}"
          >
            View more details
          </a>
        </div>
      </div>
    </div>
  `;
};

/**
 * Render pagination controls
 * @param {HTMLElement} container - Container element
 * @param {Object} pagination - Pagination object
 * @param {Object} filters - Current filters
 */
const renderPagination = (container, pagination, filters) => {
  // Remove existing pagination
  const existingPagination = container.parentElement.querySelector('.pagination-container');
  if (existingPagination) {
    existingPagination.remove();
  }

  const paginationContainer = document.createElement('div');
  paginationContainer.className = 'pagination-container w-full flex justify-center items-center gap-4 mt-8 mb-8';
  paginationContainer.innerHTML = `
    <button 
      class="pagination-btn px-6 py-2 rounded-full transition ${!pagination.hasPrevPage ? 'opacity-50 cursor-not-allowed bg-gray-300' : 'bg-[#223448] text-white hover:bg-[#1a2838]'}"
      ${!pagination.hasPrevPage ? 'disabled' : ''}
      onclick="goToHomepagePage(${pagination.currentPage - 1})"
    >
      ← Previous
    </button>
    <span class="text-gray-600 font-medium">
      Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalProperties} properties)
    </span>
    <button 
      class="pagination-btn px-6 py-2 rounded-full transition ${!pagination.hasNextPage ? 'opacity-50 cursor-not-allowed bg-gray-300' : 'bg-[#223448] text-white hover:bg-[#1a2838]'}"
      ${!pagination.hasNextPage ? 'disabled' : ''}
      onclick="goToHomepagePage(${pagination.currentPage + 1})"
    >
      Next →
    </button>
  `;

  // Insert after container
  container.parentNode.insertBefore(paginationContainer, container.nextSibling);
};

/**
 * Go to specific page on homepage
 * @param {number} page - Page number
 */
window.goToHomepagePage = (page) => {
  const container = document.getElementById('property-listings') ||
                   document.querySelector('.apartment-frame') ||
                   document.querySelector('.apartment-section');
  
  if (container) {
    // Use skeletons for pagination (not spinner)
    loadHomepageProperties(container, currentFilters, page, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

/**
 * Setup search/filter functionality
 */
const setupSearchFilters = () => {
  console.log('Setting up search filters...');
  
  // Search button in main search form
  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Search button clicked');
      await performSearch();
    });
  }

  // Filter button in sidebar
  const filterBtn = document.getElementById('filterBtn');
  if (filterBtn) {
    // Remove existing listener if any
    const newFilterBtn = filterBtn.cloneNode(true);
    filterBtn.parentNode.replaceChild(newFilterBtn, filterBtn);
    
    newFilterBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Filter button clicked');
      await performSearch();
    });
  }

  // Reset/Clear button
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    // Remove existing listener if any
    const newResetBtn = resetBtn.cloneNode(true);
    resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
    
    newResetBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Reset button clicked');
      await resetAllFilters();
    });
  }

  // Auto-search on search form change (debounced)
  const filterSelects = document.querySelectorAll('.find-apartment');
  filterSelects.forEach((select) => {
    select.addEventListener('change', () => {
      console.log('Search form changed:', select.name, select.value);
      // Debounce search
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        performSearch();
      }, 500);
    });
  });
};

/**
 * Perform search with current filters
 */
const performSearch = async () => {
  const container = document.getElementById('property-listings') ||
                   document.querySelector('.apartment-frame') ||
                   document.querySelector('.apartment-section');
  
  if (!container) {
    console.error('Container not found for search');
    return;
  }

  const filters = getFiltersFromForm();
  console.log('Performing search with filters:', filters);
  
  // Reset to page 1 when searching (show spinner during search)
  await loadHomepageProperties(container, filters, 1, true);

  // Scroll to results
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Show toast notification
  if (toast) {
    const filterCount = Object.keys(filters).length;
    if (filterCount > 0) {
      toast.success(`Searching with ${filterCount} filter${filterCount > 1 ? 's' : ''}...`);
    }
  }
};

/**
 * Reset all filters (search form + sidebar)
 */
const resetAllFilters = async () => {
  console.log('Resetting all filters...');
  
  // Reset search form selects
  const selects = document.querySelectorAll('.find-apartment');
  selects.forEach((select) => {
    select.selectedIndex = 0;
  });

  // Reset sidebar filters if available
  const sidebarSelectedFilters = window.selectedFilters || (typeof selectedFilters !== 'undefined' ? selectedFilters : null);
  if (sidebarSelectedFilters && typeof sidebarSelectedFilters === 'object') {
    Object.keys(sidebarSelectedFilters).forEach((category) => {
      sidebarSelectedFilters[category] = [];
    });
    
    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('#filterSections input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
    
    // Update filter count if function exists
    if (typeof updateFilterCount === 'function') {
      updateFilterCount();
    }
  }

  const container = document.getElementById('property-listings') ||
                   document.querySelector('.apartment-frame') ||
                   document.querySelector('.apartment-section');
  
  if (container) {
    // Reset to page 1 with no filters (shows first 8, use spinner for reset)
    await loadHomepageProperties(container, {}, 1, true);
    
    if (toast) {
      toast.info('Filters cleared. Showing all properties.');
    }
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.homepageProperties = {
    loadHomepageProperties,
    performSearch,
    resetFilters: resetAllFilters, // Alias for compatibility
    resetAllFilters,
  };
}
