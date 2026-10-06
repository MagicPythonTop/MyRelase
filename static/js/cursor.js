// 🔥 КРУГ + ТЯНУЩИЙСЯ СЛЕД (ждёт погоду!)
(function() {
    let cursor, trails = [];
    const maxTrails = 15;
    const trailDuration = 800;
    let mouseX = 0, mouseY = 0, prevX = 0, prevY = 0;
    let hoverEffectsAdded = false;

    // ✅ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ КУРСОРА
    function initCursor() {
        // Удаляем старый курсор если есть
        const oldCursor = document.querySelector('.lava-circle-cursor');
        if (oldCursor) oldCursor.remove();

        cursor = document.createElement('div');
        cursor.className = 'lava-circle-cursor';
        cursor.style.display = 'block';
        document.body.appendChild(cursor);

        // ✅ ПРОВЕРЯЕМ ПОГОДУ ПРИ КАЖДОМ ДВИЖЕНИИ
        document.addEventListener('mousemove', updateCursor);
        addHoverEffects();
    }

    function updateCursor(e) {
        prevX = mouseX;
        prevY = mouseY;
        mouseX = e.clientX;
        mouseY = e.clientY;

        // ✅ ЦЕНТРИРУЕМ + ФОРСИМ ВИДИМОСТЬ
        if (cursor) {
            cursor.style.left = (mouseX - 12) + 'px';
            cursor.style.top = (mouseY - 12) + 'px';
            cursor.style.display = 'block';
        }

        createTrail(mouseX, mouseY, prevX, prevY);
    }

    function createTrail(x, y, prevX, prevY) {
        if (trails.length > maxTrails) {
            const oldTrail = trails.shift();
            if (oldTrail) oldTrail.remove();
        }

        const trail = document.createElement('div');
        trail.className = 'trail';
        const distance = Math.sqrt(Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2));
        const size = Math.max(8, Math.min(20, distance * 0.5));

        trail.style.width = size + 'px';
        trail.style.height = size + 'px';
        trail.style.left = (x - size/2) + 'px';
        trail.style.top = (y - size/2) + 'px';
        trail.style.opacity = '0.8';

        document.body.appendChild(trail);
        trails.push(trail);

        setTimeout(() => {
            trail.style.opacity = '0';
            trail.style.transform = `scale(0.3) translateY(20px)`;
        }, 50);

        setTimeout(() => {
            if (trail.parentNode) {
                trail.remove();
                const index = trails.indexOf(trail);
                if (index > -1) trails.splice(index, 1);
            }
        }, trailDuration);
    }

    function addHoverEffects() {
        if (hoverEffectsAdded) return;
        hoverEffectsAdded = true;

        document.body.style.cursor = 'none';

        // ССЫЛКИ
        document.querySelectorAll('a, [role="button"], .btn').forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (cursor) {
                    cursor.classList.remove('hover-input');
                    cursor.classList.add('hover-link');
                }
            });
            el.addEventListener('mouseleave', () => {
                if (cursor) {
                    cursor.classList.remove('hover-link');
                }
            });
        });

        // ПОЛЯ
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.addEventListener('mouseenter', () => {
                if (cursor) {
                    cursor.classList.remove('hover-link');
                    cursor.classList.add('hover-input');
                }
            });
            el.addEventListener('mouseleave', () => {
                if (cursor) cursor.classList.remove('hover-input');
            });
        });

        // КЛИК
        document.addEventListener('mousedown', () => {
            if (cursor) cursor.classList.add('click');
        });
        document.addEventListener('mouseup', () => {
            if (cursor) cursor.classList.remove('click');
        });
    }

    // ✅ СИНХРОНИЗАЦИЯ С ТВОИМ WEATHER.JS
    function syncWithWeather() {
        const weatherClass = document.body.className.match(/weather-(\w+)/);
        if (weatherClass && !document.querySelector('.lava-circle-cursor')) {
            initCursor();
        }
    }

    // ✅ ЖДЁМ DOM + WEATHER
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(syncWithWeather, 100);  // Даём weather.js загрузиться
        });
    } else {
        setTimeout(syncWithWeather, 100);
    }

    // ✅ Observer для модалки
    const observer = new MutationObserver(() => {
        const avatarModal = document.querySelector('.avatar-modal');
        if (avatarModal) {
            avatarModal.style.cursor = 'inherit !important';
            document.querySelectorAll('.modal-avatar-img, .modal-btn, .btn-close').forEach(el => {
                el.style.cursor = 'inherit !important';
            });
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ✅ ПЕРИОДИЧЕСКАЯ ПРОВЕРКА ПОГОДЫ
    setInterval(syncWithWeather, 500);
})();
