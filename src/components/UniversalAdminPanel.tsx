import { useNetwork } from '@/lib/network-context'
import { AdminPanel as EVMAdminPanel } from './AdminPanel'
import { TronAdminPanel } from './TronAdminPanel'

export const UniversalAdminPanel = () => {
  const { isEVM, isStellar, isTron } = useNetwork()

  if (isEVM) {
    return <EVMAdminPanel />
  }

  if (isStellar) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          Stellar admin panel coming soon
        </p>
      </div>
    )
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
