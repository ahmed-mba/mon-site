// main.js - Version SIMPLIFIÉE ET SÛRE

document.addEventListener('DOMContentLoaded', function() {
    // Gestion du menu mobile
    initMobileMenu();
    
    // Gestion des animations au défilement
    initScrollAnimations();
});

function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
}

function initScrollAnimations() {
    const sections = document.querySelectorAll('section');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        sections.forEach(section => {
            section.classList.add('fade-section');
            observer.observe(section);
        });
    }
}

// Styles pour les animations
const style = document.createElement('style');
style.textContent = `
    .fade-section { opacity: 0; transform: translateY(20px); transition: all 0.6s ease; }
    .fade-section.fade-in { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(style);