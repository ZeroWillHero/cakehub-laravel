<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'CakeHub') }}</title>
    <script>
        (function () {
            try {
                var stored = localStorage.getItem('cakehub-theme');
                var theme = stored === 'light' || stored === 'dark'
                    ? stored
                    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', theme === 'dark');
            } catch (e) {}
        })();
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="antialiased">
    {{-- First-load splash: shown only until the JS bundle boots (removed in app.tsx), so slow phones see a friendly loader instead of a blank page. --}}
    <div id="app-splash" role="status" aria-label="Loading CakeHub" style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:system-ui,sans-serif;background:var(--background,#fff);color:var(--muted-foreground,#71717a);z-index:100">
        <div style="width:40px;height:40px;border-radius:9999px;border:4px solid rgba(239,136,173,.25);border-top-color:#EF88AD;animation:app-splash-spin .8s linear infinite"></div>
        <div style="font-size:14px">Loading CakeHub…</div>
        <style>@keyframes app-splash-spin{to{transform:rotate(360deg)}}html.dark #app-splash{background:#09090b!important;color:#a1a1aa!important}</style>
    </div>
    @inertia
</body>
</html>
