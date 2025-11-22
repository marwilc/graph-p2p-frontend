import { NextResponse } from "next/server";

const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

async function getPrice(tradeType: 'BUY' | 'SELL' = 'BUY', payTypes: string[] = []) {
  const body = {
    fiat: "VES",
    page: 1,
    rows: 10,
    tradeType: tradeType,
    asset: "USDT",
    countries: [],
    additionalKycVerifyFilter: 0,
    classifies: ["mass", "profession", "fiat_trade"],
    filterType: "tradable",
    followed: false,
    payTypes: payTypes,
    periods: [],
    proMerchantAds: false,
    publisherType: null,
    shieldMerchantAds: false,
    tradedWith: false
  };

  const options = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error('Binance API error:', response.status, response.statusText);
      return null;
    }
    
    const json = await response.json();
    
    // Verificar la estructura de la respuesta
    if (!json) {
      console.error('Empty response from Binance');
      return null;
    }
    
    // Verificar si hay un código de error
    if (json.code && json.code !== '000000' && json.code !== 0) {
      console.error('Binance API returned error code:', json.code, json.message);
      return null;
    }
    
    // Extraer el precio promedio de los primeros 3 anuncios, excluyendo patrocinados
    // La estructura es: json.data[] -> item.adv.price (string), item.privilegeType (null si no es patrocinado)
    if (!json.data || !Array.isArray(json.data) || json.data.length === 0) {
      console.error('No data array found or empty array');
      return null;
    }
    
    // Filtrar anuncios no patrocinados (privilegeType es null o undefined)
    const nonSponsoredAds = json.data.filter((item: { privilegeType?: number | null }) => {
      return item.privilegeType === null || item.privilegeType === undefined;
    });
    
    // Tomar solo los primeros 3 anuncios no patrocinados
    const firstThreeAds = nonSponsoredAds.slice(0, 3);
    
    if (firstThreeAds.length === 0) {
      console.error('No non-sponsored ads found');
      return null;
    }
    
    // Extraer precios de los primeros 3 anuncios
    const prices = firstThreeAds
      .map((item: { adv?: { price?: string } }) => {
        // Acceder directamente a item.adv.price
        if (item?.adv?.price) {
          const price = parseFloat(item.adv.price);
          return isNaN(price) ? null : price;
        }
        return null;
      })
      .filter((price: number | null): price is number => price !== null && price > 0);
    
    if (prices.length > 0) {
      const averagePrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      return {
        price: averagePrice,
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      };
    } else {
      console.error('No valid prices found in first 3 non-sponsored ads');
      return null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching price:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tradeType = (searchParams.get('tradeType') || 'BUY') as 'BUY' | 'SELL';
    const payTypesParam = searchParams.get('payTypes');
    const payTypes = payTypesParam ? payTypesParam.split(',') : [];
    
    // Validar que tradeType sea BUY o SELL
    if (tradeType !== 'BUY' && tradeType !== 'SELL') {
      return NextResponse.json(
        { error: 'tradeType debe ser BUY o SELL' },
        { status: 400 }
      );
    }
    
    const priceData = await getPrice(tradeType, payTypes);
    
    if (!priceData) {
      console.error('getPrice returned null');
      return NextResponse.json(
        { error: 'No se pudo obtener el precio de Binance' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ ...priceData, tradeType });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}