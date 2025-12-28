import { useEffect } from 'react';
import { resetDocument } from '../documents/editor/EditorContext';

export default function PostMessageListener() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data;

      switch (type) {
        case 'INIT_EMAIL_BUILDER':
          if (data) {
            console.log('Received INIT_EMAIL_BUILDER', data);
            resetDocument(data);
          }
          break;
        // Add other listeners here if needed (e.g. UPDATE_VARIABLES)
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return null;
}
