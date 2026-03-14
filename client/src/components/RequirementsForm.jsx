import { useState } from "react";
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
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="text-xl font-extrabold text-soil">Post Daily Requirement</h2>

      {rows.map((row, index) => (
        <div key={index} className="space-y-2 rounded-soft border border-gray-200 p-3">
          <input
            className="input-box"
            placeholder="Product (Onion)"
            value={row.productName}
            onChange={(e) => updateRow(index, "productName", e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input-box"
              placeholder="Qty kg"
              type="number"
              min="0"
              step="0.1"
              value={row.quantityKg}
              onChange={(e) => updateRow(index, "quantityKg", e.target.value)}
              required
            />
            <input
              className="input-box"
              placeholder="Max price (optional)"
              type="number"
              min="0"
              step="0.01"
              value={row.maxPricePerKg}
              onChange={(e) => updateRow(index, "maxPricePerKg", e.target.value)}
            />
          </div>

          {rows.length > 1 ? (
            <button type="button" className="btn-light" onClick={() => removeRow(index)}>
              Remove Item
            </button>
          ) : null}
        </div>
      ))}

      <select className="input-box" value={neededBy} onChange={(e) => setNeededBy(e.target.value)}>
        <option value="today">Need Today</option>
        <option value="tomorrow">Need Tomorrow</option>
      </select>

      {error ? <p className="rounded-soft bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}

      <button type="button" className="btn-light" onClick={addRow}>
        + Add Another Item
      </button>
      <button className="btn-main" disabled={loading}>
        {loading ? "Posting..." : "Post Requirement"}
      </button>
    </form>
  );
}
