// controls.js
// Handles keyboard and touch controls

export function setupControls(state, onDirectionChange) {
  // Keyboard controls
  window.onkeydown = (e) => {
    switch (e.key) {
      case 'ArrowUp': case 'w': onDirectionChange('up'); break;
      case 'ArrowDown': case 's': onDirectionChange('down'); break;
      case 'ArrowLeft': case 'a': onDirectionChange('left'); break;
      case 'ArrowRight': case 'd': onDirectionChange('right'); break;
    }
  };

  // ============================================
  // Mobile D-Pad Button Controls
  // ============================================
  const dpadButtons = document.querySelectorAll('.dpad-btn');
  
  dpadButtons.forEach(btn => {
    const direction = btn.getAttribute('data-direction');
    
    // Handle touch
    const handleTouch = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onDirectionChange(direction);
      
      // Visual feedback
      btn.classList.add('active');
      setTimeout(() => btn.classList.remove('active'), 150);
    };
    
    // Touch events
    btn.addEventListener('touchstart', handleTouch, { passive: false });
    
    // Mouse events for desktop testing
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleTouch(e);
    });
    
    // Prevent context menu on right-click
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  // ============================================
  // Swipe Controls (with aggressive prevention)
  // ============================================
  let startX, startY;
  let touchStartTime;
  let touchArea = null;

  // CRITICAL: Block iOS/touch gestures at the document level
  // This must be done with passive: false to allow preventDefault
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      touchStartTime = Date.now();
      touchArea = e.target.closest('#game-canvas') || e.target.closest('#game-container') || document.body;
    }
    // Prevent ALL default touch behavior including iOS swipe-to-close
    if (!e.target.closest('button') && !e.target.closest('input') && !e.target.closest('select') && !e.target.closest('.dpad-btn')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false, capture: true });

  document.addEventListener('touchmove', (e) => {
    // Block ALL touch move behavior - prevents iOS swipe gestures
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false, capture: true });

  document.addEventListener('touchend', (e) => {
    // Prevent default on ALL touchend
    e.preventDefault();
    e.stopPropagation();
    
    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX;
      const dy = endY - startY;
      const touchDuration = Date.now() - touchStartTime;

      // Only register swipe if it's quick (not a long press)
      if (touchDuration < 500) {
        // Check if swipe is mostly horizontal or vertical
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (Math.abs(dx) > 30) {
            onDirectionChange(dx > 0 ? 'right' : 'left');
          }
        } else {
          // Vertical swipe
          if (Math.abs(dy) > 30) {
            onDirectionChange(dy > 0 ? 'down' : 'up');
          }
        }
      }
    }
  }, { passive: false, capture: true });

  // Also block wheel/scroll events
  document.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false, capture: true });
}

export function handleInput() {
  // Reserved for future expansion (buttons, etc)
}
