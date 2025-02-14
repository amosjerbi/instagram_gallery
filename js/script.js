document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu functionality
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    // Mobile menu toggle
    document.querySelector('.menu-toggle').addEventListener('click', function() {
        document.querySelector('.nav-links').classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        const navLinks = document.querySelector('.nav-links');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (!event.target.closest('.nav-content') && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    });

    // Close mobile menu when window is resized above mobile breakpoint
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && navLinks?.classList.contains('active')) {
            navLinks.classList.remove('active');
            menuToggle.textContent = '•';
        }
    });

    // Layout switching functionality
    const layoutButtons = document.querySelectorAll('.layout-btn');
    layoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            layoutButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const layout = button.dataset.layout;
            if (layout) {
                updateLayout(layout);
            }
        });
    });

    function updateLayout(layout) {
        const gridContainer = document.querySelector('.grid-container');
        if (!gridContainer) return;
        
        switch(layout) {
            case 'grid':
                gridContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
                break;
            case 'masonry':
                gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
                break;
            case 'list':
                gridContainer.style.gridTemplateColumns = '1fr';
                break;
        }
    }

    // Share button functionality
    const shareButton = document.querySelector('.share-btn');
    shareButton?.addEventListener('click', async () => {
        try {
            await navigator.share({
                title: 'Gallery Layouts',
                text: 'Check out these amazing photos!',
                url: window.location.href
            });
        } catch (err) {
            console.log('Share failed:', err);
        }
    });

    // Back button functionality
    const backButton = document.querySelector('.back-btn');
    backButton?.addEventListener('click', () => {
        window.history.back();
    });

    // Contact button functionality
    const contactBtn = document.querySelector('.contact-btn');
    contactBtn?.addEventListener('click', () => {
        // Add contact form functionality here
        console.log('Contact button clicked');
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const id = this.getAttribute('href').substring(1);
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Smooth scrolling and image animations
    const rightColumn = document.querySelector('.right-column');
    const galleryImages = document.querySelectorAll('.gallery-image');
    
    // Initialize Intersection Observer for image animations
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        root: rightColumn,
        threshold: 0.1
    });

    // Observe each gallery image
    galleryImages.forEach(image => {
        imageObserver.observe(image);
    });

    // Smooth scroll handling
    let lastScrollTop = 0;
    let ticking = false;

    if (rightColumn) {
        rightColumn.addEventListener('scroll', function() {
            lastScrollTop = rightColumn.scrollTop;
            
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    // Add any additional scroll-based animations here if needed
                    ticking = false;
                });
                
                ticking = true;
            }
        });
    }
});
