import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { applyTheme, type Theme } from '@/lib/theme';

/** Toggles the `.dark` class (set synchronously in app.blade.php before paint). */
export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>('light');

    useEffect(() => {
        setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }, []);

    function toggle() {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        applyTheme(next);
    }

    return (
        <Button type="button" variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
            {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
    );
}
