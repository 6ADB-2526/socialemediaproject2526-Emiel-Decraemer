from django.urls import path
from .views import PostListCreateView, PostDetailView, register_view, CustomLoginView, PostVoteView, PostHideToggleView

urlpatterns = [
    # Posts
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:pk>/vote/', PostVoteView.as_view(), name='post-vote'),
    path('posts/<int:pk>/hide/', PostHideToggleView.as_view(), name='post-hide-toggle'),

    # Authenticatie (Hier sluit React op aan!)
    path('register/', register_view, name='api-register'),
    path('login/', CustomLoginView.as_view(), name='api-login'),
]

