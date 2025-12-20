import Link from 'next/link'
import { Users, BookOpen, Award, ArrowRight, Sparkles, Leaf, Sun } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Gradient Background with Texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-earth-light via-stone-warm to-earth-light" />

      {/* Decorative Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='35' fill='none' stroke='%23000' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='25' fill='none' stroke='%23000' stroke-width='1'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '80px 80px'
      }} />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-earth-gold/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-sage/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-terracotta/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="max-w-5xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-16">
            {/* Decorative Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-earth-gold/30 shadow-sm mb-8">
              <Sparkles className="w-4 h-4 text-earth-gold" />
              <span className="text-sm font-medium text-earth-brown-dark">Building Sovereign Futures</span>
            </div>

            {/* Main Title with Decorative Elements */}
            <div className="relative inline-block">
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-px bg-gradient-to-r from-transparent to-earth-gold hidden md:block" />
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-px bg-gradient-to-l from-transparent to-earth-gold hidden md:block" />
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-bold text-earth-brown-dark tracking-tight">
                BRITE POOL
              </h1>
            </div>

            {/* Subtitle with Gradient */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif mt-4 bg-gradient-to-r from-earth-gold-dark via-earth-gold to-earth-gold-dark bg-clip-text text-transparent">
              Ministerium of Empowerment
            </h2>

            {/* Description */}
            <p className="mt-8 text-lg md:text-xl text-earth-brown leading-relaxed max-w-2xl mx-auto">
              Building Resources Investing Together for Empowerment. Join us in creating a movement
              of collective prosperity and growth.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white overflow-hidden rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-earth-brown-dark to-earth-brown group-hover:from-earth-brown group-hover:to-earth-brown-dark transition-all duration-500" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <span className="relative flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/register"
                className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-earth-brown-dark bg-white/80 backdrop-blur-sm hover:bg-white border-2 border-earth-brown-dark/20 hover:border-earth-brown-dark rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              >
                Create Account
                <Users className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 - Community Governance */}
            <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden border border-white/50">
              {/* Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-earth-gold via-earth-gold-dark to-earth-gold opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Decorative Background */}
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-earth-gold/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-earth-gold/20 to-earth-gold/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                  <Users className="w-7 h-7 text-earth-gold-dark" />
                </div>
                <h3 className="text-xl font-serif font-bold text-earth-brown-dark mb-3">
                  Community Governance
                </h3>
                <p className="text-earth-brown leading-relaxed">
                  Participate in committees and shape the future of our collective through democratic decision-making.
                </p>
                <div className="mt-5 flex items-center text-earth-gold-dark font-medium text-sm group-hover:gap-2 transition-all">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Card 2 - Learn & Grow */}
            <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden border border-white/50">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sage via-sage-dark to-sage opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-sage/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-sage/20 to-sage/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                  <BookOpen className="w-7 h-7 text-sage-dark" />
                </div>
                <h3 className="text-xl font-serif font-bold text-earth-brown-dark mb-3">
                  Learn & Grow
                </h3>
                <p className="text-earth-brown leading-relaxed">
                  Access courses and resources designed for your empowerment journey and personal development.
                </p>
                <div className="mt-5 flex items-center text-sage-dark font-medium text-sm group-hover:gap-2 transition-all">
                  <span>Explore courses</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>

            {/* Card 3 - Build Equity */}
            <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden border border-white/50">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-terracotta via-terracotta to-terracotta/80 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-terracotta/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-terracotta/20 to-terracotta/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                  <Award className="w-7 h-7 text-terracotta" />
                </div>
                <h3 className="text-xl font-serif font-bold text-earth-brown-dark mb-3">
                  Build Equity
                </h3>
                <p className="text-earth-brown leading-relaxed">
                  Track contributions and earn equity through the Sacred Ledger as you grow with the community.
                </p>
                <div className="mt-5 flex items-center text-terracotta font-medium text-sm group-hover:gap-2 transition-all">
                  <span>Start earning</span>
                  <ArrowRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Decorative Elements */}
          <div className="mt-16 flex items-center justify-center gap-4 text-earth-brown-light/60">
            <Leaf className="w-5 h-5" />
            <span className="text-sm">Rooted in Community</span>
            <span className="w-1 h-1 rounded-full bg-earth-brown-light/40" />
            <Sun className="w-5 h-5" />
            <span className="text-sm">Growing Together</span>
            <span className="w-1 h-1 rounded-full bg-earth-brown-light/40" />
            <Sparkles className="w-5 h-5" />
            <span className="text-sm">Building Futures</span>
          </div>
        </div>
      </div>
    </main>
  )
}
