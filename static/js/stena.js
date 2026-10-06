document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 Stena JS v3.0 - ФИНАЛЬНАЯ ВЕРСИЯ');

    // 🛡️ 1. Парсим URL /ID123/
    const pathMatch = window.location.pathname.match(/^\/([A-Z0-9]+)\/?$/);
    let profileIdStr = pathMatch ? pathMatch[1] : null;

    // 🛡️ 2. /dashboard/ → current user
    if (window.location.pathname === '/dashboard/') {
        profileIdStr = window.DJANGO_CONFIG?.currentUserId || '0';
    }

    console.log('📍 Path:', window.location.pathname);
    console.log('🔍 URL Match:', profileIdStr);

    if (!profileIdStr || profileIdStr === '0') {
        console.error('❌ Не могу определить profile ID из URL!');
        return;
    }

    // ✅ ID как строка "ID123" (не число!)
    const profileId = profileIdStr;
    const currentUserId = window.DJANGO_CONFIG?.currentUserId || profileIdStr;

    console.log('👤 currentUserId:', currentUserId);
    console.log('📱 profileId:', profileId);

    window.currentUserId = currentUserId;
    window.currentProfileId = profileId;

    initWallForm();
    loadWallPosts(profileId);
});

function initWallForm() {
    const postInput = document.getElementById('wallPostInput');
    if (!postInput) return;
    
    const postImageInput = document.getElementById('postImageInput');
    const postSubmitBtn = document.getElementById('postSubmitBtn');
    const charsCounter = document.getElementById('postCharsCounter');
    const imagePreview = document.getElementById('postImagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImageBtn');

    postInput.addEventListener('input', () => {
        charsCounter.textContent = `${postInput.value.length} / 5000`;
    });

    postImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (r) => {
                previewImg.src = r.target.result;
                imagePreview.classList.remove('d-none');
            };
            reader.readAsDataURL(file);
        }
    });

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            postImageInput.value = '';
            imagePreview.classList.add('d-none');
        });
    }

    postSubmitBtn.addEventListener('click', createPost);
}

async function loadWallPosts(profileId) {
    console.log('📥 Загружаем посты ID:', profileId);
    
    try {
        const response = await fetch(`/api/wall/${profileId}/`);
        console.log('📊 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📋 Посты:', data.posts?.length || 0);
        renderPosts(data.posts || []);
    } catch (error) {
        console.error('❌ Ошибка:', error);
        document.getElementById('wallPostsContainer').innerHTML = 
            '<p class="text-white-50 text-center py-5 mb-0">Ошибка загрузки постов</p>';
    }
}

async function createPost() {
    const postInput = document.getElementById('wallPostInput');
    const postImageInput = document.getElementById('postImageInput');
    const postSubmitBtn = document.getElementById('postSubmitBtn');

    const text = postInput.value.trim();
    if (!text && !postImageInput.files[0]) {
        showAlert('Добавьте текст или фото!', 'warning');
        return;
    }

    postSubmitBtn.disabled = true;
    postSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const formData = new FormData();
    formData.append('text', text);
    if (postImageInput.files[0]) formData.append('image', postImageInput.files[0]);

    try {
        const response = await fetch('/api/wall/post/', {
            method: 'POST',
            body: formData,
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        });
        const data = await response.json();

        if (data.success) {
            // 🔥 ПОЛНАЯ ОЧИСТКА + НОВЫЙ ПОСТ
            postInput.value = '';
            postImageInput.value = '';
            document.getElementById('postCharsCounter').textContent = '0 / 5000';
            document.getElementById('postImagePreview')?.classList.add('d-none');

            prependPost(data.post); // ← ФИКСАНУТЫЙ!
            showAlert('Пост опубликован! 🎉', 'success');
        }
    } catch (error) {
        console.error('❌ Ошибка:', error);
        showAlert('Ошибка публикации', 'danger');
    } finally {
        postSubmitBtn.disabled = false;
        postSubmitBtn.innerHTML = '📤 Опубликовать';
    }
}

function renderPosts(posts) {
    const container = document.getElementById('wallPostsContainer');
    if (!posts.length) {
        container.innerHTML = '<p class="text-white-50 text-center py-5 mb-0">Пока нет постов...</p>';
        return;
    }
    container.innerHTML = posts.map(createPostHtml).join('');
}

