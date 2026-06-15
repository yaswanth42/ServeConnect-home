import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Extract root server URL (e.g., http://localhost:5000)
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
      const socketUrl = apiUrl.replace('/api/v1', '');
      
      const newSocket = io(socketUrl, {
        withCredentials: true
      });

      newSocket.on('connect', () => {
        console.log('Socket client connected:', newSocket.id);
        
        // Join room by userId and role
        newSocket.emit('join', {
          userId: user._id,
          role: user.role
        });
      });

      // Global Notification Handler
      newSocket.on('notification', (notif) => {
        // Add to active notifications stack
        setNotifications((prev) => [
          { ...notif, id: Date.now(), isRead: false },
          ...prev
        ]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, user]);

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications, clearNotification }}>
      {children}
      
      {/* Toast Overlay for Live Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="pointer-events-auto bg-white dark:bg-dark-800 border border-brand-500/20 shadow-xl rounded-xl p-4 flex items-start space-x-3 animate-in fade-in slide-in-from-bottom-5 duration-300"
          >
            <div className="w-2 h-2 mt-2 rounded-full bg-brand-500 flex-shrink-0 animate-ping" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-dark-900 dark:text-white">{notif.title}</p>
              <p className="text-xs text-dark-500 dark:text-dark-400 mt-0.5">{notif.message}</p>
            </div>
            <button
              onClick={() => clearNotification(notif.id)}
              className="text-dark-400 hover:text-dark-600 dark:hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
