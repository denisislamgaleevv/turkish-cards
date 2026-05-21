const CACHE_NAME = 'turkish-words-v2';
self.addEventListener('install', event => {
    console.log('SW устанавливается v2');
    // Пропускаем ожидание и активируем сразу
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('SW активируется v2');
    // Удаляем старые кэши
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Удаляем старый кэш:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            // Берем контроль над всеми клиентами
            return clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    // Не кэшируем HTML и JS файлы, чтобы всегда получать свежие
    if (event.request.url.includes('.html') || 
        event.request.url.includes('.js') ||
        event.request.url.includes('words.js')) {
        // Всегда идем в сеть
        event.respondWith(fetch(event.request));
        return;
    }
    
    // Для остальных ресурсов используем кэш
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/words.js',
    '/manifest.json'
];

// Установка Service Worker и кэширование файлов
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кэширование файлов');
                return cache.addAll(urlsToCache);
            })
    );
});

// Активация и очистка старого кэша
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Удаление старого кэша:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Перехват запросов и ответ из кэша
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кэшированный ответ или делаем запрос в сеть
                return response || fetch(event.request);
            })
    );
});