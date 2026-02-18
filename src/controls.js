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

  // Touch controls for mobile
  let startX, startY;
  let touchStartTime;
  let touchArea = null;

  // CRITICAL: Prevent all default touch behaviors on iOS
  // Use passive: false to allow preventDefault
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      touchStartTime = Date.now();

      // Find game area
      touchArea = e.target.closest('#game-canvas') || e.target.closest('#game-container') || document.body;
    }
    // Always prevent default on touch start
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    // ALWAYS prevent scrolling/swiping on iOS - prevents Telegram close gesture
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    // Prevent default for all touchend events to stop iOS swipe gestures
    e.preventDefault();
    
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
  }, { passive: false });
}

export function handleInput() {
  // Reserved for future expansion (buttons, etc)
}
