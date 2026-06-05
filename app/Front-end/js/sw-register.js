if ('serviceWorker' in navigator) {
  const root = location.pathname.includes('/pages/') ? '../' : './';
  navigator.serviceWorker.register(root + 'sw.js');
}
