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
  
  window.ontouchstart = (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      touchStartTime = Date.now();
      // Prevent default only for game canvas area
      if (e.target.closest('#game-canvas') || e.target.closest('#game-container')) {
        e.preventDefault();
      }
    }
  };
  
  window.ontouchmove = (e) => {
    // Prevent scrolling while playing
    if (e.target.closest('#game-canvas') || e.target.closest('#game-container')) {
      e.preventDefault();
    }
  };
  
  window.ontouchend = (e) => {
    if (e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const dx = endX - startX;
      const dy = endY - startY;
      const touchDuration = Date.now() - touchStartTime;
      
      // Only register swipe if it's quick (not a long press)
      if (touchDuration < 500) {
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (Math.abs(dx) > 30) { // Minimum swipe distance
            onDirectionChange(dx > 0 ? 'right' : 'left');
          }
        } else {
          // Vertical swipe - prevent Telegram close
          if (Math.abs(dy) > 30) {
            onDirectionChange(dy > 0 ? 'down' : 'up');
            // Prevent Telegram from closing on downward swipe
            if (dy > 0) {
              e.preventDefault();
            }
          }
        }
      }
    }
  };
}

export function handleInput() {
  // Reserved for future expansion (buttons, etc)
}
