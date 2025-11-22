"use client";
import { useState } from "react";
import { P2PPriceProvider } from "@/app/contexts/P2PPriceContext";
import { HomeContent } from "@/app/components/HomeContent";

export default function Home() {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [selectedPayTypes, setSelectedPayTypes] = useState<string[]>(['Banesco', 'PagoMovil']);

  return (
    <P2PPriceProvider tradeType={tradeType} payTypes={selectedPayTypes}>
      <HomeContent 
        tradeType={tradeType}
        setTradeType={setTradeType}
        selectedPayTypes={selectedPayTypes}
        setSelectedPayTypes={setSelectedPayTypes}
      />
    </P2PPriceProvider>
  );
}
