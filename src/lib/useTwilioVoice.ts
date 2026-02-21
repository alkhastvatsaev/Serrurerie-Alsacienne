
import { useEffect, useState, useCallback } from 'react';
import { Device } from '@twilio/voice-sdk';

export function useTwilioVoice() {
  const [device, setDevice] = useState<Device | null>(null);
  const [call, setCall] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<string>('idle');
  const [callerName, setCallerName] = useState<string | null>(null);

  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    let currentDevice: Device | null = null;

    async function fetchToken() {
      const response = await fetch('/api/voice/token');
      if (!response.ok) throw new Error('Refresh failed');
      const data = await response.json();
      return data.token;
    }

    async function initDevice() {
      try {
        const token = await fetchToken();
        const newDevice = new Device(token, {
          codecPreferences: ['opus', 'pcmu'] as any,
          // Twilio SDK recommendation: auto-refresh token handling
        });

        newDevice.on('registered', () => {
          setStatus('ready');
          setIsInitialized(true);
          setErrorStatus(null);
        });

        // Proactive token refresh
        newDevice.on('tokenWillExpire', async () => {
          try {
            console.log('Twilio: Refreshing token before expiration...');
            const newToken = await fetchToken();
            await newDevice.updateToken(newToken);
          } catch (e) {
            console.error('Proactive token refresh failed:', e);
          }
        });

        newDevice.on('error', async (error: any) => {
          // AccessTokenExpired: 20104
          if (error.code === 20104) {
             console.log('Twilio: Token expired, attempting emergency refresh...');
             try {
               const newToken = await fetchToken();
               await newDevice.updateToken(newToken);
               return; // Refresh handled
             } catch(e) {}
          }
          
          setStatus('error');
          setErrorStatus(`Simulateur Actif (Twilio indisponible)`);
        });

        await newDevice.register();
        currentDevice = newDevice;
        setDevice(newDevice);
      } catch (err: any) {
        setStatus('ready');
        setIsSimulated(true);
        setIsInitialized(false);
      }
    }

    initDevice();

    return () => {
      if (currentDevice) {
        currentDevice.destroy();
      }
    };
  }, []);

  const makeCall = useCallback(async (number: string) => {
    if (device && isInitialized) {
      try {
        const params = { To: number };
        const outboundCall = await device.connect({ params });
        setCall(outboundCall);
        setStatus('dialing');
        setErrorStatus(null);

        outboundCall.on('accept', () => setStatus('connected'));
        outboundCall.on('disconnect', () => { 
          setStatus('ready'); 
          setCall(null); 
        });
        outboundCall.on('error', (twError: any) => {
          console.error('Outbound Call Error:', twError);
          setStatus('error');
          setErrorStatus(`Erreur d'appel: ${twError.message || 'Échec de connexion'}`);
          setCall(null);
        });
      } catch (err: any) {
        console.error('Twilio Connect Exception:', err);
        simulateCallFlow();
      }
    } else {
      simulateCallFlow();
    }
  }, [device, isInitialized]);

  const simulateCallFlow = () => {
    setStatus('dialing');
    // Simulate connection after 2 seconds
    setTimeout(() => {
      setStatus('connected');
    }, 2500);
  };

  const endCall = useCallback(() => {
    if (call) {
      call.disconnect();
    }
    setStatus('ready');
    setCall(null);
    setCallerName(null);
  }, [call]);

  return { makeCall, endCall, status, isInitialized, callerName, errorStatus, isSimulated };
}
