let currentWeather = null;

// 🌟 С Сохранением в localStorage
function setWeather(weather) {
    // Сохраняем выбранную погоду
    localStorage.setItem('userWeather', weather);

    // Убираем старую погоду
    document.querySelectorAll('.snowflake, .raindrop, .sunray, .sun-spark, .leaf').forEach(el => el.remove());

    // ✅ ПЛАВНАЯ СМЕНА ФОНА БЕЗ ПОЛОМКИ
    document.body.style.transition = 'background 1s ease-in-out';

    // Устанавливаем класс погоды (все классы!)
    document.body.classList.remove('weather-default', 'weather-winter', 'weather-spring', 'weather-summer', 'weather-autumn');
    document.body.classList.add(`weather-${weather}`);

    // Обновляем текст кнопки
    const dropdownBtn = document.getElementById('weatherDropdown');
    const weatherNames = {
        'default': '🌤️ Стандарт',
        'winter': '❄️ Зима',
        'spring': '🌧️ Весна',
        'summer': '☀️ Лето',
        'autumn': '🍂 Осень'
    };
    if (dropdownBtn) dropdownBtn.innerHTML = weatherNames[weather];

    currentWeather = weather;
    createWeatherEffect(weather);

    // Убираем transition через 1.5 сек
    setTimeout(() => {
        document.body.style.transition = '';
    }, 1500);
}

// 🌀 Загрузка сохраненной погоды
function loadSavedWeather() {
    const savedWeather = localStorage.getItem('userWeather') || 'default';
    setWeather(savedWeather);
}

function createWeatherEffect(weather) {
    const container = document.getElementById('weatherContainer');

    if (weather === 'winter') {
        // ❄️ 30 КРАСИВЫХ СНЕЖИНОК SVG (твой код без изменений)
        for (let i = 0; i < 30; i++) {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.animationDuration = (Math.random() * 8 + 12) + 's';
            snowflake.style.animationDelay = Math.random() * 8 + 's';
            snowflake.style.opacity = Math.random() * 0.7 + 0.3;

            snowflake.innerHTML = `
                <svg viewBox="0 0 24 24" fill="white">
                    <circle cx="12" cy="12" r="2"/>
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26Z"/>
                    <path d="M12 22L10.91 15.74L4 15L10.91 14.26L12 8L13.09 14.26L20 15L13.09 15.74Z"/>
                    <circle cx="12" cy="12" r="1" fill-opacity="0.8"/>
                </svg>
            `;
            container.appendChild(snowflake);
        }
    }
    else if (weather === 'spring') {
        for (let i = 0; i < 50; i++) {
            const rain = document.createElement('div');
            rain.className = 'raindrop';
            rain.style.left = Math.random() * 100 + '%';
            rain.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
            rain.style.animationDelay = Math.random() * 2 + 's';
            rain.style.opacity = Math.random() * 0.5 + 0.3;
            container.appendChild(rain);
        }
    }
    else if (weather === 'summer') {
        // ☀️ 60 ПАДАЮЩИХ ЛУЧЕЙ + 30 искр (твой код)
        for (let i = 0; i < 60; i++) {
            const ray = document.createElement('div');
            ray.className = 'sunray';
            ray.style.left = Math.random() * 100 + '%';
            ray.style.animationDuration = (Math.random() * 4 + 6) + 's';
            ray.style.animationDelay = Math.random() * 3 + 's';
            ray.style.width = (Math.random() * 3 + 2) + 'px';
            ray.style.height = (Math.random() * 30 + 40) + 'px';
            ray.style.transform = `rotate(${Math.random() * 90 + 30}deg)`;
            container.appendChild(ray);
        }

        for (let i = 0; i < 30; i++) {
            const spark = document.createElement('div');
            spark.className = 'sun-spark';
            spark.style.left = Math.random() * 100 + '%';
            spark.style.animationDuration = (Math.random() * 5 + 7) + 's';
            spark.style.animationDelay = Math.random() * 4 + 's';
            container.appendChild(spark);
        }
    }
    else if (weather === 'autumn') {
        const leaves = ['🍁', '🍂', '🍃', '🟤'];
        for (let i = 0; i < 25; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf';
            leaf.innerHTML = leaves[Math.floor(Math.random() * leaves.length)];
            leaf.style.left = Math.random() * 100 + '%';
            leaf.style.animationDuration = (Math.random() * 8 + 12) + 's';
            leaf.style.animationDelay = Math.random() * 5 + 's';
            leaf.style.fontSize = (Math.random() * 10 + 15) + 'px';
            container.appendChild(leaf);
        }
    }
}

