// === БЕЗОПАСНЫЙ ЗВУКОВОЙ ФИДБЭК ===
let audioCtx = null;
let isAudioEnabled = false;

function initSafeAudio() {
    if (isAudioEnabled) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
            isAudioEnabled = true;
        }
    } catch (e) {
        isAudioEnabled = false;
    }
}

function safePlayTone(frequency, duration = 0.15, volume = 0.1) {
    if (!isAudioEnabled || !audioCtx) return;
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gainNode.gain.value = volume;
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        oscillator.start(now);
        oscillator.stop(now + duration);
    } catch (e) {
        // Игнорируем ошибки звука
    }
}

function playCorrectSound() {
    if (!isAudioEnabled || !audioCtx) return;
    const melody = [523.25, 659.25, 783.99];
    const now = audioCtx.currentTime;
    const duration = 0.12;

    melody.forEach((freq, i) => {
        try {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            gainNode.gain.setValueAtTime(0.15, now + i * 0.08);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + duration);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start(now + i * 0.08);
            oscillator.stop(now + i * 0.08 + duration);
        } catch (e) {}
    });
}

function playIncorrectSound() {
    if (!isAudioEnabled) return;
    safePlayTone(200, 0.2, 0.1);
}

function playLevelCompleteSound() {
    if (!isAudioEnabled) return;
    const melody = [523, 659, 784];
    melody.forEach((freq, i) => {
        setTimeout(() => safePlayTone(freq, 0.18, 0.15), i * 200);
    });
}

// Конфигурация игры
const GAME_CONFIG = {
    expPerCorrectAnswer: 10,
    bonusExpPerfect: 50,
    requiredScore: 70,
    expPerLevel: 1000
};

// API базовый URL
const API_BASE = 'http://localhost:3001/api';

// Загрузка уровней из бэкенда
async function loadLevelsFromBackend() {
    try {
        console.log('🔄 Загружаем уровни...');
        
        // Fallback тестовые уровни
        const fallbackLevels = [
            {
                id: 'savings',
                title: 'Основы накоплений',
                theme: 'Накопления',
                difficulty: 'легкий',
                reward_points: 100,
                questions: [
                    {
                        question: "Что такое 'финансовая подушка безопасности'?",
                        answers: [
                            "Деньги на непредвиденные расходы",
                            "Кредитная карта с большим лимитом", 
                            "Инвестиции в акции",
                            "Дорогая покупка в рассрочку"
                        ],
                        correctAnswer: 0,
                        explanation: "Финансовая подушка безопасности - это запас денег на 3-6 месяцев жизни для непредвиденных ситуаций (потеря работы, болезнь, ремонт)."
                    },
                    {
                        question: "Какой способ накопления самый надежный?",
                        answers: [
                            "Банковский вклад",
                            "Инвестиции в криптовалюту",
                            "Акции startups",
                            "Хранение денег дома"
                        ],
                        correctAnswer: 0,
                        explanation: "Банковский вклад защищен системой страхования вкладов и имеет предсказываемую доходность."
                    }
                ]
            },
            {
                id: 'security', 
                title: 'Финансовая защита',
                theme: 'Безопасность',
                difficulty: 'средний',
                reward_points: 150,
                questions: [
                    {
                        question: "Что НЕЛЬЗЯ сообщать по телефону незнакомцу?",
                        answers: [
                            "Реквизиты банковской карты",
                            "Своё имя",
                            "Номер телефона", 
                            "Адрес электронной почты"
                        ],
                        correctAnswer: 0,
                        explanation: "Реквизиты банковской карты (номер, срок действия, CVC) - это конфиденциальная информация, которую нельзя сообщать посторонним."
                    }
                ]
            },
            {
                id: 'goals',
                title: 'Финансовые цели',
                theme: 'Планирование', 
                difficulty: 'сложный',
                reward_points: 120,
                questions: [
                    {
                        question: "Что такое SMART-цели в финансах?",
                        answers: [
                            "Конкретные, измеримые, достижимые, релевантные, ограниченные по времени",
                            "Быстрые и спонтанные решения",
                            "Цели без конкретных сроков",
                            "Только долгосрочные планы"
                        ],
                        correctAnswer: 0,
                        explanation: "SMART - это аббревиатура для постановки эффективных целей: Specific, Measurable, Achievable, Relevant, Time-bound."
                    }
                ]
            }
        ];

        console.log('✅ Используем тестовые уровни');
        return fallbackLevels;

    } catch (error) {
        console.error('❌ Ошибка загрузки уровней:', error);
        return [];
    }
}

