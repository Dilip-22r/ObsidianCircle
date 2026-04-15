import { useEffect } from 'react';
import useChatStore from '../store/useChatStore';
import useAuth from './useAuth';

export default function useSocket() {
  const { user } = useAuth();
  const { initializeSocket, disconnectSocket } = useChatStore();

  useEffect(() => {
    if (user?.id) {
      initializeSocket(user.id);
    }

    return () => {
      disconnectSocket();
    };
  }, [user?.id, initializeSocket, disconnectSocket]);
}
