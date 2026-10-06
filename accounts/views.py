from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.conf import settings  # ← Для MEDIA_ROOT
import os                           # ← Для удаления файлов
import uuid
from .forms import RegisterForm, LoginForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Post, Profile
from django.contrib.auth import get_user_model
User = get_user_model()
from .models import Like, Comment


def home(request):
    if request.user.is_authenticated:
        return redirect(f'/{request.user.personal_id}/')  # ← ID вместо dashboard
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect(f'/{user.personal_id}/')  # ← ID вместо dashboard
        else:
            messages.error(request, '❌ Неверный логин или пароль')
    return render(request, 'users/home.html')


def register(request):
    print("🔥 REGISTER VIEW ВЫЗВАН")
    if request.user.is_authenticated:
        print("👤 Уже авторизован")
        return redirect(f'/{request.user.personal_id}/')

    if request.method == 'POST':
        print("📤 POST запрос")
        form = RegisterForm(request.POST)
        if form.is_valid():
            print("✅ ФОРМА ВАЛИДНА")
            user = form.save()

            # ✅ ГЕНЕРИРУЕМ UNIQUE ID
            import uuid
            user.personal_id = f"ID{uuid.uuid4().hex[:4].upper()}"
            user.save()

            print(f"👤 Создан: {user.username}, ID: {user.personal_id}")
            login(request, user)  # Автологин
            return redirect(f'/{user.personal_id}/')  # ← На ID!
        else:
            print("❌ ФОРМА НЕВАЛИДНА")
            print(f"🔴 ОШИБКИ: {form.errors}")
    else:
        form = RegisterForm()

    return render(request, 'accounts/register.html', {'form': form})


def login_view(request):
    if request.user.is_authenticated:
        return redirect(f'/{request.user.personal_id}/')

    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user:
                login(request, user)
                return redirect(f'/{user.personal_id}/')  # ← ID!
            else:
                messages.error(request, '❌ Неверный логин/пароль')
    else:
        form = LoginForm()
    return render(request, 'accounts/login.html', {'form': form})


@login_required
def logout_view(request):
    logout(request)
    messages.success(request, '👋 Вы вышли из аккаунта!')
    return redirect('/')


# ✅ НОВЫЕ ФУНКЦИИ ДЛЯ ID URL
@login_required
def dashboard_redirect(request):
    """dashboard/ → /ID0001/"""
    return redirect(f'/{request.user.personal_id}/')


@login_required
def user_dashboard(request, user_id):
    """ 👤 Чужой/свой профиль /IDCE55/ """
    profile = get_object_or_404(Profile, user__personal_id=user_id)

    context = {
        'current_user': request.user,  # Кто зашёл
        'profile_user': profile.user,  # Владелец профиля
        'profile': profile,  # Данные профиля
        'profile_id': user_id,  # IDCE55
        'is_owner': request.user.personal_id == user_id,
        'visiting_profile': request.user.personal_id != user_id,
    }
    return render(request, 'accounts/dashboard.html', context)


