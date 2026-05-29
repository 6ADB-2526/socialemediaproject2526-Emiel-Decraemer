from rest_framework import generics, status, permissions
from .serializers import PostSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from .models import Vote, Post

class PostListCreateView(generics.ListCreateAPIView):
    queryset = Post.objects.all().order_by('-created_at') # Nieuwste posts bovenaan
    serializer_class = PostSerializer
    
    # Alleen ingelogde gebruikers mogen POSTEN, iedereen mag LEZEN
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # HIER GEBEURT DE MAGIE: Django pakt de user van het React-token 
        # en koppelt deze als 'author' aan de nieuwe post.
        serializer.save(author=self.request.user)

class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '') # Email is optioneel

        # Basis checks
        if not username or not password:
            return Response({'error': 'Gebruikersnaam en wachtwoord zijn verplicht'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Deze gebruikersnaam bestaat al'}, status=status.HTTP_400_BAD_REQUEST)

        # Maak de gebruiker aan. 
        # Waarom 'create_user' en niet 'create'? Omdat 'create_user' het wachtwoord automatisch veilig versleutelt (hashing)!
        user = User.objects.create_user(username=username, password=password, email=email)

        # Maak direct een Token aan voor deze nieuwe gebruiker, zodat hij meteen is ingelogd
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'message': 'Gebruiker succesvol aangemaakt!',
            'token': token.key,
            'username': user.username
        }, status=status.HTTP_201_CREATED)

class VotePostView(APIView):
    permission_classes = [IsAuthenticated] # Alleen ingelogde gebruikers mogen stemmen!

    def post(self, request, post_id):
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post niet gevonden'}, status=status.HTTP_404_NOT_FOUND)

        # Verwacht een waarde van 1 (upvote), -1 (downvote) of 0 (unvote)
        value = request.data.get('value')
        if value not in [1, -1, 0]:
            return Response({'error': 'Ongeldige vote waarde'}, status=status.HTTP_400_BAD_REQUEST)

        # Kijk of de stem al bestaat
        vote = Vote.objects.filter(user=request.user, post=post).first()

        if value == 0:
            # Als de waarde 0 is, trekken we de stem in
            if vote:
                vote.delete()
            return Response({'message': 'Stem verwijderd', 'score': post.score})

        if vote:
            # Als de stem al bestond, updaten we de waarde (bijv. van up naar down)
            vote.value = value
            vote.save()
        else:
            # Anders maken we een gloednieuwe stem aan
            Vote.objects.create(user=request.user, post=post, value=value)

        return Response({
            'message': 'Stem verwerkt',
            'score': post.score,
            'user_vote': value
        }, status=status.HTTP_200_OK)
    
class VotePostView(APIView):
    permission_classes = [IsAuthenticated]  # Alleen ingelogde gebruikers mogen stemmen

    def post(self, request, post_id):
        # 1. Bestaat de post wel?
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            return Response({'error': 'Post niet gevonden'}, status=status.HTTP_404_NOT_FOUND)

        # 2. Haal de waarde op uit het React verzoek (1 voor up, -1 voor down, 0 voor unvote)
        value = request.data.get('value')
        if value not in [1, -1, 0]:
            return Response({'error': 'Ongeldige stemwaarde'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Kijk of deze gebruiker al eens op deze post gestemd heeft
        existing_vote = Vote.objects.filter(user=request.user, post=post).first()

        if value == 0:
            # Als de waarde 0 is, wil de gebruiker zijn stem intrekken
            if existing_vote:
                existing_vote.delete()
            return Response({'message': 'Stem verwijderd', 'score': post.score, 'user_vote': 0})

        if existing_vote:
            # Gebruiker heeft al gestemd, dus we updaten de stem (bijv. van upvote naar downvote)
            existing_vote.value = value
            existing_vote.save()
        else:
            # Gebruiker heeft nog niet gestemd, dus we maken een nieuwe rij aan
            Vote.objects.create(user=request.user, post=post, value=value)

        # We geven de nieuwe totale score en de huidige stem van de gebruiker terug
        return Response({
            'message': 'Stem succesvol verwerkt',
            'score': post.score,
            'user_vote': value
        }, status=status.HTTP_200_OK)