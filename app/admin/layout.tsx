import '../globals.css'
import './admin.css'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] to-[#1a1f4d]">
      {children}
    </div>
  )
}
