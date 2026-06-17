from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    # Veld voor de afbeelding. Pillow verwerkt dit.
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    is_hidden = models.BooleanField(default=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def __str__(self):
        return self.title

class Vote(models.Model):
    # Welke gebruiker stemt?
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # Op welke post wordt gestemd?
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='votes')
    # Is het een upvote (1) of downvote (-1)?
    value = models.IntegerField() 

    class Meta:
        # Dit is CRUCIAAL: Een combinatie van user en post mag maar één keer voorkomen.
        # Dit voorkomt dat een gebruiker 100 keer op dezelfde post kan stemmen!
        unique_together = ('user', 'post')