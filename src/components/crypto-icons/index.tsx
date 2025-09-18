
import type { SVGProps } from 'react';
import { BtcIcon } from './btc';
import { EthIcon } from './eth';
import { BnbIcon } from './bnb';
import { SolIcon } from './sol';
import { DogeIcon } from './doge';
import { AdaIcon } from './ada';
import { LinkIcon } from './link';
import { DefaultIcon } from './default';

export function getCryptoIcon(symbol: string): React.FC<SVGProps<SVGSVGElement>> {
  switch (symbol.toUpperCase()) {
    case 'BTC':
      return BtcIcon;
    case 'ETH':
      return EthIcon;
    case 'BNB':
      return BnbIcon;
    case 'SOL':
      return SolIcon;
    case 'DOGE':
      return DogeIcon;
    case 'ADA':
      return AdaIcon;
    case 'LINK':
      return LinkIcon;
    default:
      return DefaultIcon;
  }
}
