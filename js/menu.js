/**
 * Mobile Menu Component
 * Handles mobile menu toggle functionality
 */
class MobileMenu {
  constructor(toggleButton, menuOverlay) {
    if (!toggleButton || !menuOverlay) {
      console.warn('MobileMenu: Required elements not found');
      return;
    }
    
    this.toggleButton = toggleButton;
    this.menuOverlay = menuOverlay;
    this.isOpen = false;
    
    this.init();
  }
  
  init() {
    // Add click event listener to toggle button
    this.toggleButton.addEventListener('click', () => this.toggle());
    
    // Add keyboard event listener for ESC key and focus trap
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Use event delegation for menu links (more efficient than individual listeners)
    this.menuOverlay.addEventListener('click', (e) => {
      if (e.target.classList.contains('menu-link')) {
        this.close();
      }
    });
    
    // Add focus trap for keyboard navigation
    this.menuOverlay.addEventListener('keydown', (e) => this.handleFocusTrap(e));
  }
  
  handleFocusTrap(event) {
    if (!this.isOpen) return;
    
    // Get all focusable elements in the menu
    const focusableElements = this.menuOverlay.querySelectorAll('.menu-link');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Handle Tab key
    if (event.key === 'Tab') {
      // Shift + Tab (backwards)
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab (forwards)
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
  
  open() {
    this.isOpen = true;
    this.menuOverlay.setAttribute('aria-hidden', 'false');
    this.toggleButton.setAttribute('aria-expanded', 'true');
    this.toggleButton.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';
    
    // Focus first menu link for keyboard navigation
    setTimeout(() => {
      const firstLink = this.menuOverlay.querySelector('.menu-link');
      if (firstLink) {
        firstLink.focus();
      }
    }, 100); // Small delay to allow animation to start
  }
  
  close() {
    this.isOpen = false;
    this.menuOverlay.setAttribute('aria-hidden', 'true');
    this.toggleButton.setAttribute('aria-expanded', 'false');
    this.toggleButton.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
    
    // Return focus to toggle button for keyboard navigation
    this.toggleButton.focus();
  }
  
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  handleKeyboard(event) {
    try {
      if (event.key === 'Escape' && this.isOpen) {
        this.close();
      }
    } catch (error) {
      console.error('MobileMenu keyboard handler error:', error);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MobileMenu };
}
