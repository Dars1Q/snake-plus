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
  // Swipe Controls - Simple and Reliable
  // ============================================
  let startX = 0, startY = 0;
  let touchStartTime = 0;
  let isSwiping = false;
  let swipeDirection = null;

  // Touch START
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      touchStartTime = Date.now();
      isSwiping = false;
      swipeDirection = null;
    }
  }, { passive: true });

  // Touch MOVE - detect swipe
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && !swipeDirection) {
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      // Detect swipe if moved more than 20px (reduced from 30px)
      if (!isSwiping && (Math.abs(dx) > 20 || Math.abs(dy) > 20)) {
        isSwiping = true;

        // Determine direction
        if (Math.abs(dx) > Math.abs(dy)) {
          swipeDirection = dx > 0 ? 'right' : 'left';
        } else {
          swipeDirection = dy > 0 ? 'down' : 'up';
        }

        // Prevent scroll
        e.preventDefault();
      }

      // Always prevent default during swipe
      if (isSwiping) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  // Touch END - trigger direction
  document.addEventListener('touchend', (e) => {
    if (isSwiping && swipeDirection) {
      const touchDuration = Date.now() - touchStartTime;

      // Only quick swipes (< 500ms)
      if (touchDuration < 500) {
        console.log('Swipe:', swipeDirection);
        onDirectionChange(swipeDirection);
      }
    }
  }, { passive: true });
}

export function handleInput() {
  // Reserved for future expansion (buttons, etc)
}
