import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StockForm from "../components/StockForm";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/api";

export default function VendorDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const deactivateStock = async (id) => {
    try {
      await apiRequest(`/stock/${id}`, {
        method: "DELETE",
        token
      });
      fetchStock();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const setSurplusAction = async (item, surplusAction, discountPercent = 0) => {
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
      fetchStock();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <main className="app-shell space-y-4">
      <section className="card space-y-2">
        <h1 className="text-2xl font-black text-soil">Vendor Dashboard</h1>
        <p className="text-sm text-gray-700">Hello {user?.name}. Add and manage your daily produce stock.</p>

        <div className="grid grid-cols-2 gap-2">
          <button className="btn-light" onClick={fetchStock}>
            Refresh
          </button>
          <button className="btn-alt" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      <StockForm token={token} onCreated={fetchStock} />

      <section className="card space-y-3">
        <h2 className="text-xl font-extrabold text-soil">My Stock</h2>
        {loading ? <p className="text-sm">Loading stock...</p> : null}
        {error ? <p className="rounded-soft bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}

        {!loading && !stock.length ? <p className="text-sm text-gray-600">No stock added yet.</p> : null}

        <div className="space-y-3">
          {stock.map((item) => (
            <article key={item.id} className="rounded-soft border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-bold text-soil">{item.product_name}</p>
                  <p className="text-sm text-gray-700">
                    {item.quantity_kg} kg • {item.price_per_kg}/kg • {item.availability}
                  </p>
                  <p className="text-xs text-gray-600">
                    Surplus: {item.surplus_action}
                    {item.surplus_action === "discount" ? ` (${item.discount_percent}% off)` : ""}
                  </p>
                </div>
                <span
                  className={
                    item.is_active
                      ? "rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700"
                      : "rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600"
                  }
                >
                  {item.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="btn-light" onClick={() => setSurplusAction(item, "discount", 20)}>
                  20% Discount
                </button>
                <button className="btn-light" onClick={() => setSurplusAction(item, "storage", 0)}>
                  Store Surplus
                </button>
                <button className="btn-light" onClick={() => setSurplusAction(item, "none", 0)}>
                  Clear Surplus
                </button>
                <button className="btn-alt" onClick={() => deactivateStock(item.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
