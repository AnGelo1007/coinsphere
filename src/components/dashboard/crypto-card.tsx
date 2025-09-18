import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Triangle } from 'lucide-react';
import Image from 'next/image';
import Sparkline from '../sparkline';

type CryptoCardProps = {
  name: string;
  symbol: string;
  price: string;
  change: string;
  logo: string;
  chartData: number[];
};

export function CryptoCard({ name, symbol, price, change, logo, chartData }: CryptoCardProps) {
  const isPositive = !change.startsWith('-');
  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{name}</CardTitle>
        <Image src={logo} alt={`${name} logo`} width={24} height={24} data-ai-hint={`${name} logo`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{price}</div>
        <div
          className={cn(
            'flex items-center text-xs',
            isPositive ? 'text-green-500' : 'text-red-500'
          )}
        >
          <Triangle
            className={cn('h-3 w-3 fill-current', isPositive ? 'rotate-0' : 'rotate-180')}
          />
          <span className="ml-1">{change}</span>
        </div>
        <div className="h-16 w-full mt-2">
          <Sparkline data={chartData} positive={isPositive} />
        </div>
      </CardContent>
    </Card>
  );
}
