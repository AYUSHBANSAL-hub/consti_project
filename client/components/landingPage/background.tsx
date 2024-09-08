export default function Background({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full h-screen bg-gray-100">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Big Circle */}
        <div className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-blue-500/20 rounded-full"></div>

        {/* Dots Grid */}
        <div className="absolute left-1/3 transform -translate-x-[80%] top-1/2 grid grid-cols-11 gap-3">
          {Array.from({ length: 44 }).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 bg-blue-500/25 rounded-full"
            ></div>
          ))}
        </div>
        {/* Dots Grid */}
        <div className="absolute left-3/4 transform -translate-x-[80%] top-1/3 grid grid-cols-8 gap-3">
          {Array.from({ length: 40 }).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 bg-blue-500/25 rounded-full"
            ></div>
          ))}
        </div>
        <div className="absolute top-1/4 -right-32 w-[300px] h-[300px] border-4 border-purple-500/35 rounded-full"></div>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
