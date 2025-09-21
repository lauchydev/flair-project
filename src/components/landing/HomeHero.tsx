export default function HomeHeroGreen() {
  return (
    <div className="relative overflow-hidden">
      {/* Lime Green Background */}
      <div className="bg-gradient-to-r from-lime-400 to-lime-300 py-16 px-4">
        <div className="container mx-auto text-center relative z-10">
          {/* keep or remove the decorative emojis */}
          <h1 className="text-6xl font-black text-black mb-6 tracking-tight">
          <span className="transform -rotate-2 bg-white px-4 py-2 inline-block shadow-lg border-4 border-black">
            FLAIR
          </span>
          <span className="transform rotate-1 bg-purple-500 text-white px-4 py-2 inline-block shadow-lg border-4 border-black mt-4">
            HOME
          </span>
          </h1>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 max-w-2xl mx-auto border-4 border-black shadow-xl transform -rotate-1">
            <p className="text-xl text-black font-bold">
              🎨 Customise • ✨ Create • 🌟 Express
            </p>
            <p className="text-gray-800 mt-2 font-medium">
              Make every product uniquely yours with our creative tools!
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-pink-400 rounded-full opacity-40" />
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-purple-400 rounded-full opacity-40" />
          <div className="absolute top-1/2 left-20 w-12 h-12 bg-yellow-400 transform rotate-45 opacity-40" />
        </div>
      </div>

      {/* Purple Transition – keep if you want to match products page */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center space-x-8 text-white font-bold text-lg">
            <span className="flex items-center"><span className="w-4 h-4 bg-lime-400 rounded-full mr-2 animate-pulse" />QUALITY</span>
            <span className="flex items-center"><span className="w-4 h-4 bg-yellow-400 rounded-full mr-2 animate-pulse" />CREATIVITY</span>
            <span className="flex items-center"><span className="w-4 h-4 bg-pink-400 rounded-full mr-2 animate-pulse" />FLAIR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
