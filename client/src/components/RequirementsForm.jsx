import { useState } from "react";
import { CopyPlus, Loader2, Search, Box, DollarSign, Calendar, X, AlertCircle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../lib/api";

const emptyRow = {
  productName: "",
  quantityKg: "",
  maxPricePerKg: ""
};

export default function RequirementsForm({ token, onCreated }) {
  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [neededBy, setNeededBy] = useState("today");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateRow = (index, key, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, { ...emptyRow }]);

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const items = rows
        .filter((row) => row.productName && Number(row.quantityKg) > 0)
        .map((row) => ({
          productName: row.productName,
          quantityKg: Number(row.quantityKg),
          maxPricePerKg: row.maxPricePerKg ? Number(row.maxPricePerKg) : null
        }));

      if (!items.length) {
        throw new Error("Please add at least one valid item");
      }

      const data = await apiRequest("/requirements", {
        method: "POST",
        token,
        body: {
          items,
          neededBy
        }
      });

      setRows([{ ...emptyRow }]);
      onCreated(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card relative overflow-hidden p-6 z-10">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full mix-blend-multiply opacity-50 -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-5 relative z-10">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
          <CopyPlus className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800">Post Daily Requirement</h2>
      </div>

      <div className="space-y-4 relative z-10">
        <AnimatePresence>
          {rows.map((row, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 relative"
            >
              {rows.length > 1 && (
                <button 
                  type="button" 
                  className="absolute -right-2 -top-2 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm z-10"
                  onClick={() => removeRow(index)}
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  className="input-box pl-10 bg-white"
                  placeholder="What do you need? (e.g. Onion)"
                  value={row.productName}
                  onChange={(e) => updateRow(index, "productName", e.target.value)}
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
                    value={row.quantityKg}
                    onChange={(e) => updateRow(index, "quantityKg", e.target.value)}
                    required
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    className="input-box pl-10 bg-white"
                    placeholder="Max price (optional)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.maxPricePerKg}
                    onChange={(e) => updateRow(index, "maxPricePerKg", e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            type="button" 
            className="flex-1 btn-light border-dashed !bg-transparent hover:!bg-slate-50 !py-3 !text-slate-600 hover:!text-slate-800"
            onClick={addRow}
          >
            <Plus className="w-4 h-4" />
            Add Another Item
          </button>
          
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 pointer-events-none" />
            <select 
              className="input-box pl-10 appearance-none bg-white font-medium text-slate-700 h-full cursor-pointer" 
              value={neededBy} 
              onChange={(e) => setNeededBy(e.target.value)}
            >
              <option value="today">Need Today</option>
              <option value="tomorrow">Need Tomorrow</option>
            </select>
          </div>
        </div>

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

        <button className="btn-main !bg-amber-600 hover:!bg-amber-700 hover:shadow-amber-600/20 font-bold mt-4 shadow-md" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Posting...</>
          ) : (
            <><CopyPlus className="w-5 h-5" /> Post Requirement</>
          )}
        </button>
      </div>
    </form>
  );
}
