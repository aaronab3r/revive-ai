'use client';

import { 
  Building2, 
  Stethoscope, 
  Home, 
  Sparkles, 
  Scale, 
  Dumbbell, 
  Scissors, 
  Briefcase 
} from 'lucide-react';

export default function HighTouchSection() {
  return (
    <section className="relative w-full py-24 sm:py-32 overflow-hidden bg-white">
      
       {/* Moving Light Beam Animation */}
      <div className="absolute -inset-[10px] opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-100 to-indigo-100 blur-3xl rounded-full animate-blob mix-blend-multiply"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-100 blur-3xl rounded-full animate-blob [animation-delay:2s] mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center">
          
          <div className="w-full max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
              Designed for High-Touch Industries
            </h2>
            <p className="text-lg text-slate-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Revive AI isn't a generic robocaller. It's a purpose-built reactivation engine designed for businesses where a single appointment is worth hundreds or thousands of dollars.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {/* Card 1: Dental & Medical */}
              <div className="group relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-200 transition-all duration-500 hover:-translate-y-1 shadow-lg shadow-slate-200/50 hover:shadow-blue-200/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/0 via-blue-50/0 to-blue-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 group-hover:scale-110 transition-all duration-500">
                      <Stethoscope className="w-6 h-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-lg">Dental & Medical</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Fill hygiene schedules and reactivate continuing care patients automatically.
                  </p>
                </div>
              </div>

              {/* Card 2: Real Estate */}
              <div className="group relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-200 transition-all duration-500 hover:-translate-y-1 shadow-lg shadow-slate-200/50 hover:shadow-emerald-200/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/0 via-emerald-50/0 to-emerald-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-500">
                      <Building2 className="w-6 h-6 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-lg">Real Estate</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Re-engage old internet leads and qualify intent before you pick up the phone.
                  </p>
                </div>
              </div>

              {/* Card 3: Med Spa */}
              <div className="group relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-purple-200 transition-all duration-500 hover:-translate-y-1 shadow-lg shadow-slate-200/50 hover:shadow-purple-200/50 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-purple-50/0 via-purple-50/0 to-purple-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 group-hover:scale-110 transition-all duration-500">
                      <Sparkles className="w-6 h-6 text-purple-600 group-hover:text-purple-700 transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-lg">Med Spa</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Drive consultations for high-ticket procedures with zero manual follow-up.
                  </p>
                </div>
              </div>

              {/* Card 4: Home Services */}
              <div className="group relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-orange-200 transition-all duration-500 hover:-translate-y-1 shadow-lg shadow-slate-200/50 hover:shadow-orange-200/50 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-orange-50/0 via-orange-50/0 to-orange-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-orange-50 group-hover:bg-orange-100 group-hover:scale-110 transition-all duration-500">
                      <Home className="w-6 h-6 text-orange-600 group-hover:text-orange-700 transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-lg">Home Services</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Book estimates for roofers, HVAC, solar, and remodeling contractors.
                  </p>
                </div>
              </div>

              {/* Card 5: Legal */}
              <div className="group relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-500 hover:-translate-y-1 shadow-lg shadow-slate-200/50 hover:shadow-slate-300/50 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-slate-100/0 via-slate-100/0 to-slate-100/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 group-hover:scale-110 transition-all duration-500">
                      <Scale className="w-6 h-6 text-slate-700 group-hover:text-slate-900 transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-lg">Legal</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Qualify potential claimants and schedule intakes for law firms.
                  </p>
                </div>
              </div>

              {/* Card 6: Fitness */}
              <div className="group relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-200 transition-all duration-500 hover:-translate-y-1 shadow-lg shadow-slate-200/50 hover:shadow-red-200/50 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-red-50/0 via-red-50/0 to-red-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-red-50 group-hover:bg-red-100 group-hover:scale-110 transition-all duration-500">
                      <Dumbbell className="w-6 h-6 text-red-600 group-hover:text-red-700 transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-lg">Fitness</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Reactivate cancelled members and book trial sessions for gyms.
                  </p>
                </div>
              </div>

              {/* Card 7: Salon & Spa */}
              <div className="group relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-pink-200 transition-all duration-500 hover:-translate-y-1 shadow-lg shadow-slate-200/50 hover:shadow-pink-200/50 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-pink-50/0 via-pink-50/0 to-pink-50/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-pink-50 group-hover:bg-pink-100 group-hover:scale-110 transition-all duration-500">
                      <Scissors className="w-6 h-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-lg">Salon & Spa</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Fill last-minute cancellations and book recurring appointments.
                  </p>
                </div>
              </div>

              {/* Card 8: And More */}
              <div className="group relative p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:border-blue-300 transition-all duration-500 hover:-translate-y-1 shadow-lg shadow-blue-100/50 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 
                 <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-lg bg-white group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-500">
                      <Briefcase className="w-6 h-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-lg">...and more</h4>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Any high-ticket service business where phone follow-up drives revenue.
                  </p>
                </div>
              </div>

            </div>

          </div>
          
        </div>
      </div>
    </section>
  );
}
