import logo from "../assets/fluuyo-logo-web-outlines.svg";

export default function Logo({ className = "h-10 w-auto" }) {
  return <img src={logo} alt="Fluuyo" className={className} />;
}