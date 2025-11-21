export interface Blockchain {
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    logo:string;
  }
  

  
  //ThresholdData interface
  export interface ThresholdData {
    blockchainId: string;
    upperThreshold: number;
    lowerThreshold: number;
  }