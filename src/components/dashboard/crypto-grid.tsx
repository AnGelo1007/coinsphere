import { CryptoCard } from "./crypto-card";
import type { CryptoCardData } from "@/services/crypto-service";

type CryptoGridProps = {
  initialData: CryptoCardData[];
};

export default function CryptoGrid({ initialData }: CryptoGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {initialData.map((crypto) => (
        <CryptoCard key={crypto.symbol} {...crypto} />
      ))}
    </div>
  );
}
