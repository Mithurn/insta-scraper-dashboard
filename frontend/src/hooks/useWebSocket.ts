import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: 'initial' | 'update' | 'heartbeat';
  username?: string;
  changed?: string[];
  snapshot?: any;
  data?: Record<string, any>;
  timestamp: string;
}

export const useWebSocket = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connections
    if (isConnectingRef.current || socket) {
      return;
    }
    
    isConnectingRef.current = true;
    
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle heartbeat messages
          if (message.type === 'heartbeat') {
            // Send a ping back to keep connection alive
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        isConnectingRef.current = false;
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setError('Failed to reconnect after multiple attempts');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        isConnectingRef.current = false;
      };

      setSocket(ws);
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
      isConnectingRef.current = false;
    }
  }, [url, socket]); // Include socket to check if already connected

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setSocket(prevSocket => {
      if (prevSocket) {
        prevSocket.close();
      }
      return null;
    });
    setIsConnected(false);
  }, []); // No dependencies

  const sendMessage = (message: string) => {
    if (socket && isConnected) {
      socket.send(message);
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Only depend on url, not the functions

  return {
    socket,
    isConnected,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect
  };
};
