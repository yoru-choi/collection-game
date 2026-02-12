import Phaser from 'phaser';
import config from './game';

console.log('Main: Initializing application...');

window.addEventListener('load', () => {
  console.log('Main: Window loaded, starting Phaser...');
  try {
    const game = new Phaser.Game(config);
    console.log('Main: Phaser game instance created:', game);

    const orientationOverlay = document.getElementById('orientation-lock');
    const updateOrientationLock = () => {
      if (!orientationOverlay) return;
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth < 1024;
      orientationOverlay.classList.toggle('active', isMobile && isPortrait);
    };

    updateOrientationLock();
    window.addEventListener('resize', updateOrientationLock);
    window.addEventListener('orientationchange', updateOrientationLock);
    
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  } catch (error) {
    console.error('Failed to initialize Phaser:', error);
  }
});
