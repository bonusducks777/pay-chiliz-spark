import { useState, useEffect } from 'react'

interface MerchantInfo {
  name: string
  location: string
}

const MERCHANT_INFO_KEY = 'payment-terminal-merchant-info'

export const useMerchantInfo = () => {
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo>({
    name: '',
    location: ''
  })

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(MERCHANT_INFO_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setMerchantInfo(parsed)
      } catch (error) {
        console.error('Failed to parse stored merchant info:', error)
      }
    }
  }, [])

  // Save to localStorage whenever merchantInfo changes
  useEffect(() => {
    localStorage.setItem(MERCHANT_INFO_KEY, JSON.stringify(merchantInfo))
  }, [merchantInfo])

  const updateMerchantInfo = (updates: Partial<MerchantInfo>) => {
    setMerchantInfo(prev => ({ ...prev, ...updates }))
  }

  return {
    merchantInfo,
    setMerchantInfo,
    updateMerchantInfo
  }
}