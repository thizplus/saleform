import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface GPSButtonProps {
  lat: number | null
  lng: number | null
  onLocation: (lat: number, lng: number) => void
}

export function GPSButton({ lat, lng, onLocation }: GPSButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function getLocation() {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ไม่รองรับ GPS')
      return
    }

    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocation(pos.coords.latitude, pos.coords.longitude)
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('กรุณาอนุญาตการเข้าถึงตำแหน่ง')
            break
          case err.POSITION_UNAVAILABLE:
            setError('ไม่สามารถหาตำแหน่งได้')
            break
          case err.TIMEOUT:
            setError('หมดเวลาในการค้นหาตำแหน่ง')
            break
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={lat ? 'secondary' : 'outline'}
        size="sm"
        onClick={getLocation}
        disabled={loading}
        className="w-full"
      >
        {loading
          ? 'กำลังค้นหาตำแหน่ง...'
          : lat
            ? `ตำแหน่ง: ${lat.toFixed(5)}, ${lng?.toFixed(5)}`
            : 'ปักหมุดตำแหน่ง GPS'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
