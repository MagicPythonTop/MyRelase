from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model



class CustomUser(AbstractUser):
    personal_id = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(unique=True)
    bio = models.TextField(max_length=500, blank=True)

    def __str__(self):
        return self.username


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        default='avatars/default_avatar.jpg'  # ← ДОБАВИТЬ!
    )

    def __str__(self):
        return f'{self.user.username} Profile'


class Post(models.Model):
    author = models.ForeignKey('Profile', on_delete=models.CASCADE, related_name='posts')
    text = models.TextField(max_length=5000, blank=True)
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    comments = models.IntegerField(default=0)  # Пока простой счетчик

    class Meta:
        ordering = ['-created_at']

User = get_user_model()
class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'post']  # Один лайк на пост

    def __str__(self):
        return f"{self.user.username} liked {self.post.id}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments_list')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.username} → {self.post.id}"

    def can_delete(self, user):
        """🔥 Может ли удалить: автор ИЛИ владелец поста"""
        return user == self.author or user == self.post.author.user

    class Meta:
        ordering = ['-created_at']


# ✅ СИГНАЛЫ для CustomUser
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
