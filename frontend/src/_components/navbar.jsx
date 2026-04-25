import {
  Home,
  Brain,
  BookOpen,
  NotepadText,
  User,
  Asterisk,
  Layout,
  Search,
} from "lucide-react";
import Logo from "./logo";
import { Link } from "react-router-dom";
const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-8 py-6">
      {/* Logo */}
      <Logo />
      {/* Center Icons */}
      <div className="hidden md:flex items-center gap-6 text-zinc-400">
        <Link to="/" className="hover:text-zinc-900 transition-colors">
          <Home className="w-5 h-5 cursor-pointer " />
        </Link>
        <Link to="/chat" className="hover:text-zinc-900 transition-colors">
          <Brain className="w-5 h-5 cursor-pointer " />
        </Link>
        <Link to="/guide" className="hover:text-zinc-900 transition-colors">
          <BookOpen className="w-5 h-5 cursor-pointer" />
        </Link>
        <Link to="rcm-page" className="hover:text-zinc-900 transition-colors">
          <NotepadText className="w-5 h-5 cursor-pointer " />
        </Link>
      </div>
      {/* Search & Profile */}
      <div className="flex items-center gap-2 md:-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-sm font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 w-48 transition-all duration-300 group-hover:w-56"
          />
        </div>
        <Link
          to="/profile"
          className="w-10 h-10 flex items-center justify-center rounded-full border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors"
        >
          <User className="w-5 h-5 text-zinc-900" />
        </Link>
      </div>
    </nav>
  );
};
export default Navbar;
