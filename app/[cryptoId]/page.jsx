"use client";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Select,
  MenuItem,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { ArrowUp, ArrowDown, DollarSign, BarChart3, TrendingUp, Activity, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/auth-dialog";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { ThresholdForm } from "@/components/ThresholdForm";
import { useSession, signOut } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "next-themes";

const timeframes = [
  { label: "24H", value: "1", days: "1", icon: <Clock className="w-3 h-3" /> },
  { label: "7D", value: "7", days: "7", icon: <Calendar className="w-3 h-3" /> },
  { label: "1M", value: "30", days: "30", icon: <Calendar className="w-3 h-3" /> },
  { label: "3M", value: "90", days: "90", icon: <Calendar className="w-3 h-3" /> },
  { label: "1Y", value: "365", days: "365", icon: <Calendar className="w-3 h-3" /> },
];

const CryptoDetailView = () => {
  const params = useParams();
  const { cryptoId } = params;
  const [cryptoData, setCryptoData] = useState(null);
  const nav = useRouter();
  const [priceData, setPriceData] = useState([]);
  const [currency, setCurrency] = useState("usd");
  const [selectedTimeframe, setSelectedTimeframe] = useState("7");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session } = useSession();
  const { toast } = useToast();

  // State for threshold form
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showThresholdForm, setShowThresholdForm] = useState(false);
  const [watchlist, setWatchlist] = useState([]);

  const formatPrice = (price) => {
    if (price < 0.01) return price.toFixed(8);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  const formatTimestamp = (timestamp, timeframe) => {
    const date = new Date(timestamp);
    if (timeframe === "1") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (timeframe === "7" || timeframe === "30") {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${cryptoId}`
        );
        if (!response.ok) throw new Error("Failed to fetch crypto data");
        const data = await response.json();
        setCryptoData(data);
      } catch (error) {
        setError("Failed to load crypto data. Please try again later.");
        console.error("Error fetching crypto data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCryptoData();
  }, [cryptoId, currency]);

  function formatVolume(num) {
    if (num >= 1e12) {
      return (num / 1e12).toFixed(2) + "T";
    } else if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + "B";
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + "M";
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + "K";
    } else {
      return num.toString();
    }
  }

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const timeframe = timeframes.find((t) => t.value === selectedTimeframe);
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=${currency}&days=${timeframe.days}`
        );
        if (!response.ok) throw new Error("Failed to fetch price history");
        const data = await response.json();
        const formattedData = data.prices.map(([timestamp, price]) => ({
          date: formatTimestamp(timestamp, timeframe.value),
          price: formatPrice(price),
          timestamp, // Keep timestamp for tooltip
        }));
        setPriceData(formattedData);
      } catch (error) {
        setError("Failed to load price history. Please try again later.");
        console.error("Error fetching price history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPriceHistory();
  }, [cryptoId, selectedTimeframe, currency]);

  const handleAddPriceAlert = () => {
    if (!session) {
      setShowAuthDialog(true);
    } else {
      setShowThresholdForm(true);
    }
  };
  
  const handleSignIn = () => {
    // console.log("Sign in clicked");
    setShowAuthDialog(true);
  };

  const handleThresholdSubmit = async (data) => {
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          name: cryptoData.name,
          symbol: cryptoData.symbol,
          logo: cryptoData.image.small,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            "Couldn't set up price alert for the selected blockchain."
        );
      }

      setWatchlist((prev) => [...prev, data.blockchainId]);
      toast({
        title: "Success",
        description: `${cryptoData.name} added for price alerts.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Couldn't set up price alert for the selected blockchain.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setShowThresholdForm(false);
    }
  };

  if (isLoading && !cryptoData) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background">
          <Navbar 
            userName={session?.user?.name}
            onSignIn={handleSignIn}
            onLogout={() => signOut()}
          />
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading crypto data...</p>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background">
          <Navbar 
            userName={session?.user?.name}
            onSignIn={handleSignIn}
            onLogout={() => signOut()}
          />
          <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <Card className="w-full max-w-md border-0 shadow-xl dark:bg-gray-800 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col items-center">
                  <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-red-500 dark:text-red-400 text-center text-lg font-medium mb-2">
                    Rate limits for CoinGecko API exceeded
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    We couldn't retrieve the latest data. Please try again in a moment.
                  </p>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!cryptoData) return null;

  const priceChangeColor =
    cryptoData.market_data?.price_change_percentage_24h >= 0
      ? "text-green-500"
      : "text-red-500";

  const priceChangeBackground =
    cryptoData.market_data?.price_change_percentage_24h >= 0
      ? "bg-green-50 dark:bg-green-900/20"
      : "bg-red-50 dark:bg-red-900/20";

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
            {new Date(payload[0].payload.timestamp).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
            {payload[0].value} {currency?.toUpperCase()}
          </p>
        </div>
      );
    }
    return null;
  };

  // Get color for chart based on price trend
  const getChartColor = () => {
    if (priceData.length < 2) return "#3b82f6"; // Default blue
    const firstPrice = parseFloat(priceData[0].price);
    const lastPrice = parseFloat(priceData[priceData.length - 1].price);
    return lastPrice >= firstPrice ? "#10b981" : "#ef4444"; // Green if up, red if down
  };

  const chartColor = getChartColor();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar 
          userName={session?.user?.name}
          onSignIn={handleSignIn}
          onLogout={() => signOut()}
        />
        
        <div className="pt-24 pb-16 mx-auto container px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto rounded-xl shadow-md dark:shadow-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 sm:p-8 overflow-hidden"
          >
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl shadow-sm">
                  <img
                    src={cryptoData.image.large}
                    alt={cryptoData.name}
                    className="w-12 h-12 sm:w-16 sm:h-16"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {cryptoData.name}
                    </h1>
                    <span className="text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                      #{cryptoData.market_cap_rank}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="font-medium">{cryptoData.symbol.toUpperCase()}</span>
                    <span className={`inline-flex items-center text-sm font-medium ${priceChangeColor} ${priceChangeBackground} px-2 py-0.5 rounded-full`}>
                      {cryptoData.market_data.price_change_percentage_24h >= 0 ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(cryptoData.market_data.price_change_percentage_24h).toFixed(2)}%
                    </span>
                  </p>
                </div>
              </div>
              <Button
                className="group relative overflow-hidden rounded-full px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg transition-all duration-200"
                onClick={handleAddPriceAlert}
              >
                <span className="relative z-10 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  Add to Price Alerts
                </span>
                <div className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <motion.div 
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Current Price
                    </p>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currency.toUpperCase()} {formatPrice(
                        cryptoData.market_data.current_price[currency]
                      )}
                    </h2>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      24h Change
                    </p>
                    <h2 className={`text-2xl font-bold ${priceChangeColor}`}>
                      {cryptoData.market_data.price_change_percentage_24h >= 0 ? "+" : ""}
                      {cryptoData.market_data.price_change_percentage_24h.toFixed(2)}%
                    </h2>
                  </div>
                  <div className={`p-3 rounded-full ${
                    cryptoData.market_data.price_change_percentage_24h >= 0
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-red-50 dark:bg-red-900/20"
                  }`}>
                    {cryptoData.market_data.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="h-6 w-6 text-green-500" />
                    ) : (
                      <Activity className="h-6 w-6 text-red-500" />
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      Market Cap
                    </p>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currency.toUpperCase()} {formatVolume(cryptoData.market_data.market_cap[currency])}
                    </h2>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-indigo-500" />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 overflow-hidden">
              <Box sx={{ padding: "1.5rem" }}>
                <Typography
                  className="text-gray-900 dark:text-white mb-4"
                  style={{ fontSize: "1.5rem", fontWeight: 600 }}
                >
                  Price History
                </Typography>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex gap-2 flex-wrap">
                    {timeframes.map((timeframe) => (
                      <Button
                        key={timeframe.value}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                          selectedTimeframe === timeframe.value
                            ? "bg-blue-600 dark:bg-blue-600 text-white border-blue-600 dark:border-blue-600 shadow-md"
                            : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                        onClick={() => setSelectedTimeframe(timeframe.value)}
                      >
                        {timeframe.icon}
                        <span>{timeframe.label}</span>
                      </Button>
                    ))}
                  </div>
                  <Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="min-w-[100px] dark:bg-gray-700 dark:text-white rounded-lg"
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                      },
                    }}
                  >
                    <MenuItem value="usd">USD</MenuItem>
                    <MenuItem value="eur">EUR</MenuItem>
                    <MenuItem value="gbp">GBP</MenuItem>
                    <MenuItem value="inr">INR</MenuItem>
                    <MenuItem value="chf">CHF</MenuItem>
                    <MenuItem value="cny">CNY</MenuItem>
                    <MenuItem value="hkd">HKD</MenuItem>
                    <MenuItem value="try">TRY</MenuItem>
                    <MenuItem value="twd">TWD</MenuItem>
                  </Select>
                </div>
              </Box>
              <CardContent className="pb-0">
                <div className="h-[400px] lg:h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                      <XAxis 
                        dataKey="date"
                        interval="preserveStartEnd"
                        minTickGap={50}
                        tick={{ fill: 'rgb(156, 163, 175)' }}
                        axisLine={{ stroke: 'rgba(156, 163, 175, 0.2)' }}
                        tickLine={{ stroke: 'rgba(156, 163, 175, 0.2)' }}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        tickFormatter={(value) => `${currency.toUpperCase()} ${formatPrice(value)}`}
                        tick={{ fill: 'rgb(156, 163, 175)' }}
                        axisLine={{ stroke: 'rgba(156, 163, 175, 0.2)' }}
                        tickLine={{ stroke: 'rgba(156, 163, 175, 0.2)' }}
                        width={80}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={chartColor} 
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        strokeWidth={2}
                        activeDot={{ r: 6, strokeWidth: 0, fill: chartColor }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Stats</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">24h Trading Volume</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {currency.toUpperCase()} {formatVolume(cryptoData.market_data.total_volume[currency])}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Circulating Supply</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {cryptoData.market_data.circulating_supply.toLocaleString()}{" "}
                        <span className="text-gray-500 text-sm">{cryptoData.symbol.toUpperCase()}</span>
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Total Supply</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {cryptoData.market_data.total_supply
                          ? cryptoData.market_data.total_supply.toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Max Supply</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {cryptoData.market_data.max_supply
                          ? cryptoData.market_data.max_supply.toLocaleString()
                          : "∞"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Price Changes</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    {[
                      { period: "1h", label: "1 Hour" },
                      { period: "24h", label: "24 Hours" },
                      { period: "7d", label: "7 Days" },
                      { period: "30d", label: "30 Days" },
                      { period: "1y", label: "1 Year" }
                    ].map((item) => (
                      <div key={item.period} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                        <div className="flex items-center">
                          {cryptoData.market_data[
                            `price_change_percentage_${item.period}`
                          ] >= 0 ? (
                            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span
                            className={
                              cryptoData.market_data[
                                `price_change_percentage_${item.period}`
                              ] >= 0
                                ? "text-green-500 font-medium"
                                : "text-red-500 font-medium"
                            }
                          >
                            {cryptoData.market_data[
                              `price_change_percentage_${item.period}`
                            ]?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional information section */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">About {cryptoData.name}</h3>
              </div>
              <div className="px-6 py-4">
                <div className="prose prose-blue max-w-none dark:prose-invert prose-headings:font-semibold prose-h3:text-gray-900 dark:prose-h3:text-white prose-p:text-gray-600 dark:prose-p:text-gray-300">
                  <div 
                    dangerouslySetInnerHTML={{ __html: cryptoData.description?.en || "No description available." }}
                    className="line-clamp-4 text-gray-600 dark:text-gray-300"
                  />
                  <button className="mt-2 text-blue-600 dark:text-blue-400 font-medium hover:underline focus:outline-none">
                    Read more
                  </button>
                </div>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Official Links</h4>
                    <div className="space-y-2">
                      {cryptoData.links?.homepage?.[0] && (
                        <a 
                          href={cryptoData.links.homepage[0]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                          </svg>
                          Website
                        </a>
                      )}
                      {cryptoData.links?.blockchain_site?.[0] && (
                        <a 
                          href={cryptoData.links.blockchain_site[0]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                          </svg>
                          Explorer
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Social Media</h4>
                    <div className="space-y-2">
                      {cryptoData.links?.twitter_screen_name && (
                        <a 
                          href={`https://twitter.com/${cryptoData.links.twitter_screen_name}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z"/>
                          </svg>
                          Twitter
                        </a>
                      )}
                      {cryptoData.links?.subreddit_url && (
                        <a 
                          href={cryptoData.links.subreddit_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11c0 2.08-1.64 3.75-3.75 3.75-1.48 0-2.77-.81-3.45-2h6.9c.58.94 1.65 1.5 2.8 1.5 1.69 0 3.05-1.36 3.05-3.05 0-1.69-1.36-3.05-3.05-3.05-.92 0-1.73.41-2.29 1.05.56.64 1.08 1.32 1.47 2.05H9.5c-.38-.73-.91-1.41-1.5-2.05A3.02 3.02 0 0 0 5.5 9.2c-1.69 0-3.05 1.36-3.05 3.05 0 1.69 1.36 3.05 3.05 3.05 1.15 0 2.22-.56 2.8-1.5h2.9A3.72 3.72 0 0 0 12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5z"/>
                          </svg>
                          Reddit
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {showAuthDialog && (
            <AuthDialog
              onClose={() => setShowAuthDialog(false)}
              onSuccessfulAuth={() => {
                setShowAuthDialog(false);
                setShowThresholdForm(true);
              }}
            />
          )}

          {showThresholdForm && cryptoData && (
            <ThresholdForm
              blockchain={{
                id: cryptoId,
                name: cryptoData.name,
                symbol: cryptoData.symbol,
                current_price: cryptoData.market_data.current_price[currency],
                image: cryptoData.image.small,
              }}
              onSubmit={handleThresholdSubmit}
              onClose={() => setShowThresholdForm(false)}
            />
          )}
        </AnimatePresence>
        
        {/* Footer */}
        {/* <footer className="py-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4">
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Data provided by CoinGecko API</p>
              <p className="mt-2">© {new Date().getFullYear()} Crypto Tracker. All rights reserved.</p>
            </div>
          </div>
        </footer> */}
      </div>
    </ThemeProvider>
  );
};

export default CryptoDetailView;