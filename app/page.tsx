import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-earth-light via-stone-warm to-earth-light">
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-earth-brown-dark mb-4">
          BRITE POOL
        </h1>
        <h2 className="text-2xl md:text-3xl text-earth-gold-dark mb-8">
          Ministerium of Empowerment
        </h2>
        <p className="text-lg md:text-xl text-earth-brown leading-relaxed mb-12 max-w-2xl mx-auto">
          Building sovereign futures through empowered communities. Join us in creating a movement
          of collective prosperity and growth.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-earth-brown-dark hover:bg-earth-brown rounded-lg shadow-lg transition-all hover:shadow-xl"
          >
            Sign In
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-earth-brown-dark bg-white hover:bg-stone-warm border-2 border-earth-brown-dark rounded-lg shadow-lg transition-all hover:shadow-xl"
          >
            Create Account
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-warm">
            <div className="w-12 h-12 bg-earth-gold/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-earth-gold-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-earth-brown-dark mb-2">
              Community Governance
            </h3>
            <p className="text-earth-brown text-sm">
              Participate in committees and shape the future of our collective.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-warm">
            <div className="w-12 h-12 bg-sage/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-sage-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-earth-brown-dark mb-2">Learn & Grow</h3>
            <p className="text-earth-brown text-sm">
              Access courses and resources designed for your empowerment journey.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-warm">
            <div className="w-12 h-12 bg-terracotta/20 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-terracotta"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-earth-brown-dark mb-2">Build Equity</h3>
            <p className="text-earth-brown text-sm">
              Track contributions and earn equity through the Sacred Ledger.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
