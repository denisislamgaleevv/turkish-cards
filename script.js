

class FlashCards {
    constructor() {
        this.allCards = [];
        this.blocks = [];
        this.currentBlock = null;
        this.currentBlockIndex = -1;
        this.currentCardIndex = 0;
        this.isFlipped = false;
        this.synth = window.speechSynthesis;
        this.wordsPerBlock = 200;
        this.motivationalInterval = 150;
        
        this.init();
    }

    async init() {
        await this.loadWords();
        this.createBlocks();
        this.showBlocksView();
        this.setupEventListeners();
    }

    async loadWords() {
        console.log('Онлайн режим:', navigator.onLine);
        
        if (typeof WORDS_DATA !== 'undefined') {
            console.log('✅ Загружаем слова из WORDS_DATA');
            this.allCards = WORDS_DATA.map(word => ({
                russian: word.ru,
                turkish: word.tr,
                category: 'Основные слова',
                type: 'word',
                id: `Основные слова-${word.ru}`
            }));
            console.log(`📚 Загружено слов: ${this.allCards.length}`);
            return;
        }
        
        console.error('❌ WORDS_DATA не найдена!');
        alert('Ошибка: не найден файл words.js');
    }

    parseWords(text) {
        const lines = text.split('\n');
        let currentCategory = 'Основные слова';
        const uniqueWords = new Set();
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) continue;
            
            if (!trimmedLine.includes('–') && !trimmedLine.includes('-')) {
                if (trimmedLine.length > 2 && /^[А-Яа-яЁёA-Za-z\s]+$/.test(trimmedLine)) {
                    currentCategory = trimmedLine;
                }
                continue;
            }
            
            const separator = trimmedLine.includes('–') ? '–' : '-';
            const parts = trimmedLine.split(separator).map(part => part.trim());
            
