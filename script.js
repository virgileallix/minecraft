document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const playerList = document.getElementById('player-list');
    const serverStatus = document.getElementById('server-status');
    const refreshPlayers = document.getElementById('refresh-players');
    const refreshStatus = document.getElementById('refresh-status');
    const copyAddress = document.getElementById('copy-address');
    const toast = document.getElementById('toast');
    const demoModeToggle = document.getElementById('demo-mode');
    
    // URLs des APIs
    const playersApiUrl = 'https://panel.omgserv.com/json/447820/players';
    const statusApiUrl = 'https://panel.omgserv.com/json/447820/status';
    
    // État du mode démo
    let isDemoMode = false;
    
    // Fonction pour afficher les notifications toast
    function showToast(message, icon = 'check-circle', isSuccess = true) {
        const toastIcon = toast.querySelector('.toast-icon i');
        const toastMessage = toast.querySelector('.toast-message');
        
        toastIcon.className = `fas fa-${icon}`;
        toastIcon.style.color = isSuccess ? 'var(--primary)' : 'var(--accent)';
        toastMessage.textContent = message;
        
        toast.classList.add('show');
        
        // Masquer après 3 secondes
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Fonction pour essayer plusieurs proxies CORS 
    async function fetchWithCorsProxy(url) {
        // Liste des proxies CORS à essayer
        const corsProxies = [
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url='
        ];
        
        // Si mode démo, ne pas essayer les proxies
        if (isDemoMode) {
            throw new Error('Mode démo activé');
        }
        
        // Essayer chaque proxy jusqu'à ce qu'un fonctionne
        for (const proxy of corsProxies) {
            try {
                const response = await fetch(proxy + encodeURIComponent(url));
                if (!response.ok) {
                    throw new Error(`Réponse HTTP non valide: ${response.status}`);
                }
                return await response.json();
            } catch (error) {
                console.warn(`Échec avec le proxy ${proxy}:`, error);
                // Continuer à essayer avec le proxy suivant
            }
        }
        
        // Si aucun proxy ne fonctionne, lancer une erreur
        throw new Error('Tous les proxys CORS ont échoué');
    }
    
    // Fonction pour charger les joueurs
    async function loadPlayers() {
        // État de chargement
        playerList.innerHTML = `
            <li class="player-item loading">
                <div class="player-avatar">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="player-info">
                    <div class="player-name">Chargement...</div>
                    <div class="player-status">Récupération des joueurs</div>
                </div>
            </li>
        `;
        
        try {
            // Charger les données (réelles ou simulées)
            const data = isDemoMode ? simulatePlayersData() : await fetchWithCorsProxy(playersApiUrl);
            
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
                            <div class="player-status">${isDemoMode ? 'En ligne (simulé)' : 'En ligne'}</div>
                        </div>
                    `;
                    
                    // Ajouter le joueur à la liste
                    playerList.appendChild(playerItem);
                });
            }
        } catch (error) {
            console.error('Erreur avec l\'API des joueurs:', error);
            
            // Si on n'est pas déjà en mode démo, basculer en mode démo
            if (!isDemoMode) {
                console.log("Basculement automatique en mode démo pour les joueurs");
                const demoData = simulatePlayersData();
                
                // Vider la liste
                playerList.innerHTML = '';
                
                // Afficher les joueurs simulés
                demoData.players.forEach(player => {
                    const firstLetter = player.charAt(0).toUpperCase();
                    
                    const playerItem = document.createElement('li');
                    playerItem.className = 'player-item';
                    playerItem.innerHTML = `
                        <div class="player-avatar">${firstLetter}</div>
                        <div class="player-info">
                            <div class="player-name">${player}</div>
                            <div class="player-status">En ligne (données simulées)</div>
                        </div>
                    `;
                    
                    playerList.appendChild(playerItem);
                });
                
                // Notifier l'utilisateur
                showToast('Mode démonstration activé automatiquement', 'info-circle', false);
                
                // Mettre à jour le toggle
                demoModeToggle.checked = true;
                isDemoMode = true;
            }
        }
    }
    
    // Fonction pour charger le statut du serveur
    async function loadServerStatus() {
        // État de chargement pour chaque élément du statut
        serverStatus.querySelectorAll('.status-value').forEach(value => {
            value.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
        });
        
        try {
            // Charger les données (réelles ou simulées)
            const data = isDemoMode ? simulateServerStatus() : await fetchWithCorsProxy(statusApiUrl);
            
            if (data && data.status) {
                const status = data.status;
                const isOnline = status.online;
                
                // Statut en ligne/hors ligne
                const statusValue = serverStatus.querySelector('.status-item:nth-child(1) .status-value');
                statusValue.innerHTML = isOnline ? 
                    '<span class="status-online">En ligne</span>' : 
                    '<span class="status-offline">Hors ligne</span>';
                
                // CPU
                const cpuValue = serverStatus.querySelector('.status-item:nth-child(2) .status-value');
                cpuValue.textContent = isOnline ? `${status.cpu}%` : 'N/C';
                
                // RAM
                const ramValue = serverStatus.querySelector('.status-item:nth-child(3) .status-value');
                ramValue.textContent = isOnline ? `${Math.round(status.ram / 1024)} Mo` : 'N/C';
                
                // Joueurs
                const playersValue = serverStatus.querySelector('.status-item:nth-child(4) .status-value');
                playersValue.textContent = isOnline ? 
                    `${status.players.online} / ${status.players.max}` : 'N/C';
            } else {
                throw new Error('Format de données invalide');
            }
        } catch (error) {
            console.error('Erreur avec l\'API de statut:', error);
            
            // Si on n'est pas déjà en mode démo, basculer en mode démo
            if (!isDemoMode) {
                console.log("Basculement automatique en mode démo pour le statut");
                const demoData = simulateServerStatus();
                const status = demoData.status;
                
                // Statut en ligne/hors ligne
                const statusValue = serverStatus.querySelector('.status-item:nth-child(1) .status-value');
                statusValue.innerHTML = '<span class="status-online">En ligne (simulé)</span>';
                
                // CPU
                const cpuValue = serverStatus.querySelector('.status-item:nth-child(2) .status-value');
                cpuValue.textContent = `${status.cpu}% (simulé)`;
                
                // RAM
                const ramValue = serverStatus.querySelector('.status-item:nth-child(3) .status-value');
                ramValue.textContent = `${Math.round(status.ram / 1024)} Mo (simulé)`;
                
                // Joueurs
                const playersValue = serverStatus.querySelector('.status-item:nth-child(4) .status-value');
                playersValue.textContent = `${status.players.online} / ${status.players.max} (simulé)`;
                
                // Notifier l'utilisateur
                showToast('Mode démonstration activé automatiquement', 'info-circle', false);
                
                // Mettre à jour le toggle
                demoModeToggle.checked = true;
                isDemoMode = true;
            }
        }
    }
    
    // Fonction pour simuler des données de statut
    function simulateServerStatus() {
        console.log("Utilisation de données de statut simulées");
        
        // Données de test
        return {
            status: {
                online: true,
                cpu: 25,
                ram: 2048 * 1024, // 2 GB en Ko
                players: {
                    online: 3,
                    max: 20
                }
            }
        };
    }
    
    // Fonction pour simuler des données de joueurs
    function simulatePlayersData() {
        console.log("Utilisation de données de joueurs simulées");
        
        // Données de test
        return {
            players: ["MinecraftPro", "BTSSIODev", "CraftMaster"]
        };
    }
    
    // Événement pour le basculement du mode démo
    demoModeToggle.addEventListener('change', function() {
        isDemoMode = this.checked;
        console.log("Mode démo:", isDemoMode ? "activé" : "désactivé");
        
        // Recharger les données avec le nouveau mode
        loadPlayers();
        loadServerStatus();
        
        // Afficher une notification
        if (isDemoMode) {
            showToast('Mode démonstration activé', 'info-circle');
        } else {
            showToast('Mode démonstration désactivé', 'info-circle');
        }
    });
    
    // Événement de clic sur le bouton de rafraîchissement des joueurs
    refreshPlayers.addEventListener('click', function() {
        const icon = this.querySelector('i');
        icon.classList.add('spinning');
        
        loadPlayers();
        
        // Retirer la classe spinning après 1 seconde
        setTimeout(() => {
            icon.classList.remove('spinning');
        }, 1000);
    });
    
    // Événement de clic sur le bouton de rafraîchissement du statut
    refreshStatus.addEventListener('click', function() {
        const icon = this.querySelector('i');
        icon.classList.add('spinning');
        
        loadServerStatus();
        
        // Retirer la classe spinning après 1 seconde
        setTimeout(() => {
            icon.classList.remove('spinning');
        }, 1000);
    });
    
    // Copier l'adresse du serveur
    copyAddress.addEventListener('click', function() {
        const serverAddress = document.querySelector('.address-text').textContent;
        navigator.clipboard.writeText(serverAddress)
            .then(() => {
                showToast('Adresse du serveur copiée !');
            })
            .catch(() => {
                showToast('Impossible de copier l\'adresse', 'exclamation-circle', false);
            });
    });
    
    // Fonction pour démarrer le rafraîchissement automatique
    function startAutoRefresh() {
        const refreshInterval = 60000; // 60 secondes
        
        setInterval(() => {
            loadPlayers();
            loadServerStatus();
        }, refreshInterval);
    }
    
    // Charger les données initialement
    loadPlayers();
    loadServerStatus();
    
    // Démarrer le rafraîchissement automatique
    startAutoRefresh();
});