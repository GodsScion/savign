/**
 * Scroll Reveal Component
 * Handles scroll-based animations using Intersection Observer
 * Uses optimized scroll events for performance
 */
class ScrollReveal {
  constructor(elements, options = {}) {
    // Check for Intersection Observer support
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, showing all elements immediately');
      // Fallback: show all elements immediately
      if (elements) {
        elements.forEach(el => el.classList.add('active'));
      }
      return;
    }
    
    this.elements = elements || document.querySelectorAll('.reveal');
    this.options = {
      threshold: options.threshold || 0.15,
      rootMargin: options.rootMargin || '0px 0px -50px 0px',
      ...options
    };
    
    this.init();
  }
  
  init() {
    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      this.options
    );
    
    // Observe all elements
    this.elements.forEach(element => {
      this.observer.observe(element);
    });
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.animateIn(entry.target);
      }
    });
  }
  
  animateIn(element) {
    try {
      element.classList.add('active');
      // Optionally unobserve after animation
      // this.observer.unobserve(element);
    } catch (error) {
      console.error('ScrollReveal animateIn error:', error);
    }
  }
  
  animateOut(element) {
    try {
      element.classList.remove('active');
    } catch (error) {
      console.error('ScrollReveal animateOut error:', error);
    }
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScrollReveal };
}
