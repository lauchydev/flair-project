"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCartIcon, UserIcon } from "@heroicons/react/24/outline";

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
                  href="/"
                  className={`text-gray-800 hover:text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-md font-medium ${
                    pathname === "/" ? "bg-gray-100" : ""
                  }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className={`text-gray-800 hover:text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-md font-medium ${
                    pathname === "/products" ? "bg-gray-100" : ""
                  }`}
                >
                  Products
                </Link>
              </li>
            </ul>
          </nav>

          {/* Auth Buttons */}
          <div className="flex gap-4">
            {/* Shopping Cart */}
            <Link href="/cart">
              <ShoppingCartIcon className="w-6 h-6 text-black" />
            </Link>

            {/* User Icon */}
          <Link href="/login">
            <UserIcon className="w-6 h-6 text-black hover:text-gray-700" />
          </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
