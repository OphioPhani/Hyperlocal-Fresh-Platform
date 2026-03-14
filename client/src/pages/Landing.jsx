import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Store, ArrowRight, CheckCircle2, MapPin } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="app-shell justify-center min-h-[90vh]">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card space-y-6 text-center transform-gpu relative overflow-hidden mt-4"
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" />
        <div className="absolute top-0 left-0 -mt-10 -ml-10 w-40 h-40 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="flex justify-center mb-4 relative z-10">
          <div className="p-4 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl shadow-inner border border-white">
            <Leaf className="w-10 h-10 text-emerald-600" />
          </div>
        </div>

        <motion.p 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
          className="inline-block rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700 tracking-wider shadow-sm border border-emerald-100 relative z-10"
        >
          HYPERLOCAL FRESH NETWORK
        </motion.p>
        
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 leading-tight relative z-10 tracking-tight">
          Fresh Produce in <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">4 km.</span><br/>Fast & Simple.
        </h1>
        
        <p className="text-lg text-slate-600 leading-relaxed px-2 relative z-10 font-medium">
          Connect local fruit and vegetable vendors with restaurants and shops nearby. Reduce waste,
          improve daily buying.
        </p>

        <div className="space-y-4 pt-4 relative z-10 px-2">
          <button className="btn-main group" onClick={() => navigate("/login?role=vendor")}>
            <Store className="w-5 h-5 group-hover:scale-110 transition-transform" />
            I am a Vendor
          </button>
          <button className="btn-light group" onClick={() => navigate("/login?role=buyer")}>
            I am a Business Buyer
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.section>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-8 space-y-4 px-2"
      >
        <h2 className="text-xl font-bold text-slate-800 text-center mb-6">How it works</h2>
        
        <div className="space-y-4 relative">
          {/* Vertical line connector */}
          <div className="absolute left-[1.6rem] top-5 bottom-5 w-0.5 bg-gradient-to-b from-emerald-200 via-amber-200 to-emerald-400 z-0"></div>
          
          <div className="card-hover bg-white/60 p-4 rounded-2xl flex items-center gap-4 relative z-10 border border-white/60">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-200">
              <span className="text-emerald-700 font-bold text-lg">1</span>
            </div>
            <p className="text-slate-700 font-medium text-lg">Vendor adds stock in seconds.</p>
          </div>
          
          <div className="card-hover bg-white/60 p-4 rounded-2xl flex items-center gap-4 relative z-10 border border-white/60">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 shadow-sm border border-amber-200">
              <span className="text-amber-700 font-bold text-lg">2</span>
            </div>
            <p className="text-slate-700 font-medium text-lg">Buyer posts daily requirement.</p>
          </div>
          
          <div className="card-hover bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl flex items-center gap-4 relative z-10 border border-emerald-100 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-emerald-900 font-semibold text-lg">Smart match by price + distance.</p>
          </div>
        </div>
      </motion.section>

      <motion.footer 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-12 mb-6 px-2 text-center text-sm text-slate-500 font-medium flex items-center justify-center gap-2"
      >
        <MapPin className="w-4 h-4" />
        Redefining hyperlocal food supply
      </motion.footer>
    </main>
  );
}
