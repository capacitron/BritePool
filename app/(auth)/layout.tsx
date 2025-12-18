export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-light via-stone-warm to-earth-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-earth-brown-dark">
            BRITE POOL
          </h1>
          <p className="text-earth-brown-light mt-2">
            Ministerium of Empowerment
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
