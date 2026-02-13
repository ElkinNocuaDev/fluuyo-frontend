import logo from "../assets/fluuyo-logo-web-outlines.svg";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="bg-aurora flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-xl flex items-center justify-center">
              <span className="text-lg font-black tracking-tight">
                <img
                  src={logo}
                  alt="Fluuyo"
                  className="h-10 w-auto"
                  loading="eager"
                />
              </span>
            </div>
            <div className="text-left">
              <div className="text-2xl font-extrabold tracking-tight leading-none">
                fluuyo
              </div>
              <div className="text-xs text-slate-300">
                Friendly Finance
              </div>
            </div>
          </div>

          <div className="mx-auto mt-3 w-fit badge">
            Crédito rápido • Transparente • Seguro
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
          )}
        </div>

        {/* Card */}
        <div className="card-glass p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="mt-5 text-center text-sm text-slate-300">
            {footer}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Fluuyo • Hecho para LatAm
        </div>
      </div>
    </div>
  );
}
