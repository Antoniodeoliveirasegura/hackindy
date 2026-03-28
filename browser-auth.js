const PIHAuth = (() => {
  let cachedSession = null;

  async function request(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const init = {
      ...options,
      headers,
      credentials: "include",
    };

    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, init);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        payload?.message ||
        (typeof payload === "string" && payload) ||
        "Request failed";
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  function getInitials(name, email) {
    const source = (name || email || "PIH").trim();
    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  }

  function getDisplayName(user) {
    if (!user) return "Student";
    if (user.name && user.name.trim()) return user.name.trim();
    if (user.email && user.email.includes("@")) {
      return user.email.split("@")[0];
    }
    return "Student";
  }

  function getFirstName(user) {
    const displayName = getDisplayName(user);
    return displayName.split(/\s+/)[0] || displayName;
  }

  function injectLogoutStyles() {
    if (document.getElementById("pih-auth-style")) return;

    const style = document.createElement("style");
    style.id = "pih-auth-style";
    style.textContent = `
      .auth-logout-btn{
        font:inherit;
        font-size:12px;
        color:var(--txt1);
        padding:7px 12px;
        border-radius:8px;
        border:0.5px solid var(--bdr2);
        background:transparent;
        cursor:pointer;
        transition:background .15s,color .15s,border-color .15s;
      }
      .auth-logout-btn:hover{
        background:var(--bg2);
        color:var(--txt0);
      }
    `;
    document.head.appendChild(style);
  }

  async function getSession(force = false) {
    if (cachedSession && !force) return cachedSession;
    const data = await request("/api/session");
    cachedSession = data.session;
    return cachedSession;
  }

  async function getAuthConfig() {
    return request("/api/auth-config");
  }

  async function signOut(redirectTo = "landing.html") {
    await request("/api/sign-out", { method: "POST" });
    cachedSession = null;
    window.location.href = redirectTo;
  }

  async function requireAuth(redirectTo = "login.html") {
    const session = await getSession(true);
    if (!session?.user) {
      const target = encodeURIComponent(window.location.pathname);
      window.location.href = `${redirectTo}?next=${target}`;
      return null;
    }
    decorateProtectedNav(session);
    return session;
  }

  async function redirectIfAuthenticated(redirectTo = "index.html") {
    const session = await getSession(true);
    if (session?.user) {
      window.location.href = redirectTo;
      return session;
    }
    return null;
  }

  function decorateProtectedNav(session) {
    const avatars = document.querySelectorAll(".avatar, .av");
    avatars.forEach((avatar) => {
      avatar.textContent = getInitials(session.user.name, session.user.email);
      avatar.title = session.user.email || session.user.name || "Signed in";
    });

    const navRight = document.querySelector(".nav-right");
    if (navRight && !navRight.querySelector(".auth-logout-btn")) {
      injectLogoutStyles();
      const button = document.createElement("button");
      button.className = "auth-logout-btn";
      button.type = "button";
      button.textContent = "Sign out";
      button.addEventListener("click", () => {
        signOut("landing.html");
      });
      navRight.appendChild(button);
    }
  }

  function updateLandingLinks(session) {
    const signInLink = document.getElementById("landing-signin");
    const primaryLink = document.getElementById("landing-primary");
    const heroPrimary = document.getElementById("cta-hero-primary");
    const footerPrimary = document.getElementById("cta-footer-primary");
    const ctaSecondary = document.getElementById("cta-secondary");

    if (!session?.user) return;

    if (signInLink) {
      signInLink.textContent = "Dashboard";
      signInLink.href = "index.html";
    }

    if (primaryLink) {
      primaryLink.innerHTML = '<span data-icon="home" data-size="14"></span>Dashboard';
      primaryLink.href = "index.html";
    }

    if (heroPrimary) {
      heroPrimary.innerHTML = '<span data-icon="home" data-size="16"></span>Open dashboard';
      heroPrimary.href = "index.html";
    }

    if (footerPrimary) {
      footerPrimary.innerHTML = '<span data-icon="home" data-size="16"></span>Open dashboard';
      footerPrimary.href = "index.html";
    }

    if (ctaSecondary) {
      ctaSecondary.textContent = "Sign out";
      ctaSecondary.href = "#";
      ctaSecondary.onclick = async (event) => {
        event.preventDefault();
        await signOut("landing.html");
      };
    }

    if (window.initPIHIcons) window.initPIHIcons();
  }

  function getNextDestination() {
    const next = new URLSearchParams(window.location.search).get("next");
    if (!next || !next.startsWith("/")) return "index.html";
    return next.replace(/^\//, "") || "index.html";
  }

  return {
    request,
    getSession,
    getAuthConfig,
    getDisplayName,
    getFirstName,
    signOut,
    requireAuth,
    redirectIfAuthenticated,
    updateLandingLinks,
    decorateProtectedNav,
    getNextDestination,
  };
})();

window.PIHAuth = PIHAuth;
