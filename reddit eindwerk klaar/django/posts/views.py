from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Post, Vote
from .serializers import PostSerializer
from posts import models
from django.db.models import Q


class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Zorgt ervoor dat iedereen een post kan bekijken.
    Schrijfrechten (DELETE, PUT) worden gegeven aan de auteur óf aan een admin/superuser.
    """
    def has_object_permission(self, request, view, obj):
        # Iedereen mag de post bekijken (GET)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Als de ingelogde gebruiker een admin (superuser) is, mag hij ALTIJD verwijderen
        if request.user and request.user.is_superuser:
            return True
            
        # Anders mag het alleen als de ingelogde gebruiker de auteur is
        return obj.author == request.user


class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    def get_queryset(self):
        user = self.request.user
        
        # We beginnen met alle posts, gesorteerd op nieuwste eerst
        queryset = Post.objects.all().order_by('-created_at')
        
        if user and user.is_authenticated:
            # GEBRUIK HIER DIRECT Q:
            # Toon posts die NIET verborgen zijn OF posts die WEL verborgen zijn maar door de ingelogde user zelf gemaakt zijn
            return queryset.filter(Q(is_hidden=False) | Q(is_hidden=True, author=user))
        else:
            # Niet ingelogd? Dan alleen de openbare posts
            return queryset.filter(is_hidden=False)

class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]


@api_view(['POST'])
@permission_classes([permissions.AllowAny]) # Iedereen mag proberen te registreren
def register_view(request):
    """
    Verwerkt de registratie vanuit React. Controleert de voorwaarden,
    maakt de gebruiker aan en geeft direct een token terug.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Gebruikersnaam en wachtwoord zijn verplicht.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Deze gebruikersnaam is al bezet.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Wachtwoordvoorwaarden checken in de backend
    if len(password) < 8:
        return Response(
            {'error': 'Wachtwoord moet minimaal 8 tekens lang zijn.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    if not any(char.isupper() for char in password):
        return Response(
            {'error': 'Wachtwoord moet minimaal één hoofdletter en speciaal teken bevatten.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    if not any(not char.isalnum() for char in password):
        return Response(
            {'error': 'Wachtwoord moet minimaal één speciaal teken bevatten.'}, 
            status=status.HTTP_400_BAD_REQUEST
    )

    try:
        # Maak de gebruiker veilig aan (wachtwoord wordt automatisch gehasht)
        user = User.objects.create_user(username=username, password=password)
        
        # Genereer direct een token voor de nieuwe gebruiker
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'username': user.username,
            'message': 'Account succesvol aangemaakt!'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': 'Er is iets misgegaan tijdens het registreren.'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class CustomLoginView(ObtainAuthToken):
    """
    Verwerkt het inloggen. Controleert de gegevens via Django REST Framework
    en stuurt het token + de username terug naar React.
    """
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'username': user.username
            }, status=status.HTTP_200_OK)
            
        return Response(
            {'non_field_errors': 'Onjuiste gebruikersnaam of wachtwoord.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
class PostVoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
            value = int(request.data.get('value', 0))
            user = request.user

            if post.author == user:
                return Response(
                    {'error': 'Je kunt niet op je eigen bericht stemmen!'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            if value == 0:
                Vote.objects.filter(user=user, post=post).delete()
            else:
                Vote.objects.update_or_create(
                    user=user,
                    post=post,
                    defaults={'value': value}
                )

            # We halen alle stemmen op die bij deze post horen en tellen de 'value' velden bij elkaar op via Python
            alle_stemmen = Vote.objects.filter(post=post)
            total_score = sum(stem.value for stem in alle_stemmen)

            return Response({
                'score': total_score,
                'user_vote': value
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"DJANGO CRASH LOG: {str(e)}")
            return Response({
                'error': 'Interne serverfout in stem-logica',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class PostHideToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
            
            # Alleen de auteur mag zijn eigen post verbergen!
            if post.author != request.user:
                return Response({'error': 'Niet toegestaan'}, status=status.HTTP_403_FORBIDDEN)
            
            # Switch de boolean (True wordt False, False wordt True)
            post.is_hidden = not post.is_hidden
            post.save()
            
            return Response({'is_hidden': post.is_hidden}, status=status.HTTP_200_OK)
            
        except Post.DoesNotExist:
            return Response({'error': 'Post niet gevonden'}, status=status.HTTP_404_NOT_FOUND)