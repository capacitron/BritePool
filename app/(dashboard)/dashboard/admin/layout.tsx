// Admin pages use the main dashboard layout - no separate admin layout needed
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
