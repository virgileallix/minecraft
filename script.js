document.addEventListener('DOMContentLoaded', function() {
    // Sélection de l'élément qui contiendra la liste des joueurs
    const playerList = document.getElementById('player-list');
    
    // URL de l'API (notez que cela pourrait être bloqué par CORS)
    const apiUrl = 'https://panel.omgserv.com/json/447820/players';
    
    // Fonction pour charger les joueurs
    function loadPlayers() {
        // Ajouter l'état de chargement
        playerList.innerHTML = `
            <li class="player-item loading">
                <div class="player-avatar">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="player-info">
                    <div class="player-name">Chargement...</div>
                    <div class="player-status">Récupération des joueurs en ligne</div>
                </div>
            </li>
        `;
        
        // Utiliser un proxy CORS pour contourner les limitations CORS
        // Remarque: Il y a plusieurs services de proxy CORS, celui-ci est juste un exemple
        const corsProxyUrl = 'https://corsproxy.io/?';
        
        // Faire la requête à l'API via le proxy CORS
        fetch(corsProxyUrl + encodeURIComponent(apiUrl))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erreur réseau lors de la récupération des données');
                }
                return response.json();
            })
            .then(data => {
                // Vider la liste des joueurs
                playerList.innerHTML = '';
                
                // Vérifier si des joueurs sont connectés
                if (!data.players || data.players.length === 0) {
                    // Aucun joueur connecté
                    playerList.innerHTML = `
                        <li class="player-item no-players">
                            <div class="player-avatar">?</div>
                            <div class="player-info">
                                <div class="player-name">Aucun joueur connecté</div>
                                <div class="player-status">Soyez le premier à rejoindre !</div>
                            </div>
                        </li>
                    `;
                } else {
                    // Afficher chaque joueur
                    data.players.forEach(player => {
                        // Récupérer la première lettre du pseudo
                        const firstLetter = player.charAt(0).toUpperCase();
                        
                        // Créer l'élément pour le joueur
                        const playerItem = document.createElement('li');
                        playerItem.className = 'player-item';
                        playerItem.innerHTML = `
                            <div class="player-avatar">${firstLetter}</div>
                            <div class="player-info">
                                <div class="player-name">${player}</div>
                                <div class="player-status">En ligne</div>
                            </div>
                        `;
                        
                        // Ajouter le joueur à la liste
                        playerList.appendChild(playerItem);
                    });
                }
                
                // Ajouter les événements de survol
                addHoverEvents();
            })
            .catch(error => {
                console.error('Erreur:', error);
                
                // Afficher un message d'erreur
                playerList.innerHTML = `
                    <li class="player-item error-state">
                        <div class="player-avatar">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="player-info">
                            <div class="player-name">Erreur de chargement</div>
                            <div class="player-status">Impossible de récupérer les joueurs</div>
                        </div>
                    </li>
                `;
                
                // Alternative: utiliser des données de test en cas d'erreur
                // simulatePlayersData();
            });
    }
    
    // Fonction pour simuler des données de joueurs (à utiliser si l'API ne fonctionne pas)
    function simulatePlayersData() {
        console.log("Utilisation de données simulées car l'API n'est pas accessible");
        
        // Données de test
        const testData = {
            players: ["Player1", "MinecraftFan", "BTSSIOStudent"]
        };
        
        // Vider la liste
        playerList.innerHTML = '';
        
        // Afficher les joueurs simulés
        testData.players.forEach(player => {
            const firstLetter = player.charAt(0).toUpperCase();
            
            const playerItem = document.createElement('li');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <div class="player-avatar">${firstLetter}</div>
                <div class="player-info">
                    <div class="player-name">${player}</div>
                    <div class="player-status">En ligne (simulé)</div>
                </div>
            `;
            
            playerList.appendChild(playerItem);
        });
        
        // Ajouter les événements de survol
        addHoverEvents();
    }
    
    // Fonction pour ajouter les événements de survol
    function addHoverEvents() {
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
            if (!item.classList.contains('loading') && !item.classList.contains('error-state')) {
                item.addEventListener('mouseover', () => {
                    const avatar = item.querySelector('.player-avatar');
                    if (avatar) {
                        avatar.style.background = 'var(--primary)';
                        avatar.style.color = 'var(--dark)';
                    }
                });
                
                item.addEventListener('mouseout', () => {
                    const avatar = item.querySelector('.player-avatar');
                    if (avatar) {
                        if (!item.classList.contains('no-players')) {
                            avatar.style.background = 'rgba(0, 230, 118, 0.1)';
                            avatar.style.color = 'var(--primary)';
                        } else {
                            avatar.style.background = 'rgba(255, 255, 255, 0.1)';
                            avatar.style.color = 'rgba(255, 255, 255, 0.7)';
                        }
                    }
                });
            }
        });
    }
    
    // Ajouter un bouton de rafraîchissement
    const playersHeader = document.querySelector('.players-header');
    const refreshButton = document.createElement('div');
    refreshButton.className = 'refresh-icon';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
    refreshButton.style.marginLeft = 'auto';
    refreshButton.style.cursor = 'pointer';
    refreshButton.title = 'Rafraîchir la liste des joueurs';
    playersHeader.appendChild(refreshButton);
    
    // Événement de clic sur le bouton de rafraîchissement
    refreshButton.addEventListener('click', () => {
        refreshButton.classList.add('spinning');
        loadPlayers();
        
        // Retirer la classe spinning après 1 seconde
        setTimeout(() => {
            refreshButton.classList.remove('spinning');
        }, 1000);
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
    
    // Rafraîchir automatiquement toutes les 60 secondes
    function startAutoRefresh() {
        const refreshInterval = 60000; // 60 secondes
        
        setInterval(() => {
            loadPlayers();
        }, refreshInterval);
    }
    
    // Charger les joueurs initialement
    loadPlayers();
    
    // Démarrer le rafraîchissement automatique
    startAutoRefresh();

    // Méthode alternative: si le CORS proxy ne fonctionne pas, vous pouvez essayer la méthode JSONP avec un script dynamique
    // Cela fonctionne uniquement si l'API supporte JSONP avec un paramètre de callback
    function loadPlayersJSONP() {
        // Cette méthode est fournie comme alternative, mais n'est pas utilisée par défaut car
        // elle nécessite que l'API supporte JSONP
        const script = document.createElement('script');
        script.src = `${apiUrl}?callback=processPlayerData`;
        document.body.appendChild(script);
        
        // Le script sera supprimé après l'exécution
        script.onload = function() {
            document.body.removeChild(script);
        };
    }
    
    // Cette fonction doit être globale pour être accessible par JSONP
    window.processPlayerData = function(data) {
        console.log("Données reçues via JSONP:", data);
        // Le traitement des données serait similaire à celui dans la fonction loadPlayers
    };
});