// Сохранение результата в бэкенд
async function saveAttemptToBackend(levelId, score, status) {
    try {
        const response = await fetch(`${API_BASE}/attempts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: 1, // временный ID пользователя
                level_id: levelId,
                score: score,
                status: status
            })
        });
        
        if (!response.ok) throw new Error('Ошибка сохранения');
        const result = await response.json();
        console.log('💾 Результат сохранен в бэкенд:', result);
        return result;
    } catch (error) {
        console.error('❌ Ошибка сохранения результата:', error);
        return null;
    }
}

// Состояние игры
let gameState = {
    currentLevel: null,
    currentQuestion: 0,
    score: 0,
    selectedAnswer: null,
    showFeedback: false,
    startTime: null
};

// SVG-иконки для профиля
const LEVEL_ICONS = {
    savings: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 2v20M2 12h20M5 8h14M5 16h14"/>
            <circle cx="12" cy="12" r="9"/>
        </svg>
    `,
    security: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 2L3 7v10c0 5.55 3.84 9 9 9s9-3.45 9-9V7l-9-5z"/>
            <path d="M12 12.5v7M9 11l3-3 3 3"/>
        </svg>
    `,
    goals: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4l2 2"/>
        </svg>
    `
};

// Достижения
const ACHIEVEMENTS = {
    first_level: {
        id: 'first_level',
        title: 'Первый шаг!',
        description: 'Пройдите свой первый уровень',
        icon: '🎯'
    },
    all_levels: {
        id: 'all_levels',
        title: 'Мастер финансов',
        description: 'Пройдите все уровни',
        icon: '🏆'
    },
    perfect_score: {
        id: 'perfect_score',
        title: 'Идеальный результат!',
        description: 'Наберите 100% в любом уровне',
        icon: '⭐'
    },
    exp_500: {
        id: 'exp_500',
        title: 'Опытный инвестор',
        description: 'Заработайте 500 очков опыта',
        icon: '💼'
    },
    fast_learner: {
        id: 'fast_learner',
        title: 'Быстрый ученик',
        description: 'Пройдите уровень менее чем за 2 минуты',
        icon: '⚡'
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initGame();
});

function initGame() {
    simulateLoading(() => {
        loadProgress();
        showScreen('main-menu');
        updateUserStats();
        setupEventListeners();
        registerServiceWorker();
        displayLevelsFromBackend(); // Загружаем уровни из бэкенда
    });
}

function simulateLoading(callback) {
    let progress = 0;
    const progressBar = document.getElementById('loading-progress');
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(callback, 500);
        }
        progressBar.style.width = `${progress}%`;
    }, 200);
}

// Загрузка уровней из бэкенда и отображение
async function displayLevelsFromBackend() {
    const levels = await loadLevelsFromBackend();
    const levelsContainer = document.getElementById('levels-list');
    
    if (!levelsContainer || levels.length === 0) {
        console.error('❌ Не удалось загрузить уровни');
        return;
    }
    
    levelsContainer.innerHTML = '';
    
    levels.forEach(level => {
        const levelElement = document.createElement('div');
        levelElement.className = 'level-card';
        levelElement.innerHTML = `
            <div class="level-icon">
                ${LEVEL_ICONS[level.id] || '❓'}
            </div>
            <div class="level-content">
                <div class="level-topic-badge">${level.theme}</div>
                <h3 class="level-title">${level.title}</h3>
                <p class="level-desc">Сложность: ${level.difficulty}</p>
            </div>
            <div class="level-reward">+${level.reward_points} опыта</div>
            <button class="btn btn-secondary level-start-btn" onclick="startLevel('${level.id}')">🎮 Начать</button>
        `;
        levelsContainer.appendChild(levelElement);
    });
    
    console.log('🎯 Уровни отображены из бэкенда');
}

