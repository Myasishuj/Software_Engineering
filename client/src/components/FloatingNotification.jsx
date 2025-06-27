import React, { useEffect } from 'react';

const FloatingNotification = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  if (!message) return null;

  return (
    <div className="floating-notification btn hologram">
      <span data-text={message}>{message}</span>
      <div className="divider"></div>
      <button className="btn hologram" onClick={onClose}
      >
        <span data-text="x">x</span>
        <div class="scan-line"></div>
        </button>
    </div>
  );
};

export default FloatingNotification;