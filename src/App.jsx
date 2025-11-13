import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudSun,
  CloudRain,
  Cloud,
  Sun,
  Wind,
  Droplets,
  Umbrella,
  MapPin,
  Thermometer,
  Sunrise,
  Sunset,
  Gauge,
} from 'lucide-react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

const codeToIcon = (code) => {
  // Open-Meteo WMO codes simplified
  if ([0].includes(code)) return Sun
  if ([1, 2].includes(code)) return CloudSun
  if ([3, 45, 48].includes(code)) return Cloud
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return CloudRain
  if ([95, 96, 99].includes(code)) return CloudRain
  return Cloud
}

const codeToText = (code) => {
  const map = {
    0: 'Despejado',
    1: 'Mayormente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Niebla helada',
    51: 'Llovizna ligera',
    53: 'Llovizna',
    55: 'Llovizna intensa',
    61: 'Lluvia ligera',
    63: 'Lluvia',
    65: 'Lluvia intensa',
    80: 'Chubascos',
    81: 'Chubascos fuertes',
    82: 'Chubascos violentos',
    95: 'Tormenta',
    96: 'Tormenta fuerte',
    99: 'Tormenta severa',
  }
  return map[code] || 'Clima'
}

function Glass({ children, className = '' }) {
  return (
    <div className={`backdrop-blur-xl bg-white/10 dark:bg-white/10 shadow-[inset_1px_1px_0_0_rgba(255,255,255,0.25),_0_10px_30px_rgba(0,0,0,0.35)] border border-white/20 rounded-3xl ${className}`}>
      {children}
    </div>
  )
}

function NeumoButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl transition-all text-sm font-medium ${
        active
          ? 'bg-white/20 text-white shadow-[inset_6px_6px_12px_rgba(0,0,0,0.25),_inset_-6px_-6px_12px_rgba(255,255,255,0.1)]'
          : 'bg-white/10 text-white/80 hover:bg-white/20 shadow-[8px_8px_16px_rgba(0,0,0,0.35),_-8px_-8px_16px_rgba(255,255,255,0.06)]'
      }`}
    >
      {children}
    </button>
  )
}

function useCRLocations() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${BACKEND}/api/locations`)
        const data = await res.json()
        setLocations(data)
      } catch (e) {
        setError('No se pudieron cargar ubicaciones')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])
  return { locations, loading, error }
}

