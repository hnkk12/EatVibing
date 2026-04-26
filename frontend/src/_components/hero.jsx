import { Asterisk } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <div className="relative flex-1 flex flex-col justify-center px-6 md:px-16 pb-10 md:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl"
      >
        <h1 className="font-display text-5xl md:text-8xl font-bold leading-[0.9] md:leading-[0.88] tracking-tighter text-zinc-900 mb-8 md:mb-12">
          Deliciously <br />
          effortless
          <br />
          dining
        </h1>

        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-base md:text-xl font-normal text-zinc-500 mb-8 md:mb-10 leading-relaxed max-w-lg"
        >
          Personalized meal plans and smart restaurant picks{" "}
          <span className="text-zinc-900 font-medium">powered by AI.</span>
        </motion.h3>

        <Link to="/chat">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="inline-flex items-center gap-3 px-5 md:px-6 py-3 md:py-4 bg-white rounded-full shadow-sm border border-zinc-100 cursor-pointer hover:shadow-md transition-shadow duration-300"
          >
            <div className="bg-zinc-900 p-1 rounded-full">
              <Asterisk className="w-4 h-4 text-white" />
            </div>
            <span className="text-base md:text-xl font-medium tracking-tight text-zinc-900">
              Try AI Suggestion
            </span>
          </motion.div>
        </Link>
      </motion.div>

      {/* img - ẩn trên mobile */}
      <div className="hidden md:flex absolute right-0 bottom-0 top-0 w-1/2 items-end justify-center pointer-events-none overflow-hidden select-none">
        <motion.img />
      </div>
    </div>
  );
};

export default Hero;
