from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from .views import PostListCreateView, RegisterView, VotePostView

urlpatterns = [
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('register/', RegisterView.as_view(), name='register'),
    
    # Dit pad reageert op /api/login/ (omdat core/urls.py er 'api/' voor zet)
    path('login/', obtain_auth_token, name='api-login'),
    
    path('posts/<int:post_id>/vote/', VotePostView.as_view(), name='vote-post'),
]