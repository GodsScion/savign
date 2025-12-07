/**
 * Main Application Entry Point
 * Initializes all components when DOM is ready
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  try {
    // Initialize Mobile Menu
    const toggleButton = document.querySelector('.menu-toggle');
    const menuOverlay = document.querySelector('.menu-overlay');
    
    if (toggleButton && menuOverlay) {
      new MobileMenu(toggleButton, menuOverlay);
    }
    
    // Initialize Scroll Reveal
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
      new ScrollReveal(revealElements);
    }
    
    // Initialize Touch Handler for mobile devices
    new TouchHandler();
    
    // Smooth scroll for anchor links
    initializeSmoothScroll();
    
    console.log('SAVIGN website initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Skip if href is just "#"
      if (href === '#') {
        e.preventDefault();
        return;
      }
      
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        e.preventDefault();
        
        // Calculate offset for fixed header
        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
        const targetPosition = targetElement.offsetTop - headerHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/**
 * Debounce utility function
 * Limits the rate at which a function can fire
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 100) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle utility function
 * Ensures function is called at most once per specified time period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 100) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Handle window resize events with debouncing
 * Prevents excessive function calls during resize
 */
const handleResize = debounce(() => {
  // Dispatch custom event for components to listen to
  window.dispatchEvent(new CustomEvent('optimizedResize'));
}, 150);

// Add debounced resize listener
window.addEventListener('resize', handleResize, { passive: true });

/**
 * Handle scroll events with throttling
 * Improves performance for scroll-based interactions
 */
const handleScroll = throttle(() => {
  // Dispatch custom event for components to listen to
  window.dispatchEvent(new CustomEvent('optimizedScroll'));
}, 100);

// Add throttled scroll listener
window.addEventListener('scroll', handleScroll, { passive: true });

// Export utilities if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debounce, throttle };
}
