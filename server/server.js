const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { authenticateToken, requireRole } = require("./middleware/auth");
const { haversineKm } = require("./utils/distance");

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 4000);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const EXTRA_ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const DB_PATH = process.env.DB_PATH
  ? path.resolve(__dirname, process.env.DB_PATH)
  : path.resolve(__dirname, "..", "database", "app.db");

const PROD_ALLOWED_ORIGINS = [
  FRONTEND_URL,
  "https://aarna-seven.vercel.app",
  ...EXTRA_ALLOWED_ORIGINS
].filter(Boolean);

let db;

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      latitude: user.latitude,
      longitude: user.longitude
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isAllowedProductionOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (PROD_ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    const isVercelApp = parsed.protocol === "https:" && parsed.hostname.endsWith(".vercel.app");
    const isLocalhost = ["localhost", "127.0.0.1"].includes(parsed.hostname);
    return isVercelApp || isLocalhost;
  } catch {
    return false;
  }
}

async function initDatabase() {
  const schemaPath = path.resolve(__dirname, "..", "database", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  await db.exec(schemaSql);
  console.log(`SQLite database ready at ${DB_PATH}`);
}

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      callback(null, true);
      return;
    }

    if (isAllowedProductionOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS blocked for this origin"));
  },
  credentials: true
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Hyperlocal backend is running" });
});

app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    const { name, email, password, role, latitude, longitude } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "name, email, password and role are required" });
    }

    if (!["vendor", "buyer"].includes(role)) {
      return res.status(400).json({ error: "role must be vendor or buyer" });
    }

    if (Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) {
      return res.status(400).json({ error: "latitude and longitude are required" });
    }

    const normalizedEmail = normalizeText(email);
    const existing = await db.get("SELECT id FROM users WHERE email = ?", normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertResult = await db.run(
      `
      INSERT INTO users (name, email, password_hash, role, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [name.trim(), normalizedEmail, passwordHash, role, Number(latitude), Number(longitude)]
    );

    const user = await db.get(
      `
      SELECT id, name, email, role, latitude, longitude, created_at
      FROM users
      WHERE id = ?
      `,
      [insertResult.lastID]
    );

    const token = createToken(user);

    return res.status(201).json({ token, user });
  })
);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const userWithPassword = await db.get(
      `
      SELECT id, name, email, password_hash, role, latitude, longitude, created_at
      FROM users
      WHERE email = ?
      `,
      [normalizeText(email)]
    );

    if (!userWithPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, userWithPassword.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = {
      id: userWithPassword.id,
      name: userWithPassword.name,
      email: userWithPassword.email,
      role: userWithPassword.role,
      latitude: userWithPassword.latitude,
      longitude: userWithPassword.longitude,
      created_at: userWithPassword.created_at
    };

    const token = createToken(user);
    return res.json({ token, user });
  })
);

app.get(
  "/api/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await db.get(
      `
      SELECT id, name, email, role, latitude, longitude, created_at
      FROM users
      WHERE id = ?
      `,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  })
);

app.post(
  "/api/stock",
  authenticateToken,
  requireRole("vendor"),
  asyncHandler(async (req, res) => {
    const {
      productName,
      quantityKg,
      pricePerKg,
      availability = "today",
      surplusAction = "none",
      discountPercent = 0
    } = req.body;

    if (!productName || Number(quantityKg) <= 0 || Number(pricePerKg) < 0) {
      return res.status(400).json({ error: "productName, quantityKg and pricePerKg are required" });
    }

    if (!["today", "tomorrow"].includes(availability)) {
      return res.status(400).json({ error: "availability must be today or tomorrow" });
    }

    if (!["none", "discount", "storage"].includes(surplusAction)) {
      return res.status(400).json({ error: "Invalid surplusAction" });
    }

    const safeDiscount = Math.max(0, Math.min(100, Number(discountPercent) || 0));

    const result = await db.run(
      `
      INSERT INTO stock (
        vendor_id,
        product_name,
        quantity_kg,
        price_per_kg,
        availability,
        surplus_action,
        discount_percent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        productName.trim(),
        Number(quantityKg),
        Number(pricePerKg),
        availability,
        surplusAction,
        safeDiscount
      ]
    );

    const created = await db.get("SELECT * FROM stock WHERE id = ?", [result.lastID]);
    return res.status(201).json({ stock: created });
  })
);

