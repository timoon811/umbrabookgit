import { useState, useEffect } from 'react';

interface ResponsiveConfig {
  headerOffset: number;
  activeThreshold: number;
  toleranceUp: number;
  toleranceDown: number;
  debounceMs: number;
  rootMargin: string;
}

const getConfigForScreenSize = (width: number, height: number): ResponsiveConfig => {
  // Мобильные устройства (до 768px)
  if (width <= 768) {
    return {
      headerOffset: 80, // Меньший хедер на мобильных
      activeThreshold: 100,
      toleranceUp: 20,
      toleranceDown: 60,
      debounceMs: 50,
      rootMargin: '-80px 0px -40% 0px'
    };
  }
  
  // Планшеты (768px - 1024px)
  if (width <= 1024) {
    return {
      headerOffset: 100,
      activeThreshold: 120,
      toleranceUp: 15,
      toleranceDown: 55,
      debounceMs: 30,
      rootMargin: '-100px 0px -45% 0px'
    };
  }
  
  // Десктоп (больше 1024px)
  return {
    headerOffset: 120,
    activeThreshold: 150,
    toleranceUp: 10,
    toleranceDown: 50,
    debounceMs: 16,
    rootMargin: '-120px 0px -50% 0px'
  };
};

export function useResponsiveConfig() {
  const [config, setConfig] = useState<ResponsiveConfig>(() => {
    // Безопасная инициализация на сервере
    if (typeof window === 'undefined') {
      return getConfigForScreenSize(1200, 800); // Дефолт для SSR
    }
    return getConfigForScreenSize(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    const updateConfig = () => {
      const newConfig = getConfigForScreenSize(window.innerWidth, window.innerHeight);
      setConfig(newConfig);
    };

    // Обновляем конфигурацию при ресайзе окна
    window.addEventListener('resize', updateConfig);
    
    // Первоначальное обновление
    updateConfig();

    return () => {
      window.removeEventListener('resize', updateConfig);
    };
  }, []);

  return config;
}
