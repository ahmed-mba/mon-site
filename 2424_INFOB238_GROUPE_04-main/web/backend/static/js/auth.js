// auth.js - Version corrigée pour fonctionner avec l'API FastAPI

document.addEventListener('DOMContentLoaded', function() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');

    if (!loginTab || !registerTab || !loginForm || !registerForm) return;

    // Gestion des onglets
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });
    
    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    // Logique de connexion
    if (loginButton) {
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: new URLSearchParams({ username: email, password: password })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // --- AJOUT DE DEBUG ---
                console.log("Données reçues après connexion:", data);
                // --------------------
        
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('userName', data.user_name);
                localStorage.setItem('userEmail', data.user_email);
                
                // --- AJOUT DE DEBUG ---
                console.log("userName sauvegardé:", localStorage.getItem('userName'));
                // --------------------
        
                alert('Connexion réussie !');
                window.location.href = '/';
            } else {
                alert('Email ou mot de passe incorrect.');
            }
        });
    }

    // Logique d'inscription
    if (registerButton) {
        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            // CORRECTION: URL de l'API correcte
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ name, email, password })
            });

            if (response.ok) {
                alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
                window.location.reload(); // Recharger la page pour passer à l'onglet de connexion
            } else {
                const errorData = await response.json();
                alert(`Erreur d'inscription: ${errorData.detail}`);
            }
        });
    }
});