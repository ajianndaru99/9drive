import { type FormEvent, type ReactNode, useEffect, useState, useRef } from 'react'
import { Outlet, useOutletContext, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bell,
  Braces,
  Clock,
  Archive,
  FileArchive,
  Gauge,
  History,
  LogOut,
  Menu,
  Moon,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Star,
  Sun,
  Trash2,
  X,
  ShieldCheck,
  HardDrive,
  Info,
  CheckCircle,
  ChevronDown,
  Upload,
  FileText,
  Folder
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/drive/BrandLogo'
import { MobileBottomNav } from '@/components/drive/MobileBottomNav'
import { MobileBottomSheet } from '@/components/drive/MobileBottomSheet'
import { apiFetch, formatBytes } from '@/lib/api'
import { useUpload } from '@/context/UploadContext'
import { clearAuthSession, getStoredUser, updateStoredUser, type AuthUser } from '@/lib/auth'
import { UserInitialsAvatar } from '@/components/drive/UserInitialsAvatar'
import { cn } from '@/lib/utils'

const menu: Array<{ label: string; icon: any; href: string; disabled?: boolean }> = [
  { label: 'All Files', icon: FileArchive, href: '/all-files' },
  { label: 'Recent', icon: Clock, href: '/recent' },
  { label: 'Starred', icon: Star, href: '/starred' },
  { label: 'Shared With Me', icon: Share2, href: '/shared' },
  { label: 'Quota Tracker', icon: Gauge, href: '/quota' },
  { label: 'Archived', icon: Archive, href: '/archived' },
  { label: 'Recycle Bin', icon: Trash2, href: '/trash' },
  { label: 'Activity Log', icon: History, href: '/activity' },
  { label: 'Setting', icon: Settings, href: '/settings' },
  { label: 'API Keys', icon: Braces, href: '/api' },
]

type StorageSummary = {
  totalBytes: string
  usedBytes: string
  availableBytes: string
}

type StorageBreakdown = {
  photo: string
  video: string
  document: string
}

function SystemInfoDropdown({ storage }: { storage: any }) {
  const activeGoogle = storage?.accounts?.filter((a: any) => a.provider === 'google_drive' && a.status === 'connected') ?? []
  const activeS3 = storage?.accounts?.filter((a: any) => a.provider === 's3' && a.status === 'connected') ?? []

  return (
    <div className="absolute right-0 top-12 z-50 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f172a] shadow-2xl shadow-slate-950/25">
      <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-800/80">
        <p className="text-sm font-extrabold text-slate-950 dark:text-white">Workspace Status & Info</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Overview of your connections & guidelines</p>
      </div>
      <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-slate-800 dark:text-slate-200">
        {/* Connection status */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Connection Status</h4>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Google Drive Accounts</span>
              <span className={activeGoogle.length > 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-100 dark:border-emerald-900/40" : "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-100 dark:border-amber-900/40"}>
                {activeGoogle.length} Connected
              </span>
            </div>
            {activeGoogle.map((acc: any) => (
              <p key={acc.id} className="text-[11px] text-slate-500 dark:text-slate-400 truncate px-2.5">— {acc.email}</p>
            ))}
            {activeS3.length > 0 && (
              <div className="flex items-center justify-between text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800 mt-1">
                <span className="font-semibold text-slate-700 dark:text-slate-200">S3 Buckets</span>
                <span className="text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-100 dark:border-blue-900/40">
                  {activeS3.length} Connected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Database & engine status */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5 text-blue-500" /> Storage Gateway</h4>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <p>• <b>Sync Engine:</b> Full Native Drive Synchronization</p>
            <p>• <b>Upload Mode:</b> Direct Stream with Quota Routing</p>
            <p>• <b>Max Upload Size:</b> Up to 5 GB per stream</p>
          </div>
        </div>

        {/* Tips & Guides */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-indigo-500" /> Usage Tips</h4>
          <ul className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1 pl-1">
            <li>Files in your connected Google Drives and S3 are synchronized in real-time.</li>
            <li>Star important files or drag & drop files directly into folders.</li>
            <li>Use the Sync button to refresh any recent changes made directly on Drive.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function Sidebar({
  onNavigate,
  user,
  storage,
  breakdown,
  onLogout,
  theme,
  onToggleTheme
}: {
  onNavigate?: () => void
  user: AuthUser | null
  storage: StorageSummary | null
  breakdown: StorageBreakdown
  onLogout: () => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
}) {
  const navigate = useNavigate()
  const used = Number(storage?.usedBytes ?? 0)
  const total = Number(storage?.totalBytes ?? 0)
  const progress = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const newMenuRef = useRef<HTMLDivElement>(null)

  const items = [
    ['Photo', formatBytes(breakdown.photo), 'bg-lime-500'],
    ['Video', formatBytes(breakdown.video), 'bg-yellow-400'],
    ['Document', formatBytes(breakdown.document), 'bg-cyan-400'],
    ['Free Storage', formatBytes(storage?.availableBytes), 'bg-orange-500'],
  ]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setNewMenuOpen(false)
      }
    }
    if (userMenuOpen || newMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen, newMenuOpen])

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 transition-colors duration-200">
      <div className="flex items-center gap-2.5 pb-3 pt-1">
        <BrandLogo className="h-8 w-8" />
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">9Drive</span>
      </div>

      {/* Google Drive M3 "+ New" Extended FAB */}
      <div ref={newMenuRef} className="relative my-2">
        <button
          type="button"
          onClick={() => setNewMenuOpen(!newMenuOpen)}
          className="group relative flex h-13 w-full items-center gap-3.5 rounded-2xl bg-white px-4 text-slate-800 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] hover:shadow-[0_2px_6px_2px_rgba(60,64,67,0.3),0_6px_10px_4px_rgba(60,64,67,0.15)] dark:bg-[#1e293b] dark:text-slate-100 dark:shadow-[0_2px_8px_rgba(0,0,0,0.5)] dark:hover:bg-[#283548] transition-all duration-200 active:scale-[0.98] border border-slate-200/80 dark:border-slate-700/80 overflow-hidden cursor-pointer"
        >
          <md-ripple />
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm group-hover:scale-110 transition-transform">
            <Upload className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-white">New</span>
          <ChevronDown className={cn("ml-auto h-4 w-4 text-slate-400 transition-transform duration-200", newMenuOpen && "rotate-180")} />
        </button>

        {newMenuOpen && (
          <div className="absolute left-0 right-0 top-15 z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              type="button"
              onClick={() => {
                setNewMenuOpen(false)
                onNavigate?.()
                window.dispatchEvent(new Event('9drive:trigger-upload'))
                if (location.pathname !== '/all-files') navigate('/all-files')
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>File upload</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setNewMenuOpen(false)
                onNavigate?.()
                window.dispatchEvent(new Event('9drive:trigger-new-folder'))
                if (location.pathname !== '/all-files') navigate('/all-files')
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
            >
              <Folder className="h-4 w-4 text-amber-500" />
              <span>New folder</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setNewMenuOpen(false)
                onNavigate?.()
                window.dispatchEvent(new Event('9drive:trigger-sync'))
                if (location.pathname !== '/all-files') navigate('/all-files')
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 text-emerald-500" />
              <span>Sync Google Drive</span>
            </button>
          </div>
        )}
      </div>

      <div ref={userMenuRef} className="relative">
        <div className="flex items-center gap-3 border-y border-slate-100 dark:border-slate-800 py-3 my-2">
          <UserInitialsAvatar
            name={user?.name}
            email={user?.email}
            size="md"
            showOnlineBadge
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">{user?.name ?? 'User'}</p>
            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{user?.email ?? 'Loading...'}</p>
          </div>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="User account options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Interactive User Avatar 3-Dots Menu Popover */}
        {userMenuOpen && (
          <div
            className="absolute left-0 right-0 top-16 z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800 user-menu-popover animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="border-b border-slate-100 dark:border-slate-700/80 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl mb-1.5">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{user?.name ?? 'User Account'}</p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  onNavigate?.()
                  navigate('/settings')
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Account & Drive Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  onNavigate?.()
                  navigate('/quota')
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors"
              >
                <Gauge className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Storage Quota Tracker</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  onNavigate?.()
                  navigate('/activity')
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors"
              >
                <History className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Activity & Audit Log</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  onNavigate?.()
                  navigate('/api')
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors"
              >
                <Braces className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                <span>API Keys & Webhooks</span>
              </button>

              {onToggleTheme && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme()
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    {theme === 'light' ? <Moon className="h-3.5 w-3.5 text-slate-600" /> : <Sun className="h-3.5 w-3.5 text-amber-400" />}
                    <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</span>
                  </span>
                </button>
              )}

              <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-700/80" />

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  onLogout()
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-red-400 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <nav className="grid gap-1">
        {menu.map((item) => item.disabled ? (
          <button key={item.label} type="button" disabled className="inline-flex h-10 cursor-not-allowed items-center gap-2.5 rounded-xl px-3.5 text-[13px] font-semibold text-slate-400 dark:text-slate-600 opacity-60">
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ) : (
          <NavLink
            key={item.label}
            to={item.href}
            onClick={onNavigate}
            className={({ isActive }) => cn(
              'inline-flex h-10 items-center gap-2.5 rounded-xl px-3.5 text-[13px] font-semibold transition-all border border-transparent',
              isActive
                ? 'bg-blue-50 text-blue-600 border-blue-200/70 shadow-sm dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50 font-bold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-4 text-[13px]">
        <div className="mb-3 space-y-1.5">
          {items.map(([label, value, color]) => (
            <div key={label} className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><span className={cn('h-1.5 w-1.5 rounded-full', color)} />{label}</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
          <span>{formatBytes(storage?.usedBytes)} used</span>
          <span className="text-slate-400 dark:text-slate-500">{formatBytes(storage?.totalBytes)}</span>
        </div>
        <div className="my-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <Button variant="danger" size="sm" className="mt-3 w-full justify-start h-9 px-3 text-xs font-bold" onClick={onLogout}>
          <LogOut className="h-3.5 w-3.5" />Log Out
        </Button>
      </div>
    </aside>
  )
}

type ConnectedAccount = {
  id: string
  email: string
  provider: string
}

export type DriveLayoutContext = {
  setHeaderActions: (actions: ReactNode) => void
}

export function useDriveLayoutActions() {
  return useOutletContext<DriveLayoutContext>()
}

export function DriveLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const [user, setUser] = useState<AuthUser | null>(getStoredUser())
  const [storage, setStorage] = useState<StorageSummary | null>(null)
  const [breakdown, setBreakdown] = useState<StorageBreakdown>({ photo: '0', video: '0', document: '0' })
  const [infoOpen, setInfoOpen] = useState(false)
  const [headerActions, setHeaderActions] = useState<ReactNode>(null)
  const { uploadProgress, setUploadProgress, retryFailedUpload } = useUpload()
  const [uploadProgressCollapsed, setUploadProgressCollapsed] = useState(false)
  const [mobileFabOpen, setMobileFabOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('9drive:theme')
    if (saved === 'light' || saved === 'dark') return saved
    return 'dark'
  })

  // Advanced search states
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterKind, setFilterKind] = useState(searchParams.get('kind') ?? '')
  const [filterAccountId, setFilterAccountId] = useState(searchParams.get('accountId') ?? '')
  const [filterMinSize, setFilterMinSize] = useState(() => {
    const min = searchParams.get('minSize')
    return min ? String(Math.round(Number(min) / (1024 * 1024))) : ''
  })
  const [filterMaxSize, setFilterMaxSize] = useState(() => {
    const max = searchParams.get('maxSize')
    return max ? String(Math.round(Number(max) / (1024 * 1024))) : ''
  })
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const raw = searchParams.get('startDate')
    return raw ? raw.split('T')[0] : ''
  })
  const [filterEndDate, setFilterEndDate] = useState(() => {
    const raw = searchParams.get('endDate')
    return raw ? raw.split('T')[0] : ''
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    localStorage.setItem('9drive:theme', theme)
  }, [theme])

  useEffect(() => {
    setSearchValue(searchParams.get('q') ?? '')
    setFilterKind(searchParams.get('kind') ?? '')
    setFilterAccountId(searchParams.get('accountId') ?? '')
    setFilterMinSize(() => {
      const min = searchParams.get('minSize')
      return min ? String(Math.round(Number(min) / (1024 * 1024))) : ''
    })
    setFilterMaxSize(() => {
      const max = searchParams.get('maxSize')
      return max ? String(Math.round(Number(max) / (1024 * 1024))) : ''
    })

    const rawStart = searchParams.get('startDate')
    setFilterStartDate(rawStart ? rawStart.split('T')[0] : '')

    const rawEnd = searchParams.get('endDate')
    setFilterEndDate(rawEnd ? rawEnd.split('T')[0] : '')
  }, [searchParams])

  function toggleTheme() {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  async function loadSidebarStats() {
    try {
      const [summaryData, breakdownData] = await Promise.all([
        apiFetch<StorageSummary>('/storage/summary'),
        apiFetch<StorageBreakdown>('/storage/breakdown'),
      ])
      setStorage(summaryData)
      setBreakdown(breakdownData)
    } catch {
      // ignore
    }
  }

  async function loadConnectedAccounts() {
    try {
      const data = await apiFetch<{ accounts: ConnectedAccount[] }>('/connected-accounts')
      setAccounts(data.accounts)
    } catch {
      // ignore
    }
  }

  function logout() {
    clearAuthSession()
    navigate('/login')
  }

  // Live Search States
  const [liveResults, setLiveResults] = useState<{ files: any[]; folders: any[] }>({ files: [], folders: [] })
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveSearchOpen, setLiveSearchOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const query = searchValue.trim()
    if (!query || query.length < 2) {
      setLiveResults({ files: [], folders: [] })
      setLiveSearchOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLiveLoading(true)
      try {
        const [fileData, folderData] = await Promise.all([
          apiFetch<{ files: any[] }>(`/files?q=${encodeURIComponent(query)}`),
          apiFetch<{ folders: any[] }>(`/folders?all=1`)
        ])
        const matchedFolders = folderData.folders.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
        setLiveResults({ files: fileData.files.slice(0, 6), folders: matchedFolders })
        setLiveSearchOpen(true)
      } catch {
        // ignore
      } finally {
        setLiveLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchValue])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setLiveSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function applyFilters() {
    setLiveSearchOpen(false)
    const nextParams = new URLSearchParams()
    const activeFolderId = searchParams.get('folderId')
    if (activeFolderId && location.pathname === '/all-files') {
      nextParams.set('folderId', activeFolderId)
    }

    const q = searchValue.trim()
    if (q) nextParams.set('q', q)

    if (filterKind) nextParams.set('kind', filterKind)
    if (filterAccountId) nextParams.set('accountId', filterAccountId)

    if (filterMinSize) {
      const bytes = Number(filterMinSize) * 1024 * 1024
      if (!isNaN(bytes)) nextParams.set('minSize', String(bytes))
    }
    if (filterMaxSize) {
      const bytes = Number(filterMaxSize) * 1024 * 1024
      if (!isNaN(bytes)) nextParams.set('maxSize', String(bytes))
    }

    if (filterStartDate) {
      nextParams.set('startDate', new Date(filterStartDate).toISOString())
    }
    if (filterEndDate) {
      nextParams.set('endDate', new Date(filterEndDate).toISOString())
    }

    setFiltersOpen(false)
    navigate({ pathname: '/all-files', search: nextParams.toString() })
  }

  function clearFilters() {
    setFilterKind('')
    setFilterAccountId('')
    setFilterMinSize('')
    setFilterMaxSize('')
    setFilterStartDate('')
    setFilterEndDate('')
    setFiltersOpen(false)

    const nextParams = new URLSearchParams()
    const activeFolderId = searchParams.get('folderId')
    if (activeFolderId && location.pathname === '/all-files') {
      nextParams.set('folderId', activeFolderId)
    }
    const q = searchValue.trim()
    if (q) nextParams.set('q', q)

    navigate({ pathname: '/all-files', search: nextParams.toString() })
  }

  function searchFiles(event: FormEvent) {
    event.preventDefault()
    applyFilters()
  }

  useEffect(() => {
    apiFetch<{ user: AuthUser }>('/auth/me')
      .then((data) => {
        setUser(data.user)
        updateStoredUser(data.user)
      })
      .catch(() => undefined)
    loadSidebarStats().catch(() => undefined)
    loadConnectedAccounts().catch(() => undefined)
    window.addEventListener('9drive:storage-changed', loadSidebarStats)
    return () => window.removeEventListener('9drive:storage-changed', loadSidebarStats)
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setInfoOpen(false)
        setLiveSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="flex min-h-screen w-full flex-col lg:h-screen lg:overflow-hidden lg:flex-row">
        <div className="hidden lg:block lg:h-screen lg:shrink-0">
          <Sidebar user={user} storage={storage} breakdown={breakdown} onLogout={logout} theme={theme} onToggleTheme={toggleTheme} />
        </div>
        <div className={cn('fixed inset-0 z-40 bg-slate-950/40 transition-opacity lg:hidden', sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={() => setSidebarOpen(false)} />
        <div className={cn('fixed inset-y-0 left-0 z-50 transform bg-white dark:bg-[#0c111e] shadow-2xl transition-transform duration-300 ease-out lg:hidden', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
          <div className="absolute right-4 top-4 z-10">
            <Button variant="outline" size="icon" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Sidebar user={user} storage={storage} breakdown={breakdown} onLogout={logout} onNavigate={() => setSidebarOpen(false)} theme={theme} onToggleTheme={toggleTheme} />
        </div>
        <section className="min-w-0 flex-1 p-4 sm:p-6 pb-28 lg:pb-8 lg:h-screen lg:overflow-y-auto lg:p-8">
          <header className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="outline" size="icon" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex min-w-0 items-center gap-2">
                  <BrandLogo className="h-9 w-9 shrink-0" />
                  <span className="truncate text-xl font-extrabold tracking-tight">9Drive</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
                  {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
                <div className="relative shrink-0">
                  <Button variant="outline" size="icon" className="relative" aria-label="System info" aria-expanded={infoOpen} onClick={() => setInfoOpen(!infoOpen)}>
                    <Bell className="h-5 w-5" />
                    {!infoOpen ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" /> : null}
                  </Button>
                  {infoOpen ? <SystemInfoDropdown storage={storage} /> : null}
                </div>
              </div>
            </div>
            <div ref={searchContainerRef} className="relative w-full min-w-0 flex-1 lg:max-w-md xl:max-w-xl">
              <form onSubmit={searchFiles} className="relative w-full">
                <div className="relative flex items-center w-full">
                  <Search className="absolute left-4 h-4.5 w-4.5 text-slate-500 dark:text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchValue}
                    onFocus={() => { if (searchValue.trim().length >= 2) setLiveSearchOpen(true) }}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search in Drive (files, folders, docs...)"
                    className="h-12 w-full pl-11 pr-20 rounded-full border border-transparent bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm font-medium shadow-sm transition-all focus:bg-white dark:focus:bg-[#0f172a] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 outline-none"
                  />
                  <div className="absolute right-2.5 flex items-center gap-1">
                    {searchValue && (
                      <button
                        type="button"
                        onClick={() => { setSearchValue(''); setLiveSearchOpen(false) }}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(!filtersOpen)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer",
                        filtersOpen && "text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400"
                      )}
                      aria-label="Search filters"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Live search dropdown popover */}
              {liveSearchOpen && (liveResults.folders.length > 0 || liveResults.files.length > 0 || liveLoading) && (
                <div className="absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f172a] shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>Search Suggestions</span>
                    {liveLoading && <span className="text-blue-600 dark:text-blue-400 animate-pulse">Searching...</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                    {liveResults.folders.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-3 py-1">Folders</p>
                        {liveResults.folders.map((folder) => (
                          <button
                            key={folder.id}
                            type="button"
                            onClick={() => {
                              setLiveSearchOpen(false)
                              navigate(`/all-files?folderId=${folder.id}`)
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-slate-800 dark:text-slate-200"
                          >
                            <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span className="truncate font-semibold">{folder.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {liveResults.files.length > 0 && (
                      <div className="mt-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-3 py-1">Files</p>
                        {liveResults.files.map((file) => (
                          <button
                            key={file.id}
                            type="button"
                            onClick={() => {
                              setLiveSearchOpen(false)
                              navigate(`/all-files?q=${encodeURIComponent(file.name)}`)
                            }}
                            className="flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-slate-800 dark:text-slate-200"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
                              <span className="truncate font-semibold">{file.name}</span>
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{formatBytes(file.sizeBytes)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                    <button type="button" onClick={applyFilters} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 cursor-pointer">
                      Press Enter to see all results →
                    </button>
                  </div>
                </div>
              )}

              {filtersOpen && (
                <div className="absolute left-0 right-0 top-14 z-50 rounded-[28px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f172a] p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-sm font-extrabold text-slate-950 dark:text-white">Advanced Search Filters</span>
                    <button type="button" onClick={clearFilters} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">Clear All</button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {/* File Kind */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">File Type</label>
                      <select value={filterKind} onChange={(e) => setFilterKind(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none">
                        <option value="">All Types</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                        <option value="doc">Document</option>
                        <option value="archive">Archive</option>
                      </select>
                    </div>

                    {/* Connected Account */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Connected Account</label>
                      <select value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none">
                        <option value="">All Accounts</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.email} ({acc.provider})</option>
                        ))}
                      </select>
                    </div>

                    {/* Size range */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Size Range (MB)</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input type="number" placeholder="Min" value={filterMinSize} onChange={(e) => setFilterMinSize(e.target.value)} className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none" />
                        <span className="text-slate-400 text-xs font-semibold">to</span>
                        <input type="number" placeholder="Max" value={filterMaxSize} onChange={(e) => setFilterMaxSize(e.target.value)} className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none" />
                      </div>
                    </div>

                    {/* Date range */}
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date Range</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none" />
                        <span className="text-slate-400 text-xs font-semibold">to</span>
                        <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <Button variant="outline" size="sm" type="button" onClick={() => setFiltersOpen(false)}>Cancel</Button>
                    <Button variant="default" size="sm" type="button" onClick={applyFilters}>Apply Filters</Button>
                  </div>
                </div>
              )}
            </div>
            {/* Header actions injected by child pages */}
            {headerActions ? (
              <div className="hidden lg:flex items-center gap-2 shrink-0">
                {headerActions}
              </div>
            ) : null}
             <div className="relative hidden flex-wrap gap-2 lg:flex shrink-0">
              <Button variant="outline" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button variant="outline" size="icon" className="relative" aria-label="System info" aria-expanded={infoOpen} onClick={() => setInfoOpen(!infoOpen)}>
                <Bell className="h-5 w-5" />
                {!infoOpen ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" /> : null}
              </Button>
              {infoOpen ? <SystemInfoDropdown storage={storage} /> : null}
            </div>
          </header>
          <Outlet context={{ setHeaderActions } satisfies DriveLayoutContext} />
        </section>
      </div>

      {/* Mobile Material 3 Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 z-40 block lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFabOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-[0_4px_16px_rgba(37,99,235,0.4)] active:scale-95 transition-all duration-200 overflow-hidden cursor-pointer"
          aria-label="Create new or upload"
        >
          <md-ripple />
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {/* Mobile FAB Action Bottom Sheet */}
      <MobileBottomSheet
        open={mobileFabOpen}
        onClose={() => setMobileFabOpen(false)}
        title="Create & Upload"
      >
        <div className="grid gap-1.5 py-1">
          <button
            type="button"
            onClick={() => {
              setMobileFabOpen(false)
              window.dispatchEvent(new Event('9drive:trigger-upload'))
              if (location.pathname !== '/all-files') navigate('/all-files')
            }}
            className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">Upload files</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Stream files to Google Drive</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileFabOpen(false)
              window.dispatchEvent(new Event('9drive:trigger-new-folder'))
              if (location.pathname !== '/all-files') navigate('/all-files')
            }}
            className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">New folder</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Organize your files</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileFabOpen(false)
              window.dispatchEvent(new Event('9drive:trigger-sync'))
              if (location.pathname !== '/all-files') navigate('/all-files')
            }}
            className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-white">Sync Google Drive</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scan and refresh existing drive files</p>
            </div>
          </button>
        </div>
      </MobileBottomSheet>

      {/* Material 3 Bottom Navigation Bar */}
      <MobileBottomNav />

      {uploadProgress.open ? (
        <div className="fixed inset-x-3 bottom-20 lg:bottom-5 z-[70] max-h-[70dvh] overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-2xl shadow-slate-950/25 backdrop-blur-2xl sm:inset-x-auto sm:right-5 sm:w-[min(420px,calc(100vw-2.5rem))] floating-upload-panel animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/90 px-4 py-3">
            <div className="flex items-center gap-2 font-extrabold text-sm text-slate-950 dark:text-white">
              {uploadProgress.status === 'done' ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : uploadProgress.status === 'partial' || uploadProgress.status === 'error' ? <X className="h-5 w-5 text-red-500" /> : <Upload className="h-5 w-5 text-blue-600" />}
              {uploadProgress.status === 'done' ? 'Upload complete' : uploadProgress.status === 'partial' ? 'Upload completed with errors' : uploadProgress.status === 'error' ? 'Upload failed' : uploadProgress.percent >= 99 ? 'Processing on server' : 'Uploading files'}
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => setUploadProgressCollapsed(!uploadProgressCollapsed)}><ChevronDown className={cn("h-4 w-4 transition-transform", uploadProgressCollapsed && "rotate-180")} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => setUploadProgress((current) => ({ ...current, open: false }))}><X className="h-4 w-4" /></Button>
            </div>
          </div>
          {!uploadProgressCollapsed && (
            <div className="p-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3 text-sm mb-2">
                  <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{uploadProgress.fileName}</p>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{uploadProgress.percent}%</span>
                </div>
                <md-linear-progress
                  value={uploadProgress.percent / 100}
                  indeterminate={uploadProgress.percent >= 99 && uploadProgress.status !== 'done' ? true : undefined}
                />
              </div>
              {uploadProgress.files.length > 0 ? (
                <div className="grid max-h-64 gap-2.5 overflow-y-auto pr-1 text-slate-950 dark:text-slate-100">
                  {uploadProgress.files.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${index}`} className="grid gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 p-3 border border-slate-100 dark:border-slate-700/60">
                      <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                        <p className="min-w-0 flex-1 truncate font-semibold text-slate-900 dark:text-slate-100" title={file.name}>{file.name}</p>
                        <span className="shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">{file.percent}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatBytes(file.size)}</span>
                        <div className="flex items-center gap-2">
                          {file.status === 'error' && (
                            <Button variant="default" className="h-6 px-2 text-[11px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-none border-none" onClick={() => retryFailedUpload(file.name)}>
                              Retry
                            </Button>
                          )}
                          <span className={file.status === 'error' ? 'font-semibold text-red-600' : file.status === 'done' ? 'font-semibold text-emerald-600' : 'font-semibold text-blue-600'}>
                            {file.status === 'error' ? 'Failed' : file.status === 'done' ? 'Done' : file.percent >= 99 ? 'Processing' : 'Uploading'}
                          </span>
                        </div>
                      </div>
                      <md-linear-progress
                        value={file.percent / 100}
                        indeterminate={file.percent >= 99 && file.status !== 'done' ? true : undefined}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </main>
  )
}
