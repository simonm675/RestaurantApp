# 🚀 Restaurant App Production Optimization Guide

Generated: March 28, 2026

---

## 📋 Inhaltsverzeichnis

1. [WebSocket Integration](#websocket)
2. [React Performance](#react-performance)
3. [Error Handling & Retry Logic](#error-handling)
4. [Security Upgrades](#security)
5. [Database Optimization](#database)
6. [Monitoring & Logging](#monitoring)
7. [Deployment Checklist](#deployment)

---

## 🔌 WebSocket Integration {#websocket}

### Was wurde implementiert?
- **Socket.IO Server** auf dem Backend (HTTP + WebSocket duale Unterstützung)
- **SocketManager** - Zentrale Klasse für Event-Management
- **useWebSocket Hook** - Frontend Real-time Connection Management
- **useOrderUpdates Hook** - Spezialisierter Hook für Order-Updates

### Wie man es nutzt:

#### Backend - Neue Order Notification
```javascript
// In orderController.js
const socketManager = req.app.get("socketManager");

// Neue Bestellung erstellt
await newOrder.save();

// Küche-Personal benachrichtigen
socketManager.notifyKitchenNewOrder(newOrder);

// Optional: Auch Den User benachrichtigen
socketManager.notifyUser(newOrder.userId, {
  type: "order_created",
  message: "Bestellung aufgegeben!",
  orderId: newOrder._id,
});
```

#### Frontend - KitchenPage aktualisiert mit Real-time
```javascript
// src/pages/KitchenPage.jsx
import { useWebSocket } from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";

const KitchenPage = () => {
  const { user } = useAuth();
  const { subscribe, isConnected, error } = useWebSocket(user.id, "kitchen");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe zu neuen Orders
    const unsubscribe = subscribe("order:created", (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      
      // Optional: Sound abspielen für neue Order
      playNotificationSound();
      
      // Toast-Notification
      toast.success(`Neue Bestellung! ${newOrder.items.length} Items`);
    });

    // Subscribe zu Status-Updates
    const unsubscribeStatus = subscribe("order:statusChanged", (data) => {
      setOrders(prev => 
        prev.map(o => 
          o._id === data.orderId 
            ? { ...o, status: data.status }
            : o
        )
      );
    });

    return () => {
      unsubscribe();
      unsubscribeStatus();
    };
  }, [isConnected, subscribe]);

  return (
    <div>
      {/* Display orders */}
      {error && <div className="error">Verbindung lost: {error}</div>}
    </div>
  );
};
```

### Was Still To Do:
1. **Order-Updates Pushen**: Wenn Küche Status ändert → `socket.emit("order:status:change", ...)`
2. **Delivery Tracking**: GPS-Positionen via WebSocket
3. **Sound & Notifications**: Audio-Alert für neue Orders
4. **Reconnection UI Feedback**: "Trying to reconnect..." Indicator

---

## ⚡ React Performance {#react-performance}

### Problem Analysis
Die meisten Performance-Probleme entstehen durch:
- Unnötige Context Re-Renders (alle Subscriber render wenn etwas ändert)
- Fehlende Memoization von Callbacks
- Zu viele API-calls (keine Caching-Strategie)

### LÖSUNG 1: Context Splitting

**Vorher: Problem**
```javascript
// AuthContext.jsx - BAD
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");

  const value = { user, loading, theme, setUser, setLoading, setTheme };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// ❌ Problem: Wenn theme ändert → ALLE Komponenten die useAuth() nutzen re-rendern!
```

**Nachher: Solution**
```javascript
// Separate Contexts
const UserContext = createContext();
const LoadingContext = createContext();
const ThemeContext = createContext();

// Nur die Komponenten die user brauchen → re-rendern bei user-change
// Nur die die theme brauchen → re-rendern bei theme-change
```

### LÖSUNG 2: Debounce Search

```javascript
// MenuPage.jsx - Beispiel
import { useDebounce } from "../hooks/usePerformance";

const MenuPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);

  // Search wird nur ausgeführt wenn user 300ms nicht getippt hat
  const debouncedSearch = useDebounce(async (term) => {
    if (term.length < 2) {
      setFilteredItems([]);
      return;
    }
    
    try {
      const { data } = await menuApi.search(term);
      setFilteredItems(data);
    } catch (error) {
      console.error(error);
    }
  }, 300);

  return (
    <input
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        debouncedSearch(e.target.value);
      }}
      placeholder="Suchen..."
    />
  );
};
```

### LÖSUNG 3: Lazy Loading Komponenten

```javascript
// Große Komponenten lazy-loaden
import { lazy, Suspense } from "react";
import Spinner from "./Spinner";

const AdminPage = lazy(() => import("./AdminPage"));
const KitchenPage = lazy(() => import("./KitchenPage"));

// Im Router:
<Route 
  path="/admin" 
  element={
    <Suspense fallback={<Spinner />}>
      <AdminPage />
    </Suspense>
  } 
/>
```

### LÖSUNG 4: Caching mit getCachedOrFetch

```javascript
// MenuPage.jsx
import { getCachedOrFetch } from "../utils/errorHandling";

const MenuPage = () => {
  useEffect(() => {
    // Cache Menu für 5 Minuten
    getCachedOrFetch("menu-items", 
      () => menuApi.getAll(),
      5 * 60 * 1000  // 5 minutes
    ).then(setItems);
  }, []);
};

// User-Profil für 1 Stunde cachen
getCachedOrFetch("user-profile", 
  () => userApi.getProfile(),
  1 * 60 * 60 * 1000  // 1 hour
);
```

---

## 🆘 Error Handling & Retry {#error-handling}

### Automatisches Retry bei temporären Fehlern

```javascript
import { retryRequest, withTimeout } from "../utils/errorHandling";

// Nutze es so:
try {
  const result = await retryRequest(
    () => menuApi.getAll(),
    3,      // Max 3 Versuche
    1000    // Start mit 1s Delay
  );
  // Nach 1s, 2s, 4s versuchen wenn es fehlschlägt
} catch (error) {
  showErrorToast(error, "MenuPage");
}
```

### Timeout für langsame Requests

```javascript
const data = await withTimeout(
  orderApi.create(orderData),
  10000  // 10 Sekunden Timeout
);
```

### Offline Queue für Requests

```javascript
import { requestQueue } from "../utils/errorHandling";

// Wenn User offline ist → Queue
try {
  await orderApi.create(data);
} catch (error) {
  if (!navigator.onLine) {
    // Speichere in Queue
    requestQueue.add({
      endpoint: "/api/orders",
      method: "POST",
      data,
    });
    toast.info("Wird übertragen wenn Internet da ist");
  }
}

// Wenn zurück online → automatisch flushen
window.addEventListener("online", () => {
  requestQueue.flush(async (request) => {
    await axios({
      method: request.method,
      url: request.endpoint,
      data: request.data,
    });
  });
});
```

---

## 🔒 Security Upgrades {#security}

### 1. JWT Refresh Token Pattern

**Backend**:
```javascript
// authController.js
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// Refresh Endpoint
router.post("/refresh", (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const { accessToken } = generateTokens(decoded.userId);
    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});
```

### 2. Rate Limiting (bereits implementiert)

Rate Limiters sind in `rateLimitMiddleware.js` definiert:
- Global: 100 requests/15 min
- Auth: 5 failed login attempts/15 min
- Order Create: 10 orders/minute

### 3. CSRF Protection
Optionale Zusatz (falls ohne SameSite reicht):
- Frontend sendet Origin-Header
- Backend validiert Host

---

## 🗄️ Database Optimization {#database}

### Indexes erstellen:
```bash
npm run setup:indexes
```

Folgende Indexes wurden erstellt:
- `orders.createdAt` - Sortierung nach Erstellungsdatum
- `orders.status` - Filter nach Status
- `orders.userId` + `createdAt` - User-spezifische Orders
- `menuitems.category` - Kategorie-Filter
- `menuitems.name` + `description` - Volltextsuche

### Pagination für große Datenmengen:

```javascript
// Backend - orderRoutes.js
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); // .lean() = no Mongoose overhead

  const total = await Order.countDocuments();

  res.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
```

---

## 📊 Monitoring & Logging {#monitoring}

### Logging Setup (bereits implementiert mit Winston)

Logs werden geschrieben zu:
- `logs/error.log` - Nur Errors (rotiert bei 5MB)
- `logs/combined.log` - Alle Logs (rotiert bei 5MB)

### Dashboard Metrics (optional)

```javascript
// socketManager.broadcastDashboardMetrics(metrics)
const metrics = {
  ordersPerHour: 45,
  avgOrderTime: 12.5,
  activeOrders: 8,
  kitchenQueueLength: 3,
};

socketManager.broadcastDashboardMetrics(metrics);
```

---

## ✅ Deployment Checklist {#deployment}

- [ ] **Environment variables**:
  - JWT_SECRET = neue Secret (nicht default)
  - NODE_ENV = production
  - FRONTEND_URL = production Frontend URL
  - LOG_LEVEL = warn oder error (nicht debug)

- [ ] **Database**:
  - Indexes erstellt (`npm run setup:indexes`)
  - Backup configured
  - Monitoring enabled

- [ ] **Security**:
  - JWT_SECRET rotiert
  - Rate limiting aktiv
  - CORS nur für bekannte Domains
  - .env nie committed

- [ ] **Frontend**:
  - WebSocket reconnection working
  - Error boundaries implemented
  - Fallback UI für offline
  - Images optimiert (lazy loaded)

- [ ] **Monitoring**:
  - Winston Logging funktioniert
  - Error Tracking auf Sentry/ähnlich
  - Performance Monitoring aktiv

- [ ] **Testing**:
  - Orders flüssig erstellt/aktualisiert
  - Kitchen Display aktualisiert in Echtzeit
  - Offline Requests queued
  - Error Recovery funktioniert

---

## 🎯 Performance Targets

| Metrik | Target | Tool |
|--------|--------|------|
| Time-to-First-Byte | < 200ms | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| API Response Time | < 300ms | Winston Logs |
| WebSocket Latency | < 100ms | Socket.IO Debug |
| Order Creation | < 1s | Profiler |

---

## 📞 Support & Debugging

### WebSocket nicht verbunden?
```javascript
// Browser Console
socket.disconnect();  // reconnect
socket.on("connect", () => console.log("Connected!"));
socket.on("disconnect", () => console.log("Disconnected"));
```

### CPU bei 100%?
- Suche nach Re-Render-Loops (React Profiler)
- Prüfe WebSocket-Events auf Duplizierung
- Cache-Invalidation überprüfen

### Database Performance?
```bash
# MongoDB Profiling aktivieren
db.setProfilingLevel(1, { slowms: 200 })
```

---

**Generated**: March 28, 2026  
**Status**: Ready for Production  
**Next Review**: Q2 2026
