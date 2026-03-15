import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { apiRequest, pingHealth } from "../lib/api";
import { Store, ShoppingBag, MapPin, Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";

export default function Login() {
  const [searchParams] = useSearchParams();
  const roleFromQuery = searchParams.get("role");
  const initialRole = roleFromQuery === "vendor" || roleFromQuery === "buyer" ? roleFromQuery : "vendor";

  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [role, setRole] = useState(initialRole);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    latitude: "",
    longitude: ""
  });
  const [locationStatus, setLocationStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // null = checking, true = ready, false = waking up
  const [serverReady, setServerReady] = useState(null);
  const retryTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function checkServer() {
      const ok = await pingHealth();
      if (cancelled) return;
      if (ok) {
        setServerReady(true);
      } else {
        setServerReady(false);
        retryTimerRef.current = setInterval(async () => {
          const again = await pingHealth();
          if (!cancelled && again) {
            setServerReady(true);
            clearInterval(retryTimerRef.current);
          }
        }, 7000);
      }
    }

    checkServer();
    return () => {
      cancelled = true;
      clearInterval(retryTimerRef.current);
    };
  }, []);

  const title = useMemo(() => {
    if (mode === "register") {
      return role === "vendor" ? "Vendor Sign Up" : "Buyer Sign Up";
    }
    return role === "vendor" ? "Vendor Login" : "Buyer Login";
  }, [mode, role]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const useCurrentLocation = () => {
    setLocationStatus("Fetching location...");

    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange("latitude", String(position.coords.latitude));
        onChange("longitude", String(position.coords.longitude));
        setLocationStatus("Location captured.");
      },
      () => {
        setLocationStatus("Could not fetch location. Enter manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        const payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude)
        };

        const data = await apiRequest("/auth/register", {
          method: "POST",
          body: payload
        });

        login(data.token, data.user);
        navigate(data.user.role === "vendor" ? "/vendor" : "/buyer");
      } else {
        const data = await apiRequest("/auth/login", {
          method: "POST",
          body: {
            email: form.email,
            password: form.password
          }
        });

        login(data.token, data.user);
        navigate(data.user.role === "vendor" ? "/vendor" : "/buyer");
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell justify-center min-h-screen">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto relative z-10"
      >
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-emerald-600 transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="card shadow-2xl border-white/60 p-8 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100">
                {role === "vendor" ? (
                  <Store className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-amber-500" />
                )}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 text-center mb-8">{title}</h1>

            <div className="bg-slate-100/50 p-1.5 rounded-xl flex gap-1 mb-6 backdrop-blur-sm">
              <button
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "login" ? "bg-white shadow-soft text-emerald-700" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                type="button"
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === "register" ? "bg-white shadow-soft text-emerald-700" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"}`}
                type="button"
                onClick={() => setMode("register")}
              >
                Create Account
              </button>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              <AnimatePresence mode="popLayout">
                {mode === "register" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                  >
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      className="input-box pl-10"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={(e) => onChange("name", e.target.value)}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  className="input-box pl-10"
                  placeholder="Email address"
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  className="input-box pl-10"
                  placeholder="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  required
                />
              </div>

              <AnimatePresence mode="popLayout">
                {mode === "register" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <button 
                      type="button" 
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors"
                      onClick={useCurrentLocation}
                    >
                      <MapPin className="w-4 h-4" />
                      Use My Current Location
                    </button>
                    {locationStatus && (
                      <p className="text-xs text-center font-medium text-emerald-600">{locationStatus}</p>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        className="input-box text-sm"
                        placeholder="Latitude"
                        value={form.latitude}
                        onChange={(e) => onChange("latitude", e.target.value)}
                        required
                      />
                      <input
                        className="input-box text-sm"
                        placeholder="Longitude"
                        value={form.longitude}
                        onChange={(e) => onChange("longitude", e.target.value)}
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {serverReady === false && (
                  <motion.div
                    key="waking"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-100 flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    Backend is starting up — this takes ~30 seconds. Retrying automatically...
                  </motion.div>
                )}
                {serverReady === null && (
                  <motion.p
                    key="checking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-center text-slate-400 flex items-center justify-center gap-1.5"
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Connecting to server...
                  </motion.p>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex items-center gap-2 mt-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button className="btn-main mt-6" disabled={loading || serverReady === false}>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  mode === "register" ? "Create Account" : "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
