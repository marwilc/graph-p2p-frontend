"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

interface PriceData {
  date: string;
  price: number;
  timestamp: string;
  tradeType: 'BUY' | 'SELL';
}

interface DailyPriceData {
  date: string;
  price: number;
}

interface P2PPriceContextType {
  currentPrice: number | null;
  dailyPrices: DailyPriceData[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const P2PPriceContext = createContext<P2PPriceContextType | undefined>(undefined);

const STORAGE_KEY_BUY = 'p2p_usdt_ves_prices_buy';
const STORAGE_KEY_SELL = 'p2p_usdt_ves_prices_sell';

interface P2PPriceProviderProps {
  children: ReactNode;
  tradeType: 'BUY' | 'SELL';
  payTypes: string[];
}

export function P2PPriceProvider({ children, tradeType, payTypes }: P2PPriceProviderProps) {
  const [dailyPrices, setDailyPrices] = useState<DailyPriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const STORAGE_KEY = tradeType === 'BUY' ? STORAGE_KEY_BUY : STORAGE_KEY_SELL;

  // Cargar precios históricos desde localStorage
  const loadHistoricalPrices = useCallback((): DailyPriceData[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const prices: PriceData[] = JSON.parse(stored);
        // Agrupar por fecha y tomar el último precio del día (más reciente timestamp)
        const dailyMap = new Map<string, { price: number; timestamp: string }>();
        
        prices.forEach((item) => {
          const date = item.date;
          const existing = dailyMap.get(date);
          
          if (!existing || new Date(item.timestamp) > new Date(existing.timestamp)) {
            dailyMap.set(date, { price: item.price, timestamp: item.timestamp });
          }
        });
        
        // Convertir a array y ordenar por fecha
        return Array.from(dailyMap.entries())
          .map(([date, data]) => ({ date, price: data.price }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }
    } catch (err) {
      console.error('Error loading historical prices:', err);
    }
    
    return [];
  }, [STORAGE_KEY]);

  // Guardar precio en localStorage
  const savePrice = useCallback((priceData: PriceData) => {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const prices: PriceData[] = stored ? JSON.parse(stored) : [];
      
      // Agregar nuevo precio
      prices.push(priceData);
      
      // Mantener solo los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredPrices = prices.filter(
        (p) => new Date(p.timestamp) >= thirtyDaysAgo
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPrices));
    } catch (err) {
      console.error('Error saving price:', err);
    }
  }, [STORAGE_KEY]);

  // Obtener precio actual del API
  const fetchCurrentPrice = useCallback(async () => {
    // Evitar peticiones duplicadas
    if (isFetchingRef.current) {
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      const payTypesParam = payTypes.length > 0 ? `&payTypes=${payTypes.join(',')}` : '';
      const response = await fetch(`/api/p2p?tradeType=${tradeType}${payTypesParam}`);
      if (!response.ok) {
        throw new Error('Error al obtener el precio');
      }
      
      const data = await response.json();
      
      if (data.price) {
        setCurrentPrice(data.price);
        
        // Guardar el precio si es un nuevo día o si no existe para hoy
        const today = new Date().toISOString().split('T')[0];
        const historical = loadHistoricalPrices();
        const todayPrice = historical.find(p => p.date === today);
        
        if (!todayPrice || todayPrice.price !== data.price) {
          savePrice({
            date: data.date,
            price: data.price,
            timestamp: data.timestamp,
            tradeType: tradeType,
          });
          
          // Recargar precios históricos
          const updated = loadHistoricalPrices();
          setDailyPrices(updated);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error fetching price:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [tradeType, payTypes, loadHistoricalPrices, savePrice]);

  // Inicializar y configurar intervalo
  const payTypesKey = payTypes.join(',');
  
  useEffect(() => {
    // Cargar precios históricos al montar o cuando cambie el tradeType
    const historical = loadHistoricalPrices();
    setDailyPrices(historical);
    
    // Resetear el flag de fetching cuando cambian las dependencias
    isFetchingRef.current = false;
    
    // Limpiar intervalo anterior si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Obtener precio actual
    fetchCurrentPrice();
    
    // Actualizar cada 8 segundos
    intervalRef.current = setInterval(() => {
      if (!isFetchingRef.current) {
        fetchCurrentPrice();
      }
    }, 8 * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tradeType, payTypesKey, fetchCurrentPrice, loadHistoricalPrices]);

  // Formatear datos para el gráfico
  const chartData = dailyPrices.map((item) => ({
    date: new Date(item.date).toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    }),
    price: item.price,
    fullDate: item.date,
  }));

  const value: P2PPriceContextType = {
    dailyPrices: chartData,
    currentPrice,
    loading,
    error,
    refresh: fetchCurrentPrice,
  };

  return (
    <P2PPriceContext.Provider value={value}>
      {children}
    </P2PPriceContext.Provider>
  );
}

export function useP2PPriceContext() {
  const context = useContext(P2PPriceContext);
  if (context === undefined) {
    throw new Error('useP2PPriceContext must be used within a P2PPriceProvider');
  }
  return context;
}

