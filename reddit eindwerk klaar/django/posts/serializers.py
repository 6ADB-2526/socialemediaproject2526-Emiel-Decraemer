from rest_framework import serializers
from .models import Post, Vote

class PostSerializer(serializers.ModelSerializer):
    # DIT IS DE FIX: We vertellen Django dat hij de username van het gerelateerde 'author' object moet pakken
    author_username = serializers.ReadOnlyField(source='author.username')
    
    # De dynamische velden voor de stemmen
    score = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Post
        # Nu is 'author_username' hier 100% geldig!
        fields = ['id', 'title', 'content', 'image', 'created_at', 'author_username', 'score', 'user_vote', 'is_hidden']

    # Berekent de totale score (upvotes minus downvotes) voor de feed
    def get_score(self, obj):
        alle_stemmen = Vote.objects.filter(post=obj)
        return sum(stem.value for stem in alle_stemmen)

    # Kijkt of de op dit moment ingelogde gebruiker al op deze post gestemd heeft
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            try:
                vote = Vote.objects.get(user=request.user, post=obj)
                return vote.value
            except Vote.DoesNotExist:
                return 0
        return 0