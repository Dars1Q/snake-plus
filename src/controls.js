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
  // Swipe Controls - ONLY on game canvas
  // ============================================
  let startX = 0, startY = 0;
  let touchStartTime = 0;
  let isSwiping = false;
  let swipeDetected = false;
  let swipeDirection = null;
  let onGameArea = false;

  // Touch START - record initial position
  const handleTouchStart = (e) => {
    // Check if touch is on game area
    const gameCanvas = document.getElementById('game-canvas');
    const gameContainer = document.getElementById('game-container');
    const target = e.target;
    
    onGameArea = target === gameCanvas || 
                 target === gameContainer || 
                 gameCanvas?.contains(target) ||
                 gameContainer?.contains(target);
    
    if (e.touches.length === 1 && onGameArea) {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      touchStartTime = Date.now();
      isSwiping = false;
      swipeDetected = false;
      swipeDirection = null;
    }
  };

  // Touch MOVE - detect swipe direction (ONLY on game area)
  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && onGameArea && !swipeDetected) {
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      
      // Detect swipe if moved more than 30px
      if (!isSwiping && (Math.abs(dx) > 30 || Math.abs(dy) > 30)) {
        isSwiping = true;
        
        // Determine direction
        if (Math.abs(dx) > Math.abs(dy)) {
          swipeDirection = dx > 0 ? 'right' : 'left';
        } else {
          swipeDirection = dy > 0 ? 'down' : 'up';
        }
        
        // Prevent scroll ONLY on game area
        if (e.cancelable) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
      
      // Prevent default if swiping
      if (isSwiping && e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    // Allow normal scroll outside game area
  };

  // Touch END - trigger direction change
  const handleTouchEnd = (e) => {
    if (onGameArea && isSwiping && swipeDirection && !swipeDetected) {
      const touchDuration = Date.now() - touchStartTime;
      
      // Only quick swipes (< 500ms)
      if (touchDuration < 500) {
        swipeDetected = true;
        console.log('Swipe detected:', swipeDirection);
        onDirectionChange(swipeDirection);
      }
    }
  };

  // Add event listeners
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

export function handleInput() {
  // Reserved for future expansion (buttons, etc)
}
