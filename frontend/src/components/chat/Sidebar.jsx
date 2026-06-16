import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { WebSocketContext } from '../../context/WebSocketContext';
import { Users, LogOut, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import NewChatModal from './NewChatModal';

const Sidebar = ({ activeConversation, setActiveConversation }) => {
    const [conversations, setConversations] = useState([]);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const { authTokens, logoutUser, user } = useContext(AuthContext);
    const { onlineUsers } = useContext(WebSocketContext);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/conversations/', {
                    headers: {
                        Authorization: `Bearer ${authTokens?.access}`
                    }
                });
                setConversations(response.data);
            } catch (error) {
                console.error("Failed to fetch conversations", error);
            }
        };

        if (authTokens) {
            fetchConversations();
        }
    }, [authTokens]);

    return (
        <div className="w-80 border-r bg-muted/20 flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Users className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight">Chats</h2>
                </div>
                <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" title="New Chat" onClick={() => setIsNewChatModalOpen(true)}>
                        <Plus className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={logoutUser} title="Logout">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {conversations.map(conv => {
                    const otherMembers = conv.members_details.filter(m => m.id !== user.user_id);
                    const displayName = conv.is_group ? conv.group_name : otherMembers[0]?.username;
                    const otherUserId = !conv.is_group && otherMembers[0]?.id;
                    const isOnline = otherUserId && onlineUsers[otherUserId];

                    return (
                        <div 
                            key={conv.id}
                            onClick={() => setActiveConversation(conv)}
                            className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-colors ${
                                activeConversation?.id === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                            }`}
                        >
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold uppercase overflow-hidden">
                                    {conv.is_group && conv.group_avatar ? (
                                        <img src={`http://localhost:8000${conv.group_avatar}`} alt="avatar" className="h-full w-full object-cover" />
                                    ) : !conv.is_group && otherMembers[0]?.avatar ? (
                                        <img src={`http://localhost:8000${otherMembers[0].avatar}`} alt="avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        displayName?.charAt(0)
                                    )}
                                </div>
                                {!conv.is_group && isOnline && (
                                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"></span>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold truncate">{displayName}</h4>
                                    {conv.last_message && (
                                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                            {new Date(conv.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground truncate">
                                        {conv.last_message ? (
                                            conv.last_message.media_type !== 'none' ? `[${conv.last_message.media_type}]` : conv.last_message.text
                                        ) : 'No messages yet'}
                                    </p>
                                    {conv.unread_count > 0 && (
                                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <NewChatModal 
                isOpen={isNewChatModalOpen} 
                onClose={() => setIsNewChatModalOpen(false)} 
                onChatCreated={(conv) => {
                    setConversations(prev => {
                        const exists = prev.find(c => c.id === conv.id);
                        if (exists) return prev;
                        return [conv, ...prev];
                    });
                    setActiveConversation(conv);
                }}
            />
        </div>
    );
};

export default Sidebar;