# ✅ 1. ФУНКЦИЯ СОЗДАНИЯ ПОСТА (исправленная)
@csrf_exempt
def create_wall_post(request):
    print("🚀 CREATE POST!")

    if request.method != 'POST':
        return JsonResponse({'error': 'Только POST'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Не авторизован'}, status=401)

    # 🔥 ПРОВЕРКА PROFILE
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        return JsonResponse({'error': 'Profile не найден'}, status=500)

    text = request.POST.get('text', '').strip()
    image = request.FILES.get('image')

    if not text and not image:
        return JsonResponse({'error': 'Текст или фото'}, status=400)

    post = Post.objects.create(
        author=profile,
        text=text[:5000],
        image=image
    )

    print(f"✅ ПОСТ # {post.id} СОЗДАН!")

    return JsonResponse({
        'success': True,
        'post': {
            'id': post.id,
            'author_id': request.user.personal_id,
            'author_name': request.user.username,
            'author_avatar': (profile.avatar.url if profile.avatar else
                              '/static/images/default_avatar.jpg'),
            'text': post.text,
            'image': post.image.url if post.image else None,
            'created_at': post.created_at.strftime('%d.%m.%Y %H:%M'),
            'likes': 0,
            'comments': 0
        }
    })


@require_http_methods(["GET"])
def get_wall_posts(request, profile_id):
    print(f"🔍 get_wall_posts({profile_id})")

    try:
        # 🔥 НАЙДЕНЫЙ КОД - РАБОТАЕТ!
        user = User.objects.filter(personal_id=profile_id).first()
        if not user:
            print(f"❌ User {profile_id} НЕ НАЙДЕН")
            return JsonResponse({'posts': []})

        profile = getattr(user, 'profile', None)
        if not profile:
            print(f"❌ Profile для {profile_id} НЕТ")
            return JsonResponse({'posts': []})

        posts = Post.objects.filter(author=profile).order_by('-created_at')[:20]

    except Exception as e:
        print(f"💥 ОШИБКА: {e}")
        return JsonResponse({'posts': []})

    posts_data = []
    for post in posts:
        try:
            posts_data.append({
                'id': post.id,
                'author_id': post.author.user.personal_id,
                'author_name': post.author.user.username,
                'author_avatar': (post.author.avatar.url if hasattr(post.author, 'avatar') and post.author.avatar
                                  else '/static/images/default_avatar.jpg'),
                'text': post.text or '',
                'image': post.image.url if hasattr(post, 'image') and post.image else None,
                'created_at': post.created_at.strftime('%d.%m.%Y %H:%M') if post.created_at else '26.01.2026 10:00',
                'likes': Like.objects.filter(post=post).count(),
                'comments': post.comments_list.all().count(),
            })
        except Exception as e:
            print(f"💥 Пост {post.id}: {e}")
            continue

    print(f"✅ Вернули {len(posts_data)} постов")
    return JsonResponse({'posts': posts_data})


@csrf_exempt
def delete_wall_post(request, post_id):  # ← УБЕРИ @require_http_methods!
    print(f"🗑️ DELETE POST ID={post_id}")

    if request.method != 'POST':
        return JsonResponse({'error': 'Только POST'}, status=405)

    try:
        post = Post.objects.get(id=post_id)
        if post.author.user != request.user:
            return JsonResponse({'error': 'Нет прав'}, status=403)

        post.delete()
        return JsonResponse({'success': True})
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Пост не найден'}, status=404)

@login_required
@csrf_exempt
def upload_avatar(request):
    """AJAX загрузка + УДАЛЕНИЕ + ДЕФОЛТ"""
    if request.method == 'POST':
        profile = request.user.profile

        # ✅ УДАЛЕНИЕ АВАТАРА
        if request.POST.get('action') == 'delete':
            old_avatar = profile.avatar
            profile.avatar = None  # ← ОЧИЩАЕМ ПОЛЕ
            profile.save()

            # Удаляем файл
            if old_avatar:
                try:
                    if os.path.isfile(old_avatar.path):
                        os.remove(old_avatar.path)
                except:
                    pass

            return JsonResponse({
                'status': 'deleted',
                'default_url': '/static/images/default_avatar.jpg',
                'message': 'Аватар удалён!'
            })

        # ✅ НОВЫЙ АВАТАР
        elif request.FILES.get('avatar'):
            # Удаляем старый
            if profile.avatar:
                try:
                    if os.path.isfile(profile.avatar.path):
                        os.remove(profile.avatar.path)
                except:
                    pass

            profile.avatar = request.FILES['avatar']
            profile.save()

            return JsonResponse({
                'status': 'success',
                'url': profile.avatar.url,
                'message': 'Аватар обновлён!'
            })

    return JsonResponse({'status': 'error'}, status=400)


@csrf_exempt
@login_required
def toggle_like(request, post_id):
    """❤️ ЛАЙК/ДИЗЛАЙК поста"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Только POST'}, status=405)

    try:
        post = Post.objects.get(id=post_id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)

        if not created:  # Уже лайкнул → убираем
            like.delete()
            liked = False
            likes_count = Like.objects.filter(post=post).count()
        else:  # Новый лайк
            liked = True
            likes_count = Like.objects.filter(post=post).count()

        return JsonResponse({
            'success': True,
            'liked': liked,
            'likes_count': likes_count
        })

    except Post.DoesNotExist:
        return JsonResponse({'error': 'Пост не найден'}, status=404)


# НОВЫЕ ФУНКЦИИ (ПОСЛЕ toggle_like):
@csrf_exempt
@login_required
def add_comment(request, post_id):
    if request.method != 'POST': return JsonResponse({'error': 'POST only'}, status=405)

    try:
        post = Post.objects.get(id=post_id)
        text = request.POST.get('text', '').strip()
        if not (2 <= len(text) <= 1000): return JsonResponse({'error': '2-1000 символов'}, status=400)

        comment = Comment.objects.create(post=post, author=request.user, text=text)

        # 🔥 НЕ ТРОГАЙ post.comments! БД посчитает сама!
        return JsonResponse({
            'success': True,
            'comments_count': post.comments_list.all().count(),  # 🔥 Реальный счётчик!
            'comment': {
                'id': comment.id, 'author_id': request.user.personal_id,
                'author_name': request.user.username,
                'author_avatar': (
                    request.user.profile.avatar.url if request.user.profile.avatar else '/static/images/default_avatar.jpg'),
                'text': comment.text, 'created_at': comment.created_at.strftime('%d.%m.%Y %H:%M')
            }
        })
    except:
        return JsonResponse({'error': 'Пост не найден'}, status=404)


@csrf_exempt
@login_required
def delete_comment(request, comment_id):
    """🗑️ Удаление комментария"""
    if request.method != 'POST': return JsonResponse({'error': 'POST only'}, status=405)

    try:
        comment = Comment.objects.get(id=comment_id)
        if not comment.can_delete(request.user):
            return JsonResponse({'error': 'Нет прав'}, status=403)

        post_id = comment.post.id
        comment.delete()

        return JsonResponse({
            'success': True,
            'post_id': post_id,
            'comments_count': Comment.objects.filter(post=comment.post).count()
        })
    except:
        return JsonResponse({'error': 'Не найден'}, status=404)


@require_http_methods(["GET"])
def get_comments(request, post_id):
    """💬 УЛУЧШЕННЫЙ - с кнопками удаления"""
    try:
        post = Post.objects.get(id=post_id)
        comments = post.comments_list.all()[:10]

        comments_data = []
        for comment in comments:
            can_delete = comment.can_delete(request.user)
            comments_data.append({
                'id': comment.id,
                'post_id': post_id,
                'author_id': comment.author.personal_id,
                'author_name': comment.author.username,
                'author_avatar': (
                    comment.author.profile.avatar.url if comment.author.profile.avatar else '/static/images/default_avatar.jpg'),
                'text': comment.text,
                'created_at': comment.created_at.strftime('%d.%m.%Y %H:%M'),
                'can_delete': can_delete  # 🔥 Для кнопки 🗑️
            })

        return JsonResponse({'comments': comments_data})
    except:
        return JsonResponse({'comments': []})


@require_http_methods(["GET"])
def get_comments(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
        comments = [{'id': c.id, 'author_id': c.author.personal_id, 'author_name': c.author.username,
                     'author_avatar': (
                         c.author.profile.avatar.url if c.author.profile.avatar else '/static/images/default_avatar.jpg'),
                     'text': c.text, 'created_at': c.created_at.strftime('%d.%m.%Y %H:%M')}
                    for c in post.comments_list.all()[:10]]
        return JsonResponse({'comments': comments})
    except:
        return JsonResponse({'comments': []})