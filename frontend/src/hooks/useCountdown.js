import { useState, useEffect } from 'react';

export function useCountdown(initialSeconds, onComplete) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            setIsActive(false);
            if (onComplete) {
              onComplete();
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, seconds, onComplete]);

  const start = (newSeconds) => {
    if (newSeconds !== undefined) {
      setSeconds(newSeconds);
    }
    setIsActive(true);
  };

  const stop = () => {
    setIsActive(false);
  };

  const reset = (newSeconds = initialSeconds) => {
    setSeconds(newSeconds);
    setIsActive(false);
  };

  return { seconds, isActive, start, stop, reset };
}



