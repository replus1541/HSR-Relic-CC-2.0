import { Badge } from "../ui/components/index.js";
import { routes } from "./route-config.js";

function matchRoute(route, pathname) {
  if (!route.path.includes(":")) return route.path === pathname ? { route, params: {} } : null;
  const routeParts = route.path.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (routeParts.length !== pathParts.length) return null;
  const params = {};
  for (let index = 0; index < routeParts.length; index += 1) {
    const routePart = routeParts[index];
    const pathPart = pathParts[index];
    if (routePart.startsWith(":")) params[routePart.slice(1)] = decodeURIComponent(pathPart);
    else if (routePart !== pathPart) return null;
  }
  return { route, params };
}

function isNavActive(route, activeRoute, pathname) {
  if (route.path === activeRoute.path) return true;
  return route.path !== "/" && pathname.startsWith(`${route.path}/`);
}

export function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const match = routes.map((route) => matchRoute(route, pathname)).find(Boolean) ?? { route: routes[0], params: {} };
  const activeRoute = match.route;
  const ActiveComponent = activeRoute.component;
  const navRoutes = routes.filter((route) => !route.hideFromNav);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header__title">
          <p className="app-kicker">HSR Relic CC v2.0</p>
          <h1>{activeRoute.title}</h1>
          <Badge tone="ready">v2 shell</Badge>
        </div>
        <nav className="app-nav" aria-label="v2 route navigation">
          {navRoutes.map((route) => (
            <a key={route.path} className={isNavActive(route, activeRoute, pathname) ? "is-active" : ""} href={route.path}>
              {route.label}
            </a>
          ))}
        </nav>
      </header>
      <ActiveComponent params={match.params} />
    </main>
  );
}