app.get(
  "/api/stock/my",
  authenticateToken,
  requireRole("vendor"),
  asyncHandler(async (req, res) => {
    const rows = await db.all(
      `
      SELECT *
      FROM stock
      WHERE vendor_id = ?
      ORDER BY is_active DESC, created_at DESC
      `,
      [req.user.id]
    );

    return res.json({ stock: rows });
  })
);

app.put(
  "/api/stock/:id",
  authenticateToken,
  requireRole("vendor"),
  asyncHandler(async (req, res) => {
    const stockId = Number(req.params.id);
    const existing = await db.get("SELECT * FROM stock WHERE id = ? AND vendor_id = ?", [stockId, req.user.id]);

    if (!existing) {
      return res.status(404).json({ error: "Stock item not found" });
    }

    const updates = {
      product_name: req.body.productName ?? existing.product_name,
      quantity_kg: req.body.quantityKg ?? existing.quantity_kg,
      price_per_kg: req.body.pricePerKg ?? existing.price_per_kg,
      availability: req.body.availability ?? existing.availability,
      surplus_action: req.body.surplusAction ?? existing.surplus_action,
      discount_percent: req.body.discountPercent ?? existing.discount_percent,
      is_active: req.body.isActive ?? existing.is_active
    };

    if (!["today", "tomorrow"].includes(updates.availability)) {
      return res.status(400).json({ error: "availability must be today or tomorrow" });
    }

    if (!["none", "discount", "storage"].includes(updates.surplus_action)) {
      return res.status(400).json({ error: "Invalid surplusAction" });
    }

    await db.run(
      `
      UPDATE stock
      SET product_name = ?,
          quantity_kg = ?,
          price_per_kg = ?,
          availability = ?,
          surplus_action = ?,
          discount_percent = ?,
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND vendor_id = ?
      `,
      [
        String(updates.product_name).trim(),
        Number(updates.quantity_kg),
        Number(updates.price_per_kg),
        updates.availability,
        updates.surplus_action,
        Math.max(0, Math.min(100, Number(updates.discount_percent) || 0)),
        Number(updates.is_active) ? 1 : 0,
        stockId,
        req.user.id
      ]
    );

    const updated = await db.get("SELECT * FROM stock WHERE id = ?", [stockId]);
    return res.json({ stock: updated });
  })
);

app.delete(
  "/api/stock/:id",
  authenticateToken,
  requireRole("vendor"),
  asyncHandler(async (req, res) => {
    const stockId = Number(req.params.id);
    const existing = await db.get("SELECT id FROM stock WHERE id = ? AND vendor_id = ?", [stockId, req.user.id]);

    if (!existing) {
      return res.status(404).json({ error: "Stock item not found" });
    }

    await db.run(
      `
      UPDATE stock
      SET is_active = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND vendor_id = ?
      `,
      [stockId, req.user.id]
    );

    return res.json({ message: "Stock removed" });
  })
);

app.post(
  "/api/requirements",
  authenticateToken,
  requireRole("buyer"),
  asyncHandler(async (req, res) => {
    const { items, neededBy = "today" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }

    if (!["today", "tomorrow"].includes(neededBy)) {
      return res.status(400).json({ error: "neededBy must be today or tomorrow" });
    }

    const requestGroup = `REQ-${Date.now()}-${req.user.id}`;

    for (const item of items) {
      if (!item.productName || Number(item.quantityKg) <= 0) {
        return res.status(400).json({ error: "Each item needs productName and quantityKg" });
      }

      await db.run(
        `
        INSERT INTO requirements (
          buyer_id,
          request_group,
          product_name,
          quantity_kg,
          max_price_per_kg,
          needed_by,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, 'open')
        `,
        [
          req.user.id,
          requestGroup,
          item.productName.trim(),
          Number(item.quantityKg),
          item.maxPricePerKg ? Number(item.maxPricePerKg) : null,
          neededBy
        ]
      );
    }

    const createdRows = await db.all(
      `
      SELECT *
      FROM requirements
      WHERE request_group = ?
      ORDER BY id DESC
      `,
      [requestGroup]
    );

    return res.status(201).json({ requestGroup, requirements: createdRows });
  })
);

