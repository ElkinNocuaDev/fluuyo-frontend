import logo from "../assets/fluuyo-logo-web-outlines.svg";
import { useNavigate } from "react-router-dom";

export default function AppLayout({ children }) {
  const nav = useNavigate();

  return (
    <div className="bg-aurora min-h-screen text-white">
      
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => nav("/app")}
          >
            <img src={logo} alt="Fluuyo" className="h-8" />
            <span className="font-bold text-lg">fluuyo</span>
          </div>

          <div className="text-sm text-white/70">
            Mi cuenta
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
