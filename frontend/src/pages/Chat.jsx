import React, { useState } from 'react';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';

const Chat = () => {
    const [activeConversation, setActiveConversation] = useState(null);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            <Sidebar 
                activeConversation={activeConversation} 
                setActiveConversation={setActiveConversation} 
            />
            <ChatWindow 
                conversation={activeConversation} 
            />
        </div>
    );
};

export default Chat;
