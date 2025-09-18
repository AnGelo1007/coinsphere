import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import type { NewsArticle } from '@/services/crypto-service';

type NewsFeedProps = {
  initialData: NewsArticle[];
};

export default function NewsFeed({ initialData }: NewsFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>News Feed</CardTitle>
        <CardDescription>Latest crypto market news</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {initialData.map((item, index) => (
            <li key={index}>
              <Link href="#" className="group">
                <p className="text-xs text-muted-foreground">{item.source} - {item.time}</p>
                <p className="font-semibold group-hover:text-primary transition-colors">{item.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
