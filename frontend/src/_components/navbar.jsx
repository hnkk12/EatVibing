import { useEffect, useState } from "react";
import { Search, User, Menu, X, LogOut } from "lucide-react";
import Logo from "./logo";
import { Link, redirect } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(null); //state archieves data user

  //session management
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    //listening sign in/log out status
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") setUser(session?.user);
        if (event === "SIGNED_OUT") setUser(null);
      },
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  // logic đăng nhập Google
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };
  //logic logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
  };

  const links = [
    { to: "/", label: "Home" },
    { to: "/chat", label: "AI Assistance" },
    { to: "/guide", label: "Guideline" },
    { to: "/rcm-page", label: "Community" },
  ];

  return (
    <nav className="relative z-50 bg-white">
      <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6">
        <Logo />

        <div className="hidden md:flex items-center gap-6 text-zinc-400">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-zinc-900 transition-colors text-sm font-medium"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 w-48 transition-all duration-300 hover:w-56"
            />
          </div>

          {/* User Menu Desktop */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              {user ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-5 h-5 text-zinc-900" />
              )}
            </button>

            {/* DROPDOWN CHỈ HIỆN SIGN IN WITH GOOGLE */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 flex flex-col z-50 animate-in fade-in zoom-in duration-200">
                <p className="px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  {user ? `Welcome,${user.user_metadata.full_name}` : "Account"}
                </p>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm font-semibold text-red-500 transition-colors rounded-xl"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 text-sm font-semibold text-zinc-700 transition-colors border border-zinc-100 rounded-xl"
                  >
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google"
                      className="w-4 h-4"
                    />
                    Sign in with Google
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200"
          >
            <User className="w-4 h-4 text-zinc-900" />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200"
          >
            {isOpen ? (
              <X className="w-4 h-4 text-zinc-900" />
            ) : (
              <Menu className="w-4 h-4 text-zinc-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile User Menu */}
      {showUserMenu && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-zinc-200 p-4 flex flex-col shadow-lg">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 px-4 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center gap-3 font-bold text-zinc-700 active:scale-[0.98] transition-transform"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>
        </div>
      )}
      {/* Mobile Nav Links (Hamburger menu) */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#F7F7F7] border-b border-zinc-200 px-4 pb-4 flex flex-col gap-1">
          <div className="relative mb-2 mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-sm focus:outline-none"
            />
          </div>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setIsOpen(false)}
              className="py-3 px-2 text-zinc-500 font-medium text-sm border-b border-zinc-100 last:border-0"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
