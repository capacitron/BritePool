export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-100 via-cream to-forest-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-forest-900">
            BRITE POOL
          </h1>
          <p className="text-forest-600 mt-2 font-body">
            Ministerium of Empowerment
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
