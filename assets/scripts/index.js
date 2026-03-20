"use strict";
// nav dropdown
const dropdownBox = document.getElementById("myDropdown");
const dropdownBtn = document.querySelector(".dropdown-btn");
const dropdownContent = document.querySelector(".dropdown-content");
const dropdownItems = document.querySelectorAll("a");
const track = document.querySelector(".review-track");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");

// dropdown in navbar
dropdownBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdownBox.classList.toggle("active");
});

document.addEventListener("click", function () {
  dropdownBox.classList.remove("active");
});

// Mobile menu toggle
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

mobileMenuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
});

// Mobile dropdown toggle
const mobileDropdownBtn = document.getElementById("mobile-dropdown-btn");
const mobileDropdownMenu = document.getElementById("mobile-dropdown-menu");

mobileDropdownBtn.addEventListener("click", () => {
  mobileDropdownMenu.classList.toggle("hidden");
});

// Faq
const faqQuestions = document.querySelectorAll(".faq-question");
const questions = document.querySelectorAll(".faq-question");

questions.forEach((question) => {
  question.addEventListener("click", () => {
    const answer = question.nextElementSibling;
    const icon = question.querySelector(".faq-icon");

    if (answer.style.maxHeight) {
      answer.style.maxHeight = null;
      icon.style.transform = "rotate(0deg)";
    } else {
      document.querySelectorAll(".faq-answer").forEach((a) => {
        a.style.maxHeight = null;
        a.previousElementSibling.querySelector(".faq-icon").style.transform =
          "rotate(0deg)";
      });

      answer.style.maxHeight = answer.scrollHeight + "px";
      icon.style.transform = "rotate(180deg)";
    }
  });
});

// carousel
// nextBtn.addEventListener("click", () => {
//   document.documentElement.style.setProperty("--dir", "1");
//   restartAnimation();
// });

// // Change Direction to Left
// prevBtn.addEventListener("click", () => {
//   document.documentElement.style.setProperty("-1");
//   restartAnimation();
// });

function restartAnimation() {
  track.style.animation = "none";
  track.offsetHeight;
  track.style.animation = null;
}
