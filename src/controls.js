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
  // Swipe Controls (with aggressive prevention)
  // ============================================
  let startX, startY;
  let touchStartTime;
  let touchArea = null;
  let isSwiping = false;

  // CRITICAL: Block iOS/touch gestures at the document level
  // This must be done with passive: false to allow preventDefault
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      touchStartTime = Date.now();
      touchArea = e.target.closest('#game-canvas') || e.target.closest('#game-container') || document.body;
      isSwiping = false;
    }
    // Prevent ALL default touch behavior including iOS swipe-to-close
    // EXCEPT on buttons/inputs
    if (!e.target.closest('button') && !e.target.closest('input') && !e.target.closest('select')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { passive: false, capture: true });

  document.addEventListener('touchmove', (e) => {
    // Allow swipe detection on game area
    if (e.touches.length === 1) {
      const endX = e.touches[0].clientX;
      const endY = e.touches[0].clientY;
      const dx = endX - startX;
      const dy = endY - startY;
      
      // Start detecting swipe if moved more than 10px
      if (!isSwiping && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        isSwiping = true;
      }
      
      // If swiping on game area, prevent default to stop scroll
      if (isSwiping && touchArea) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, { passive: false, capture: true });

  document.addEventListener('touchend', (e) => {
    // Prevent default on ALL touchend to stop iOS gestures
    e.preventDefault();
    e.stopPropagation();

    if (e.changedTouches.length === 1 && isSwiping) {
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
            console.log('Swipe right:', dx > 0 ? 'right' : 'left');
          }
        } else {
          // Vertical swipe
          if (Math.abs(dy) > 30) {
            onDirectionChange(dy > 0 ? 'down' : 'up');
            console.log('Swipe vertical:', dy > 0 ? 'down' : 'up');
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
