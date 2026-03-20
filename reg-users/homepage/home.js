const filterOptions = {
  "Property type": [
    "Apartment / Flat",
    "House",
    "Condo",
    "Studio apartment",
    "Duplexes",
    "Serviced apartment",
    "Shared apartment",
    "self-contained rooms",
  ],
  "Rent Price, Yearly, N": [
    "100 - 200k",
    "200k - 400k",
    "400k - 600k",
    "600k - 1M",
    "1M - 2M",
    "2M - 5M",
    "5M and above",
  ],
  Agent: ["Show all", "Verified agent", "Unverified agent"],
  Amenities: [
    "Swimming Pool",
    "Gym",
    "Air Conditioning",
    "PParking space",
    "Garden",
    "Elevator",
    "Security",
    "Balcony",
    "Furnished",
    "Pet Friendly",
  ],
  Bathrooms: ["1", "2", "3", "4", "5+"],
  Bedrooms: ["Studio", "1", "2", "3", "4", "5+"],
  Furnishing: ["Fully Furnished", "Semi Furnished", "Unfurnished"],
};

// Make selectedFilters globally accessible
window.selectedFilters = {};
let selectedFilters = window.selectedFilters;

function initializeFilters() {
  Object.keys(filterOptions).forEach((category) => {
    selectedFilters[category] = [];
  });
}

function createFilterSection(category, options) {
  const section = document.createElement("div");
  section.className = "filter-section";

  const header = document.createElement("button");
  header.className = "section-header";
  header.innerHTML = `
                <span>${category}</span>
                <svg class="section-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>         
            `;

  const content = document.createElement("div");
  content.className = "section-content";

  options.forEach((option) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "checkbox-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `${category}-${option}`;
    checkbox.value = option;

    const label = document.createElement("label");
    label.htmlFor = `${category}-${option}`;
    label.textContent = option;

    checkbox.addEventListener("change", (e) => {
      handleCheckboxChange(category, option, e.target.checked);
    });

    optionDiv.appendChild(checkbox);
    optionDiv.appendChild(label);
    optionDiv.addEventListener("click", (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        handleCheckboxChange(category, option, checkbox.checked);
      }
    });

    content.appendChild(optionDiv);
  });
  header.addEventListener("click", () => {
    header.classList.toggle("active");
    content.classList.toggle("active");
  });

  section.appendChild(header);
  section.appendChild(content);

  return section;
}

function handleCheckboxChange(category, option, isChecked) {
  if (isChecked) {
    if (!selectedFilters[category].includes(option)) {
      selectedFilters[category].push(option);
    }
  } else {
    selectedFilters[category] = selectedFilters[category].filter(
      (item) => item !== option,
    );
  }
  updateFilterCount();
}

function updateFilterCount() {
  const count = Object.values(selectedFilters).flat().length;
  const filterCountDiv = document.getElementById("filterCount");
  const countBadge = document.getElementById("countBadge");

  // Only update if elements exist
  if (filterCountDiv && countBadge) {
    countBadge.textContent = count;

    if (count > 0) {
      filterCountDiv.classList.add("active");
    } else {
      filterCountDiv.classList.remove("active");
    }
  }
}

function resetSidebarFilters() {
  const checkboxes = document.querySelectorAll('#filterSections input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });

  Object.keys(selectedFilters).forEach((category) => {
    selectedFilters[category] = [];
  });

  updateFilterCount();
  
  // Use the resetFilters function from homepageProperties if available
  if (typeof window !== 'undefined' && window.homepageProperties && window.homepageProperties.resetFilters) {
    window.homepageProperties.resetFilters();
  }
}

function applyFilters() {
  console.log("Applied filters:", selectedFilters);

  // Use the performSearch function from homepageProperties if available
  if (typeof window !== 'undefined' && window.homepageProperties && window.homepageProperties.performSearch) {
    window.homepageProperties.performSearch();
  } else if (typeof performSearch === 'function') {
    performSearch();
  } else {
    // Fallback: show filter summary
    const filterSummary = Object.entries(selectedFilters)
      .filter(([_, values]) => values.length > 0)
      .map(([category, values]) => `${category}: ${values.join(", ")}`)
      .join("\n");

    if (filterSummary) {
      if (toast) {
        toast.info("Filters applied: " + filterSummary);
      } else {
        alert("Filters applied!\n\n" + filterSummary);
      }
    } else {
      if (toast) {
        toast.warning("No filters selected");
      } else {
        alert("No filters selected");
      }
    }
  }
}
function init() {
  console.log('Initializing sidebar filters...');
  
  initializeFilters();

  const sectionsContainer = document.getElementById("filterSections");
  if (!sectionsContainer) {
    console.warn('Filter sections container not found');
    return;
  }

  // Clear any existing content
  sectionsContainer.innerHTML = '';

  // Create filter sections
  Object.entries(filterOptions).forEach(([category, options]) => {
    const section = createFilterSection(category, options);
    sectionsContainer.appendChild(section);
  });
  
  console.log('Sidebar filters initialized:', Object.keys(filterOptions).length, 'categories');

  // Setup filter buttons - use existing handlers but integrate with API
  const resetBtn = document.getElementById("resetBtn");
  const filterBtn = document.getElementById("filterBtn");
  
  if (resetBtn) {
    // Remove existing listeners to avoid conflicts
    const newResetBtn = resetBtn.cloneNode(true);
    resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
    
    newResetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetSidebarFilters();
    });
  }
  
  if (filterBtn) {
    // Remove existing listeners to avoid conflicts
    const newFilterBtn = filterBtn.cloneNode(true);
    filterBtn.parentNode.replaceChild(newFilterBtn, filterBtn);
    
    newFilterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      applyFilters();
    });
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
