import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

const NewChatModal = ({ isOpen, onClose, onChatCreated }) => {
    const { authTokens } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && authTokens) {
            fetchUsers();
        }
    }, [isOpen, authTokens]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8000/api/users/', {
                headers: { Authorization: `Bearer ${authTokens?.access}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const startChat = async (userId) => {
        try {
            const response = await axios.post('http://localhost:8000/api/conversations/', {
                is_group: false,
                members: [userId]
            }, {
                headers: { Authorization: `Bearer ${authTokens?.access}` }
            });
            onChatCreated(response.data);
            onClose();
        } catch (error) {
            console.error("Failed to create conversation", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card text-card-foreground w-full max-w-md rounded-xl shadow-lg border">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">New Chat</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                    {loading ? (
                        <div className="text-center text-muted-foreground p-4">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">No other users found.</div>
                    ) : (
                        users.map(user => (
                            <div 
                                key={user.id} 
                                onClick={() => startChat(user.id)}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            >
                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold uppercase overflow-hidden shrink-0">
                                    {user.avatar ? (
                                        <img src={`http://localhost:8000${user.avatar}`} alt="avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        user.username.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-semibold truncate">{user.username}</h4>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewChatModal;