app.get(
  "/api/requirements/my",
  authenticateToken,
  requireRole("buyer"),
  asyncHandler(async (req, res) => {
    const rows = await db.all(
      `
      SELECT *
      FROM requirements
      WHERE buyer_id = ?
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    return res.json({ requirements: rows });
  })
);

app.get(
  "/api/vendors/nearby",
  authenticateToken,
  requireRole("buyer"),
  asyncHandler(async (req, res) => {
    const buyer = await db.get("SELECT id, latitude, longitude FROM users WHERE id = ?", [req.user.id]);
    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    const rows = await db.all(
      `
      SELECT
        s.*,
        u.name AS vendor_name,
        u.latitude AS vendor_latitude,
        u.longitude AS vendor_longitude
      FROM stock s
      JOIN users u ON u.id = s.vendor_id
      WHERE s.is_active = 1
      ORDER BY s.price_per_kg ASC, s.created_at DESC
      `
    );

    const withinRadius = rows
      .map((row) => {
        const distanceKm = haversineKm(
          Number(buyer.latitude),
          Number(buyer.longitude),
          Number(row.vendor_latitude),
          Number(row.vendor_longitude)
        );

        return {
          ...row,
          distanceKm: Number(distanceKm.toFixed(2))
        };
      })
      .filter((row) => row.distanceKm <= 4)
      .sort((a, b) => a.price_per_kg - b.price_per_kg || a.distanceKm - b.distanceKm);

    return res.json({ vendors: withinRadius });
  })
);

app.get(
  "/api/matches",
  authenticateToken,
  requireRole("buyer"),
  asyncHandler(async (req, res) => {
    const buyer = await db.get("SELECT id, latitude, longitude FROM users WHERE id = ?", [req.user.id]);
    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    const requirements = await db.all(
      `
      SELECT *
      FROM requirements
      WHERE buyer_id = ?
        AND status = 'open'
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    const stockRows = await db.all(
      `
      SELECT
        s.*,
        u.name AS vendor_name,
        u.latitude AS vendor_latitude,
        u.longitude AS vendor_longitude
      FROM stock s
      JOIN users u ON u.id = s.vendor_id
      WHERE s.is_active = 1
      ORDER BY s.price_per_kg ASC
      `
    );

    const matches = requirements.map((requirement) => {
      const requirementName = normalizeText(requirement.product_name);

      const options = stockRows
        .map((stock) => {
          const distanceKm = haversineKm(
            Number(buyer.latitude),
            Number(buyer.longitude),
            Number(stock.vendor_latitude),
            Number(stock.vendor_longitude)
          );

          const effectivePrice =
            stock.surplus_action === "discount"
              ? Number((stock.price_per_kg * (1 - Number(stock.discount_percent) / 100)).toFixed(2))
              : Number(stock.price_per_kg);

          return {
            ...stock,
            distanceKm: Number(distanceKm.toFixed(2)),
            effectivePrice
          };
        })
        .filter((stock) => {
          const stockName = normalizeText(stock.product_name);
          const nameMatches =
            stockName.includes(requirementName) || requirementName.includes(stockName);
          const distanceMatches = stock.distanceKm <= 4;
          const quantityMatches = Number(stock.quantity_kg) > 0;
          const priceMatches = requirement.max_price_per_kg
            ? stock.effectivePrice <= Number(requirement.max_price_per_kg)
            : true;

          return nameMatches && distanceMatches && quantityMatches && priceMatches;
        })
        .sort((a, b) => a.effectivePrice - b.effectivePrice || a.distanceKm - b.distanceKm)
        .map((item) => ({
          stockId: item.id,
          vendorId: item.vendor_id,
          vendorName: item.vendor_name,
          productName: item.product_name,
          availability: item.availability,
          quantityKg: item.quantity_kg,
          pricePerKg: item.price_per_kg,
          effectivePrice: item.effectivePrice,
          distanceKm: item.distanceKm,
          surplusAction: item.surplus_action,
          discountPercent: item.discount_percent
        }));

      return {
        requirementId: requirement.id,
        requestGroup: requirement.request_group,
        productName: requirement.product_name,
        quantityKg: requirement.quantity_kg,
        maxPricePerKg: requirement.max_price_per_kg,
        neededBy: requirement.needed_by,
        options
      };
    });

    return res.json({ matches });
  })
);

app.post(
  "/api/orders",
  authenticateToken,
  requireRole("buyer"),
  asyncHandler(async (req, res) => {
    const { items, requestGroup } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array is required" });
    }

    const buyer = await db.get("SELECT id, latitude, longitude FROM users WHERE id = ?", [req.user.id]);
    if (!buyer) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    const createdOrders = [];

    for (const item of items) {
      const stockId = Number(item.stockId);
      const quantityKg = Number(item.quantityKg);

      if (!stockId || quantityKg <= 0) {
        return res.status(400).json({ error: "Each item needs stockId and quantityKg" });
      }

      const stock = await db.get(
        `
        SELECT
          s.*,
          u.latitude AS vendor_latitude,
          u.longitude AS vendor_longitude
        FROM stock s
        JOIN users u ON u.id = s.vendor_id
        WHERE s.id = ?
          AND s.is_active = 1
        `,
        [stockId]
      );

      if (!stock) {
        return res.status(404).json({ error: `Stock ${stockId} not found` });
      }

      if (quantityKg > Number(stock.quantity_kg)) {
        return res.status(400).json({ error: `Not enough quantity for stock ${stockId}` });
      }

      const distanceKm = haversineKm(
        Number(buyer.latitude),
        Number(buyer.longitude),
        Number(stock.vendor_latitude),
        Number(stock.vendor_longitude)
      );

      if (distanceKm > 4) {
        return res.status(400).json({ error: `Stock ${stockId} is outside 4km radius` });
      }

      const unitPrice =
        stock.surplus_action === "discount"
          ? Number((stock.price_per_kg * (1 - Number(stock.discount_percent) / 100)).toFixed(2))
          : Number(stock.price_per_kg);

      const totalPrice = Number((unitPrice * quantityKg).toFixed(2));

      const orderInsert = await db.run(
        `
        INSERT INTO orders (
          buyer_id,
          vendor_id,
          stock_id,
          request_group,
          quantity_kg,
          unit_price,
          total_price,
          delivery_cost,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'confirmed')
        `,
        [req.user.id, stock.vendor_id, stock.id, requestGroup || null, quantityKg, unitPrice, totalPrice]
      );

      const remainingQty = Number(stock.quantity_kg) - quantityKg;
      await db.run(
        `
        UPDATE stock
        SET quantity_kg = ?,
            is_active = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `,
        [remainingQty, remainingQty > 0 ? 1 : 0, stock.id]
      );

      const created = await db.get("SELECT * FROM orders WHERE id = ?", [orderInsert.lastID]);
      createdOrders.push(created);
    }

    if (requestGroup) {
      await db.run(
        `
        UPDATE requirements
        SET status = 'fulfilled'
        WHERE request_group = ?
          AND buyer_id = ?
          AND status = 'open'
        `,
        [requestGroup, req.user.id]
      );
    }

    return res.status(201).json({ orders: createdOrders });
  })
);

app.get(
  "/api/orders/my",
  authenticateToken,
  asyncHandler(async (req, res) => {
    let rows;

    if (req.user.role === "buyer") {
      rows = await db.all(
        `
        SELECT
          o.*,
          s.product_name,
          u.name AS vendor_name
        FROM orders o
        JOIN stock s ON s.id = o.stock_id
        JOIN users u ON u.id = o.vendor_id
        WHERE o.buyer_id = ?
        ORDER BY o.created_at DESC
        `,
        [req.user.id]
      );
    } else {
      rows = await db.all(
        `
        SELECT
          o.*,
          s.product_name,
          u.name AS buyer_name
        FROM orders o
        JOIN stock s ON s.id = o.stock_id
        JOIN users u ON u.id = o.buyer_id
        WHERE o.vendor_id = ?
        ORDER BY o.created_at DESC
        `,
        [req.user.id]
      );
    }

    return res.json({ orders: rows });
  })
);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || 500;
  const message = error.message || "Internal server error";
  res.status(status).json({ error: message });
});

(async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing. Create server/.env from server/.env.example");
    }

    await initDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
})();
