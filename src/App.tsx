import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AdminAuthProvider, RequireAdmin } from "./lib/adminAuth";

// Route-level code splitting keeps Stripe.js and the donation page out of the
// initial download for visitors who only came to read about the band.
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Instruments = lazy(() => import("./pages/Instruments"));
const Donate = lazy(() => import("./pages/Donate"));
const Legal = lazy(() => import("./pages/Legal"));
const NotFound = lazy(() => import("./pages/NotFound"));
const IndexPage = lazy(() => import("./pages/IndexPage"));
const DetailPage = lazy(() => import("./pages/DetailPage"));
const Stories = lazy(() => import("./pages/Stories"));
const StoryDetail = lazy(() => import("./pages/StoryDetail"));
const StorySubmit = lazy(() => import("./pages/StorySubmit"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() =>
  import("./pages/AdminAuth").then((module) => ({ default: module.AdminLoginPage })),
);
const AdminForgotPassword = lazy(() =>
  import("./pages/AdminAuth").then((module) => ({ default: module.AdminForgotPasswordPage })),
);
const AdminResetPassword = lazy(() =>
  import("./pages/AdminAuth").then((module) => ({ default: module.AdminResetPasswordPage })),
);

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    // CMS pages load asynchronously, so the target section may not exist on the
    // first frame after navigation. Keep checking briefly, then give up quietly.
    const id = decodeURIComponent(hash.slice(1));
    let attempts = 0;
    let timer: number | undefined;

    const scrollToTarget = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: "start" });
        return;
      }

      if (attempts < 20) {
        attempts += 1;
        timer = window.setTimeout(scrollToTarget, 100);
      }
    };

    scrollToTarget();
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}

function PageLoading() {
  return (
    <div className="band bg-paper" role="status">
      <div className="mx-auto w-full max-w-6xl px-5 py-24">
        <span className="sr-only">Loading page</span>
        <div className="h-8 w-56 rounded-full bg-surface" />
      </div>
    </div>
  );
}

function PublicLayout() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brass-bright focus:px-4 focus:py-2 focus:font-bold focus:text-night-950"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AdminAuthProvider>
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/performances" element={<IndexPage />} />
              <Route path="/schedule" element={<IndexPage />} />
              <Route path="/detail/:id" element={<DetailPage />} />
              <Route path="/instruments" element={<Instruments />} />
              <Route path="/about" element={<About />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/stories/submit" element={<StorySubmit />} />
              <Route path="/stories/:slug" element={<StoryDetail />} />
              <Route path="/blog" element={<Navigate to="/stories" replace />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/privacy" element={<Legal slug="privacy" />} />
              <Route path="/terms" element={<Legal slug="terms" />} />
              <Route path="/accessibility" element={<Legal slug="accessibility" />} />
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminDashboard />
                </RequireAdmin>
              }
            />
          </Routes>
        </Suspense>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
