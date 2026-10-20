import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

export interface GeoAddress {
  tambon: string
  amphoe: string
  province: string
  postcode: string
}

interface GPSButtonProps {
  lat: number | null
  lng: number | null
  onLocation: (lat: number, lng: number, accuracy?: number) => void
  onAddress?: (address: GeoAddress) => void
  address?: GeoAddress | null
}

/** Reverse geocode ผ่าน Nominatim (ฟรี, ไม่ต้อง key) */
async function reverseGeocode(lat: number, lng: number): Promise<GeoAddress | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=th&addressdetails=1`
    )
    const data = await res.json()
    const a = data.address || {}
    // Nominatim: town/village = ตำบล, county = อำเภอ, province = จังหวัด
    const tambon = (a.town || a.village || a.suburb || '').replace(/^ตำบล/, '')
    const amphoe = (a.county || a.city_district || '').replace(/^อำเภอ/, '')
    const province = (a.province || a.state || '').replace(/^จังหวัด/, '')
    const postcode = a.postcode || ''
    return { tambon, amphoe, province, postcode }
  } catch {
    return null
  }
}

export function GPSButton({ lat, onLocation, onAddress, address }: GPSButtonProps) {
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
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        onLocation(latitude, longitude, accuracy)

        // Reverse geocode เพื่อได้ ตำบล/อำเภอ/จังหวัด
        if (onAddress) {
          const geo = await reverseGeocode(latitude, longitude)
          if (geo) onAddress(geo)
        }
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('กรุณาอนุญาตการเข้าถึงตำแหน่ง — ไปที่ตั้งค่า > แอป LINE > ตำแหน่ง')
            break
          case err.POSITION_UNAVAILABLE:
            setError('ไม่สามารถหาตำแหน่งได้ — ลองเปิด GPS แล้วกดอีกครั้ง')
            break
          case err.TIMEOUT:
            setError('หมดเวลา — ลองอีกครั้งในที่โล่ง')
            break
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const hasLocation = lat !== null

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={getLocation}
        disabled={loading}
        className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
          hasLocation
            ? 'bg-success-soft text-success-ink border border-success/30'
            : 'border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/50'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            กำลังค้นหาตำแหน่ง...
          </>
        ) : hasLocation ? (
          <>
            <MapPin className="size-4" />
            ได้ตำแหน่งแล้ว — แตะเพื่อปักใหม่
          </>
        ) : (
          <>
            <MapPin className="size-4" />
            ปักตำแหน่งหน้างาน
          </>
        )}
      </button>

      {/* แสดงที่อยู่จาก GPS */}
      {hasLocation && address && (address.tambon || address.amphoe) && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <MapPin className="size-3.5 mt-0.5 shrink-0" />
          <span>
            {[
              address.tambon && `ต.${address.tambon}`,
              address.amphoe && `อ.${address.amphoe}`,
              address.province && `จ.${address.province}`,
              address.postcode,
            ].filter(Boolean).join(' ')}
          </span>
        </div>
      )}

      {error && (
        <p className="text-sm text-danger-ink bg-danger-soft rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  )
}
