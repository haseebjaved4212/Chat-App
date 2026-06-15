from rest_framework import generics, viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Conversation, Message
from .serializers import RegisterSerializer, UserSerializer, ConversationSerializer, MessageSerializer
from .utils import generate_video_thumbnail
from django.core.files import File
import os

User = get_user_model()

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 30
    page_size_query_param = 'page_size'
    max_page_size = 100

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class UserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        # Exclude the current user
        return User.objects.exclude(id=self.request.user.id)

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return self.request.user.conversations.all().order_by('-updated_at')

    def create(self, request, *args, **kwargs):
        is_group = request.data.get('is_group', False)
        member_ids = request.data.get('members', [])
        
        # Ensure the creator is in the members list
        if request.user.id not in member_ids:
            member_ids.append(request.user.id)

        if not is_group and len(member_ids) == 2:
            # Check if 1-on-1 conversation already exists
            existing_conv = Conversation.objects.filter(is_group=False).filter(members__id=member_ids[0]).filter(members__id=member_ids[1]).first()
            if existing_conv:
                serializer = self.get_serializer(existing_conv)
                return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        conversation_id = self.request.query_params.get('conversation_id')
        if conversation_id:
            # Only allow if user is a member
            if not self.request.user.conversations.filter(id=conversation_id).exists():
                return Message.objects.none()
            return Message.objects.filter(conversation_id=conversation_id).order_by('-timestamp')
        return Message.objects.none()

    def perform_create(self, serializer):
        msg = serializer.save(sender=self.request.user)
        # Update the conversation's updated_at field
        msg.conversation.save()
        
        # If it's a video, generate thumbnail
        if msg.media_type == 'video' and msg.media_file:
            thumb_path = generate_video_thumbnail(msg.media_file.path)
            if thumb_path:
                with open(thumb_path, 'rb') as f:
                    msg.media_thumbnail.save(f"{msg.id}_thumb.jpg", File(f), save=True)
                os.remove(thumb_path)

    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        conversation_id = request.data.get('conversation_id')
        if conversation_id:
            Message.objects.filter(
                conversation_id=conversation_id,
                is_read=False
            ).exclude(sender=request.user).update(is_read=True)
            return Response({"status": "success"})
        return Response({"error": "conversation_id required"}, status=status.HTTP_400_BAD_REQUEST)
