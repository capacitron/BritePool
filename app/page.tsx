import Link from 'next/link'
import { Users, BookOpen, Award, ArrowRight, Leaf, Sun, Shield, TrendingUp } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-cream">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sand-100 via-cream to-forest-50" />

      {/* Decorative Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='25' fill='none' stroke='%23324c3a' stroke-width='1'/%3E%3Ccircle cx='30' cy='30' r='15' fill='none' stroke='%23324c3a' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />

      {/* Floating Orbs - More vibrant */}
      <div className="absolute top-10 left-5 md:top-20 md:left-10 w-48 md:w-72 h-48 md:h-72 bg-forest-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-5 md:bottom-20 md:right-10 w-64 md:w-96 h-64 md:h-96 bg-earth-400/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-40 md:w-64 h-40 md:h-64 bg-sand-400/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 md:p-8">
        <div className="max-w-5xl w-full mx-auto text-center">
          {/* Hero Section */}
          <div className="text-center mb-12 md:mb-16">
            {/* Main Title */}
            <div className="relative inline-block">
              <div className="absolute -left-6 md:-left-12 top-1/2 -translate-y-1/2 w-4 md:w-8 h-px bg-gradient-to-r from-transparent to-forest-400 hidden sm:block" />
              <div className="absolute -right-6 md:-right-12 top-1/2 -translate-y-1/2 w-4 md:w-8 h-px bg-gradient-to-l from-transparent to-forest-400 hidden sm:block" />
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-bold text-forest-950 tracking-tight leading-tight">
                BRITE POOL
              </h1>
            </div>

            {/* Subtitle */}
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display mt-3 md:mt-4 text-earth-500 font-medium">
              Ministerium of <span className="italic text-forest-600">Empowerment</span>
            </h2>

            {/* Description */}
            <p className="mt-6 md:mt-8 text-base sm:text-lg md:text-xl text-forest-700 font-body leading-relaxed max-w-2xl mx-auto px-4">
              Building Resources Investing Together for Empowerment. Join us in creating a movement
              of collective prosperity and growth.
            </p>

            {/* CTA Buttons - Mobile First */}
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <Link
                href="/login"
                className="group relative w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base md:text-lg font-semibold text-sand-50 bg-forest-600 hover:bg-forest-700 overflow-hidden rounded-xl shadow-lg shadow-forest-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-forest-600/30 hover:-translate-y-0.5"
              >
                <span className="relative flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/register"
                className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base md:text-lg font-semibold text-forest-800 bg-sand-100 hover:bg-sand-200 border-2 border-forest-200 hover:border-forest-300 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                Create Account
                <Users className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
              </Link>
            </div>

            {/* Accent CTA */}
            <div className="mt-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-earth-600 hover:text-earth-700 font-medium text-sm font-body transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                Start your empowerment journey today
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Feature Cards - Mobile First Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 w-full">
            {/* Card 1 - Community Governance */}
            <div className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden border border-sand-200">
              {/* Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-forest-500 via-forest-600 to-forest-500" />

              {/* Decorative Background */}
              <div className="absolute -bottom-8 -right-8 w-24 md:w-32 h-24 md:h-32 bg-forest-100 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

              <div className="relative flex flex-col items-center text-center">
                <div className="w-12 md:w-14 h-12 md:h-14 bg-forest-100 rounded-xl flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 group-hover:bg-forest-200 transition-all shadow-sm">
                  <Users className="w-6 md:w-7 h-6 md:h-7 text-forest-600" />
                </div>
                <h3 className="text-lg md:text-xl font-display font-semibold text-forest-900 mb-2 md:mb-3">
                  Community Governance
                </h3>
                <p className="text-forest-600 font-body leading-relaxed text-sm md:text-base">
                  Participate in committees and shape the future of our collective through democratic decision-making.
                </p>
                <div className="mt-4 md:mt-5 flex items-center justify-center text-forest-700 font-medium text-sm group-hover:text-forest-800 transition-colors">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Card 2 - Learn & Grow */}
            <div className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden border border-sand-200">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-earth-400 via-earth-500 to-earth-400" />
              <div className="absolute -bottom-8 -right-8 w-24 md:w-32 h-24 md:h-32 bg-earth-100 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

              <div className="relative flex flex-col items-center text-center">
                <div className="w-12 md:w-14 h-12 md:h-14 bg-earth-100 rounded-xl flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 group-hover:bg-earth-200 transition-all shadow-sm">
                  <BookOpen className="w-6 md:w-7 h-6 md:h-7 text-earth-600" />
                </div>
                <h3 className="text-lg md:text-xl font-display font-semibold text-forest-900 mb-2 md:mb-3">
                  Learn & Grow
                </h3>
                <p className="text-forest-600 font-body leading-relaxed text-sm md:text-base">
                  Access courses and resources designed for your empowerment journey and personal development.
                </p>
                <div className="mt-4 md:mt-5 flex items-center justify-center text-earth-600 font-medium text-sm group-hover:text-earth-700 transition-colors">
                  <span>Explore courses</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Card 3 - Build Equity */}
            <div className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden border border-sand-200 sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sand-500 via-sand-600 to-sand-500" />
              <div className="absolute -bottom-8 -right-8 w-24 md:w-32 h-24 md:h-32 bg-sand-200 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

              <div className="relative flex flex-col items-center text-center">
                <div className="w-12 md:w-14 h-12 md:h-14 bg-sand-200 rounded-xl flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 group-hover:bg-sand-300 transition-all shadow-sm">
                  <Award className="w-6 md:w-7 h-6 md:h-7 text-sand-700" />
                </div>
                <h3 className="text-lg md:text-xl font-display font-semibold text-forest-900 mb-2 md:mb-3">
                  Build Equity
                </h3>
                <p className="text-forest-600 font-body leading-relaxed text-sm md:text-base">
                  Track contributions and earn equity through the Sacred Ledger as you grow with the community.
                </p>
                <div className="mt-4 md:mt-5 flex items-center justify-center text-sand-700 font-medium text-sm group-hover:text-sand-800 transition-colors">
                  <span>Start earning</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges Section */}
          <div className="mt-12 md:mt-16 p-6 md:p-8 bg-forest-900 rounded-2xl w-full">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-display font-semibold text-sand-100 mb-2">
                  Join Our Growing Community
                </h3>
                <p className="text-forest-300 font-body text-sm md:text-base">
                  Empowering members to build wealth together since 2024
                </p>
              </div>
              <div className="flex items-center justify-center gap-6 md:gap-8">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-display font-bold text-earth-400">500+</div>
                  <div className="text-xs md:text-sm text-forest-300 font-body">Members</div>
                </div>
                <div className="w-px h-12 bg-forest-700" />
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-display font-bold text-earth-400">12</div>
                  <div className="text-xs md:text-sm text-forest-300 font-body">Committees</div>
                </div>
                <div className="w-px h-12 bg-forest-700" />
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-display font-bold text-earth-400">$2M+</div>
                  <div className="text-xs md:text-sm text-forest-300 font-body">Invested</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Decorative Elements - Mobile Optimized */}
          <div className="mt-10 md:mt-16 flex flex-wrap items-center justify-center gap-3 md:gap-4 text-forest-500">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 md:w-5 h-4 md:h-5" />
              <span className="text-xs md:text-sm font-body">Rooted in Community</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-forest-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 md:w-5 h-4 md:h-5" />
              <span className="text-xs md:text-sm font-body">Secure & Transparent</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-forest-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Sun className="w-4 md:w-5 h-4 md:h-5" />
              <span className="text-xs md:text-sm font-body">Growing Together</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 md:mt-12 text-center">
            <p className="text-xs text-forest-400 font-body">
              &copy; 2024 BRITE POOL Ministerium of Empowerment. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