function setupEventListeners() {
    // Активация звука при первом взаимодействии
    const enableAudio = () => {
        initSafeAudio();
        document.body.removeEventListener('click', enableAudio);
        document.body.removeEventListener('touchstart', enableAudio);
    };
    document.body.addEventListener('click', enableAudio, { once: true, passive: true });
    document.body.addEventListener('touchstart', enableAudio, { once: true, passive: true });

    // Навигация
    document.getElementById('profile-btn').addEventListener('click', () => showScreen('profile-screen'));
    document.getElementById('profile-back-btn').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('back-btn').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('menu-btn').addEventListener('click', () => showScreen('main-menu'));
    document.getElementById('help-btn').addEventListener('click', () => showScreen('help-screen'));
    document.getElementById('help-back-btn').addEventListener('click', () => showScreen('main-menu'));

    // Игровые действия
    document.getElementById('play-again-btn').addEventListener('click', restartLevel);
    document.getElementById('reset-progress-btn').addEventListener('click', resetProgress);
    document.getElementById('export-data-btn').addEventListener('click', exportData);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    targetScreen.classList.add('active');
    targetScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (screenId === 'profile-screen') {
        renderProfile();
    }
}

function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');

    notificationText.textContent = message;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, duration);
}

// Работа с прогрессом
function loadProgress() {
    const saved = localStorage.getItem('financialGameProgress');
    if (saved) {
        window.gameProgress = JSON.parse(saved);
    } else {
        window.gameProgress = {
            totalExp: 0,
            userLevel: 1,
            levels: {},
            achievements: [],
            completedLevels: 0,
            playCount: 0,
            totalPlayTime: 0
        };
        saveProgress();
    }
}

function saveProgress() {
    localStorage.setItem('financialGameProgress', JSON.stringify(window.gameProgress));
}

function resetProgress() {
    if (confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить.')) {
        window.gameProgress = {
            totalExp: 0,
            userLevel: 1,
            levels: {},
            achievements: [],
            completedLevels: 0,
            playCount: 0,
            totalPlayTime: 0
        };
        saveProgress();
        updateUserStats();
        renderProfile();
        showScreen('main-menu');
        showNotification('Прогресс успешно сброшен!');
    }
}

