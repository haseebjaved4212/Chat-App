import React, { useEffect, useState, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { WebSocketContext } from '../../context/WebSocketContext';
import { Send, Image as ImageIcon, Video, Paperclip } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../components/ui/input'; // fixed import path below

const ChatWindow = ({ conversation }) => {
    const { authTokens, user } = useContext(AuthContext);
    const { messages, joinRoom, leaveRoom, sendMessage, sendTypingStatus, activeTyping } = useContext(WebSocketContext);
    
    const [localMessages, setLocalMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Initial fetch and WebSocket join
    useEffect(() => {
        if (!conversation) return;
        
        setLocalMessages([]);
        setPage(1);
        setHasMore(true);
        joinRoom(conversation.id);

        fetchMessages(1);

        return () => {
            leaveRoom(conversation.id);
        };
    }, [conversation?.id]);

    // Merge WS messages with local messages
    useEffect(() => {
        if (conversation && messages[conversation.id]) {
            const wsMessages = messages[conversation.id];
            // Naive merge - in a real app, you'd filter out duplicates by ID
            setLocalMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = wsMessages.filter(m => !existingIds.has(m.id));
                return [...prev, ...newMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            });
        }
    }, [messages, conversation?.id]);

    const fetchMessages = async (pageNumber) => {
        if (!conversation) return;
        try {
            const response = await axios.get(`http://localhost:8000/api/messages/?conversation_id=${conversation.id}&page=${pageNumber}`, {
                headers: { Authorization: `Bearer ${authTokens?.access}` }
            });
            const fetched = response.data.results.reverse(); // API returns newest first due to -timestamp ordering
            
            setLocalMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = fetched.filter(m => !existingIds.has(m.id));
                return [...newMessages, ...prev].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            });
            
            setHasMore(response.data.next !== null);
        } catch (error) {
            console.error("Fetch messages error", error);
        }
    };

    const handleScroll = (e) => {
        const { scrollTop } = e.target;
        if (scrollTop === 0 && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchMessages(nextPage);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [localMessages.length]); // Simple trigger, adjust as needed

    const handleTextChange = (e) => {
        setInputText(e.target.value);
        
        // Handle Typing indicator
        sendTypingStatus(conversation.id, true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(conversation.id, false);
        }, 1500);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim() === '') return;
        
        sendMessage(conversation.id, inputText);
        setInputText('');
        sendTypingStatus(conversation.id, false);
    };

    if (!conversation) {
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a chat to start messaging</div>;
    }

    const otherMembers = conversation.members_details.filter(m => m.id !== user.user_id);
    const displayName = conversation.is_group ? conversation.group_name : otherMembers[0]?.username;
    
    // Check if anyone is typing
    const typingUsers = activeTyping[conversation.id] || {};
    const someoneTyping = Object.keys(typingUsers).some(id => typingUsers[id] && id !== String(user.user_id));

    return (
        <div className="flex-1 flex flex-col h-full bg-background relative">
            {/* Header */}
            <div className="h-16 border-b flex items-center px-6 shadow-sm z-10 bg-card">
                <h3 className="text-lg font-bold">{displayName}</h3>
            </div>

            {/* Messages Area */}
            <div 
                className="flex-1 overflow-y-auto p-6 space-y-4" 
                onScroll={handleScroll}
                ref={scrollContainerRef}
            >
                {localMessages.map((msg) => {
                    const isMe = msg.sender_details.id === user.user_id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                                {conversation.is_group && !isMe && (
                                    <div className="text-xs font-bold mb-1 opacity-75">{msg.sender_details.username}</div>
                                )}
                                
                                {msg.media_type === 'image' && msg.media_file && (
                                    <img src={`http://localhost:8000${msg.media_file}`} alt="attachment" className="max-w-full rounded-md mb-2" />
                                )}
                                
                                {msg.media_type === 'video' && msg.media_file && (
                                    <video controls className="max-w-full rounded-md mb-2" poster={msg.media_thumbnail ? `http://localhost:8000${msg.media_thumbnail}` : ''}>
                                        <source src={`http://localhost:8000${msg.media_file}`} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}

                                <p className="text-sm">{msg.text}</p>
                                
                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isMe && (msg.is_read ? ' • Read' : ' • Sent')}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {someoneTyping && (
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-2 text-sm text-muted-foreground animate-pulse">
                            Typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <input
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={handleTextChange}
                    />
                    <Button type="submit" size="icon" className="shrink-0" disabled={!inputText.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
