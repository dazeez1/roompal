/**
 * Protected Pages Initialization
 * Add this script to all protected pages (reg-users/, admin/)
 * It will automatically check authentication and redirect if needed
 */

// Load required scripts first
const scripts = [
  '../../assets/scripts/api.js',
  '../../assets/scripts/authGuard.js',
];

let loadedScripts = 0;

scripts.forEach((src) => {
  const script = document.createElement('script');
  script.src = src;
  script.onload = () => {
    loadedScripts++;
    if (loadedScripts === scripts.length) {
      // All scripts loaded, initialize auth guard
      if (window.authGuard) {
        window.authGuard.initAuthGuard();
      }
    }
  };
  script.onerror = () => {
    console.error(`Failed to load script: ${src}`);
  };
  document.head.appendChild(script);
});