function exportData() {
    const dataStr = JSON.stringify(window.gameProgress, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-game-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification('Данные успешно экспортированы!');
}

// Запуск уровня
async function startLevel(levelId) {
    const levels = await loadLevelsFromBackend();
    const level = levels.find(l => l.id === levelId);
    
    if (!level) {
        alert('Уровень не найден!');
        return;
    }
    
    gameState.currentLevel = level;
    gameState.currentQuestion = 0;
    gameState.score = 0;
    gameState.selectedAnswer = null;
    gameState.showFeedback = false;
    gameState.startTime = Date.now();

    window.gameProgress.playCount = (window.gameProgress.playCount || 0) + 1;
    saveProgress();

    document.getElementById('level-title').textContent = level.title;
    document.getElementById('level-topic').textContent = level.theme;
    showScreen('level-screen');
    renderQuestion();
}

function renderQuestion() {
    const question = gameState.currentLevel.questions[gameState.currentQuestion];
    const progress = ((gameState.currentQuestion + 1) / gameState.currentLevel.questions.length) * 100;

    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('level-progress').textContent =
        `Вопрос ${gameState.currentQuestion + 1}/${gameState.currentLevel.questions.length}`;

    const container = document.getElementById('question-container');
    container.innerHTML = `
        <div class="question-text">${question.question}</div>
        <div class="answers-list">
            ${question.answers.map((answer, index) => `
                <button class="answer-btn" onclick="selectAnswer(${index})">
                    ${answer}
                </button>
            `).join('')}
        </div>
    `;

    document.getElementById('feedback').classList.add('hidden');
}

function selectAnswer(answerIndex) {
    if (gameState.showFeedback) return;

    gameState.selectedAnswer = answerIndex;
    gameState.showFeedback = true;

    const question = gameState.currentLevel.questions[gameState.currentQuestion];
    const isCorrect = answerIndex === question.correctAnswer;

    // 🔊 Воспроизводим звук
    if (isCorrect) {
        gameState.score++;
        playCorrectSound();
    } else {
        playIncorrectSound();
    }

    // Подсветка ответов
    const answerButtons = document.querySelectorAll('.answer-btn');
    answerButtons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correctAnswer) {
            btn.classList.add('correct');
        } else if (index === answerIndex && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    // Показ фидбека
    const feedback = document.getElementById('feedback');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackText = document.getElementById('feedback-text');
    const nextBtn = document.getElementById('next-btn');

    feedback.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackIcon.textContent = isCorrect ? '✅' : '❌';
    feedbackText.textContent = question.explanation;
    
    // ПРИНУДИТЕЛЬНОЕ ПЕРЕОПРЕДЕЛЕНИЕ СТИЛЕЙ
    feedback.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: relative !important;
        z-index: 1000 !important;
    `;
    feedback.classList.remove('hidden');

    // ПРИНУДИТЕЛЬНОЕ ПЕРЕОПРЕДЕЛЕНИЕ СТИЛЕЙ КНОПКИ
    nextBtn.style.cssText = `
        display: inline-block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: all !important;
        cursor: pointer !important;
        position: relative !important;
        z-index: 1001 !important;
    `;

    // ПРОСТАЯ И НАДЕЖНАЯ УСТАНОВКА ОБРАБОТЧИКА
    console.log('Setting next button handler for question:', gameState.currentQuestion);
    
    // Полная переустановка обработчика
    nextBtn.onclick = null; // Очищаем старые обработчики
    nextBtn.addEventListener('click', function nextButtonHandler() {
        console.log('Next button clicked! Current question:', gameState.currentQuestion);
        nextQuestion();
    }, { once: true }); // { once: true } чтобы избежать дублирования

    // Дублируем через onclick для надежности
    nextBtn.onclick = function() {
        console.log('Next button clicked via onclick');
        nextQuestion();
    };

    console.log('Next button setup complete - styles and handlers applied');
    
    // Дополнительная проверка через 100ms
    setTimeout(() => {
        const computedStyle = window.getComputedStyle(feedback);
        console.log('Final feedback styles:', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity
        });
        
        const btnComputedStyle = window.getComputedStyle(nextBtn);
        console.log('Final button styles:', {
            display: btnComputedStyle.display,
            pointerEvents: btnComputedStyle.pointerEvents,
            cursor: btnComputedStyle.cursor
        });
    }, 100);
}
function nextQuestion() {
    console.log('nextQuestion called! Current question:', gameState.currentQuestion);
    
    gameState.currentQuestion++;
    gameState.selectedAnswer = null;
    gameState.showFeedback = false;

    console.log('Next question index:', gameState.currentQuestion);
    console.log('Total questions:', gameState.currentLevel.questions.length);

    if (gameState.currentQuestion < gameState.currentLevel.questions.length) {
        console.log('Rendering next question');
        renderQuestion();
    } else {
        console.log('Finishing level');
        finishLevel();
    }
}

finishLevel()
function showResults(score, expEarned, bonusExp, levelCompleted, timeSpent) {
    const levelProgress = window.gameProgress.levels[gameState.currentLevel.id];
    const bestScore = levelProgress?.bestScore || 0;

    document.getElementById('result-icon').textContent = levelCompleted ? '🎉' : '😔';
    document.getElementById('result-title').textContent = levelCompleted ? 'Уровень пройден!' : 'Попробуйте еще раз';
    document.getElementById('correct-answers').textContent = `${gameState.score}/${gameState.currentLevel.questions.length}`;
    
    // ИСПРАВЛЕННОЕ ОТОБРАЖЕНИЕ ОПЫТА:
    let expText = `+${expEarned}`;
    if (bonusExp > 0) expText += ` (+${bonusExp} бонус)`;
    if (levelCompleted) expText += ` +${gameState.currentLevel.reward_points} (уровень)`;
    
    document.getElementById('exp-earned').textContent = expText;
    document.getElementById('best-score').textContent = `${bestScore}%`;

    const achievementsContainer = document.getElementById('achievements');
    achievementsContainer.innerHTML = '';

    let newAchievements = 0;

    if (levelCompleted) {
        const achievement = createAchievementElement(ACHIEVEMENTS.first_level, true);
        achievementsContainer.appendChild(achievement);
        newAchievements++;
    }

    if (gameState.score === gameState.currentLevel.questions.length) {
        const achievement = createAchievementElement(ACHIEVEMENTS.perfect_score, true);
        achievementsContainer.appendChild(achievement);
        newAchievements++;
    }

    const achievementsSection = document.getElementById('achievements-container');
    achievementsSection.style.display = newAchievements > 0 ? 'block' : 'none';

    if (newAchievements > 0) {
        showNotification(`🎖️ Получено ${newAchievements} нов${newAchievements === 1 ? 'ое' : 'ых'} достижения!`);
    }

    showScreen('results-screen');
}

function createAchievementElement(achievement, isNew = false) {
    const div = document.createElement('div');
    div.className = `achievement ${isNew ? 'achievement-new' : ''}`;
    div.innerHTML = `
        <div style="display: flex; align-items: center;">
            <span class="achievement-icon">${achievement.icon}</span>
            <div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        </div>
    `;
    return div;
}

function checkAchievements(achievementId) {
    if (!window.gameProgress.achievements.includes(achievementId)) {
        window.gameProgress.achievements.push(achievementId);
        saveProgress();
        return true;
    }
    return false;
}

function restartLevel() {
    startLevel(gameState.currentLevel.id);
}

function updateUserStats() {
    document.getElementById('total-exp').textContent = window.gameProgress.totalExp;
    document.getElementById('completed-levels').textContent = window.gameProgress.completedLevels;
    document.getElementById('user-level').textContent = window.gameProgress.userLevel;
}

function renderProfile() {
    document.getElementById('profile-total-exp').textContent = window.gameProgress.totalExp;
    document.getElementById('profile-levels-completed').textContent = window.gameProgress.completedLevels;
    document.getElementById('profile-achievements').textContent = window.gameProgress.achievements.length;

    const levelsList = document.getElementById('profile-levels-list');
    levelsList.innerHTML = "";

    // Загружаем уровни для отображения в профиле
    loadLevelsFromBackend().then(levels => {
        levels.forEach(level => {
            const progress = window.gameProgress.levels[level.id] || {};
            const avgTime = progress.playCount ? Math.round(progress.totalTime / progress.playCount) : 0;
            const iconHTML = LEVEL_ICONS[level.id] || '❓';

            const levelElement = document.createElement('div');
            levelElement.className = 'profile-level';
            levelElement.innerHTML = `
                <div class="level-info">
                    <div class="level-name">
                        <span class="profile-level-icon">${iconHTML}</span>
                        ${level.title}
                        <span class="level-difficulty">${level.difficulty === 'easy' ? '★' : level.difficulty === 'medium' ? '★★' : '★★★'}</span>
                    </div>
                    <div class="level-score">
                        ${progress.completed ?
                            `Лучший результат: ${progress.bestScore}% | Игр: ${progress.playCount || 0}` :
                            'Еще не пройден'}
                        ${avgTime ? ` | Среднее время: ${avgTime}с` : ''}
                    </div>
                </div>
                <div class="level-status">
                    ${progress.completed ? '✅' : '❌'}
                </div>
            `;
            levelsList.appendChild(levelElement);
        });
    });

    const totalPlayTime = window.gameProgress.totalPlayTime || 0;
    const totalPlayCount = window.gameProgress.playCount || 0;

    if (totalPlayCount > 0) {
        const statsInfo = document.createElement('div');
        statsInfo.className = 'help-section';
        statsInfo.innerHTML = `
            <h3>Общая статистика</h3>
            <p>Всего сыграно игр: <strong>${totalPlayCount}</strong></p>
            <p>Общее время игры: <strong>${Math.round(totalPlayTime / 60)} минут</strong></p>
            <p>Среднее время на игру: <strong>${Math.round(totalPlayTime / totalPlayCount)} секунд</strong></p>
        `;
        levelsList.parentNode.insertBefore(statsInfo, levelsList.nextSibling);
    }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(() => console.log('✅ Service Worker зарегистрирован'))
            .catch(err => console.log('❌ Ошибка Service Worker:', err));
    }
}

// Глобальные функции для HTML
window.startLevel = startLevel;
window.selectAnswer = selectAnswer;

// Добавьте в конец script.js
window.debugNextButton = function() {
    const nextBtn = document.getElementById('next-btn');
    console.log('Debug next button:', nextBtn);
    console.log('onclick:', nextBtn.onclick);
    
    // Принудительно вызовем nextQuestion
    alert('Принудительный вызов nextQuestion');
    nextQuestion();
};

// Добавим временную кнопку для теста
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const testBtn = document.createElement('button');
        testBtn.textContent = 'ТЕСТ: Принудительно Продолжить';
        testBtn.style.position = 'fixed';
        testBtn.style.bottom = '10px';
        testBtn.style.right = '10px';
        testBtn.style.zIndex = '9999';
        testBtn.style.background = 'orange';
        testBtn.style.color = 'white';
        testBtn.style.padding = '10px';
        testBtn.onclick = function() {
            if (typeof nextQuestion === 'function') {
                nextQuestion();
            } else {
                alert('nextQuestion не найдена');
            }
        };
        document.body.appendChild(testBtn);
    }, 3000);
});