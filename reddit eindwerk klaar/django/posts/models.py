from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')

    def __str__(self):
        return self.title

    # Handige extra functie: berekent direct de totale score (upvotes minus downvotes)
    @property
    def score(self):
        # Tel alle 'value' velden van de gekoppelde votes bij elkaar op
        return self.votes.aggregate(models.Sum('value'))['value__sum'] or 0


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