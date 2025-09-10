export default function Footer() {
    return (
        <footer className="relative overflow-hidden">
            {/* Top Transition Bar - matches ProductsHero */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 py-8 border-b-4 border-black">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center items-center space-x-8 text-white font-bold text-lg">
                        <span className="flex items-center hover:scale-105 transition-transform duration-200">
                            <span className="w-4 h-4 bg-lime-400 rounded-full mr-2 animate-pulse"></span>
                            SUPPORT
                        </span>
                        <span className="flex items-center hover:scale-105 transition-transform duration-200">
                            <span className="w-4 h-4 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                            CREATIVITY
                        </span>
                        <span className="flex items-center hover:scale-105 transition-transform duration-200">
                            <span className="w-4 h-4 bg-pink-400 rounded-full mr-2 animate-pulse"></span>
                            FLAIR
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Footer Area - lime gradient, decorative shapes */}
            <div className="relative bg-gradient-to-r from-lime-400 to-lime-300 py-16 px-4">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-6 left-10 text-6xl opacity-80 animate-pulse select-none">
                        🌈
                    </div>
                    <div className="absolute top-10 right-12 text-4xl opacity-80 animate-bounce select-none">
                        ⭐
                    </div>
                    <div className="absolute bottom-12 left-1/4 text-3xl opacity-80 animate-pulse select-none">
                        ✨
                    </div>
                    <div className="absolute top-12 left-8 w-20 h-20 bg-pink-400 rounded-full opacity-30"></div>
                    <div className="absolute bottom-10 right-10 w-16 h-16 bg-purple-400 rounded-full opacity-30"></div>
                    <div className="absolute top-1/2 right-20 w-12 h-12 bg-yellow-400 rotate-45 opacity-30"></div>
                </div>

                <div className="container mx-auto relative z-10">
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-10 border-4 border-black shadow-xl transform -rotate-1">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-black">
                            <div>
                                <h3 className="text-2xl font-black mb-4 tracking-tight inline-block bg-white px-3 py-1 border-4 border-black shadow-md transform -rotate-2">
                                    FLAIR
                                </h3>
                                <p className="text-gray-800 font-medium">
                                    Creating custom products that bring your
                                    dreams to life.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-extrabold mb-4">
                                    Quick Links
                                </h3>
                                <ul className="flex flex-col gap-2">
                                    <li>
                                        <a
                                            href="#"
                                            className="inline-block text-black font-semibold hover:rotate-1 hover:scale-105 transition-transform duration-200"
                                        >
                                            Home
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="inline-block text-black font-semibold hover:-rotate-1 hover:scale-105 transition-transform duration-200"
                                        >
                                            Products
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="inline-block text-black font-semibold hover:rotate-1 hover:scale-105 transition-transform duration-200"
                                        >
                                            About Us
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="inline-block text-black font-semibold hover:-rotate-1 hover:scale-105 transition-transform duration-200"
                                        >
                                            Contact
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-extrabold mb-4">
                                    Contact Us
                                </h3>
                                <address className="not-italic text-black font-medium">
                                    <p>Level 1, 457 Elizabeth St</p>
                                    <p>Surry Hills, NSW, 2010</p>
                                    <p>Australia</p>
                                    <p>+61 466063046</p>
                                    <p className="mt-2">halolifezz@gmail.com</p>
                                </address>
                            </div>
                        </div>

                        <div className="border-t-4 border-black mt-8 pt-6 text-center text-black">
                            <p className="font-semibold">
                                &copy; {new Date().getFullYear()} Flair · Made
                                with ❤️
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
