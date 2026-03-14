import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <main className="app-shell space-y-4">
      <section className="card space-y-2">
        <h1 className="text-2xl font-black text-soil">Buyer Dashboard</h1>
        <p className="text-sm text-gray-700">Hi {user?.name}. Post needs and order from nearby vendors.</p>

        <div className="grid grid-cols-2 gap-2">
          <button className="btn-light" onClick={refreshData}>
            Refresh
          </button>
          <button className="btn-alt" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      <RequirementsForm token={token} onCreated={refreshData} />

      <section className="card space-y-3">
        <h2 className="text-xl font-extrabold text-soil">Nearby Stock (within 4 km)</h2>
        {loading ? <p className="text-sm">Loading live stock...</p> : null}
        {error ? <p className="rounded-soft bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}

        {!loading && !vendors.length ? <p className="text-sm text-gray-600">No nearby stock right now.</p> : null}

        <div className="space-y-2">
          {vendors.map((item) => (
            <article key={item.id} className="rounded-soft border border-gray-200 p-3">
              <p className="text-base font-bold text-soil">{item.product_name}</p>
              <p className="text-sm text-gray-700">
                {item.vendor_name} • {item.distanceKm} km • {item.quantity_kg} kg • {item.price_per_kg}/kg
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-xl font-extrabold text-soil">Smart Matches</h2>
        {!matches.length ? <p className="text-sm text-gray-600">Post requirements to see matches.</p> : null}

        <div className="space-y-3">
          {matches.map((match) => (
            <article key={match.requirementId} className="rounded-soft border border-gray-200 p-3">
              <p className="text-base font-bold text-soil">
                Need {match.productName} - {match.quantityKg} kg ({match.neededBy})
              </p>
              {match.maxPricePerKg ? (
                <p className="text-xs text-gray-600">Max price: {match.maxPricePerKg}/kg</p>
              ) : null}

              {!match.options.length ? <p className="text-sm text-gray-600 mt-2">No vendors matched yet.</p> : null}

              <div className="mt-2 space-y-2">
                {match.options.map((option) => {
                  const orderQty = Math.min(Number(match.quantityKg), Number(option.quantityKg));
                  return (
                    <div key={`${match.requirementId}-${option.stockId}`} className="rounded-soft bg-sky p-2">
                      <p className="text-sm font-semibold text-soil">
                        {option.vendorName} • {option.distanceKm} km • {option.effectivePrice}/kg
                      </p>
                      <p className="text-xs text-gray-700">
                        Available: {option.quantityKg} kg • Surplus: {option.surplusAction}
                      </p>
                      <button
                        className="btn-main mt-2"
                        onClick={() => placeOrder(option.stockId, orderQty, match.requestGroup)}
                      >
                        Order {orderQty} kg
                      </button>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-xl font-extrabold text-soil">My Orders</h2>
        {!orders.length ? <p className="text-sm text-gray-600">No orders yet.</p> : null}
        <div className="space-y-2">
          {orders.map((order) => (
            <article key={order.id} className="rounded-soft border border-gray-200 p-3">
              <p className="text-sm font-bold text-soil">
                {order.product_name} from {order.vendor_name}
              </p>
              <p className="text-xs text-gray-700">
                {order.quantity_kg} kg • {order.unit_price}/kg • Total {order.total_price}
              </p>
              <p className="text-xs text-gray-600">Status: {order.status} • Delivery cost: {order.delivery_cost}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-extrabold text-soil">Recent Requirements</h2>
        <div className="mt-2 space-y-2">
          {!requirements.length ? <p className="text-sm text-gray-600">No requirements posted.</p> : null}
          {requirements.slice(0, 8).map((item) => (
            <p key={item.id} className="rounded-soft bg-gray-50 p-2 text-sm text-gray-700">
              {item.product_name} • {item.quantity_kg} kg • {item.status}
            </p>
          ))}
        </div>
      </section>
    </main>
  );
}
