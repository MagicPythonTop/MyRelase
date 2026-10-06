from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),  # ← ЭТО БЫЛО!

    path('api/wall/post/', views.create_wall_post, name='create_wall_post'),
    path('api/wall/<str:profile_id>/', views.get_wall_posts, name='get_wall_posts'),
    path('api/wall/post/<int:post_id>/delete/', views.delete_wall_post, name='delete_wall_post'),
    path('api/wall/post/<int:post_id>/like/', views.toggle_like, name='toggle_like'),
    path('api/wall/post/<int:post_id>/comment/', views.add_comment, name='add_comment'),
    path('api/wall/comment/<int:comment_id>/delete/', views.delete_comment, name='delete_comment'),
    path('api/wall/post/<int:post_id>/comments/', views.get_comments, name='get_comments'),

    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard_redirect, name='dashboard'),

    path('<str:user_id>/', views.user_dashboard, name='user_dashboard'),
]