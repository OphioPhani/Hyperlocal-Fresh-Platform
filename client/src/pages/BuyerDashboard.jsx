import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, RefreshCw, ShoppingBag, MapPin, Search, ShoppingCart, Clock, CheckCircle2, ChevronRight, AlertCircle, PackageSearch, Tag } from "lucide-react";
import RequirementsForm from "../components/RequirementsForm";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/api";

export default function BuyerDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [requirements, setRequirements] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [matches, setMatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshData = async () => {
    setLoading(true);
    setError("");

    try {
      const [requirementData, vendorData, matchData, orderData] = await Promise.all([
        apiRequest("/requirements/my", { token }),
        apiRequest("/vendors/nearby", { token }),
        apiRequest("/matches", { token }),
        apiRequest("/orders/my", { token })
      ]);

      setRequirements(requirementData.requirements || []);
      setVendors(vendorData.vendors || []);
      setMatches(matchData.matches || []);
      setOrders(orderData.orders || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const placeOrder = async (stockId, quantityKg, requestGroup) => {
    try {
      await apiRequest("/orders", {
        method: "POST",
        token,
        body: {
          requestGroup,
          items: [{ stockId, quantityKg }]
        }
      });
      refreshData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <main className="app-shell pb-20">
      {/* Premium Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-4 z-40 bg-white/80"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center border border-amber-200 shadow-sm">
            <ShoppingBag className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Buyer Dashboard</h1>
            <p className="text-sm font-medium text-slate-500">Welcome, <span className="text-amber-700 font-bold">{user?.name}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="btn-light flex-1 sm:flex-none !py-2 !px-4 !text-sm" onClick={refreshData}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn-light !py-2 !px-4 !text-sm text-red-600 hover:bg-red-50 hover:border-red-200" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </motion.header>

      {/* Main Content Form */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <RequirementsForm token={token} onCreated={refreshData} />
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl mt-6 text-sm border border-red-100 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Smart Matches Section */}
      <motion.section 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="mt-8 space-y-4"
      >
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 px-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Smart Matches
        </h2>
        
        {!matches.length ? (
          <div className="card text-center py-8 bg-slate-50/50 border-dashed border-2">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-medium">Post requirements to see vendor matches.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, idx) => (
              <motion.article 
                key={match.requirementId} 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}
                className="card border-emerald-100 shadow-soft p-5 bg-gradient-to-br from-white to-emerald-50/30"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                      Need {match.productName}
                      <span className="text-sm font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                        {match.quantityKg} kg
                      </span>
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> By {match.neededBy}</span>
                      {match.maxPricePerKg && (
                        <span className="flex items-center gap-1 text-amber-600"><Tag className="w-3.5 h-3.5" /> Max ₹{match.maxPricePerKg}/kg</span>
                      )}
                    </div>
                  </div>
                </div>

                {!match.options.length ? (
                  <div className="p-3 bg-white/60 rounded-xl text-center border border-white mt-2">
                    <p className="text-sm text-slate-500 font-medium">No vendors matched yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Available Vendors</p>
                    {match.options.map((option) => {
                      const orderQty = Math.min(Number(match.quantityKg), Number(option.quantityKg));
                      return (
                        <div key={`${match.requirementId}-${option.stockId}`} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-base font-bold text-slate-800">{option.vendorName}</p>
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 text-sm">
                                ₹{option.effectivePrice}/kg
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500 mt-2">
                              <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 border border-slate-200 rounded-md">
                                <MapPin className="w-3.5 h-3.5" /> {option.distanceKm} km
                              </span>
                              <span>Available: <strong>{option.quantityKg} kg</strong></span>
                              {option.surplusAction !== "none" && (
                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded-md">
                                  Surplus: {option.surplusAction}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className="btn-main sm:w-auto !py-2.5 !px-5 whitespace-nowrap shadow-md text-sm"
                            onClick={() => placeOrder(option.stockId, orderQty, match.requestGroup)}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Order {orderQty} kg
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.article>
            ))}
          </div>
        )}
      </motion.section>

      {/* Grid for Orders and Nearby Stock */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        
        {/* Orders Section */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 px-2">
            <PackageSearch className="w-5 h-5 text-emerald-600" />
            My Orders
          </h2>
          
          <div className="card space-y-3 p-4">
            {!orders.length ? <p className="text-sm text-slate-500 font-medium text-center py-4">No active orders.</p> : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold text-slate-800">
                        {order.product_name} <span className="text-slate-500 font-medium whitespace-nowrap">from {order.vendor_name}</span>
                      </p>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium gap-2">
                      <span className="bg-white px-2 py-1 rounded border border-slate-200">
                        {order.quantity_kg} kg @ ₹{order.unit_price}/kg
                      </span>
                      <div className="text-right">
                        <span className="text-slate-400">Delivery: ₹{order.delivery_cost}</span>
                        <div className="text-sm font-bold text-slate-800 mt-0.5">Total: ₹{order.total_price}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* Nearby Network Stock */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Live Network
            </h2>
            {loading && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
          </div>
          
          <div className="card space-y-3 p-4 bg-slate-800 text-white border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 pointer-events-none" />
            
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">Within 4 km Radius</p>
            
            {!vendors.length ? <p className="text-sm text-slate-400 font-medium py-2">No active stock in network.</p> : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 stylish-scrollbar">
                {vendors.map((item) => (
                  <div key={item.id} className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3 hover:bg-slate-700 transition-colors">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-white">{item.product_name}</p>
                      <span className="text-emerald-300 font-bold text-sm">₹{item.price_per_kg}/kg</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs font-medium text-slate-300">
                      <span>{item.vendor_name} • {item.distanceKm} km</span>
                      <span className="bg-slate-600 px-1.5 py-0.5 rounded">{item.quantity_kg} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      </div>

    </main>
  );
}
