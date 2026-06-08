<template>
  <div class="flex min-h-screen">
    <div class="flex-1 flex items-center justify-center p-8 bg-dark">
      <router-view />
    </div>
    <div class="flex-1 flex items-center justify-center p-12 bg-gradient-to-br from-red-600 to-red-700 text-white max-md:hidden">
      <div class="max-w-sm">
        <h1 class="text-4xl font-bold mb-3">GudangVisa</h1>
        <p class="text-lg opacity-90 leading-relaxed mb-10">
          Streamlined document tracking for VISA, KITAS & Passport processing.
        </p>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3 text-[15px] opacity-90">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>Real-time status tracking</span>
          </div>
          <div class="flex items-center gap-3 text-[15px] opacity-90">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>Secure document storage</span>
          </div>
          <div class="flex items-center gap-3 text-[15px] opacity-90">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Role-based access control</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
