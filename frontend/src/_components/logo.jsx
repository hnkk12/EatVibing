import { Link } from "react-router-dom";

function Logo() {
  return (
    <Link to="/" className="cursor-pointer group inline-block">
      <div className="flex flex-col gap-1 mb-1">
        <div className="h-1 w-6 bg-white rounded-full group-hover:w-4 transition-all duration-300"></div>
        <div className="h-1 w-4 bg-[#b4eb77] rounded-full group-hover:w-6 transition-all duration-300"></div>
        <div className="h-1 w-6 bg-white rounded-full group-hover:w-4 transition-all duration-300"></div>
      </div>
      <span className="font-bold text-xl tracking-tight text-white">
        EatVibing
      </span>
    </Link>
  );
}

export default Logo;
