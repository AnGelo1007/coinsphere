import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function CryptoCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-4 w-16 mb-4" />
        <Skeleton className="h-16 w-full" />
      </CardContent>
    </Card>
  );
}

export function DashboardSectionSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </CardContent>
        </Card>
    );
}

export function MarketsTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32 mb-4" />
                 <div className="flex gap-2">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-28" /></TableHead>
                            <TableHead className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell><div className='flex items-center gap-2'><Skeleton className='h-8 w-8 rounded-full' /><Skeleton className='h-6 w-24' /></div></TableCell>
                                <TableCell><Skeleton className='h-6 w-32' /></TableCell>
                                <TableCell><Skeleton className='h-6 w-20' /></TableCell>
                                <TableCell className='text-right'><Skeleton className='h-8 w-16 ml-auto' /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
