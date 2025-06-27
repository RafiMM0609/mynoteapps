'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';

interface PWAInstallPromptProps {
  className?: string;
}

export function PWAInstallPrompt({ className = '' }: PWAInstallPromptProps) {
  const { isInstallable, isInstalled, isOnline, updateAvailable, installPWA, updatePWA } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show prompt after a delay if installable and not dismissed
    if (isInstallable && !dismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, dismissed, isInstalled]);

  const handleInstall = async () => {
    try {
      await installPWA();
      setShowPrompt(false);
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleUpdate = async () => {
    try {
      await updatePWA();
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  // Check if previously dismissed
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  // Update available notification
  if (updateAvailable) {
    return (
      <div className={`fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Update Available</h3>
            <p className="text-sm opacity-90">A new version of Kagita Notes is ready to install.</p>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleUpdate}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Install prompt
  if (showPrompt && isInstallable && !isInstalled) {
    return (
      <div className={`fixed bottom-4 left-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-lg z-50 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h3 className="font-semibold">Install Kagita Notes</h3>
              <p className="text-sm opacity-90">Get the full app experience with offline access!</p>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleDismiss}
              className="text-white text-opacity-75 hover:text-opacity-100 px-2 py-1 text-sm transition-opacity"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm font-medium transition-all"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Offline indicator
  if (!isOnline) {
    return (
      <div className={`fixed top-4 left-4 right-4 bg-orange-600 text-white p-3 rounded-lg shadow-lg z-50 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
        </div>
      </div>
    );
  }

  return null;
}

// Standalone install button component
export function PWAInstallButton({ 
  children, 
  className = '', 
  variant = 'primary' 
}: { 
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}) {
  const { isInstallable, installPWA } = usePWA();

  if (!isInstallable) {
    return null;
  }

  const baseClasses = "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all";
  const variants = {
    primary: "bg-purple-600 hover:bg-purple-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800"
  };

  return (
    <button
      onClick={installPWA}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      <span className="text-lg">📱</span>
      {children || 'Install App'}
    </button>
  );
}

// PWA Status indicator
export function PWAStatus({ className = '' }: { className?: string }) {
  const { isInstalled, isOnline } = usePWA();

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
      <span className="text-gray-600">
        {isInstalled ? '📱 App Mode' : '🌐 Web Mode'} • {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
