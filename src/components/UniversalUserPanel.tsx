import { useNetwork } from '@/lib/network-context'
import { UserPanel as EVMUserPanel } from './UserPanel'
import { StellarUserPanel } from './StellarUserPanel'
import { TronUserPanel } from './TronUserPanel'

export const UniversalUserPanel = () => {
  const { isEVM, isStellar, isTron } = useNetwork()

  if (isEVM) {
    return <EVMUserPanel />
  }

  if (isStellar) {
    return <StellarUserPanel />
  }

  if (isTron) {
    return <TronUserPanel />
  }

  return (
    <div className="p-8 text-center">
      <p className="text-muted-foreground">
        User panel not available for this network yet
      </p>
    </div>
  )
}
