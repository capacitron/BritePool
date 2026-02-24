import { ScrollText, Sparkles } from 'lucide-react'

export default function GratitudePage() {
  return (
    <div className="space-y-8">
      {/* Ornate document frame */}
      <div className="relative">
        {/* Ornate border frame */}
        <div className="absolute inset-0 border-4 border-double border-earth-300 rounded-2xl pointer-events-none" />
        <div className="absolute inset-2 border border-earth-200 rounded-xl pointer-events-none" />

        {/* Main document */}
        <div className="relative bg-gradient-to-b from-cream via-white to-sand-50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Decorative top flourish */}
          <div className="h-2 bg-gradient-to-r from-earth-300 via-earth-500 to-earth-300" />

          {/* Header */}
          <div className="pt-10 pb-6 px-6 md:px-12 text-center border-b border-earth-200">
            {/* Icon */}
            <div className="mx-auto mb-6 relative">
              <div className="absolute inset-0 w-20 h-20 bg-earth-400/20 rounded-full blur-xl mx-auto" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-earth-400 via-earth-500 to-earth-600 rounded-full flex items-center justify-center mx-auto shadow-xl ring-4 ring-earth-200">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title with flourishes */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-earth-400 to-earth-300" />
              <ScrollText className="w-6 h-6 text-earth-500" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent via-earth-400 to-earth-300" />
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-forest-800 tracking-wide">
              DECLARATION OF GRATITUDE
            </h1>
            <p className="text-sm uppercase tracking-[0.3em] text-earth-600 mt-2 font-body">
              for BRITE POOL and the Healing Centers
            </p>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-earth-300" />
              <div className="w-2 h-2 rounded-full bg-earth-400" />
              <div className="w-3 h-3 rounded-full bg-earth-500" />
              <div className="w-2 h-2 rounded-full bg-earth-400" />
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-earth-300" />
            </div>
          </div>

          {/* Declaration Content */}
          <div className="px-6 md:px-12 py-10">
            {/* Opening */}
            <div className="text-center mb-8 pb-8 border-b border-dashed border-earth-200">
              <p className="text-2xl text-forest-800 font-display font-bold italic">
                We give thanks.
              </p>
            </div>

            <div className="space-y-6 text-forest-700 font-body text-base leading-relaxed">
              <p>
                We stand in deep gratitude for Brite Pool, a private association born of
                Source-based inspiration, established in integrity, wisdom, and care for the
                flourishing of health, wealth, and human dignity. We honor this living field as a
                sanctuary of freedom, abundance, and shared purpose, a place where people gather not
                by chance, but by resonance.
              </p>

              <p>
                <span className="font-semibold text-forest-800">We are grateful</span> for the
                healing centers now fully activated, cleansed, protected, and radiant. These spaces
                are joyful, safe, and welcoming, designed with crystalline architecture and dome
                structures that hold a morphic field of elevated vibration. Love beams through every
                corridor. Beauty is present in every detail. Sunshine, clean air, and living water
                restore clarity, vitality, and peace.
              </p>

              <p>
                <span className="font-semibold text-forest-800">We give thanks</span> for the purity
                of the water, the abundance of vegetation, and the bio-harmonious relationship with
                the land. The environment itself rejuvenates all who enter. Animals are protected
                and honored. The ecosystem thrives. Life multiplies gently and generously.
              </p>

              <p>
                <span className="font-semibold text-forest-800">We are grateful</span> for a
                community of like-minded people growing together in harmony. Friendly faces, shared
                laughter, music, creativity, and meaningful connection fill these spaces. This is an
                inclusive, accessible environment where all are supported, respected, and uplifted,
                including local communities who are strengthened, empowered, and celebrated through
                participation and collaboration.
              </p>

              <p>
                <span className="font-semibold text-forest-800">We give thanks</span> for the
                presence of higher intelligence and star wisdom awakening gently within the field.
                Consciousness expands naturally here. Clarity is restored. Spiritual hygiene is
                maintained. Each member is supported by their Higher Self, grounded in
                responsibility, authenticity, and inner sovereignty.
              </p>

              <p>
                <span className="font-semibold text-forest-800">We are grateful</span> for the flow
                of money moving abundantly, cleanly, and joyfully through Brite Pool. Wealth
                circulates with purpose, integrity, and care, generating sustainable prosperity and
                passive income exceeding one hundred fifty thousand per month. These resources
                support innovation, education, regeneration, and long-term stability for all members
                and partners.
              </p>

              <p>
                <span className="font-semibold text-forest-800">We give thanks</span> for
                exceptional courses and educational offerings that are clear, practical, and
                transformative. Knowledge is shared freely and responsibly. People complete
                projects, accomplish new goals, and step into greater confidence and capability
                through what is learned here.
              </p>

              <p>
                <span className="font-semibold text-forest-800">We are grateful</span> for credible,
                aligned partners and remarkable wealth-generation opportunities that arrive in
                perfect timing. Technology emerges that genuinely helps people heal, organize, grow,
                and thrive. Innovation serves humanity. Systems remain elegant, organized, dynamic,
                and replicable across regions.
              </p>

              <p>
                <span className="font-semibold text-forest-800">We give thanks</span> for leadership
                and administration rooted in integrity, accountability, and service. Members act
                with honor. Responsibilities are shared. Support is consistent. Transitional spaces
                are used wisely for reflection, integration, and transmutation. What enters heavy
                leaves lighter. What enters fragmented leaves whole.
              </p>

              <p>
                <span className="font-semibold text-forest-800">We are grateful</span> for the calm,
                peace, and harmony that emanate naturally from this field. This is a five-star
                experience not because of excess, but because of refinement, care, and conscious
                design. Everything feels intentional, clean, and alive.
              </p>

              <p>
                We recognize Brite Pool and the Healing Centers as sovereign expressions of
                cooperation, beauty, and inspired creation. A place where freedom is felt, abundance
                flows, healing happens, and something new is quietly born for the benefit of all.
              </p>
            </div>

            {/* Closing */}
            <div className="text-center mt-10 pt-8 border-t border-dashed border-earth-200">
              <p className="text-lg text-forest-700 font-body italic leading-relaxed">
                And for all of this,
                <br />
                we give thanks—
                <br />
                <span className="font-semibold text-forest-800">joyfully, fully, and now.</span>
              </p>
            </div>

            {/* Closing seal section */}
            <div className="mt-12 pt-8 border-t border-earth-200 text-center">
              <div className="inline-flex flex-col items-center">
                {/* Decorative seal */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-earth-100 to-earth-200 flex items-center justify-center border-4 border-earth-300 shadow-inner">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-earth-400 to-earth-600 flex items-center justify-center shadow-lg">
                      <span className="text-white font-display font-bold text-xl">BP</span>
                    </div>
                  </div>
                  {/* Ribbon effect */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-earth-500 rounded-b-lg shadow-md" />
                </div>

                <p className="text-sm text-forest-500 font-body mt-4">
                  BRITE POOL Ministerium of Empowerment
                </p>
              </div>
            </div>
          </div>

          {/* Decorative bottom flourish */}
          <div className="h-2 bg-gradient-to-r from-earth-300 via-earth-500 to-earth-300" />
        </div>
      </div>
    </div>
  )
}
