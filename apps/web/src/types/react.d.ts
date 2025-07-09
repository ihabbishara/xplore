// Fix for React type conflicts between React 18 and 19
import * as React from 'react'

declare module 'react' {
  // Extend ReactNode to include bigint (from React 19)
  type ReactNode =
    | React.ReactElement
    | string
    | number
    | bigint
    | React.ReactFragment
    | React.ReactPortal
    | boolean
    | null
    | undefined
}


// Fix for lucide-react icons
declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'
  
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: number | string
    strokeWidth?: number | string
  }
  
  export type LucideIcon = FC<LucideProps>
  
  export const Plus: LucideIcon
  export const Search: LucideIcon
  export const Filter: LucideIcon
  export const MapPin: LucideIcon
  export const Calendar: LucideIcon
  export const ChevronDown: LucideIcon
  export const X: LucideIcon
  export const Cloud: LucideIcon
  export const CloudRain: LucideIcon
  export const Sun: LucideIcon
  export const Wind: LucideIcon
  export const Droplets: LucideIcon
  export const ThermometerSun: LucideIcon
  export const Eye: LucideIcon
  export const Map: LucideIcon
  export const TrendingUp: LucideIcon
  export const BarChart: LucideIcon
  export const Clock: LucideIcon
  export const CheckCircle: LucideIcon
  export const XCircle: LucideIcon
  export const AlertCircle: LucideIcon
  export const Info: LucideIcon
  export const Home: LucideIcon
  export const DollarSign: LucideIcon
  export const Car: LucideIcon
  export const Utensils: LucideIcon
  export const Lightbulb: LucideIcon
  export const Activity: LucideIcon
  export const Package: LucideIcon
  export const Star: LucideIcon
  export const Heart: LucideIcon
  export const MessageCircle: LucideIcon
  export const Share2: LucideIcon
  export const Loader2: LucideIcon
  export const Check: LucideIcon
  export const ChevronLeft: LucideIcon
  export const ChevronRight: LucideIcon
  export const Trash2: LucideIcon
  export const Edit: LucideIcon
  export const Copy: LucideIcon
  export const Download: LucideIcon
  export const Upload: LucideIcon
  export const Settings: LucideIcon
  export const User: LucideIcon
  export const LogOut: LucideIcon
  export const Menu: LucideIcon
  export const Globe: LucideIcon
  export const Navigation: LucideIcon
  export const Target: LucideIcon
  export const Compass: LucideIcon
  export const Link: LucideIcon
  export const ExternalLink: LucideIcon
  export const BookOpen: LucideIcon
  export const Image: LucideIcon
  export const Camera: LucideIcon
  export const Mic: LucideIcon
  export const Play: LucideIcon
  export const Pause: LucideIcon
  export const Square: LucideIcon
  export const MoreVertical: LucideIcon
  export const MoreHorizontal: LucideIcon
  export const Save: LucideIcon
  export const RefreshCw: LucideIcon
  export const RotateCcw: LucideIcon
  export const ZoomIn: LucideIcon
  export const ZoomOut: LucideIcon
  export const Maximize: LucideIcon
  export const Minimize: LucideIcon
  export const ArrowUp: LucideIcon
  export const ArrowDown: LucideIcon
  export const ArrowLeft: LucideIcon
  export const ArrowRight: LucideIcon
  export const Hash: LucideIcon
  export const AtSign: LucideIcon
  export const Bell: LucideIcon
  export const BellOff: LucideIcon
  export const Bookmark: LucideIcon
  export const Send: LucideIcon
  export const Inbox: LucideIcon
  export const Archive: LucideIcon
  export const Briefcase: LucideIcon
  export const Building: LucideIcon
  export const FileText: LucideIcon
  export const Folder: LucideIcon
  export const Grid: LucideIcon
  export const List: LucideIcon
  export const Lock: LucideIcon
  export const Unlock: LucideIcon
  export const Shield: LucideIcon
  export const Zap: LucideIcon
  export const Layers: LucideIcon
  export const Template: LucideIcon
  export const Award: LucideIcon
  export const Flag: LucideIcon
  export const AlertTriangle: LucideIcon
  export const HelpCircle: LucideIcon
  export const MessageSquare: LucideIcon
  export const Phone: LucideIcon
  export const Mail: LucideIcon
  export const Wifi: LucideIcon
  export const WifiOff: LucideIcon
  export const Battery: LucideIcon
  export const BatteryLow: LucideIcon
  export const BatteryCharging: LucideIcon
  export const Cpu: LucideIcon
  export const Database: LucideIcon
  export const HardDrive: LucideIcon
  export const Monitor: LucideIcon
  export const Smartphone: LucideIcon
  export const Tablet: LucideIcon
  export const Tv: LucideIcon
  export const Watch: LucideIcon
  export const Headphones: LucideIcon
  export const Speaker: LucideIcon
  export const Volume: LucideIcon
  export const Volume1: LucideIcon
  export const Volume2: LucideIcon
  export const VolumeX: LucideIcon
  export const Paperclip: LucideIcon
  export const Code: LucideIcon
  export const Terminal: LucideIcon
  export const Palette: LucideIcon
  export const Brush: LucideIcon
  export const Crop: LucideIcon
  export const Scissors: LucideIcon
  export const Type: LucideIcon
  export const Bold: LucideIcon
  export const Italic: LucideIcon
  export const Underline: LucideIcon
  export const AlignLeft: LucideIcon
  export const AlignCenter: LucideIcon
  export const AlignRight: LucideIcon
  export const AlignJustify: LucideIcon
  export const EyeOff: LucideIcon
  export const Users: LucideIcon
  export const Link: LucideIcon
  export const TrendingDown: LucideIcon
}

// Fix for recharts
declare module 'recharts' {
  import { FC } from 'react'
  
  export const ResponsiveContainer: FC<any>
  export const LineChart: FC<any>
  export const Line: FC<any>
  export const BarChart: FC<any>
  export const Bar: FC<any>
  export const PieChart: FC<any>
  export const Pie: FC<any>
  export const AreaChart: FC<any>
  export const Area: FC<any>
  export const XAxis: FC<any>
  export const YAxis: FC<any>
  export const CartesianGrid: FC<any>
  export const Tooltip: FC<any>
  export const Legend: FC<any>
  export const Cell: FC<any>
  export const LabelList: FC<any>
}