function useWeather(lat, lon) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (lat == null || lon == null) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${BACKEND}/api/weather?lat=${lat}&lon=${lon}`)
        const json = await res.json()
        if (json.ok) setData(json.data)
        else setError('Error al obtener clima')
      } catch (e) {
        setError('Error de red')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lat, lon])

  return { data, loading, error }
}

function Header({ selected, onSelect, locations }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-white">
        <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
          <Sun className="text-yellow-300" size={22} />
        </div>
        <div>
          <p className="text-white/80 text-xs">Clima Costa Rica</p>
          <h1 className="font-semibold">IMN Style</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={18} className="text-white/70" />
        <div className="flex gap-2 flex-wrap">
          {locations.map((l) => (
            <NeumoButton
              key={l.slug}
              active={selected?.slug === l.slug}
              onClick={() => onSelect(l)}
            >
              {l.name}
            </NeumoButton>
          ))}
        </div>
      </div>
    </div>
  )
}

function CurrentWeather({ weather }) {
  const code = weather.current.weather_code
  const Icon = codeToIcon(code)
  return (
    <Glass className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="size-20 md:size-24 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
              <Icon size={44} className="text-white" />
            </motion.div>
          </div>
          <div>
            <div className="text-5xl md:text-6xl lg:text-7xl font-semibold text-white drop-shadow">{Math.round(weather.current.temperature_2m)}°</div>
            <p className="text-white/80">{codeToText(code)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
          <Stat icon={Droplets} label="Humedad" value={`${weather.current.relative_humidity_2m}%`} />
          <Stat icon={Wind} label="Viento" value={`${Math.round(weather.current.wind_speed_10m)} km/h`} />
          <Stat icon={Umbrella} label="Precip." value={`${weather.current.precipitation ?? 0} mm`} />
          <Stat icon={Gauge} label="Sensación" value={`${Math.round(weather.current.apparent_temperature)}°`} />
        </div>
      </div>
    </Glass>
  )
}

function Stat({ icon: Ico, label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-white/90 shadow-[inset_4px_4px_10px_rgba(0,0,0,0.25),_inset_-4px_-4px_10px_rgba(255,255,255,0.06)]">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/60">
        <Ico size={14} />
        {label}
      </div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  )
}

function Daily({ daily }) {
  const days = useMemo(() => {
    return daily.time.map((t, i) => ({
      date: new Date(t),
      code: daily.weather_code[i],
      tmax: daily.temperature_2m_max[i],
      tmin: daily.temperature_2m_min[i],
      pop: daily.precipitation_probability_max[i],
      sunrise: daily.sunrise[i],
      sunset: daily.sunset[i],
      wind: daily.wind_speed_10m_max[i],
    }))
  }, [daily])

  return (
    <Glass className="p-5">
      <div className="flex items-center justify-between mb-3 text-white/80">
        <span className="font-medium">Pronóstico 7 días</span>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1"><Sunrise size={14} /> am</div>
          <div className="flex items-center gap-1"><Sunset size={14} /> pm</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {days.slice(0, 7).map((d, idx) => {
          const Icon = codeToIcon(d.code)
          const dayName = d.date.toLocaleDateString('es-CR', { weekday: 'long' })
          return (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="rounded-2xl p-4 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 text-white">
              <div className="flex items-center justify-between">
                <span className="capitalize text-white/80">{dayName}</span>
                <Icon size={22} />
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-2xl font-semibold">{Math.round(d.tmax)}°</span>
                <span className="text-white/70">/{Math.round(d.tmin)}°</span>
              </div>
              <div className="text-xs text-white/70 mt-2">Prob. lluvia: {d.pop ?? 0}% • Viento máx.: {Math.round(d.wind)} km/h</div>
            </motion.div>
          )
        })}
      </div>
    </Glass>
  )
}

function Hourly({ hourly }) {
  // show next 12 hours temperature and precip probability
  const items = useMemo(() => {
    const now = Date.now()
    const arr = []
    for (let i = 0; i < hourly.time.length; i++) {
      const ts = new Date(hourly.time[i]).getTime()
      if (ts >= now && arr.length < 12) {
        arr.push({
          time: new Date(hourly.time[i]),
          temp: hourly.temperature_2m[i],
          pop: hourly.precipitation_probability[i],
          code: hourly.weather_code[i],
          wind: hourly.wind_speed_10m[i],
          clouds: hourly.cloud_cover[i],
        })
      }
    }
    return arr
  }, [hourly])

  return (
    <Glass className="p-5">
      <div className="text-white/80 font-medium mb-3">Próximas horas</div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((h, idx) => {
          const Icon = codeToIcon(h.code)
          return (
            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="min-w-[110px] rounded-2xl bg-white/10 border border-white/10 p-3 text-white">
              <div className="text-xs text-white/70">
                {h.time.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Icon size={18} />
                <div className="text-lg font-semibold">{Math.round(h.temp)}°</div>
              </div>
              <div className="text-xs text-white/70 mt-1">Lluvia {h.pop ?? 0}%</div>
              <div className="text-xs text-white/60">Viento {Math.round(h.wind)} km/h</div>
            </motion.div>
          )
        })}
      </div>
    </Glass>
  )
}

export default function App() {
  const { locations } = useCRLocations()
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!selected && locations.length > 0) setSelected(locations[0])
  }, [locations, selected])

  const { data, loading } = useWeather(selected?.lat, selected?.lon)

  return (
    <div className="min-h-screen bg-[#0b1020] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <Spline scene="https://prod.spline.design/4Zh-Q6DWWp5yPnQf/scene.splinecode" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-10">
        <Header selected={selected} onSelect={setSelected} locations={locations} />

        <div className="mt-6 grid grid-cols-1 gap-6">
          <Glass className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin size={16} />
                  <span className="uppercase tracking-wider text-xs">Costa Rica</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-semibold mt-1">{selected?.name || 'Cargando...'}</h2>
                <p className="text-white/70 text-sm">{selected?.region || ''}</p>
              </div>
              {data && (
                <div className="flex items-center gap-4 text-white/80">
                  <div className="flex items-center gap-1"><Thermometer size={16} /> Real {Math.round(data.current.apparent_temperature)}°</div>
                </div>
              )}
            </div>
          </Glass>

          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-white/70">
                Cargando clima...
              </motion.div>
            )}
          </AnimatePresence>

          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <CurrentWeather weather={data} />
                <Hourly hourly={data.hourly} />
              </div>
              <div className="space-y-6">
                <Daily daily={data.daily} />
              </div>
            </div>
          )}
        </div>

        <footer className="mt-10 text-center text-white/60 text-xs">
          Datos en vivo • Inspirado por el Instituto Meteorológico Nacional • Pura vida 🇨🇷
        </footer>
      </div>
    </div>
  )
}
