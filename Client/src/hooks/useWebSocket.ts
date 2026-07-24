import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface UseWebSocketOptions {
  url: string | null;
  enabled?: boolean;
  autoReconnect?: boolean;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  maxRetries?: number;
  pingIntervalMs?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onReconnectAttempt?: (attempt: number, delay: number) => void;
}

export interface UseWebSocketReturn {
  status: WebSocketStatus;
  reconnectAttempt: number;
  lastMessage: MessageEvent | null;
  socket: WebSocket | null;
  send: (data: string | Blob | BufferSource) => boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useWebSocket = ({
  url,
  enabled = true,
  autoReconnect = true,
  initialDelayMs = 1000,
  maxDelayMs = 30000,
  backoffFactor = 1.5,
  maxRetries = 10,
  pingIntervalMs = 30000,
  onOpen,
  onMessage,
  onClose,
  onError,
  onReconnectAttempt,
}: UseWebSocketOptions): UseWebSocketReturn => {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [socketInstance, setSocketInstance] = useState<WebSocket | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef<number>(0);
  const isManuallyClosedRef = useRef<boolean>(false);
  const connectRef = useRef<() => void>(() => {});

  const callbacksRef = useRef({
    onOpen,
    onMessage,
    onClose,
    onError,
    onReconnectAttempt,
  });

  useEffect(() => {
    callbacksRef.current = {
      onOpen,
      onMessage,
      onClose,
      onError,
      onReconnectAttempt,
    };
  }, [onOpen, onMessage, onClose, onError, onReconnectAttempt]);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!url || !enabled) return;
    clearTimers();

    isManuallyClosedRef.current = false;
    setStatus(retryCountRef.current > 0 ? 'reconnecting' : 'connecting');

    try {
      const ws = new WebSocket(url);
      socketRef.current = ws;
      setSocketInstance(ws);

      ws.onopen = (event) => {
        setStatus('connected');
        retryCountRef.current = 0;
        setReconnectAttempt(0);

        // Start ping heartbeat
        if (pingIntervalMs > 0) {
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              try {
                ws.send(JSON.stringify({ type: 'ping' }));
              } catch {
                // Ignore send errors during heartbeat
              }
            }
          }, pingIntervalMs);
        }

        callbacksRef.current.onOpen?.(event);
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
        callbacksRef.current.onMessage?.(event);
      };

      ws.onerror = (event) => {
        setStatus('error');
        callbacksRef.current.onError?.(event);
      };

      ws.onclose = (event) => {
        clearTimers();
        setSocketInstance(null);
        callbacksRef.current.onClose?.(event);

        if (isManuallyClosedRef.current) {
          setStatus('disconnected');
          return;
        }

        // Auto reconnect logic with exponential backoff
        if (autoReconnect && retryCountRef.current < maxRetries) {
          const delay = Math.min(
            initialDelayMs * Math.pow(backoffFactor, retryCountRef.current),
            maxDelayMs
          );
          retryCountRef.current += 1;
          setReconnectAttempt(retryCountRef.current);
          setStatus('reconnecting');

          callbacksRef.current.onReconnectAttempt?.(retryCountRef.current, delay);

          reconnectTimerRef.current = setTimeout(() => {
            connectRef.current();
          }, delay);
        } else {
          setStatus('disconnected');
        }
      };
    } catch {
      setStatus('error');
    }
  }, [url, enabled, autoReconnect, initialDelayMs, maxDelayMs, backoffFactor, maxRetries, pingIntervalMs, clearTimers]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    clearTimers();
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setSocketInstance(null);
    }
    setStatus('disconnected');
  }, [clearTimers]);

  const send = useCallback((data: string | Blob | BufferSource) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (enabled && url) {
      connect();
    } else {
      const handle = setTimeout(() => disconnect(), 0);
      return () => clearTimeout(handle);
    }

    return () => {
      disconnect();
    };
  }, [url, enabled, connect, disconnect]);

  return {
    status,
    reconnectAttempt,
    lastMessage,
    socket: socketInstance,
    send,
    connect,
    disconnect,
  };
};
