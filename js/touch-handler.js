/**
 * Touch Handler Component
 * Manages touch interactions and provides enhanced touch feedback
 */
class TouchHandler {
  constructor() {
    this.isTouchDevice = this.detectTouchDevice();
    
    if (this.isTouchDevice) {
      this.init();
    }
  }
  
  /**
   * Detect if device supports touch
   * @returns {boolean} True if touch is supported
   */
  detectTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }
  
  /**
   * Initialize touch event handlers
   */
  init() {
    this.addTouchFeedback();
    this.preventDoubleTapZoom();
    console.log('Touch optimizations initialized');
  }
  
  /**
   * Add touch feedback to interactive elements
   * Provides visual feedback on touch start/end
   */
  addTouchFeedback() {
    const interactiveElements = document.querySelectorAll(
      '.menu-toggle, .nav-link, .menu-link, .cta-button, .card-link, .product-card'
    );
    
    interactiveElements.forEach(element => {
      // Add touch start feedback
      element.addEventListener('touchstart', (e) => {
        element.classList.add('touch-active');
      }, { passive: true });
      
      // Remove touch feedback on touch end
      element.addEventListener('touchend', (e) => {
        element.classList.remove('touch-active');
      }, { passive: true });
      
      // Remove touch feedback if touch is cancelled
      element.addEventListener('touchcancel', (e) => {
        element.classList.remove('touch-active');
      }, { passive: true });
    });
  }
  
  /**
   * Prevent double-tap zoom on interactive elements
   * This is handled via CSS touch-action, but we add extra handling for older browsers
   */
  preventDoubleTapZoom() {
    const interactiveElements = document.querySelectorAll(
      '.menu-toggle, .nav-link, .menu-link, .cta-button, .card-link'
    );
    
    interactiveElements.forEach(element => {
      let lastTouchEnd = 0;
      
      element.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, { passive: false });
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TouchHandler };
}
