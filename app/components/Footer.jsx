// app/components/Footer.jsx
"use client";

export default function Footer() {
  return (
    <footer className="rounded-md w-full bg-gray-800 text-white p-4 text-center">
      <p>&copy; {new Date().getFullYear()} Spiritual Thoughts. All rights reserved.</p>
    </footer>
  );
}
