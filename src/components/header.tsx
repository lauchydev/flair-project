"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-black">
            <Link href="/">Flair</Link>
          </div>

          {/* Centered Navigation */}
          <nav className="hidden md:block absolute left-1/2 -translate-x-1/2">
            <ul className="flex gap-8">
              <li>
                <Link
                  href="/home"
                  className={`text-gray-800 hover:text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-md font-medium ${
                    pathname === "/home" ? "bg-gray-100" : ""
                  }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className={`text-gray-800 hover:text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-md font-medium ${
                    pathname === "/" ? "bg-gray-100" : ""
                  }`}
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/landing"
                  className={`text-gray-800 hover:text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-md font-medium ${
                    pathname === "/landing" ? "bg-gray-100" : ""
                  }`}
                >
                  Landing Page
                </Link>
              </li>
            </ul>
          </nav>

          {/* Auth Buttons */}
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