//Модалка

document.addEventListener('DOMContentLoaded', function() {
    const avatarImg = document.getElementById('avatarImg');
    let escHandler = null;

    if (!avatarImg) return;

    console.log('✅ Аватар готов, isOwner:', avatarImg.dataset.isOwner);

    avatarImg.addEventListener('click', function() {
        const isOwner = this.dataset.isOwner === 'true';
        console.log('🖱️ Клик! isOwner:', isOwner);

        let buttons = '';
        if (isOwner) {
            buttons = `
                <button class="modal-btn" onclick="changeAvatar()" style="
                    background:#ffd700;color:black;padding:12px 24px;border:none;border-radius:25px;font-weight:bold;font-size:16px;cursor:pointer;margin-right:10px;box-shadow:0 4px 15px rgba(255,215,0,0.4);">
                    📎 Изменить
                </button>`;
            if (this.src.includes('/media/')) {
                buttons += `
                <button class="modal-btn" onclick="deleteAvatar()" style="
                    background:#dc3545;color:white;padding:12px 24px;border:none;border-radius:25px;font-weight:bold;font-size:16px;cursor:pointer;box-shadow:0 4px 15px rgba(220,53,69,0.4);">
                    🗑️ Удалить
                </button>`;
            }
        } else {
            buttons = `
                `;
        }

        document.body.insertAdjacentHTML('beforeend', `
            <div id="avatarModal" style="
                position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);
                z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;">
                <div style="position:relative;max-width:90vw;max-height:90vh;">
                    <div style="position:absolute;top:-70px;right:0;display:flex;gap:10px;z-index:100000;">${buttons}</div>
                    <button onclick="closeModal()" style="
                        position:absolute;top:-70px;left:0;background:rgba(255,255,255,0.2);border:none;
                        color:white;width:50px;height:50px;border-radius:50%;font-size:24px;
                        cursor:pointer;box-shadow:0 4px 15px rgba(0,0,0,0.3);">×</button>
                    <img src="${this.src}" style="
                        max-width:100%;max-height:80vh;width:auto;height:auto;
                        border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,0.9);
                        border:3px solid rgba(255,255,255,0.2);">
                </div>
            </div>
        `);

        escHandler = (e) => e.key === 'Escape' && closeModal();
        document.addEventListener('keydown', escHandler);
        document.getElementById('avatarModal').onclick = (e) => {
            if (e.target.id === 'avatarModal') closeModal();
        };
    });

    // ГЛОБАЛЬНЫЕ ФУНКЦИИ
    window.closeModal = () => {
        const modal = document.getElementById('avatarModal');
        if (modal) modal.remove();
        if (escHandler) document.removeEventListener('keydown', escHandler);
    };

    window.goProfile = () => {
        window.location.href = `/dashboard/`;
        closeModal();
    };

    // ФУНКЦИИ ТОЛЬКО ДЛЯ СВОЕГО ПРОФИЛЯ
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        console.log('✅ avatarInput найден — свой профиль');

        window.changeAvatar = () => {
            avatarInput.click();
            closeModal();
        };

        window.deleteAvatar = () => {
            if (confirm('Удалить аватар?')) {
                const formData = new FormData();
                formData.append('action', 'delete');
                fetch('/upload-avatar/', {
                    method: 'POST', body: formData,
                    headers: {'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value}
                }).then(r=>r.json()).then(d=> {
                    if (d.status === 'deleted') {
                        avatarImg.src = d.default_url + '?t=' + Date.now();
                    }
                }).catch(err=>console.error(err));
            }
        };

        avatarInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = r => avatarImg.src = r.target.result;
                reader.readAsDataURL(file);

                const formData = new FormData();
                formData.append('avatar', file);
                fetch('/upload-avatar/', {
                    method: 'POST', body: formData,
                    headers: {'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value}
                }).then(r=>r.json()).then(d=> {
                    if (d.status === 'success') avatarImg.src = d.url + '?t=' + Date.now();
                });
            }
        };
    } else {
        console.log('✅ avatarInput НЕТ — чужой профиль');
    }
});


// 🎛️ Инициализация СО Сохранением
document.addEventListener('DOMContentLoaded', function() {
    // Обработчики для кнопок погоды
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-weather')) {
            const weather = e.target.getAttribute('data-weather');
            setWeather(weather);
        }
    });

    // ✅ Загружаем СОХРАНЕННУЮ погоду (не default!)
    setTimeout(() => loadSavedWeather(), 0);
});



