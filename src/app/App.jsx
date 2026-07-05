import { routes } from "./route-config.js";

export function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const activeRoute = routes.find((route) => route.path === pathname) ?? routes[0];
  const ActiveComponent = activeRoute.component;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">HSR Relic CC v2.0</p>
          <h1>{activeRoute.title}</h1>
        </div>
        <nav className="app-nav" aria-label="v2 route navigation">
          {routes.map((route) => (
            <a key={route.path} className={route.path === activeRoute.path ? "is-active" : ""} href={route.path}>
              {route.label}
            </a>
          ))}
        </nav>
      </header>
      <ActiveComponent />
    </main>
  );
}
