import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/api";

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

  const title = useMemo(() => {
    if (mode === "register") {
      return role === "vendor" ? "Vendor Sign Up" : "Buyer Sign Up";
    }
    return "Login";
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
    <main className="app-shell">
      <section className="card space-y-4">
        <h1 className="text-3xl font-black text-soil">{title}</h1>

        <div className="grid grid-cols-2 gap-2">
          <button
            className={role === "vendor" ? "btn-main" : "btn-light"}
            type="button"
            onClick={() => setRole("vendor")}
          >
            Vendor
          </button>
          <button
            className={role === "buyer" ? "btn-alt" : "btn-light"}
            type="button"
            onClick={() => setRole("buyer")}
          >
            Buyer
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            className={mode === "login" ? "btn-main" : "btn-light"}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "btn-alt" : "btn-light"}
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form className="space-y-3" onSubmit={submit}>
          {mode === "register" && (
            <input
              className="input-box"
              placeholder="Name"
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              required
            />
          )}

          <input
            className="input-box"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            required
          />

          <input
            className="input-box"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => onChange("password", e.target.value)}
            required
          />

          {mode === "register" && (
            <>
              <button type="button" className="btn-light" onClick={useCurrentLocation}>
                Use My Current Location
              </button>
              {locationStatus ? <p className="text-xs text-gray-600">{locationStatus}</p> : null}

              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input-box"
                  placeholder="Latitude"
                  value={form.latitude}
                  onChange={(e) => onChange("latitude", e.target.value)}
                  required
                />
                <input
                  className="input-box"
                  placeholder="Longitude"
                  value={form.longitude}
                  onChange={(e) => onChange("longitude", e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {error ? <p className="rounded-soft bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}

          <button className="btn-main" disabled={loading}>
            {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
