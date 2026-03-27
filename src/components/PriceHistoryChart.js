import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui';

/**
 * PriceHistoryChart Component
 * Displays an artwork's sale price over time using a line/area chart
 * 
 * @param {Array} priceData - Array of { timestamp, price } objects
 * @param {String} title - Chart title
 * @param {String} currency - Currency symbol (default: 'XLM')
 */
const PriceHistoryChart = ({ priceData = [], title = 'Price History', currency = 'XLM' }) => {
  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!priceData || priceData.length === 0) return [];
    
    return priceData
      .map((sale) => ({
        date: formatDate(sale.timestamp),
        price: parseFloat(sale.price),
        fullDate: sale.timestamp
      }))
      .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
  }, [priceData]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        currentPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        priceChange: 0,
        priceChangePercent: 0
      };
    }

    const prices = chartData.map(d => d.price);
    const currentPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const priceChange = currentPrice - firstPrice;
    const priceChangePercent = ((priceChange / firstPrice) * 100) || 0;

    return {
      currentPrice,
      minPrice,
      maxPrice,
      avgPrice,
      priceChange,
      priceChangePercent
    };
  }, [chartData]);

  // Format date for display
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // Format price with currency
  function formatPrice(price) {
    return `${price.toFixed(2)} ${currency}`;
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {formatPrice(data.price)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(data.fullDate).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Price Data Available
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              This artwork hasn't been sold yet. Price history will appear here once sales occur.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositiveTrend = stats.priceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              {title}
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositiveTrend 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositiveTrend ? '+' : ''}{stats.priceChangePercent.toFixed(2)}%
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Statistics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Price</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(stats.currentPrice)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Min Price</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(stats.minPrice)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Max Price</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(stats.maxPrice)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Price</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(stats.avgPrice)}
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12} 
                  tickMargin={10}
                  stroke="#6b7280"
                />
                <YAxis 
                  fontSize={12}
                  tickFormatter={(value) => `${value}`}
                  stroke="#6b7280"
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Data Points Info */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Based on {chartData.length} sale{chartData.length !== 1 ? 's' : ''} • 
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PriceHistoryChart;