function prependPost(post) {
    const container = document.getElementById('wallPostsContainer');

    // 🔥 УДАЛЯЕМ "Пока нет постов..." если есть!
    const noPostsMsg = container.querySelector('.text-white-50');
    if (noPostsMsg) {
        noPostsMsg.remove();
    }

    // Добавляем пост НАВЕРХ
    container.insertAdjacentHTML('afterbegin', createPostHtml(post));
}

function createPostHtml(post) {
    const isOwner = post.author_id === window.currentProfileId;

    return `
    <div class="vk-card p-4 mb-3 rounded-3 post-item" data-post-id="${post.id}">
        <div class="d-flex align-items-start gap-3">
            <img src="${post.author_avatar}" class="rounded-circle avatar-48" 
                 alt="${post.author_name}" 
                 onerror="this.src='/static/images/default_avatar.jpg'"
                 style="width:48px;height:48px;object-fit:cover;flex-shrink:0;">
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <strong class="text-white">${post.author_name}</strong>
                        <small class="text-white-50 ms-2">${getTimeAgo(post.created_at || 'сейчас')}</small>
                        
                    </div>
                    ${isOwner ? `
                        <button class="btn btn-sm btn-outline-danger delete-post-btn" 
                                data-post-id="${post.id}" 
                                title="Удалить">
                            <i class="fas fa-trash-alt"></i> 🗑️
                        </button>
                    ` : ''}
                </div>
                
                ${post.text ? `<div class="text-white mb-3 post-text">${post.text}</div>` : ''}
                ${post.image ? `<img src="${post.image}" class="rounded-3 w-100 shadow-sm mb-3 post-img" style="max-height:400px;object-fit:cover;">` : ''}
                
                <!-- 🔥 КРАСИВЫЕ ЛАЙКИ + КОММЕНТАРИИ С АНИМАЦИЕЙ -->
                <div class="post-actions d-flex gap-3 align-items-center">
                    <button class="like-btn btn btn-sm btn-outline-light position-relative p-2 like-hover-effect" 
        data-post-id="${post.id}">
    <i class="far fa-heart me-1 like-icon"></i>  <!-- ← far = ♡ -->
    <span class="like-count fw-bold">${post.likes || 0}</span>
</button>
                    <button class="comment-btn btn btn-sm btn-outline-light position-relative p-2" 
                            data-post-id="${post.id}">
                        <i class="far fa-comment me-1"></i>
                        <span class="comment-count fw-bold">${post.comments || 0}</span>
                    </button>
                    <div class="flex-grow-1"></div>
                    <small class="text-white-50 post-time">${getTimeAgo(post.created_at)}</small>
                </div>
            </div>
        </div>
    </div>`;
}

// 🔥 MSK +3ч к серверному времени!
function getTimeAgo(dateStr) {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('.').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // 🔥 +3ч для MSK!
    let mskHours = hours + 3;
    if (mskHours >= 24) {
        mskHours -= 24;
        // Переход на следующий день логика...
    }

    const postDate = new Date(year, month - 1, day, mskHours, minutes);
    const now = new Date();
    const diffMs = now - postDate;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'сейчас';
    if (diffMin < 60) return `${diffMin}м назад`;
    return `${Math.floor(diffMin/60)}ч назад`;
}

document.addEventListener('click', async (e) => {
    if (e.target.closest('.delete-post-btn')) {
        const postId = e.target.closest('.delete-post-btn').dataset.postId;
        if (confirm('Удалить?')) await deletePost(postId, e.target.closest('.post-item'));
        return;
    }

    if (e.target.closest('.like-btn')) {
        const btn = e.target.closest('.like-btn');
        await toggleLike(btn.dataset.postId, btn);
        return;
    }

    // 💬 НОВЫЕ КОММЕНТАРИИ!
    if (e.target.closest('.comment-btn')) {
        await toggleComments(e.target.closest('.comment-btn').dataset.postId);
        return;
    }

    if (e.target.classList.contains('submit-comment-btn')) {
        await submitComment(e.target.dataset.postId);
        return;
    }

    if (e.target.closest('.delete-comment-btn')) {
    const commentId = e.target.closest('.delete-comment-btn').dataset.commentId;
    const postId = e.target.closest('.delete-comment-btn').dataset.postId;
    if (confirm('Удалить комментарий?')) {
        await deleteComment(commentId, postId);
    }
    return;
}
});


// 🔥 КОММЕНТАРИИ
let commentsOpen = new Set();  // Открытые посты

