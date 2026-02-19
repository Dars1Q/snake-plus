// controls.js
// Handles keyboard and touch controls

export function setupControls(state, onDirectionChange) {
  console.log('setupControls called');
  
  // Keyboard controls
  window.onkeydown = (e) => {
    console.log('Key pressed:', e.key);
    switch (e.key) {
      case 'ArrowUp': case 'w': onDirectionChange('up'); break;
      case 'ArrowDown': case 's': onDirectionChange('down'); break;
      case 'ArrowLeft': case 'a': onDirectionChange('left'); break;
      case 'ArrowRight': case 'd': onDirectionChange('right'); break;
    }
  };

  // ============================================
  // Swipe Controls - WITH LOGS
  // ============================================
  let startX = 0, startY = 0;
  let isSwiping = false;
  let swipeDirection = null;

  // Touch START
  document.addEventListener('touchstart', (e) => {
    console.log('touchstart!', e.touches.length, 'touches');
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwiping = false;
      swipeDirection = null;
      console.log('Start pos:', startX, startY);
    }
  });

  // Touch MOVE - detect swipe
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && !swipeDirection) {
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      console.log('touchmove:', dx, dy, 'swiping:', isSwiping);

      // Detect swipe if moved more than 30px
      if (!isSwiping && (Math.abs(dx) > 30 || Math.abs(dy) > 30)) {
        isSwiping = true;

        // Determine direction
        if (Math.abs(dx) > Math.abs(dy)) {
          swipeDirection = dx > 0 ? 'right' : 'left';
        } else {
          swipeDirection = dy > 0 ? 'down' : 'up';
        }

        console.log('🎯 SWIPE:', swipeDirection);
        onDirectionChange(swipeDirection);
      }
    }
  });

  // Touch END
  document.addEventListener('touchend', (e) => {
    console.log('touchend');
    // Reset
    isSwiping = false;
    swipeDirection = null;
  });
  
  console.log('Swipe controls setup complete');
}

export function handleInput() {
  // Reserved for future expansion (buttons, etc)
}
