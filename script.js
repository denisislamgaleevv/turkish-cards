class FlashCards {
    constructor() {
        this.cards = [];
        this.currentIndex = 0;
        this.isFlipped = false;
        this.synth = window.speechSynthesis;
        this.init();
    }

    async init() {
        await this.loadWords();
        this.shuffleCards();
        this.renderCard();
        this.setupEventListeners();
    }

    async loadWords() {
        try {
            const response = await fetch('words.txt');
            const text = await response.text();
            this.parseWords(text);
        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
        }
    }

    parseWords(text) {
        const lines = text.split('\n');
        let currentCategory = '';
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) continue;
            
            // Проверяем, является ли строка заголовком категории
            if (!trimmedLine.includes('–') && !trimmedLine.includes('-')) {
                currentCategory = trimmedLine;
                continue;
            }
            
            // Парсим слова
            const parts = trimmedLine.split(/[–-]/).map(part => part.trim());
            if (parts.length === 2) {
                const russian = parts[0];
                const turkish = parts[1];
                
                this.cards.push({
                    russian: russian,
                    turkish: turkish,
                    category: currentCategory
                });
            }
        }
    }

    shuffleCards() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    speakText(text) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Устанавливаем турецкий язык
        utterance.lang = 'tr-TR';
        utterance.rate = 0.9; // Немного медленнее для лучшего восприятия
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
            const soundIcon = document.querySelector('.sound-icon');
            if (soundIcon) {
                soundIcon.classList.add('speaking');
            }
        };

        utterance.onend = () => {
            const soundIcon = document.querySelector('.sound-icon');
            if (soundIcon) {
                soundIcon.classList.remove('speaking');
            }
        };

        utterance.onerror = (event) => {
            console.error('Ошибка воспроизведения:', event);
            const soundIcon = document.querySelector('.sound-icon');
            if (soundIcon) {
                soundIcon.classList.remove('speaking');
            }
        };

        this.synth.speak(utterance);
    }

    renderCard() {
        const card = this.cards[this.currentIndex];
        if (!card) return;

        const cardElement = document.getElementById('card');
        const cardInner = document.getElementById('card-inner');
        const counterElement = document.getElementById('counter');
        
        cardInner.innerHTML = `
            <div class="card-face card-front">
                <div class="word">${card.russian}</div>
                 
            </div>
            <div class="card-face card-back">
                <div class="word-container">
                    <div class="word">${card.turkish}</div>
                    <div class="sound-icon" onclick="event.stopPropagation(); flashCards.speakText('${card.turkish.replace(/'/g, "\\'")}')">
                        🔊
                    </div>
                </div>
            
            </div>
        `;
        
        counterElement.textContent = `${this.currentIndex + 1} / ${this.cards.length}`;
        
        // Сбрасываем состояние переворота
        this.isFlipped = false;
        cardElement.classList.remove('flipped');
    }

    setupEventListeners() {
        const cardElement = document.getElementById('card');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        // Клик по карточке для переворота
        cardElement.addEventListener('click', (e) => {
            // Не переворачиваем карточку если кликнули на значок звука
            if (!e.target.closest('.sound-icon')) {
                this.flipCard();
            }
        });

        // Кнопки навигации
        prevBtn.addEventListener('click', () => {
            this.prevCard();
        });

        nextBtn.addEventListener('click', () => {
            this.nextCard();
        });

        // Клавиши клавиатуры
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
                    if (this.isFlipped) {
                        const currentWord = this.cards[this.currentIndex].turkish;
                        this.speakText(currentWord);
                    }
                    break;
            }
        });
    }

    flipCard() {
        const cardElement = document.getElementById('card');
        this.isFlipped = !this.isFlipped;
        cardElement.classList.toggle('flipped');
        
        // Если перевернули на турецкую сторону, останавливаем любое текущее воспроизведение
        if (this.isFlipped) {
            this.synth.cancel();
        }
    }

    nextCard() {
        if (this.currentIndex < this.cards.length - 1) {
            this.currentIndex++;
            this.renderCard();
            // Останавливаем воспроизведение при смене карточки
            this.synth.cancel();
        }
    }

    prevCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderCard();
            // Останавливаем воспроизведение при смене карточки
            this.synth.cancel();
        }
    }
}

// Глобальная переменная для доступа из HTML
let flashCards;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    flashCards = new FlashCards();
});