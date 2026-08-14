import { Database, HardDrive, RefreshCw } from 'lucide-react'
import { GoogleLogo } from '@/components/auth/GoogleLogo'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface ConnectedAccountItem {
  id: string
  provider: string
  email: string
  displayName?: string | null
  status: string
  storageAccount?: {
    usedBytes?: string | number | null
    limitBytes?: string | number | null
  } | null
}

export function DriveAccountTabs({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onSyncAccount,
  isSyncing = false,
  className
}: {
  accounts: ConnectedAccountItem[]
  selectedAccountId: string | null
  onSelectAccount: (accountId: string | null) => void
  onSyncAccount?: (accountId?: string) => void
  isSyncing?: boolean
  className?: string
}) {
  if (accounts.length === 0) return null

  // Calculate total combined stats
  const totalUsed = accounts.reduce((acc, a) => acc + BigInt(a.storageAccount?.usedBytes ?? '0'), 0n)
  const totalLimit = accounts.reduce((acc, a) => acc + BigInt(a.storageAccount?.limitBytes ?? '16106127360'), 0n)
  const percentTotal = totalLimit > 0n ? Math.min(100, Math.round(Number((totalUsed * 100n) / totalLimit))) : 0

  const activeAccount = accounts.find((a) => a.id === selectedAccountId)

  return (
    <div className={cn('grid gap-3', className)}>
      {/* Account Chips / Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* All Storage Tab */}
        <button
          type="button"
          onClick={() => onSelectAccount(null)}
          className={cn(
            'group flex shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left transition-all duration-150',
            selectedAccountId === null
              ? 'border-blue-500 bg-blue-50/80 dark:border-blue-500/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm'
              : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
          )}
        >
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
            selectedAccountId === null
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-slate-700'
          )}>
            <HardDrive className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold">All Storage</span>
              <span className="rounded-md bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                {accounts.length} Drives
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {formatBytes(totalUsed)} · {percentTotal}% used
            </p>
          </div>
        </button>

        {/* Per-Account Tabs */}
        {accounts.map((account) => {
          const isSelected = selectedAccountId === account.id
          const used = BigInt(account.storageAccount?.usedBytes ?? '0')
          const limit = BigInt(account.storageAccount?.limitBytes ?? '16106127360')
          const percent = limit > 0n ? Math.min(100, Math.round(Number((used * 100n) / limit))) : 0

          return (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelectAccount(account.id)}
              className={cn(
                'group flex shrink-0 items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left transition-all duration-150',
                isSelected
                  ? 'border-blue-500 bg-blue-50/80 dark:border-blue-500/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm'
                  : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
              )}
            >
              <div className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                isSelected
                  ? 'bg-white dark:bg-slate-800 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/80'
              )}>
                {account.provider === 's3' ? (
                  <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <GoogleLogo className="h-4 w-4" />
                )}
              </div>
              <div className="max-w-[160px] sm:max-w-[200px]">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-bold" title={account.displayName || account.email}>
                    {account.displayName || account.email.split('@')[0]}
                  </p>
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    account.status === 'connected' ? 'bg-emerald-500' : 'bg-slate-400'
                  )} />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {formatBytes(used)} / {formatBytes(limit)} ({percent}%)
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Active Specific Drive Banner */}
      {activeAccount && (
        <div className="flex flex-col gap-3 rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-transparent p-3.5 dark:border-blue-900/50 dark:from-blue-950/30 dark:via-slate-900/40 dark:to-transparent sm:flex-row sm:items-center sm:justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700">
              {activeAccount.provider === 's3' ? (
                <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <GoogleLogo className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {activeAccount.displayName || activeAccount.email}
                </span>
                <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  {activeAccount.provider === 's3' ? 'S3 Storage' : 'Google Drive'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Showing files strictly located in this drive ({activeAccount.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onSyncAccount && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSyncAccount(activeAccount.id)}
                disabled={isSyncing}
                className="h-8 gap-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                title="Sync and import existing files from this Google Drive"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin text-blue-600')} />
                {isSyncing ? 'Scanning Drive...' : 'Sync Full Drive'}
              </Button>
            )}
            <Button
              variant="soft"
              size="sm"
              onClick={() => onSelectAccount(null)}
              className="h-8 text-xs font-semibold"
            >
              Show All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
