import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="app-shell">
      <section className="card space-y-4">
        <p className="inline-block rounded-full bg-mango/20 px-3 py-1 text-sm font-semibold text-soil">
          Hyperlocal Fresh Network
        </p>
        <h1 className="text-3xl font-black text-soil">Fresh Produce in 4 km. Fast. Simple.</h1>
        <p className="text-base text-gray-700">
          Connect local fruit and vegetable vendors with restaurants and shops nearby. Reduce waste,
          improve daily buying.
        </p>

        <div className="space-y-3 pt-2">
          <button className="btn-main" onClick={() => navigate("/login?role=vendor")}>I am a Vendor</button>
          <button className="btn-alt" onClick={() => navigate("/login?role=buyer")}>I am a Business Buyer</button>
        </div>
      </section>

      <section className="card mt-4 space-y-2">
        <h2 className="text-xl font-extrabold text-soil">How it works</h2>
        <p className="text-sm text-gray-700">1. Vendor adds stock in seconds.</p>
        <p className="text-sm text-gray-700">2. Buyer posts daily requirement.</p>
        <p className="text-sm text-gray-700">3. Smart match by price + distance (within 4 km).</p>
      </section>

      <footer className="mt-4 px-1 text-center text-xs text-gray-600">
        A hyperlocal platform that helps small vegetable vendors sell more, restaurants procure faster,
        and cities reduce food waste.
      </footer>
    </main>
  );
}