async function toggleComments(postId) {
    const postItem = document.querySelector(`[data-post-id="${postId}"]`);
    const btn = postItem.querySelector('.comment-btn');
    const countEl = postItem.querySelector('.comment-count');

    // 🔥 СОХРАНЯЕМ НАСТОЯЩИЙ СЧЁТЧИК!
    const currentCount = parseInt(countEl.textContent) || 0;

    if (commentsOpen.has(postId)) {
        // Закрыть
        postItem.querySelector('.comments-container')?.remove();
        commentsOpen.delete(postId);
        // 🔥 ВОССТАНАВЛИВАЕМ СЧЁТЧИК!
        btn.innerHTML = `<i class="far fa-comment me-1"></i><span class="comment-count fw-bold">${currentCount}</span>`;
    } else {
        // Открыть
        await loadComments(postId, postItem);
        commentsOpen.add(postId);
        // 🔥 СЧЁТЧИК НЕ МЕНЯЕМ!
        btn.innerHTML = `<i class="fas fa-comment me-1"></i><span class="comment-count fw-bold">${currentCount}</span>`;
    }
}

async function loadComments(postId, postItem) {
    const response = await fetch(`/api/wall/post/${postId}/comments/`);
    const {comments} = await response.json();

    const container = document.createElement('div');
    container.className = 'comments-container mt-4';
    container.innerHTML = `
        <div class="comments-list">${comments.map(createCommentHtml).join('')}</div>
        
        <!-- 🔥 ФОРМА С КНОПКОЙ "Отправить" -->
        <div class="comment-form mt-4 p-3">
            <div class="input-group">
                <textarea class="form-control bg-transparent border-0 text-white ps-4 shadow-none" 
                          rows="1" placeholder="Напиши комментарий..." data-post-id="${postId}"
                          style="outline:none;resize:none;font-size:1rem;" maxlength="1000"></textarea>
                <button class="btn btn-primary submit-comment-btn px-4 py-2 ms-2 shadow-sm" data-post-id="${postId}">
                    Отправить
                </button>
            </div>
        </div>
    `;

    postItem.querySelector('.post-actions').after(container);

    // Auto-resize textarea
    const textarea = container.querySelector('textarea');
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });
    textarea.focus();

    // Enter отправляет
    textarea.addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            container.querySelector('.submit-comment-btn').click();
        }
    });
}

// noinspection JSUnusedGlobalSymbols
async function deleteComment(commentId, postId) {
    if (!confirm('Удалить комментарий?')) return;

    // 🔥 ШАГ 1: НАЙДИ КОММЕНТ
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!commentElement) {
        showAlert('Комментарий не найден', 'warning');
        return;
    }

    // 🔥 ШАГ 2: НАЙДИ СЧЁТЧИК
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    const countEl = postElement?.querySelector('.comment-count');
    const currentCount = parseInt(countEl?.textContent || 0);

    // 🔥 ШАГ 3: УДАЛИТЬ + ОБНОВИТЬ СЧЁТЧИК
    commentElement.closest('.comment-item').style.transition = 'opacity 0.3s ease';
    commentElement.closest('.comment-item').style.opacity = '0';

    setTimeout(() => {
        commentElement.closest('.comment-item').remove();

        // 🔥 НОВЫЙ СЧЁТЧИК
        if (countEl) {
            const newCount = Math.max(0, currentCount - 1);
            countEl.textContent = newCount;
        }

        showAlert('🗑️ Удалено!', 'success');
    }, 300);
}


function createCommentHtml(c) {
    return `
    <div class="comment-item mb-3 p-0 position-relative" data-comment-id="${c.id}">
        <div class="d-flex align-items-start gap-3 p-3 hover-bg">
            <img src="${c.author_avatar}" class="rounded-circle flex-shrink-0 mt-1" 
                 style="width:42px;height:42px;object-fit:cover;border:2px solid rgba(255,255,255,0.15);"
                 alt="${c.author_name}" onerror="this.src='/static/images/default_avatar.jpg'">
            
            <div class="flex-grow-1 min-w-0">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center gap-2 flex-grow-1">
                        <strong class="text-white fw-semibold">${c.author_name}</strong>
                        <small class="text-white-50">${getTimeAgo(c.created_at)}</small>
                    </div>
                    <!-- 🔥 КОРЗИНА БОЛЬШАЯ + КРАСНАЯ НА HOVER! -->
                    <button class="btn p-2 m-1 delete-comment-btn bg-transparent border-0 rounded-circle shadow-none"
                            data-comment-id="${c.id}" data-post-id="${c.post_id}" title="Удалить"
                            style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;opacity:0.6;transition:all 0.2s ease;">
                        <i class="fas fa-trash-can text-muted fs-5" style="transition:all 0.2s ease;"></i>
                    </button>
                </div>
                <div class="text-white lh-lg">${c.text}</div>
            </div>
        </div>
        <hr class="border-secondary-subtle mx-4 opacity-25 my-0">
    </div>`;
}

