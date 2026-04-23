import { useEffect } from 'react';

export default function Toast({ message, type, onHide }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onHide, 3000);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;
  return (
    <div className={`toast show ${type || ''}`}>
      {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'} {message}
    </div>
  );
}