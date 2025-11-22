"use client";
import { Select, SelectItem, Switch, Card, CardBody, Button, Tooltip } from "@heroui/react";
import { UsdtVesChart } from "@/components/UsdtVesChart";
import { useP2PPriceContext } from "@/app/contexts/P2PPriceContext";

// Icono de refresh
const RefreshIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

const PAYMENT_TYPES = [
  { key: "PagoMovil", label: "Pago Móvil" },
  { key: "Banesco", label: "Banesco" },
  { key: "SpecificBank", label: "Banco Específico" },
  { key: "BANK", label: "Transferencia Bancaria" },
  { key: "Mercantil", label: "Mercantil" },
  { key: "Provincial", label: "Provincial" },
  { key: "Bancamiga", label: "Bancamiga" },
  { key: "BNCBancoNacional", label: "BNC Banco Nacional" },
  { key: "BBVABank", label: "BBVA Bank" },
  { key: "Bancaribe", label: "Bancaribe" },
  { key: "Banplus", label: "Banplus" },
  { key: "BancoVeneCredit", label: "Banco VeneCredit" },
  { key: "BancoPlaza", label: "Banco Plaza" },
  { key: "BancoActivo", label: "Banco Activo" },
  { key: "RecargaPines", label: "Recarga Pines" },
];

interface HomeContentProps {
  tradeType: 'BUY' | 'SELL';
  setTradeType: (type: 'BUY' | 'SELL') => void;
  selectedPayTypes: string[];
  setSelectedPayTypes: (types: string[]) => void;
}

export function HomeContent({ tradeType, setTradeType, selectedPayTypes, setSelectedPayTypes }: HomeContentProps) {
  const { currentPrice, dailyPrices, refresh, loading } = useP2PPriceContext();
  
  // Calcular variación diaria
  const getDailyVariation = () => {
    if (dailyPrices.length < 2) return null;
    const today = dailyPrices[dailyPrices.length - 1];
    const yesterday = dailyPrices[dailyPrices.length - 2];
    const variation = today.price - yesterday.price;
    const percentage = ((variation / yesterday.price) * 100).toFixed(2);
    return { variation, percentage, isPositive: variation >= 0 };
  };

  const variation = getDailyVariation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-zinc-900">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-100 bg-clip-text text-transparent">
              Gráfica del Precio del USDT P2P
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 mt-4">
              Monitoreo en tiempo real: 1 USDT = X VES (Bolívares)
            </p>
          </div>

          {/* Chart Card */}
          <Card className="bg-zinc-900 border border-zinc-800">
            <CardBody className="p-6 sm:p-8 lg:p-10">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-zinc-200 mb-2">
                  Variación Diaria del Precio
                </h2>
                <p className="text-sm text-zinc-400">
                  Última actualización en tiempo real
                </p>
              </div>
              {currentPrice && (
                <div className="text-right flex items-start gap-2">
                  <div>
                    <div className="text-sm text-zinc-400 mb-1">Precio Actual</div>
                    <div className="text-2xl sm:text-3xl font-bold text-zinc-100">
                      1 USDT = {currentPrice.toFixed(2)} VES
                    </div>
                    {variation && (
                      <div className={`text-sm mt-1 ${variation.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {variation.isPositive ? '↑' : '↓'} {Math.abs(parseFloat(variation.percentage))}% 
                        ({variation.isPositive ? '+' : ''}{variation.variation.toFixed(2)} VES)
                      </div>
                    )}
                  </div>
                  <Tooltip
                    content="Refrescar precio"
                    color="default"
                    placement="left"
                    classNames={{
                      base: "bg-zinc-800 text-zinc-500",
                    }}
                  >
                    <Button
                      isIconOnly
                      variant="light"
                      color="default"
                      onPress={refresh}
                      isLoading={loading}
                      aria-label="Refrescar precio"
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      <RefreshIcon className="w-5 h-5" />
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>
            
            {/* Toggle Switch */}
            <div className="mb-6 flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${tradeType === 'BUY' ? 'text-zinc-200' : 'text-zinc-500'}`}>
                Precio Promedio de Compra
              </span>
              <Switch
                isSelected={tradeType === 'SELL'}
                onValueChange={(isSelected) => {
                  setTradeType(isSelected ? 'SELL' : 'BUY');
                }}
                color="primary"
                classNames={{
                  base: "max-w-fit",
                  wrapper: "bg-zinc-700 group-data-[selected=true]:bg-blue-600",
                  thumb: "bg-white",
                }}
                aria-label="Toggle entre compra y venta"
              />
              <span className={`text-sm font-medium ${tradeType === 'SELL' ? 'text-zinc-200' : 'text-zinc-500'}`}>
                Precio Promedio de Venta
              </span>
            </div>
            
            {/* Payment Types Filter */}
            <div className="mb-6">
              <Select
                label="Tipos de Pago"
                placeholder="Selecciona tipos de pago"
                selectionMode="multiple"
                selectedKeys={selectedPayTypes}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys) as string[];
                  setSelectedPayTypes(selected);
                }}
                variant="bordered"
                classNames={{
                  base: "max-w-full",
                  trigger: "bg-zinc-800 border-zinc-700 text-zinc-200",
                  popoverContent: "bg-zinc-100 border-zinc-800",
                  label: "text-zinc-400",
                }}
              >
                {PAYMENT_TYPES.map((type) => (
                  <SelectItem key={type.key}>
                    {type.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
            
            <div className="w-full">
              <UsdtVesChart />
            </div>
            </CardBody>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
            <Card className="bg-zinc-900 border border-zinc-800">
              <CardBody className="p-6">
                <div className="text-sm text-zinc-400 mb-2">Moneda Base</div>
                <div className="text-2xl font-bold text-zinc-100">1 USDT</div>
              </CardBody>
            </Card>
            <Card className="bg-zinc-900 border border-zinc-800">
              <CardBody className="p-6">
                <div className="text-sm text-zinc-400 mb-2">Equivale a</div>
                {currentPrice ? (
                  <div className="text-2xl font-bold text-zinc-100">
                    {currentPrice.toFixed(2)} VES
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-zinc-500">-</div>
                )}
              </CardBody>
            </Card>
            <Card className="bg-zinc-900 border border-zinc-800">
              <CardBody className="p-6">
                <div className="text-sm text-zinc-400 mb-2">Tipo de Operación</div>
                <div className="text-2xl font-bold text-zinc-100">
                  {tradeType === 'BUY' ? 'Compra' : 'Venta'}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

