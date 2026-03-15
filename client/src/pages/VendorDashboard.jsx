import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, RefreshCw, Store, Tag, Archive, Trash2, Clock, AlertCircle, Package, Menu, UserCircle2, Loader2, Settings } from "lucide-react";
import StockForm from "../components/StockForm";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/api";

export default function VendorDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const menusRef = useRef(null);

  const fetchStock = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/stock/my", { token });
      setStock(data.stock || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    if (!menuOpen && !profileOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (menusRef.current && !menusRef.current.contains(event.target)) {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, profileOpen]);

  const deactivateStock = async (id) => {
    setActionBusy(`${id}:delete`);
    setError("");
    try {
      await apiRequest(`/stock/${id}`, {
        method: "DELETE",
        token
      });
      await fetchStock();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionBusy("");
    }
  };

  const setSurplusAction = async (item, surplusAction, discountPercent = 0) => {
    setActionBusy(`${item.id}:${surplusAction}`);
    setError("");
    try {
      await apiRequest(`/stock/${item.id}`, {
        method: "PUT",
        token,
        body: {
          productName: item.product_name,
          quantityKg: item.quantity_kg,
          pricePerKg: item.price_per_kg,
          availability: item.availability,
          isActive: item.is_active,
          surplusAction,
          discountPercent
        }
      });
      await fetchStock();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setActionBusy("");
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
        className="card mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-4 z-40 bg-white/85 relative"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200 shadow-sm">
            <Store className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Vendor Dashboard</h1>
            <p className="text-sm font-medium text-slate-500">Welcome back, <span className="text-emerald-700 font-bold">{user?.name}</span></p>
          </div>
        </div>

        <div className="relative flex items-center gap-2 w-full sm:w-auto" ref={menusRef}>
          <button className="btn-light flex-1 sm:flex-none !py-2 !px-4 !text-sm" onClick={fetchStock}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            className="icon-btn"
            type="button"
            aria-label="Open menu"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setProfileOpen(false);
            }}
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            className="icon-btn"
            type="button"
            aria-label="Open profile"
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setMenuOpen(false);
            }}
          >
            <UserCircle2 className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="dropdown-panel z-50"
              >
                <p className="px-2 pb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Quick menu</p>
                <a href="#stock-form" className="btn-light !w-full !justify-start !rounded-xl !px-3 !py-2 !text-sm !font-semibold !bg-slate-50 !border-slate-200 hover:!bg-slate-100">Add stock</a>
                <a href="#stock-section" className="btn-light !mt-2 !w-full !justify-start !rounded-xl !px-3 !py-2 !text-sm !font-semibold !bg-slate-50 !border-slate-200 hover:!bg-slate-100">Manage stock</a>
                <button type="button" className="btn-light !mt-2 !w-full !justify-start !rounded-xl !px-3 !py-2 !text-sm !font-semibold !bg-slate-50 !border-slate-200 hover:!bg-slate-100" onClick={fetchStock}>
                  <Settings className="w-4 h-4" />
                  Reload data
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className="dropdown-panel z-50"
              >
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                  <p className="text-sm font-bold text-slate-800">{user?.name || "Vendor"}</p>
                  <p className="text-xs font-medium text-slate-500">{user?.email || ""}</p>
                  <p className="mt-1 inline-flex rounded-md bg-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 border border-emerald-200">Vendor account</p>
                </div>
                <button type="button" className="btn-light !mt-3 !w-full !justify-start !rounded-xl !px-3 !py-2 !text-sm !font-semibold !text-red-600 !border-red-200 !bg-red-50 hover:!bg-red-100" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Main Content Form */}
      <motion.div
        id="stock-form"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <StockForm token={token} onCreated={fetchStock} />
      </motion.div>

      {/* Stock List Section */}
      <motion.section 
        id="stock-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 space-y-4"
      >
        <div className="flex items-center justify-between px-2">
          <h2 className="section-title !px-0">
            <Package className="w-5 h-5 text-emerald-600" />
            My Active Stock
          </h2>
          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
            {stock.length} Items
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 font-medium">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!loading && !stock.length && (
          <div className="card text-center py-12 bg-slate-50/50 border-dashed border-2">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-lg">No stock added yet.</p>
            <p className="text-slate-400 text-sm mt-1">Use the form above to add your fresh produce.</p>
          </div>
        )}

        <div className="space-y-4 relative z-10">
          <AnimatePresence>
            {stock.map((item, index) => (
              <motion.article 
                key={item.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="card-hover bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-0"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 tracking-tight">{item.product_name}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm font-medium text-slate-600">
                        <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-lg text-slate-700">
                          {item.quantity_kg} kg
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                          ₹{item.price_per_kg}/kg
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          {item.availability}
                        </span>
                      </div>
                    </div>
                    
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border shadow-sm ${
                        item.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {item.surplus_action !== "none" && (
                    <div className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 border border-amber-200">
                      {item.surplus_action === "discount" ? (
                        <><Tag className="w-3.5 h-3.5" /> Surplus: Discount ({item.discount_percent}% off)</>
                      ) : (
                        <><Archive className="w-3.5 h-3.5" /> Surplus: Sent to Storage</>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button 
                      type="button"
                      disabled={actionBusy.startsWith(`${item.id}:`)}
                      className="btn-light !py-2 !px-3 !text-xs !bg-slate-50 hover:!bg-amber-50 hover:!text-amber-700 hover:!border-amber-200 group disabled:opacity-60" 
                      onClick={() => setSurplusAction(item, "discount", 20)}
                    >
                      {actionBusy === `${item.id}:discount` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                      20% Discount
                    </button>
                    <button 
                      type="button"
                      disabled={actionBusy.startsWith(`${item.id}:`)}
                      className="btn-light !py-2 !px-3 !text-xs !bg-slate-50 hover:!bg-blue-50 hover:!text-blue-700 hover:!border-blue-200 group disabled:opacity-60" 
                      onClick={() => setSurplusAction(item, "storage", 0)}
                    >
                      {actionBusy === `${item.id}:storage` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                      Store Surplus
                    </button>
                    <button 
                      type="button"
                      disabled={actionBusy.startsWith(`${item.id}:`)}
                      className="btn-light !py-2 !px-3 !text-xs !bg-slate-50 hover:!bg-slate-100 group disabled:opacity-60" 
                      onClick={() => setSurplusAction(item, "none", 0)}
                    >
                      {actionBusy === `${item.id}:none` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" />}
                      Clear Surplus
                    </button>
                    <button 
                      type="button"
                      disabled={actionBusy.startsWith(`${item.id}:`)}
                      className="btn-light !py-2 !px-3 !text-xs !border-red-200 !bg-red-50 !text-red-700 hover:!bg-red-600 hover:!text-white group disabled:opacity-60" 
                      onClick={() => deactivateStock(item.id)}
                    >
                      {actionBusy === `${item.id}:delete` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                      Remove
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </motion.section>
    </main>
  );
}
