

const CACHE_NAME = 'turkish-words-v6';

// Файлы для кэширования (относительные пути — работают из любой папки)
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './words.js',
    './manifest.json'
];

// Установка - кэшируем ВСЕ файлы
self.addEventListener('install', event => {
    console.log('🔧 SW устанавливается v6');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async (cache) => {
                console.log('📦 Кэшируем все файлы...');
                try {
                    await cache.addAll(urlsToCache);
                    console.log('✅ Все файлы закэшированы');
                } catch (error) {
                    console.error('❌ Ошибка кэширования:', error);
                }
            })
            .then(() => self.skipWaiting())
    );
});

// Активация - чистим старый кэш
self.addEventListener('activate', event => {
    console.log('🚀 SW активируется v6');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Удаляем старый кэш:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('✅ SW активирован, берём контроль над страницами');
            return clients.claim();
        })
    );
});

// Fetch - стратегия "кэш или сеть" (офлайн-режим)
self.addEventListener('fetch', event => {
    const url = event.request.url;
    
    // Для HTML используем стратегию "сначала сеть, потом кэш"
    if (url.includes('.html') || url.endsWith('/') || event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request).then(cached => {
                        return cached || caches.match('./index.html');
                    });
                })
        );
        return;
    }
    
    // Для остальных файлов (JS, CSS, words.js) - сначала кэш, потом сеть
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    console.log('📀 Из кэша:', url.split('/').pop());
                    return cachedResponse;
                }
                
                console.log('🌐 Из сети:', url.split('/').pop());
                return fetch(event.request)
                    .then(response => {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                        return response;
                    })
                    .catch(error => {
                        console.error('❌ Ошибка загрузки:', url.split('/').pop(), error);
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        throw error;
                    });
            })
    );
});