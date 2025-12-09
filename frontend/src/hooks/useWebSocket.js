import { useState, useEffect, useRef, useCallback } from 'react';

// Helper para convertir URL relativa a WebSocket
function getWebSocketUrl(url) {
  // Si ya es una URL completa con ws:// o wss://, usarla directamente
  if (url.startsWith('ws://') || url.startsWith('wss://')) {
    return url;
  }
  
  // Si es una URL completa con http://, convertir a ws://
  if (url.startsWith('http://')) {
    return url.replace('http://', 'ws://');
  }
  if (url.startsWith('https://')) {
    return url.replace('https://', 'wss://');
  }
  
  // Si es relativa, construir desde la ubicación actual
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}${url}`;
}

export function useWebSocket(url, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const onMessageRef = useRef(null);
  const { onMessage, reconnect = true, reconnectInterval = 3000 } = options;

  // Update the ref whenever onMessage changes
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ Ya hay una conexión WebSocket abierta, ignorando');
      return;
    }
    
    // Si ya hay un websocket connecting, no crear otro
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('⚠️ Ya hay una conexión WebSocket en progreso, ignorando');
      return;
    }

    const wsUrl = getWebSocketUrl(url);
    console.log('🔌 Conectando WebSocket:', wsUrl);
    console.log('🔍 Detalles de conexión:', {
      url,
      wsUrl,
      protocol: window.location.protocol,
      host: window.location.host,
      origin: window.location.origin
    });
    
    try {
      const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket conectado exitosamente');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Mensaje recibido:', data);
        setLastMessage(data);
        if (onMessageRef.current) {
          onMessageRef.current(data);
        }
      } catch (error) {
        console.error('Error parseando mensaje:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Error en WebSocket:', error);
      console.error('❌ Detalles del error:', {
        type: error.type,
        target: error.target,
        readyState: ws.readyState
      });
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket desconectado');
      setIsConnected(false);
      wsRef.current = null;

      // Intentar reconectar
      if (reconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Intentando reconectar...');
          connect();
        }, reconnectInterval);
      }
    };

    wsRef.current = ws;
    } catch (error) {
      console.error('💥 Error creando WebSocket:', error);
      console.error('💥 Detalles:', {
        url: wsUrl,
        error: error.message,
        stack: error.stack
      });
    }
  }, [url, reconnect, reconnectInterval]); // Removed onMessage from dependencies

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('📤 Mensaje enviado:', message);
      return true;
    }
    console.warn('⚠️ WebSocket no está conectado');
    return false;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        console.log('🧹 Limpiando conexión WebSocket en unmount');
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
    reconnect: connect
  };
}

