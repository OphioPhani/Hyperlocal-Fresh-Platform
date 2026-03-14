import { useState } from "react";
import { PlusCircle, Loader2, Leaf, Box, DollarSign, Calendar, Tag, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../lib/api";

const initialState = {
  productName: "",
  quantityKg: "",
  pricePerKg: "",
  availability: "today",
  surplusAction: "none",
  discountPercent: "0"
};

export default function StockForm({ token, onCreated }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/stock", {
        method: "POST",
        token,
        body: {
          productName: form.productName,
          quantityKg: Number(form.quantityKg),
          pricePerKg: Number(form.pricePerKg),
          availability: form.availability,
          surplusAction: form.surplusAction,
          discountPercent: Number(form.discountPercent || 0)
        }
      });

      setForm(initialState);
      onCreated(data.stock);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card relative overflow-hidden p-6 z-10">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full mix-blend-multiply opacity-50 -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-5 relative z-10">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
          <PlusCircle className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Add Fresh Stock</h2>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="relative">
          <Leaf className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            className="input-box pl-10 bg-white"
            placeholder="Product name (e.g. Tomatoes, Apples)"
            value={form.productName}
            onChange={(e) => onChange("productName", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              className="input-box pl-10 bg-white"
              placeholder="Qty (kg)"
              type="number"
              min="0"
              step="0.1"
              value={form.quantityKg}
              onChange={(e) => onChange("quantityKg", e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              className="input-box pl-10 bg-white"
              placeholder="Price/kg (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.pricePerKg}
              onChange={(e) => onChange("pricePerKg", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500 pointer-events-none" />
            <select
              className="input-box pl-10 appearance-none bg-white font-medium text-slate-700 cursor-pointer"
              value={form.availability}
              onChange={(e) => onChange("availability", e.target.value)}
            >
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
            </select>
          </div>

          <div className="relative">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 pointer-events-none" />
            <select
              className="input-box pl-10 appearance-none bg-white font-medium text-slate-700 cursor-pointer"
              value={form.surplusAction}
              onChange={(e) => onChange("surplusAction", e.target.value)}
            >
              <option value="none">No Surplus Info</option>
              <option value="discount">Discount Surplus</option>
              <option value="storage">Store in Cold Storage</option>
            </select>
          </div>
        </div>

        <AnimatePresence>
          {form.surplusAction === "discount" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative overflow-hidden"
            >
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
              <input
                className="input-box pl-10 bg-amber-50/50 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
                placeholder="Discount % (e.g. 20)"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.discountPercent}
                onChange={(e) => onChange("discountPercent", e.target.value)}
                required
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button className="btn-main font-bold mt-2 shadow-md shadow-emerald-500/20" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
          ) : (
            <><PlusCircle className="w-5 h-5" /> Save Stock to Network</>
          )}
        </button>
      </div>
    </form>
  );
}
