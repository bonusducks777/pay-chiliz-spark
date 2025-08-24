import { useNetwork } from '@/lib/network-context'
import { AdminPanel as EVMAdminPanel } from './AdminPanel'
import { StellarAdminPanel } from './StellarAdminPanel'
import { TronAdminPanel } from './TronAdminPanel'

export const UniversalAdminPanel = () => {
  const { isEVM, isStellar, isTron } = useNetwork()

  if (isEVM) {
    return <EVMAdminPanel />
  }

  if (isStellar) {
    return <StellarAdminPanel />
  }

  if (isTron) {
    return <TronAdminPanel />
  }

  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">
        Admin panel not available for this network yet
      </p>
    </div>
  )
}
