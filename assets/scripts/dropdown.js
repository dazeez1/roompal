const dropdownBtn = document.querySelector(".dropdwon-btn");
const dropdownMenu = document.querySelector("#dropdown-menu");
const dropdownList = document.querySelectorAll(".li");

dropdownBtn.addEventListener("click", () => {
  dropdownMenu.classList.toggle(".show");
});

dropdownList.forEach((dropdownList) => {
  dropdownList.addEventListener("click"),
    () => {
      dropdownBtn.textContent = dropdownList.textContent;
      dropdownMenu.classList.remove("show");
    };
});

dropdownList.addEventListener("click", () => {
  dropdownBtn.textContent = dropdownList.textContent;
  dropdownMenu.classList.remove("show");
});

document.addEventListener("click", (e) => {
  if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.remove("show");
  }
});
