import {
  Utensils,
  Car,
  Droplet,
  Sparkles,
  HeartPulse,
  ShoppingBag,
  Briefcase,
  Home,
  Smartphone,
  BookOpen,
  Coins,
  Plus,
  Minus,
  Edit,
  Trash2,
  Bell,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Calendar,
  User,
  PlusCircle,
  Save,
  Share2,
  HelpCircle,
  SmartphoneIcon,
  Laptop,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit2,
  Pencil,
  Loader2,
  Bot,
  AlertCircle
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Utensils,
  Car,
  Droplet,
  Sparkles,
  HeartPulse,
  ShoppingBag,
  Briefcase,
  Home,
  Smartphone,
  BookOpen,
  Coins,
  Plus,
  Minus,
  Edit,
  Trash2,
  Bell,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle,
  AlertTriangle,
  Wallet,
  Calendar,
  User,
  PlusCircle,
  Save,
  Share2,
  HelpCircle,
  SmartphoneIcon,
  Laptop,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit2,
  Pencil,
  Loader2,
  Bot,
  AlertCircle
};

interface LucideIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function LucideIcon({ name, className = '', size = 20 }: LucideIconProps) {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent className={className} size={size} />;
}
