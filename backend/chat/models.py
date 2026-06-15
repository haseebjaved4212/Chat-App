from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from .utils import validate_file_size, validate_file_extension

class CustomUser(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    online_status = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username

class Conversation(models.fields.related.RelatedField):
    pass # to resolve NameError in M2M before definition

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    members = models.ManyToManyField(CustomUser, related_name='conversations')
    is_group = models.BooleanField(default=False)
    group_name = models.CharField(max_length=255, null=True, blank=True)
    group_avatar = models.ImageField(upload_to='group_avatars/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.is_group:
            return f"Group: {self.group_name}"
        return f"1-on-1: {self.id}"

class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='messages_sent')
    text = models.TextField(blank=True)
    
    # Media handling
    MEDIA_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
        ('none', 'None'),
    )
    media_file = models.FileField(
        upload_to='chat_media/', 
        null=True, 
        blank=True,
        validators=[validate_file_size, validate_file_extension]
    )
    media_thumbnail = models.ImageField(upload_to='chat_media/thumbnails/', null=True, blank=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='none')
    
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Msg {self.id} by {self.sender.username if self.sender else 'Unknown'}"
