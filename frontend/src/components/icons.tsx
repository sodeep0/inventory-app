import {
  Package,
  ArrowsLeftRight,
  TrendUp,
  List,
  X,
  Plus,
  Minus,
  ArrowCounterClockwise,
  SlidersHorizontal,
  CaretDown,
  CaretUp,
  Check,
  Moon,
  Sun,
  Desktop,
  Package as PackageIcon,
  House,
  MagnifyingGlass,
  Trash,
  PencilSimple,
  Circle,
  DownloadSimple,
  WarningCircle,
  Table,
  Eye,
  CheckCircle,
  CaretRight,
  Coins,
  ShoppingCart,
} from "@phosphor-icons/react"

const iconMap = {
  Package,
  ArrowsLeftRight,
  TrendUp,
  List,
  X,
  Plus,
  Minus,
  ArrowCounterClockwise,
  SlidersHorizontal,
  CaretDown,
  CaretUp,
  Check,
  Moon,
  Sun,
  Desktop,
  PackageIcon,
  House,
  MagnifyingGlass,
  Trash,
  PencilSimple,
  Circle,
  DownloadSimple,
  WarningCircle,
  Table,
  Eye,
  CheckCircle,
  CaretRight,
  Coins,
  ShoppingCart,
}

type IconName = keyof typeof iconMap

interface PhosphorIconProps {
  name: IconName
  size?: number
  weight?: "regular" | "bold" | "fill" | "duotone"
  className?: string
}

export function PhosphorIcon({ name, size = 16, weight = "bold", className }: PhosphorIconProps) {
  const IconComponent = iconMap[name]
  if (!IconComponent) return null
  return <IconComponent size={size} weight={weight} className={className} />
}
