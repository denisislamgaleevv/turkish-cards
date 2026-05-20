const fs = require('fs');

// Читаем исходный файл
const inputText = fs.readFileSync('words.txt', 'utf8');
const lines = inputText.split('\n');

const wordsArray = [];
let currentCategory = 'Основные слова';

for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;
    
    // УДАЛИТЕ ЭТИ 3 СТРОКИ:
    // if (/^\d+\s*[–-]/.test(trimmedLine)) continue;
    
    // Проверяем, является ли строка категорией
    if (!trimmedLine.includes('–') && !trimmedLine.includes('-') && 
        /^[А-Яа-яЁёA-Za-z\s]+$/.test(trimmedLine) && trimmedLine.length > 2) {
        currentCategory = trimmedLine;
        continue;
    }
    
    // Разделяем на русское и турецкое слово
    const separator = trimmedLine.includes('–') ? '–' : '-';
    const parts = trimmedLine.split(separator).map(part => part.trim());
    
    if (parts.length >= 2) {
        const russian = parts[0].trim();
        const turkish = parts.slice(1).join(',').trim();
        
        // Очищаем турецкую часть от квадратных скобок с транскрипцией
        const cleanTurkish = turkish.replace(/\s*\[[^\]]*\]/g, '').trim();
        
        if (russian && cleanTurkish && russian.length > 0 && cleanTurkish.length > 0) {
            wordsArray.push({
                ru: russian,
                tr: cleanTurkish
            });
        }
    }
}

// Удаляем дубликаты по русскому слову
const seen = new Set();
const uniqueWords = wordsArray.filter(word => {
    const key = word.ru.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
});

console.log(`Обработано слов: ${uniqueWords.length}`);

// Генерируем JavaScript файл
const output = `// Автоматически сгенерированный файл слов
// Всего слов: ${uniqueWords.length}

const WORDS_DATA = ${JSON.stringify(uniqueWords, null, 2)};

// Для совместимости с существующим кодом
const wordsData = {
    "Основные слова": WORDS_DATA
};

// Экспортируем (для модулей)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WORDS_DATA, wordsData };
}
`;

fs.writeFileSync('words.js', output, 'utf8');
console.log('Файл words.js успешно создан!');