            if (parts.length >= 2) {
                const russian = parts[0].trim();
                const turkish = parts.slice(1).join(',').trim();
                
                const lowercaseRussian = russian.toLowerCase();
                if (uniqueWords.has(lowercaseRussian)) {
                    console.log(`Пропускаем дубликат: ${russian}`);
                    continue;
                }
                
                if (russian && turkish && russian.length > 0 && turkish.length > 0) {
                    uniqueWords.add(lowercaseRussian);
                    
                    this.allCards.push({
                        russian: russian,
                        turkish: turkish,
                        category: currentCategory,
                        type: 'word',
                        id: `${currentCategory}-${russian}`
                    });
                }
            }
        }
        
        console.log(`Загружено уникальных слов: ${this.allCards.length}`);
    }

    createBlocks() {
        this.blocks = [];
        
        // Копия карточек в ОБРАТНОМ порядке (от последнего к первому)
        const cardsCopy = [...this.allCards].reverse();
        
        // Разбиваем на блоки
        for (let i = 0; i < cardsCopy.length; i += this.wordsPerBlock) {
            const blockCards = cardsCopy.slice(i, i + this.wordsPerBlock);
            
            this.blocks.push({
                index: Math.floor(i / this.wordsPerBlock),
                cards: blockCards,
                name: `Блок ${Math.floor(i / this.wordsPerBlock) + 1}`,
                size: blockCards.length
            });
        }
        
        console.log(`Создано блоков: ${this.blocks.length}`);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    showBlocksView() {
        document.getElementById('blocks-container').style.display = 'grid';
        document.getElementById('cards-view').style.display = 'none';
        document.getElementById('block-info').textContent = `Выберите блок для изучения`;
        document.querySelector('h1').textContent = 'Турецкие слова - Блоки';
        
        this.renderBlocks();
    }

    showCardsView(blockIndex) {
        document.getElementById('blocks-container').style.display = 'none';
        document.getElementById('cards-view').style.display = 'block';
        
        this.currentBlockIndex = blockIndex;
        this.currentBlock = this.blocks[blockIndex];
        this.currentCardIndex = 0;
        
        document.getElementById('block-info').textContent = 
            `${this.currentBlock.name} • ${this.currentCardIndex + 1}/${this.currentBlock.size}`;
        
        document.querySelector('h1').textContent = 'Турецкие слова - Карточки';
        
        this.renderCard();
    }

    renderBlocks() {
        const container = document.getElementById('blocks-container');
        container.innerHTML = '';
        
        this.blocks.forEach((block, index) => {
            const blockElement = document.createElement('div');
            blockElement.className = 'block';
            blockElement.innerHTML = `
                <div class="block-content">
                    <div class="block-name">${block.name}</div>
                    <div class="block-size">${block.size} слов</div>
                    <button class="btn btn-start" data-block="${index}">
                        Начать изучение
                    </button>
                </div>
            `;
            
            blockElement.querySelector('.btn-start').addEventListener('click', () => {
                this.showCardsView(index);
            });
            
            container.appendChild(blockElement);
        });
    }

    renderCard() {
        if (!this.currentBlock || !this.currentBlock.cards[this.currentCardIndex]) {
            return;
        }

        const card = this.currentBlock.cards[this.currentCardIndex];
        const cardElement = document.getElementById('card');
        const cardInner = document.getElementById('card-inner');
        
        if (this.isMotivationalCard(this.currentCardIndex)) {
            cardInner.innerHTML = `
                <div class="card-face card-front">
                    <div class="motivational-content">
                        <div class="motivational-image">
                            <img src="motivation.jpg" alt="Молодец!" class="motivation-img">
                        </div>
                        <div class="motivational-text">Молодец!</div>
                        <div class="motivational-subtext">Продолжай изучение блока!</div>
                    </div>
                </div>
                <div class="card-face card-back">
                    <div class="motivational-content">
                        <div class="motivational-image">🌟</div>
                        <div class="motivational-text">Отлично!</div>
                        <div class="motivational-subtext">Ты на правильном пути!</div>
                    </div>
                </div>
            `;
        } else {
            const turkishWords = card.turkish.split(',').map(word => word.trim());
            
            cardInner.innerHTML = `
                <div class="card-face card-front">
                    <div class="word">${card.russian}</div>
                </div>
                <div class="card-face card-back">
                    <div class="word-container">
                        <div class="turkish-translation">
                            ${turkishWords.map(word => `<div class="turkish-word">${word}</div>`).join('')}
                        </div>
                        <div class="sound-icon" onclick="event.stopPropagation(); flashCards.speakText('${turkishWords[0].replace(/'/g, "\\'")}')">
                            🔊
                        </div>
                    </div>
                </div>
            `;
        }
        
        document.getElementById('block-info').textContent = 
            `${this.currentBlock.name} • ${this.currentCardIndex + 1}/${this.currentBlock.size}`;
        
        this.isFlipped = false;
        cardElement.classList.remove('flipped');
    }

    isMotivationalCard(index) {
        return (index + 1) % this.motivationalInterval === 0;
    }

    speakText(text) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.9;
        
        const soundIcon = document.querySelector('.sound-icon');
        if (soundIcon) {
            soundIcon.classList.add('speaking');
            utterance.onend = () => soundIcon.classList.remove('speaking');
            utterance.onerror = () => soundIcon.classList.remove('speaking');
        }

        this.synth.speak(utterance);
    }

    setupEventListeners() {
        const cardElement = document.getElementById('card');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const blockBtn = document.getElementById('block-btn');

        cardElement.addEventListener('click', (e) => {
            if (!e.target.closest('.sound-icon')) {
                this.flipCard();
            }
        });

        prevBtn.addEventListener('click', () => this.prevCard());
        nextBtn.addEventListener('click', () => this.nextCard());
        blockBtn.addEventListener('click', () => {
            this.showBlocksView();
        });

        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.prevCard();
                    break;
                case 'ArrowRight':
                    this.nextCard();
                    break;
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    this.flipCard();
                    break;
                case 's':
                case 'S':
                case 'ы':
                case 'Ы':
                    e.preventDefault();
                    if (this.isFlipped && !this.isMotivationalCard(this.currentCardIndex)) {
                        const currentWord = this.currentBlock.cards[this.currentCardIndex].turkish;
                        const firstTranslation = currentWord.split(',')[0].trim();
                        this.speakText(firstTranslation);
                    }
                    break;
                case 'b':
                case 'B':
                case 'и':
                case 'И':
                    e.preventDefault();
                    this.showBlocksView();
                    break;
            }
        });
    }

    async clearAllCache() {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => {
                    console.log(`Удаляем кэш: ${cacheName}`);
                    return caches.delete(cacheName);
                })
            );
            console.log('✅ Весь кэш очищен');
        }
        
        localStorage.clear();
        console.log('✅ localStorage очищен');
        
        sessionStorage.clear();
        console.log('✅ sessionStorage очищен');
        
        window.location.reload(true);
    }

    flipCard() {
        const cardElement = document.getElementById('card');
        this.isFlipped = !this.isFlipped;
        cardElement.classList.toggle('flipped');
        
        if (this.isFlipped) {
            this.synth.cancel();
        }
    }

    nextCard() {
        if (this.currentCardIndex < this.currentBlock.cards.length - 1) {
            this.currentCardIndex++;
            this.renderCard();
            this.synth.cancel();
        } else {
            this.showBlocksView();
        }
    }

    prevCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.renderCard();
            this.synth.cancel();
        }
    }
}

// Глобальная переменная
let flashCards;

document.addEventListener('DOMContentLoaded', () => {
    flashCards = new FlashCards();
});

// Регистрация Service Worker для офлайн-работы
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('✅ SW зарегистрирован:', reg);
                reg.update();
            })
            .catch(err => {
                console.error('❌ Ошибка SW:', err);
            });
    });
}

// Отслеживание статуса онлайн/офлайн
window.addEventListener('load', () => {
    const statusElement = document.getElementById('online-status');
    if (!statusElement) return;
    
    function updateOnlineStatus() {
        if (navigator.onLine) {
            statusElement.textContent = '🟢 Онлайн';
            statusElement.style.color = 'green';
        } else {
            statusElement.textContent = '📴 Офлайн (работает из кэша)';
            statusElement.style.color = 'orange';
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
});
