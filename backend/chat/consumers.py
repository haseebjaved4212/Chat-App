import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from .serializers import MessageSerializer

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_anonymous:
            await self.close()
        else:
            # We add user to a personal group for direct notifications (like online status updates)
            self.user_group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            
            # Broadcast user online status
            await self.set_online_status(True)
            await self.broadcast_status_to_contacts(True)

            await self.accept()

    async def disconnect(self, close_code):
        if not self.user.is_anonymous:
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
            
            # Broadcast user offline status
            await self.set_online_status(False)
            await self.broadcast_status_to_contacts(False)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'join_room':
            conversation_id = data.get('conversation_id')
            await self.channel_layer.group_add(
                f"chat_{conversation_id}",
                self.channel_name
            )

        elif action == 'leave_room':
            conversation_id = data.get('conversation_id')
            await self.channel_layer.group_discard(
                f"chat_{conversation_id}",
                self.channel_name
            )

        elif action == 'chat_message':
            conversation_id = data.get('conversation_id')
            text = data.get('text', '')
            media_url = data.get('media_url', None)
            media_type = data.get('media_type', 'none')

            message_data = await self.save_message(conversation_id, text, media_url, media_type)
            if message_data:
                await self.channel_layer.group_send(
                    f"chat_{conversation_id}",
                    {
                        'type': 'chat_message_event',
                        'message': message_data
                    }
                )

        elif action == 'typing':
            conversation_id = data.get('conversation_id')
            is_typing = data.get('is_typing', False)
            await self.channel_layer.group_send(
                f"chat_{conversation_id}",
                {
                    'type': 'typing_event',
                    'user_id': str(self.user.id),
                    'is_typing': is_typing
                }
            )

    async def chat_message_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))

    async def status_update_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'user_id': event['user_id'],
            'is_online': event['is_online']
        }))

    @database_sync_to_async
    def save_message(self, conversation_id, text, media_url, media_type):
        try:
            conv = Conversation.objects.get(id=conversation_id)
            if self.user not in conv.members.all():
                return None
            msg = Message.objects.create(
                conversation=conv,
                sender=self.user,
                text=text,
                media_type=media_type
            )
            # Handle media assigning if uploaded previously via API (simulated here)
            # Often, media is uploaded via REST, and then WS is notified, or sent text with media ID.
            return MessageSerializer(msg).data
        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def set_online_status(self, is_online):
        self.user.online_status = is_online
        self.user.save(update_fields=['online_status'])

    @database_sync_to_async
    def get_contact_ids(self):
        # Users in shared conversations
        contacts = set()
        for conv in self.user.conversations.all():
            for member in conv.members.all():
                if member != self.user:
                    contacts.add(member.id)
        return list(contacts)

    async def broadcast_status_to_contacts(self, is_online):
        contact_ids = await self.get_contact_ids()
        for contact_id in contact_ids:
            await self.channel_layer.group_send(
                f"user_{contact_id}",
                {
                    'type': 'status_update_event',
                    'user_id': str(self.user.id),
                    'is_online': is_online
                }
            )
