// Service Worker for Umbra Platform
// This is a minimal implementation to prevent errors

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Skip waiting and become active immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Take control of all pages immediately
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests, not POST/PUT/DELETE etc
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For now, just pass through all requests without caching
  event.respondWith(fetch(event.request));
});
