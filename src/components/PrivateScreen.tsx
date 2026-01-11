import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { useTranslation } from '../hooks/useTranslation';

interface PrivateScreenProps {
  children: React.ReactNode;
  autoCloseSeconds?: number;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function PrivateScreen({ 
  children, 
  autoCloseSeconds = 15,
  onClose,
  showCloseButton = true 
}: PrivateScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(autoCloseSeconds);
  const { t } = useTranslation();

  useEffect(() => {
    if (autoCloseSeconds <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoCloseSeconds, onClose]);

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
      <div className="private-screen">
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
          {children}
          
          {autoCloseSeconds > 0 && (
            <div className="mt-6 pm-text-60 text-sm">
              {t('nameEntry.autoClose', { seconds: secondsLeft })}
            </div>
          )}
          
          {showCloseButton && (
            <Button
              variant="secondary"
            onClick={handleClose}
            className="mt-4"
          >
            {t('common.clearScreen')}
          </Button>
        )}
      </div>
    </div>
  );
} 
