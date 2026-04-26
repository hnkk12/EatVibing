import { useState } from "react";
import { Search, User, Menu, X } from "lucide-react";
import Logo from "./logo";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/chat", label: "AI Assistance" },
    { to: "/guide", label: "Guideline" },
    { to: "/rcm-page", label: "Community" },
  ];

  return (
    <nav className="relative z-50">
      {/* Main bar */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6">
        <Logo />

        {/* Desktop links */}
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

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 w-48 transition-all duration-300 hover:w-56"
            />
          </div>
          <Link
            to="/profile"
            className="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <User className="w-5 h-5 text-zinc-900" />
          </Link>
        </div>

        {/* Mobile right */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/profile"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-200"
          >
            <User className="w-4 h-4 text-zinc-900" />
          </Link>
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

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#F7F7F7] border-b border-zinc-200 px-4 pb-4 flex flex-col gap-1">
          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>
          {/* Links */}
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setIsOpen(false)}
              className="py-3 px-2 text-zinc-500 hover:text-zinc-900 font-medium text-sm border-b border-zinc-100 last:border-0 transition-colors"
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
