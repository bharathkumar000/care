import { useState, useEffect, useRef } from 'react';
import { recordPanicEvent } from '../utils/emergencyEventStore';

export function useECGData() {
  const [data, setData] = useState({ hr: null, gsr: null, panic: 0 });
  const [chartData, setChartData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [hasReceivedData, setHasReceivedData] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const timeRef = useRef(0);
  const prevPanicRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const connectWs = () => {
      if (!isMounted) return;
      setConnectionStatus('connecting');

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host || 'localhost:8000';
        const wsUrl = `${protocol}//${host}/ws`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setConnectionStatus('connected');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const parsed = JSON.parse(event.data);
            
            const hrVal = typeof parsed.hr === 'number' ? parsed.hr : null;
            const gsrVal = typeof parsed.gsr === 'number' ? parsed.gsr : null;
            const panicVal = parsed.panic === 1 || parsed.panic === true ? 1 : 0;
            const ecgVal = typeof parsed.ecg === 'number' ? parsed.ecg : 0;

            // Trigger emergency event only on rising edge (0 -> 1)
            if (prevPanicRef.current === 0 && panicVal === 1) {
              recordPanicEvent({
                patientId: 1,
                patientName: "John Doe",
                heartRate: hrVal || 85,
                stressValue: gsrVal || 500,
                eventType: "Panic Button"
              });
            }
            prevPanicRef.current = panicVal;

            setData({
              hr: hrVal,
              gsr: gsrVal,
              panic: panicVal
            });
            setHasReceivedData(true);

            setChartData((prev) => {
              const newPoint = { time: timeRef.current++, ecg: ecgVal };
              const newData = [...prev, newPoint];
              return newData.length > 100 ? newData.slice(newData.length - 100) : newData;
            });
          } catch (e) {
            console.error("Failed to parse telemetry data", e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          setConnectionStatus('disconnected');
          reconnectTimeoutRef.current = setTimeout(connectWs, 2000);
        };

        ws.onerror = () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };

        wsRef.current = ws;
      } catch (err) {
        if (!isMounted) return;
        setIsConnected(false);
        setConnectionStatus('disconnected');
        reconnectTimeoutRef.current = setTimeout(connectWs, 2000);
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { data, chartData, isConnected, connectionStatus, hasReceivedData };
}

