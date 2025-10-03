'use client'

import {
  CameraAlt as CameraIcon,
  Videocam as VideoIcon,
  PhotoCamera as PhotoIcon,
  LocationOn as LocationIcon,
  Map as MapIcon,
  Streetview as StreetViewIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  AttachMoney as MoneyIcon,
  // Peso symbol (using AttachMoney as base)
  AttachMoney as PesoIcon,
  DirectionsCar as CarIcon,
  BarChart as ChartIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  PhoneAndroid as MobileIcon,
  GpsFixed as TargetIcon,
  Lock as LockIcon,
  Folder as FolderIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Link as LinkIcon,
  Assignment as ReportIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  FileDownload as FileIcon,
  Cloud as CloudIcon,
  BugReport as BugIcon,
  Smartphone as SmartphoneIcon,
  TouchApp as TouchIcon,
  TextFields as TypographyIcon,
  Palette as PaletteIcon,
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Close as CloseIcon,
  ExitToApp as SignOutIcon,
  Menu as MenuIcon,
  MoreVert as MoreIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  List as ListIcon,
  GridView as GridIcon,
  ViewList as ViewListIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Notifications as NotificationIcon,
  NotificationsActive as NotificationActiveIcon,
  NotificationsOff as NotificationOffIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  ThumbDownOutlined as ThumbDownOutlinedIcon,
  Share as ShareIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  CloudSync as CloudSyncIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  SignalWifi4Bar as SignalWifi4BarIcon,
  SignalWifiOff as SignalWifiOffIcon,
  BatteryFull as BatteryFullIcon,
  BatteryStd as BatteryStdIcon,
  BatteryAlert as BatteryAlertIcon,
  BatteryUnknown as BatteryUnknownIcon,
  BatteryChargingFull as BatteryChargingFullIcon,
  BatteryCharging20 as BatteryCharging20Icon,
  BatteryCharging30 as BatteryCharging30Icon,
  BatteryCharging50 as BatteryCharging50Icon,
  BatteryCharging60 as BatteryCharging60Icon,
  BatteryCharging80 as BatteryCharging80Icon,
  BatteryCharging90 as BatteryCharging90Icon,
  BatterySaver as BatterySaverIcon,
} from '@mui/icons-material'

// Icon mapping for easy replacement
export const Icons = {
  // Camera & Media
  camera: CameraIcon,
  video: VideoIcon,
  photo: PhotoIcon,
  
  // Location & Maps
  location: LocationIcon,
  map: MapIcon,
  streetview: StreetViewIcon,
  
  // Actions
  copy: CopyIcon,
  check: CheckIcon,
  cancel: CancelIcon,
  pending: PendingIcon,
  money: MoneyIcon,
  peso: PesoIcon,
  car: CarIcon,
  chart: ChartIcon,
  search: SearchIcon,
  delete: DeleteIcon,
  build: BuildIcon,
  mobile: MobileIcon,
  target: TargetIcon,
  lock: LockIcon,
  folder: FolderIcon,
  upload: UploadIcon,
  download: DownloadIcon,
  link: LinkIcon,
  report: ReportIcon,
  admin: AdminIcon,
  person: PersonIcon,
  security: SecurityIcon,
  file: FileIcon,
  cloud: CloudIcon,
  bug: BugIcon,
  smartphone: SmartphoneIcon,
  touch: TouchIcon,
  typography: TypographyIcon,
  palette: PaletteIcon,
  
  // Navigation
  back: BackIcon,
  forward: ForwardIcon,
  close: CloseIcon,
  signout: SignOutIcon,
  menu: MenuIcon,
  more: MoreIcon,
  add: AddIcon,
  remove: RemoveIcon,
  edit: EditIcon,
  save: SaveIcon,
  send: SendIcon,
  refresh: RefreshIcon,
  settings: SettingsIcon,
  home: HomeIcon,
  dashboard: DashboardIcon,
  list: ListIcon,
  grid: GridIcon,
  viewlist: ViewListIcon,
  view: ViewIcon,
  hide: HideIcon,
  
  // Status & Feedback
  info: InfoIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  notification: NotificationIcon,
  notificationActive: NotificationActiveIcon,
  notificationOff: NotificationOffIcon,
  
  // Ratings & Favorites
  star: StarIcon,
  starBorder: StarBorderIcon,
  favorite: FavoriteIcon,
  favoriteBorder: FavoriteBorderIcon,
  thumbUp: ThumbUpIcon,
  thumbDown: ThumbDownIcon,
  thumbUpOutlined: ThumbUpOutlinedIcon,
  thumbDownOutlined: ThumbDownOutlinedIcon,
  share: ShareIcon,
  
  // Cloud & Network
  cloudUpload: CloudUploadIcon,
  cloudDownload: CloudDownloadIcon,
  cloudSync: CloudSyncIcon,
  cloudDone: CloudDoneIcon,
  cloudOff: CloudOffIcon,
  wifi: WifiIcon,
  wifiOff: WifiOffIcon,
  signalWifi4Bar: SignalWifi4BarIcon,
  signalWifiOff: SignalWifiOffIcon,
  
  // Battery
  batteryFull: BatteryFullIcon,
  batteryStd: BatteryStdIcon,
  batteryAlert: BatteryAlertIcon,
  batteryUnknown: BatteryUnknownIcon,
  batteryChargingFull: BatteryChargingFullIcon,
  batteryCharging20: BatteryCharging20Icon,
  batteryCharging30: BatteryCharging30Icon,
  batteryCharging50: BatteryCharging50Icon,
  batteryCharging60: BatteryCharging60Icon,
  batteryCharging80: BatteryCharging80Icon,
  batteryCharging90: BatteryCharging90Icon,
  batterySaver: BatterySaverIcon,
}

interface IconProps {
  name: keyof typeof Icons
  size?: number | string
  className?: string
  color?: string
}

export default function Icon({ name, size = 24, className = '', color }: IconProps) {
  const IconComponent = Icons[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  
  return (
    <IconComponent
      sx={{
        fontSize: size,
        color: color,
        ...(className && { className })
      }}
    />
  )
}