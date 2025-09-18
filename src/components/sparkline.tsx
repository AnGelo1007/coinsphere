'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

const Sparkline = ({ data, width = 120, height = 40, positive = true }: SparklineProps) => {
  const { theme } = useTheme();
  const [strokeColor, setStrokeColor] = useState('#10b981');

  useEffect(() => {
    // Cannot get resolvedTheme from next-themes on server, so we need to wait for mount
    const green = '#10b981';
    const red = '#ef4444';
    setStrokeColor(positive ? green : red);
  }, [positive, theme]);


  if (!data || data.length === 0) {
    return null;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max-min;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <path d={`M ${points}`} fill="none" stroke={strokeColor} strokeWidth="1.5" />
    </svg>
  );
};

export default Sparkline;
