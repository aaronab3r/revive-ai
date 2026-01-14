import Link from 'next/link';
import { UploadCloud, Bot, CalendarCheck, PlayCircle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden relative">
      {/* Hero Background Gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]" /> 
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-slate-900">
                Revive AI
              </span>
            </div>

            {/* Desktop Nav Actions */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center relative z-10">
        {/* HERO SECTION */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32">
          
          <div className="flex flex-col items-center text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              New Generation Voice AI
            </div>

            <h1 className="max-w-5xl text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl md:text-7xl mb-16">
              <span className="block sm:inline whitespace-normal">Stop Letting Dead Leads</span>{' '}
              <span className="block text-slate-500">Ghost Your Revenue.</span>
            </h1>

             <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
                <div className="text-left flex flex-col items-start justify-center h-full">
                   <p className="text-lg sm:text-xl leading-8 text-slate-600 mb-8">
                     Revive AI deploys hyper-realistic voice agents to reactivate your dead leads and book appointments directly onto your calendar, completely on autopilot.
                   </p>
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-none p-1 bg-green-100 rounded-full">
                           <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-slate-700 font-medium">Reactivate over 20% of old leads instantly</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-none p-1 bg-green-100 rounded-full">
                           <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-slate-700 font-medium">Fills cancellations & empty slots</span>
                      </div>
                       <div className="flex items-center gap-3">
                        <div className="flex-none p-1 bg-green-100 rounded-full">
                           <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-slate-700 font-medium">Syncs directly to your calendar</span>
                      </div>
                   </div>
                </div>

                {/* Feature Card */}
                <div className="relative isolate transform scale-95 lg:scale-100 origin-center lg:origin-top-right w-full">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-3xl -z-10 transform rotate-2"></div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
                     <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2">
                           <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-semibold text-sm text-slate-900">Revive AI</span>
                        </div>
                     </div>
                     
                     {/* Mock UI Stats */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="text-slate-500 text-xs mb-1">Revenue Reactivated</div>
                          <div className="text-2xl font-bold text-slate-900">$42,500</div>
                          <div className="text-emerald-600 text-xs mt-1 flex items-center gap-1 font-medium">
                            ↑ 12% vs last month
                          </div>
                        </div>
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div className="text-slate-500 text-xs mb-1">Appointments Booked</div>
                          <div className="text-2xl font-bold text-slate-900">86</div>
                          <div className="text-emerald-600 text-xs mt-1 flex items-center gap-1 font-medium">
                            ↑ 24% vs last month
                          </div>
                        </div>
                     </div>

                     {/* Mock UI List */}
                     <div className="mt-6 space-y-3">
                        {[
                          { name: 'Sarah Miller', initials: 'SM' },
                          { name: 'Michael Chen', initials: 'MC' },
                          { name: 'John Doe', initials: 'JD' }
                        ].map((lead, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors rounded-lg border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{lead.initials}</div>
                               <div>
                                  <div className="text-sm font-medium text-slate-900">{lead.name}</div>
                                  <div className="text-xs text-slate-500">Appt Confirmed</div>
                               </div>
                            </div>
                            <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Booked</div>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
             </div>
          </div>

          {/* VSL Video Embed */}
          <div className="relative mx-auto w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden aspect-video border border-slate-200 mb-20">
            <iframe 
              className="absolute top-0 left-0 w-full h-full" 
              src="https://www.youtube.com/embed/2mIwru1tOUA?rel=0" 
              title="Revive AI Demo"
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen>
            </iframe>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full mb-20">
            <a 
              href="https://cal.com/partner-smile/revenue-recovery-audit" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center px-12 py-6 text-xl font-bold text-white transition-all bg-blue-600 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-1"
            >
              Book a Demo
              <ArrowRight className="ml-3 w-6 h-6" />
            </a>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="w-full bg-slate-50 py-24 sm:py-32 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Automated Patient Reactivation</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Stop wasting hours on manual dials. Our AI handles the entire reactivation process.
              </p>
            </div>
            
            <div className="mx-auto max-w-7xl grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-6">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">1. Upload Lists</h3>
                <p className="text-base leading-7 text-slate-600">
                  Export your dormant patient list or old leads from your CRM and drag-and-drop the CSV. We verify numbers automatically.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                 <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-6">
                  <Bot className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">2. AI Engagement</h3>
                <p className="text-base leading-7 text-slate-600">
                  Our voice agent calls each lead, navigating objections and questions with human-level nuance and empathy.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                 <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-6">
                  <CalendarCheck className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">3. Booked Calendar</h3>
                <p className="text-base leading-7 text-slate-600">
                  Appointments are synced directly to your Google Calendar. You only speak to patients who are ready to come in.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* USE CASES & FEATURES */}
        <section className="w-full py-24 sm:py-32 px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center">
            
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">Designed for High-Touch Industries</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Revive AI isn't a generic robocaller. It's a purpose-built reactivation engine designed for businesses where a single appointment is worth hundreds or thousands of dollars.
              </p>
              
              <div className="flex justify-center text-left">
                <ul className="space-y-6 inline-block">
                <li className="flex items-start gap-4">
                  <div className="flex-none mt-1">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Dental & Medical</h4>
                    <p className="text-slate-600 text-sm mt-1">Fill hygiene schedules and reactivate continuing care patients.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                   <div className="flex-none mt-1">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Real Estate & Mortgage</h4>
                    <p className="text-slate-600 text-sm mt-1">Re-engage old internet leads and qualify intent before you call.</p>
                  </div>
                </li>
                 <li className="flex items-start gap-4">
                   <div className="flex-none mt-1">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Med Spa & Elective</h4>
                    <p className="text-slate-600 text-sm mt-1">Drive consultations for high-ticket procedures automatically.</p>
                  </div>
                </li>
              </ul>
              </div>
            </div>
            
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="w-full py-24 sm:py-32 relative overflow-hidden bg-slate-900">
           <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
           
           <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
             <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">Ready to clear the graveyard?</h2>
             <p className="text-lg leading-8 text-slate-300 mb-10 max-w-2xl mx-auto">
                Join high-performance practices using Revive AI to turn dead leads into active revenue.
             </p>
             <a 
              href="https://cal.com/partner-smile/revenue-recovery-audit" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-blue-600 transition-all bg-white rounded-xl hover:bg-slate-50 hover:scale-105 shadow-xl"
            >
              Start Reactivating Now
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full py-6 bg-white border-t border-slate-100 text-sm">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-200">
                  <Sparkles className="h-3 w-3 text-slate-600" />
              </div>
               <span className="font-semibold text-slate-900">Revive AI</span>
            </div>
            
            <div className="text-slate-500">
               © 2026 Revive AI Inc. All rights reserved.
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}