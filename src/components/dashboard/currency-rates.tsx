
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

type CurrencyRate = {
    pair: string;
    rate: string;
}

type CurrencyRatesProps = {
  initialData: CurrencyRate[];
};

export default function CurrencyRates({ initialData }: CurrencyRatesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Rates</CardTitle>
        <CardDescription>Live foreign exchange rates (vs USD)</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(initialData.length > 7 && "h-[400px]")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pair</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.length > 0 ? initialData.map((rate) => (
                <TableRow key={rate.pair}>
                  <TableCell className="font-medium">{rate.pair}</TableCell>
                  <TableCell className="text-right">{rate.rate}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Could not load rates.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
