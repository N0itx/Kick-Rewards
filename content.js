$(document).ready(async function () {
    
    let channelName = '';
    //Obtenemos el username para la API dependiendo de donde se esta haciendo la peticion (streamer/moderador)
    if (window.location.href.includes('moderator')) {
        channelName =  window.location.href.split('/')[4];// Obtenemos el username del canal por la URL
    } else {
        channelName = $('nav > div').last().find('button img').attr('alt');// Obtenemos el username desde el alt de la imagen
    }

    const authToken = '203792012|K2lXBrsbFkat7ANjkBUgmHn2ftrQRVJGpJriBK4J'; // Token de la cuenta que nos permitira hacer la peticion



    async function fetchRewards() {
        //URL Base
        let url = `https://kick.com/api/v2/channels/${channelName}/redemption-metadata`

        // Opciones para la peticion fetch
        const options = {
            headers: {
                "accept": "application/json",
                "accept-language": "es-MX,es;q=0.9",
                "authorization": `Bearer ${authToken}`,
                "cache-control": "no-cache",
                "cluster": "v2",
                "pragma": "no-cache",
                "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site"
            },
            referrer: "https://dashboard.kick.com/",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "include"
        };

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error al realizar la petición:', error);
            throw error;
        }
    }

    async function getAllRewards() {
        let allRewards = [];
        try {
            $('.kick-content').append(`<div class="kick-log">• Obteniendo rewards...</div>`)

            const data = await fetchRewards();

            // Extraemos los rewards de la respuesta
            if (data.data && data.data.redemptions && Array.isArray(data.data.redemptions)) {
                allRewards = [...allRewards, ...data.data.redemptions];
            }

            console.log(`• Se encontraron ${allRewards.length} rewards.`);
            $('.kick-content').append(`<div class="kick-log">• Se encontraron ${allRewards.length} rewards.</div>`)
            return allRewards;
        } catch (error) {
            console.error('Error al obtener todas los rewards:', error);
            throw error;
        }
    }

    function extractRewards(rewards) {
        return rewards.map(rewards => rewards);
    }

    // Función para realizar las peticiones a la API
    async function fetchRedemptions(nextPageToken = null, rewardID = null) {
        // URL base
        let url = `https://kick.com/api/v2/channels/${channelName}/redemptions?reward_id=${rewardID}`;

        // Si hay un token de siguiente pagina, lo añadimos a la URL
        if (nextPageToken) {
            url += `&next_page_token=${nextPageToken}`;
        }

        // Opciones para la peticion fetch
        const options = {
            headers: {
                "accept": "application/json",
                "accept-language": "es-MX,es;q=0.9",
                "authorization": `Bearer ${authToken}`,
                "cache-control": "no-cache",
                "cluster": "v2",
                "pragma": "no-cache",
                "sec-ch-ua": "\"Chromium\";v=\"136\", \"Google Chrome\";v=\"136\", \"Not.A/Brand\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site"
            },
            referrer: "https://dashboard.kick.com/",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "include"
        };

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`Error en la petición: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error al realizar la petición:', error);
            throw error;
        }
    }

    // Funcion principal que realizara todas las peticiones necesarias
    async function getAllRedemptions(rewardId) {
        let allRedemptions = [];
        let nextPageToken = null;
        let pageCount = 0;
        let playerCount = 0;

        console.log('• Iniciando recolección de canjeos...');

        try {
            do {
                pageCount++;
                console.log(`• Obteniendo página ${pageCount}${nextPageToken ? ' con token' : ''}...`);
                $('.kick-content').append(`<div class="kick-log">• Obteniendo página ${pageCount} | usuarios: ${playerCount}...</div>`)

                const data = await fetchRedemptions(nextPageToken, rewardId);

                // Extraemos los canejos de la respuesta
                if (data.data && data.data.redemptions && Array.isArray(data.data.redemptions)) {
                    playerCount += data.data.redemptions.length;
                    allRedemptions = [...allRedemptions, ...data.data.redemptions];
                }

                // Verificamos si hay un token para la siguiente pagina
                nextPageToken = data.data && data.data.next_page_token ?
                    data.data.next_page_token :
                    null;

                // Por si estamos haciendo muchas peticiones (para evitar ser limitados por la API o Baneo)
                if (nextPageToken) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

            } while (nextPageToken);

            console.log(`• Proceso completado. Se encontraron ${allRedemptions.length} canjeos en total.`);
            $('.kick-content').empty();
            $('.kick-content').append(`<div class="kick-log">Proceso completado. Se encontraron ${allRedemptions.length} canjeos en total.</div>`)
            return allRedemptions;
        } catch (error) {
            console.error('Error al obtener todas las canejos:', error);
            throw error;
        }
    }

    // Función para extraer solo los usernames de los canejos
    function extractUsernames(redemptions) {
        return redemptions.map(redemption => redemption.username);
    }

    // Nueva función para contar canjeos por usuario y obtener el top 10
    function getTop10Users(redemptions) {
        const userCounts = {};
        
        // Contar canjeos por usuario
        redemptions.forEach(redemption => {
            const username = redemption.username;
            userCounts[username] = (userCounts[username] || 0) + 1;
        });
        
        // Convertir a array y ordenar por cantidad de canjeos (descendente)
        const sortedUsers = Object.entries(userCounts)
            .map(([username, count]) => ({ username, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Tomar solo los primeros 10
        
        return sortedUsers;
    }

    $('body').append(`<button class="kick-generar">GENERAR LISTA DE REWARDS</button>`)

    $('.kick-generar').click(async function () {

        $('body').append(`
        <div class="kick-consola">
            <div class="kick-title">SCRAP JSON DATA FROM KICK</div>
            <div class="kick-content"></div>
        </div>`)

        getAllRewards()
        .then(rewards => {
            console.log('Todos los rewards obtenidos:', rewards.length);

            // Extrae info de los rewards
            const rewardnames = extractRewards(rewards);

            $('.kick-content').append(`<div class="kick-log"><br>✅ Lista de rewards: <br><br></div>`)
            rewardnames.forEach(rewardname => $('.kick-content').append(`<button class="kick-but" id="${rewardname.reward_id}">${rewardname.title}</button>`));
            $('.kick-but').click(async function () {
                $('.kick-content').empty();
                let rewardId = $(this).attr("id");
                console.log('Reward ID seleccionado:', rewardId);
                getAllRedemptions(rewardId)
                .then(redemptions => {
                    console.log('Todos los redemptions obtenidos:', redemptions.length);
        
                    // Obtener el top 10 de usuarios con más canjeos
                    const top10Users = getTop10Users(redemptions);
                    
                    // Mostrar el top 10 primero
                    $('.kick-content').append(`<div class="kick-log"><br>🏆 TOP 10 - USUARIOS CON MÁS CANJEOS: <br><br></div>`)
                    top10Users.forEach((user, index) => {
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
                        $('.kick-content').append(`<div class="kick-log">${medal} ${index + 1}. ${user.username} - ${user.count} canjeos</div>`);
                    });
                    
                    // Extraer solo los usernames para la lista completa
                    const usernames = extractUsernames(redemptions);
        
                    $('.kick-content').append(`<div class="kick-log tit"><br>===== Lista de participantes =====<br></div>`)
                    $('.kick-content').append(`<button class="kick-copy-btn" data-usernames='${JSON.stringify(usernames)}'>📋 Copiar la lista de nombres</button><br><br>`)
                    usernames.forEach(username => $('.kick-content').append(`<div class="kick-log">${username}</div>`));
                })
                .catch(error => {
                    console.error('Error en el proceso:', error);
                    $('.kick-content').append(`<div class="kick-log">Error en el proceso: ${error}</div>`)
                });
            });
        })
        .catch(error => {
            console.error('Error en el proceso:', error);
            $('.kick-content').append(`<div class="kick-log">Error en el proceso: ${error}</div>`)
        });
    });

    // Event listener para el botón de copiar
    $(document).on('click', '.kick-copy-btn', function() {
        const usernames = JSON.parse($(this).attr('data-usernames'));
        const usernameList = usernames.join('\n'); // Une los usernames con salto de línea, sin comas
        
        // Copiar al portapapeles
        navigator.clipboard.writeText(usernameList).then(function() {
            // Cambiar temporalmente el texto del botón para confirmar
            const originalText = $('.kick-copy-btn').text();
            $('.kick-copy-btn').text('✅ COPIADO!');
            setTimeout(() => {
                $('.kick-copy-btn').text(originalText);
            }, 2000);
        }).catch(function(err) {
            console.error('Error al copiar: ', err);
            // Fallback para navegadores que no soporten clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = usernameList;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const originalText = $('.kick-copy-btn').text();
            $('.kick-copy-btn').text('✅ COPIADO!');
            setTimeout(() => {
                $('.kick-copy-btn').text(originalText);
            }, 2000);
        });
    });

});


// $('.kick-content').append(`<div class="kick-log">${}</div>`)