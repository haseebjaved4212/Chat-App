import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from './AuthContext';

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
    const { authTokens, user } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState({}); // { conversationId: [messages] }
    const [activeTyping, setActiveTyping] = useState({}); // { conversationId: { userId: isTyping } }
    const [onlineUsers, setOnlineUsers] = useState({}); // { userId: isOnline }

    const socketRef = useRef(null);

    useEffect(() => {
        if (authTokens && !socketRef.current) {
            const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${authTokens.access}`);

            ws.onopen = () => {
                setIsConnected(true);
            };

            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                
                if (data.type === 'chat_message') {
                    const msg = data.message;
                    setMessages(prev => ({
                        ...prev,
                        [msg.conversation]: [...(prev[msg.conversation] || []), msg]
                    }));
                } else if (data.type === 'typing') {
                    setActiveTyping(prev => ({
                        ...prev,
                        [data.conversation_id]: {
                            ...(prev[data.conversation_id] || {}),
                            [data.user_id]: data.is_typing
                        }
                    }));
                } else if (data.type === 'status_update') {
                    setOnlineUsers(prev => ({
                        ...prev,
                        [data.user_id]: data.is_online
                    }));
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                socketRef.current = null;
            };

            socketRef.current = ws;
            setSocket(ws);
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [authTokens]);

    const joinRoom = (conversationId) => {
        if (socketRef.current && isConnected) {
            socketRef.current.send(JSON.stringify({
                action: 'join_room',
                conversation_id: conversationId
            }));
        }
    };

    const leaveRoom = (conversationId) => {
        if (socketRef.current && isConnected) {
            socketRef.current.send(JSON.stringify({
                action: 'leave_room',
                conversation_id: conversationId
            }));
        }
    };

    const sendMessage = (conversationId, text, mediaUrl = null, mediaType = 'none') => {
        if (socketRef.current && isConnected) {
            socketRef.current.send(JSON.stringify({
                action: 'chat_message',
                conversation_id: conversationId,
                text,
                media_url: mediaUrl,
                media_type: mediaType
            }));
        }
    };

    const sendTypingStatus = (conversationId, isTyping) => {
        if (socketRef.current && isConnected) {
            socketRef.current.send(JSON.stringify({
                action: 'typing',
                conversation_id: conversationId,
                is_typing: isTyping
            }));
        }
    };

    const value = {
        socket,
        isConnected,
        messages,
        activeTyping,
        onlineUsers,
        joinRoom,
        leaveRoom,
        sendMessage,
        sendTypingStatus
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};
