import {
  AlertTriangle,
  ArrowUpRight,
  Music,
  RefreshCw,
  ShieldX,
  type LucideIcon,
} from 'lucide-react';

const ICONS = {
  music: Music,
  refresh: RefreshCw,
  kicked: ShieldX,
  external: ArrowUpRight,
  warning: AlertTriangle,
} as const;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function Icon({
  name,
  size = 22,
  strokeWidth = 2.8,
  className,
}: IconProps): React.ReactElement {
  const Component: LucideIcon = ICONS[name];
  return <Component size={size} strokeWidth={strokeWidth} className={className} />;
}
