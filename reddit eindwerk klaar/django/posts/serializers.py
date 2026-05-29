from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    # Dit veld haalt automatisch de gebruikersnaam van de auteur op (b.v. "u/Emiel")
    # We zetten read_only=True zodat React dit veld niet verplicht hoeft op te sturen
    author_username = serializers.CharField(source='author.username', read_only=True)
    
    # Dit veld berekent de live score (upvotes minus downvotes) van de post
    score = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        # Deze velden worden als JSON naar React gestuurd
        fields = ['id', 'title', 'content', 'created_at', 'score', 'author_username']
        
        # Super belangrijk: read_only_fields vertelt Django welke velden 
        # AUTOMATISCH door de backend worden ingevuld. React hoeft deze dus NIET mee te sturen.
        read_only_fields = ['id', 'created_at', 'score', 'author_username']