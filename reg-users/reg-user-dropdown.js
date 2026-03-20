const menuToggle = document.querySelector(".menu-toggle");
const dropdown = document.querySelector(".nav-dropdown");
const backBtn = document.querySelector(".back-btn");

// Toggle dropdown
menuToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.classList.toggle("show");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target) && !menuToggle.contains(e.target)) {
    dropdown.classList.remove("show");
  }
});

// Close dropdown when clicking a link
document.querySelectorAll(".dropdown-links a").forEach((link) => {
  link.addEventListener("click", () => {
    dropdown.classList.remove("show");
  });
});

// Back button functionality
backBtn.addEventListener("click", () => {
  window.history.back();
});