async function submitComment(postId) {
    const textarea = document.querySelector(`textarea[data-post-id="${postId}"]`);
    const text = textarea.value.trim();
    if (text.length < 2) return;

    const formData = new FormData(); formData.append('text', text);

    try {
        const response = await fetch(`/api/wall/post/${postId}/comment/`, {
            method: 'POST', body: formData,
            headers: {'X-CSRFToken': getCookie('csrftoken')}
        });
        const data = await response.json();

        if (data.success) {
            prependComment(postId, data.comment);
            textarea.value = '';

            // 🔥 БЕРЁМ ТОЧНЫЙ СЧЁТЧИК ИЗ API!
            const countEl = document.querySelector(`[data-post-id="${postId}"] .comment-count`);
            countEl.textContent = data.comments_count;  // ← НОВОЕ!

            showAlert('💬 Отправлено!', 'success');
        }
    } catch (error) {
        showAlert('Ошибка', 'danger');
    }
}

function prependComment(postId, comment) {
    const list = document.querySelector(`[data-post-id="${postId}"] .comments-list`);
    if (list) list.insertAdjacentHTML('afterbegin', createCommentHtml(comment));
}

// 🔥 НОВАЯ ФУНКЦИЯ deletePost с проверкой пустоты
async function deletePost(postId, postElement) {
    try {
        const response = await fetch(`/api/wall/post/${postId}/delete/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        });

        const data = await response.json();
        if (data.success) {
            postElement.remove(); // Удаляем элемент

            // 🔥 ПРОВЕРЯЕМ ПУСТОТУ КОНТЕЙНЕРА!
            const container = document.getElementById('wallPostsContainer');
            if (container.children.length === 0) {
                container.innerHTML = '<p class="text-white-50 text-center py-5 mb-0">Пока нет постов...</p>';
            }

            showAlert('Пост удалён!', 'success');
        }
    } catch (error) {
        showAlert('Ошибка удаления', 'danger');
        console.error('❌ Ошибка:', error);
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

//Лайки
async function toggleLike(postId, btn) {
    console.log('🔥 ЛАЙК ПОСТА:', postId);

    try {
        const response = await fetch(`/api/wall/post/${postId}/like/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('📡 API ОТВЕТ:', data);

        if (data.success) {
            // 🔥 СЧЁТЧИК
            const count = btn.querySelector('.like-count');
            if (count) count.textContent = data.likes_count;

            // 🔥 АНИМАЦИЯ + ИКОНКА + ТОСТ ← ЭТОГО НЕТ В ТВОЁМ JS!
            btn.style.transform = 'scale(1.1)';
            setTimeout(()=>btn.style.transform='', 200);

            const icon = btn.querySelector('.like-icon');
            if (data.liked) {
                icon.className = 'fas fa-heart me-1 like-icon'; // ♥
                showAlert('♥ Лайк поставлен!', 'success');     // 🔥 УВЕДОМЛЕНИЕ!
            } else {
                icon.className = 'far fa-heart me-1 like-icon'; // ♡
                showAlert('♡ Лайк убран', 'info');
            }
        }
    } catch (error) {
        console.error('❌ ЛАЙК:', error);
        showAlert('Ошибка лайка 😔', 'warning');
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showAlert(message, type = 'info') {
    // 🔥 УБИРАЕМ СТАРЫЙ ТОСТ
    document.querySelectorAll('.custom-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show custom-toast`;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999; 
        min-width: 300px; max-width: 400px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: none; border-radius: 10px;
    `;
    toast.innerHTML = `
        <div class="d-flex">
            <i class="fas ${type==='success' ? 'fa-check-circle text-success me-2' : 
                           type==='danger' ? 'fa-exclamation-circle text-danger me-2' : 
                           type==='warning' ? 'fa-exclamation-triangle text-warning me-2' : 'fa-info-circle text-info me-2'}"></i>
            <strong>${message}</strong>
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.parentElement.remove()"></button>
        </div>
    `;
    document.body.appendChild(toast);

    // 🔥 АНИМАЦИЯ ВЫЛЕТА
    setTimeout(() => {
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
