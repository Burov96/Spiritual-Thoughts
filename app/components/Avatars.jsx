export default function Avatar({ src }) {
    return <img src={src || "/default-avatar.png"} alt="User Avatar" className="w-12 h-12 rounded-full" />
  }
  