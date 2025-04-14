// Animation pour les avatars des joueurs
document.addEventListener('DOMContentLoaded', function() {
    // Animation au survol des avatars
    document.querySelectorAll('.player-avatar').forEach(avatar => {
        avatar.addEventListener('mouseover', () => {
            avatar.style.transform = 'rotateY(180deg)';
        });
        
        avatar.addEventListener('mouseout', () => {
            avatar.style.transform = 'rotateY(0)';
        });
    });
    
    // Animation au survol des lignes de joueurs
    document.querySelectorAll('.player-item').forEach(item => {
        item.addEventListener('mouseover', () => {
            const avatar = item.querySelector('.player-avatar');
            avatar.style.background = 'var(--primary)';
            avatar.style.color = 'var(--dark)';
        });
        
        item.addEventListener('mouseout', () => {
            const avatar = item.querySelector('.player-avatar');
            if (!item.classList.contains('no-players')) {
                avatar.style.background = 'rgba(0, 230, 118, 0.1)';
                avatar.style.color = 'var(--primary)';
            } else {
                avatar.style.background = 'rgba(255, 255, 255, 0.1)';
                avatar.style.color = 'rgba(255, 255, 255, 0.7)';
            }
        });
    });
    
    // Effet léger de pulsation pour l'icône
    const playersIcon = document.querySelector('.players-icon');
    if (playersIcon) {
        setInterval(() => {
            playersIcon.style.transform = 'scale(1.05)';
            setTimeout(() => {
                playersIcon.style.transform = 'scale(1)';
            }, 500);
        }, 3000);
    }
});

// Fonction pour rafraîchir automatiquement la liste des joueurs toutes les 60 secondes
function refreshPlayerList() {
    const refreshInterval = 60000; // 60 secondes
    
    setInterval(() => {
        fetch(window.location.href)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newPlayerList = doc.querySelector('.player-list');
                
                if (newPlayerList) {
                    document.querySelector('.player-list').innerHTML = newPlayerList.innerHTML;
                }
            })
            .catch(error => {
                console.error('Erreur lors du rafraîchissement de la liste des joueurs:', error);
            });
    }, refreshInterval);
}

// Lancer le rafraîchissement automatique
refreshPlayerList();