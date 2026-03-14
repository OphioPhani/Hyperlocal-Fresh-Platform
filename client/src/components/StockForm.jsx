import { useState } from "react";
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
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="text-xl font-extrabold text-soil">Add Stock</h2>

      <input
        className="input-box"
        placeholder="Product name (Tomato)"
        value={form.productName}
        onChange={(e) => onChange("productName", e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          className="input-box"
          placeholder="Qty kg"
          type="number"
          min="0"
          step="0.1"
          value={form.quantityKg}
          onChange={(e) => onChange("quantityKg", e.target.value)}
          required
        />
        <input
          className="input-box"
          placeholder="Price/kg"
          type="number"
          min="0"
          step="0.01"
          value={form.pricePerKg}
          onChange={(e) => onChange("pricePerKg", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          className="input-box"
          value={form.availability}
          onChange={(e) => onChange("availability", e.target.value)}
        >
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
        </select>

        <select
          className="input-box"
          value={form.surplusAction}
          onChange={(e) => onChange("surplusAction", e.target.value)}
        >
          <option value="none">No Surplus</option>
          <option value="discount">Discount Surplus</option>
          <option value="storage">Store in Cold Storage</option>
        </select>
      </div>

      {form.surplusAction === "discount" ? (
        <input
          className="input-box"
          placeholder="Discount %"
          type="number"
          min="0"
          max="100"
          step="1"
          value={form.discountPercent}
          onChange={(e) => onChange("discountPercent", e.target.value)}
        />
      ) : null}

      {error ? <p className="rounded-soft bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}

      <button className="btn-main" disabled={loading}>
        {loading ? "Saving..." : "Save Stock"}
      </button>
    </form>
  );
}
