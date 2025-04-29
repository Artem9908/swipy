import Image from 'next/image';

export default function AppScreenshot() {
  return (
    <div className="relative w-full h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Phone frame */}
      <div className="absolute inset-0 border-8 border-[#333333] rounded-[2rem] overflow-hidden">
        {/* Status bar */}
        <div className="h-8 bg-[#333333] flex items-center justify-between px-4">
          <span className="text-white text-sm">9:41</span>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">📶</span>
            <span className="text-white text-sm">📡</span>
            <span className="text-white text-sm">🔋</span>
          </div>
        </div>

        {/* App content */}
        <div className="h-[calc(100%-2rem)] bg-white">
          {/* Header */}
          <div className="h-16 bg-white border-b border-[#f0f0f0] flex items-center justify-between px-4">
            <h1 className="text-xl font-bold text-[#333333]">Discover</h1>
            <button className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <span className="text-[#4CAF50]">⚙️</span>
            </button>
          </div>

          {/* Restaurant cards */}
          <div className="p-4 space-y-4">
            {/* Card 1 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative h-48">
                <Image
                  src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Sushi Master"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">Sushi Master</h3>
                  <p className="text-sm">Japanese • 4.8 ★</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                      <span className="text-[#4CAF50]">✕</span>
                    </button>
                    <button className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                      <span className="text-[#4CAF50]">♥</span>
                    </button>
                  </div>
                  <button className="px-4 py-2 bg-[#4CAF50] text-white rounded-full text-sm font-semibold">
                    View Details
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative h-48">
                <Image
                  src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="Pasta Paradise"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">Pasta Paradise</h3>
                  <p className="text-sm">Italian • 4.6 ★</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <button className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                      <span className="text-[#4CAF50]">✕</span>
                    </button>
                    <button className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                      <span className="text-[#4CAF50]">♥</span>
                    </button>
                  </div>
                  <button className="px-4 py-2 bg-[#4CAF50] text-white rounded-full text-sm font-semibold">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 