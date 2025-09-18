'use client';

import { useEffect, useRef, useLayoutEffect } from 'react';
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData } from 'lightweight-charts';
import { useTheme } from 'next-themes';

interface TradingChartProps {
  candlestickData: CandlestickData[];
  timezone: string;
}

const chartOptions = (theme: string | undefined) => {
    const isDark = theme === 'dark';
    return {
        layout: {
            background: { color: 'transparent' },
            textColor: isDark ? '#D1D5DB' : '#1F2937',
        },
        grid: {
            vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
        },
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        },
    };
};

const candlestickSeriesOptions = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderDownColor: '#ef5350',
  borderUpColor: '#26a69a',
  wickDownColor: '#ef5350',
  wickUpColor: '#26a69a',
};

export function TradingChart({ candlestickData, timezone }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const { resolvedTheme } = useTheme();

    useLayoutEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, chartOptions(resolvedTheme));
        chartRef.current = chart;

        const series = chart.addCandlestickSeries(candlestickSeriesOptions);
        seriesRef.current = series;
        
        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
        };
    }, [resolvedTheme]);

    useEffect(() => {
        if (seriesRef.current && candlestickData) {
            seriesRef.current.setData(candlestickData);
            chartRef.current?.timeScale().fitContent();
        }
    }, [candlestickData]);


    return <div ref={chartContainerRef} className="w-full h-full" />;
}
