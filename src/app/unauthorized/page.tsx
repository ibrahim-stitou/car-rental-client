// app/unauthorized/page.tsx
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function UnauthorizedPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 left-2/3 w-80 h-80 bg-blue-400 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/6 w-72 h-72 bg-pink-400 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-400 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIuMDUiLz48cGF0aCBkPSJNMCAwaDMwdjMwSDB6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIuMDUiLz48cGF0aCBkPSJNMzAgMGgzMHYzMEgzMHoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjxwYXRoIGQ9Ik0wIDMwaDMwdjMwSDB6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIuMDUiLz48L2c+PC9zdmc+')]"></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full mx-auto">
        {/* Main content container */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header section with "403" */}
          <div className="relative h-32 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex items-center">
              <span className="text-8xl font-black tracking-tighter text-white">4</span>
              <div className="mx-2 relative">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center animate-spin">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0V7m0 2h2m-2 0H9" />
                    </svg>
                  </div>
                </div>
              </div>
              <span className="text-8xl font-black tracking-tighter text-white">3</span>
            </div>

            {/* Decorative elements */}
            <div className="absolute -left-6 -bottom-6 w-12 h-12 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="absolute right-12 top-6 w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="absolute right-20 bottom-8 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          </div>

          {/* Content section */}
          <div className="p-8 md:p-12">
            <h1 className="text-4xl font-extrabold text-white text-center mb-4">Access Denied</h1>

            <div className="mb-8 space-y-6">
                <p className={"text-white/90 text-xl text-center"}>
                Looks like you&apos;ve tried to enter a restricted area of Inginuity-Talent.
                </p>

              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-lg blur opacity-25"></div>
                <div className="relative bg-black/30 backdrop-blur-sm p-6 rounded-lg border border-white/10">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Why am I seeing this?</h2>
                  </div>
                    <p className={"text-white/80"}>
                    You do not have the necessary permissions to access this resource. If you believe this is an error, please contact your administrator or our support team.
                    </p>
                </div>
              </div>

              {/* Progress bar with keyframe animation */}
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 animate-[shimmer_2s_ease-in-out_infinite]"></div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="group px-8 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Return to Homepage
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-black/30 backdrop-blur-sm border-t border-white/10">
            <div className="flex justify-between items-center">
              <p className="text-white/60 text-sm">
                © {year} Inginuity-Talent
              </p>
              <div className="flex space-x-2">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}