export default function Footer() {
  return (
    <footer className="bg-yellow-300 text-black py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Flair</h3>
            <p className="text-black">
              Creating custom products that bring your dreams to life.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <a href="#" className="text-black hover:text-black">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="text-black hover:text-black">
                  Products
                </a>
              </li>
              <li>
                <a href="#" className="text-black hover:text-black">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-black hover:text-black">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <address className="not-italic text-black">
              <p>Level 1, 457 Elizabeth St</p>
              <p>Surry Hills, NSW, 2010</p>
              <p>Australia</p>
              <p>+61 466063046</p>
              <p className="mt-2">halolifezz@gmail.com</p>
            </address>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-black">
          <p>&copy; {new Date().getFullYear()} Flair. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
