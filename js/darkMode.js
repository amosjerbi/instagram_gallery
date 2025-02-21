document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.querySelector('.menu-toggle');
    const root = document.documentElement;
    
    // Debug log
    console.log('Dark mode script loaded');
    console.log('Toggle button found:', toggleButton !== null);

    if (!toggleButton) {
        console.error('Menu toggle button not found!');
        return;
    }

    // Function to update theme
    const updateTheme = (isDark) => {
        if (isDark) {
            root.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'enabled');
            toggleButton.classList.add('dark-mode');
        } else {
            root.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'disabled');
            toggleButton.classList.remove('dark-mode');
        }
    };

    // Check for saved user preference
    const darkMode = localStorage.getItem('darkMode');
    console.log('Saved dark mode preference:', darkMode);
    
    // Set initial state
    if (darkMode === 'enabled') {
        updateTheme(true);
    }

    // Handle click events
    toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Toggle button clicked');
        
        const currentTheme = root.getAttribute('data-theme');
        const isDark = currentTheme !== 'dark';
        
        console.log('Switching to:', isDark ? 'dark' : 'light', 'mode');
        updateTheme(isDark);
    });
});
