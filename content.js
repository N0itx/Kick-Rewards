let authToken = 'TU_TOKEN'; // Token de la cuenta que nos permitira hacer la peticion

chrome.storage.local.get("bearerToken", data => {
  authToken = data.bearerToken || 'empty';
  // console.log(authToken)
});

$(document).ready(async function () {

  let channelName = '';
  //Obtenemos el username para la API dependiendo de donde se esta haciendo la peticion (streamer/moderador)
  if (window.location.href.includes('moderator')) {
    channelName = window.location.href.split('/')[4]; // Obtenemos el username del canal por la URL
  } else {
    channelName = $('nav > div').last().find('button img').attr('alt'); // Obtenemos el username desde el alt de la imagen
  }

  // Funcion para agregar logs con animacion - version compacta
  function addLog(message, type = 'info') {
    if (message === '') {
      // Crear espaciador pequeño
      $('.kick-content').append(`<div class="kick-spacer"></div>`);
      return;
    }
    
    const logClass = type === 'success' ? 'kick-log success' : 
                    type === 'error' ? 'kick-log error' : 'kick-log';
    
    const logElement = $(`<div class="${logClass}">${message}</div>`);
    $('.kick-content').append(logElement);
    
    // Auto-scroll al final para usuarios (la verdad se ve bonito, pero no es necesario)
    setTimeout(() => {
      $('.kick-content').scrollTop($('.kick-content')[0].scrollHeight);
    }, 50);
  }

  // Funcion para agregar espaciado pequeño
  function addSmallSpacer() {
    $('.kick-content').append(`<div class="kick-spacer small"></div>`);
  }

  // Funcion para mostrar top 10 en dos columnas
  function displayTop10(top10Users) {
    // Crear contenedor del top 10
    const top10Container = $(`
      <div class="kick-top10-container">
        <div class="kick-top10-title">🏆 TOP 10 - USUARIOS CON MÁS CANJEOS</div>
        <div class="kick-top10-columns">
          <div class="kick-top10-column" id="column1"></div>
          <div class="kick-top10-column" id="column2"></div>
        </div>
      </div>
    `);
    
    $('.kick-content').append(top10Container);
    
    // Distribuir usuarios en dos columnas (5 y 5)
    top10Users.forEach((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
      const columnId = index < 5 ? '#column1' : '#column2';
      
      setTimeout(() => {
        const userElement = $(`<div class="kick-top10-item">${medal} ${index + 1}. ${user.username} - ${user.count} canjeos</div>`);
        $(columnId).append(userElement);
        animateIn(userElement, 0);
      }, index * 100);
    });
  }

  // Funcion para mostrar estado de carga
  function showLoading(element) {
    element.addClass('kick-loading');
    const originalText = element.text();
    element.data('original-text', originalText);
    element.html('⏳ Cargando...');
  }

  function hideLoading(element) {
    element.removeClass('kick-loading');
    const originalText = element.data('original-text');
    if (originalText) {
      element.html(originalText);
    }
  }

  // Funcion para animar entrada de elementos
  function animateIn(element, delay = 0) {
    element.css({
      'opacity': '0',
      'transform': 'translateY(20px)'
    });
    
    setTimeout(() => {
      element.css({
        'transition': 'all 0.3s ease-out',
        'opacity': '1',
        'transform': 'translateY(0)'
      });
    }, delay);
  }

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
        throw new Error(`Error en la peticion: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al realizar la peticion:', error);
      throw error;
    }
  }

  async function getAllRewards() {
    let allRewards = [];
    try {
      addLog('🎁 Obteniendo rewards...');

      const data = await fetchRewards();

      // Extraemos los rewards de la respuesta
      if (data.data && data.data.redemptions && Array.isArray(data.data.redemptions)) {
        allRewards = [...allRewards, ...data.data.redemptions];
      }

      console.log(`• Se encontraron ${allRewards.length} rewards.`);
      addLog(`✅ Se encontraron ${allRewards.length} rewards.`, 'success');
      return allRewards;
    } catch (error) {
      console.error('Error al obtener todas los rewards:', error);
      addLog(`❌ Error al obtener rewards: ${error.message}`, 'error');
      throw error;
    }
  }

  function extractRewards(rewards) {
    return rewards.map(rewards => rewards);
  }

  // Funcion para realizar las peticiones a la API
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
        throw new Error(`Error en la peticion: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error al realizar la peticion:', error);
      throw error;
    }
  }

  // Funcion principal
  async function getAllRedemptions(rewardId) {
    let allRedemptions = [];
    let nextPageToken = null;
    let pageCount = 0;
    let playerCount = 0;

    console.log('• Iniciando recoleccion de canjeos...');

    try {
      do {
        pageCount++;
        console.log(`• Obteniendo página ${pageCount}${nextPageToken ? ' con token' : ''}...`);
        addLog(`📄 Página ${pageCount} | usuarios: ${playerCount}...`);

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

        // Por si estamos haciendo muchas peticiones (para evitar ser limitados por la API o Baneo ya que no conozco el limite de kick)
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } while (nextPageToken);

      console.log(`• Proceso completado. Se encontraron ${allRedemptions.length} canjeos en total.`);
      $('.kick-content').empty();
      addLog(`🎉 Proceso completado. Se encontraron ${allRedemptions.length} canjeos en total.`, 'success');
      return allRedemptions;
    } catch (error) {
      console.error('Error al obtener todas las canejos:', error);
      addLog(`❌ Error al obtener canjeos: ${error.message}`, 'error');
      throw error;
    }
  }

  // Funcion para extraer solo los usernames de los canejos
  function extractUsernames(redemptions) {
    return redemptions.map(redemption => redemption.username);
  }

  // Nueva funcion para contar canjeos por usuario y obtener el top 10
  function getTop10Users(redemptions) {
    const userCounts = {};

    // Contar canjeos por usuario
    redemptions.forEach(redemption => {
      const username = redemption.username;
      userCounts[username] = (userCounts[username] || 0) + 1;
    });

    // Convertir a array y ordenar por cantidad de canjeos (descendente)
    const sortedUsers = Object.entries(userCounts)
      .map(([username, count]) => ({
        username,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Tomar solo los primeros 10

    return sortedUsers;
  }

  // Crear el boton principal con svg de kick
  $('body').append(`
    <button class="kick-generar">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 20 21" fill="black" class="size-5 fill-black" style="margin-right: 5px;">
        <g clip-path="url(#clip0_14730_75831)">
          <path d="M13.52 1.4602H6.48C2.9 1.4602 0 4.3602 0 7.9302V8.4802H5.5C5.5 7.4902 6.29 6.7002 7.27 6.7002H12.73C13.71 6.7002 14.5 7.4902 14.5 8.4702L20 8.4802V7.9302C20 4.3502 17.1 1.4502 13.52 1.4502V1.4602Z" fill="current"></path>
          <path d="M14.5 13.49C14.5 14.47 13.71 15.26 12.73 15.26H7.27C6.29 15.26 5.5 14.47 5.5 13.49V10.98H0V19.54H20V10.98H14.5V13.49Z" fill="current"></path>
          <path d="M11.2502 14.0003V12.2603C11.8802 11.8503 12.3002 11.1403 12.3002 10.3303C12.3002 9.06027 11.2702 8.03027 10.0002 8.03027C8.7302 8.03027 7.7002 9.06027 7.7002 10.3303C7.7002 11.1403 8.1202 11.8503 8.7502 12.2603V14.0003H11.2502Z" fill="current"></path>
        </g>
        <defs>
          <clipPath id="clip0_14730_75831">
            <rect width="20" height="20" fill="white" transform="translate(0 0.5)"></rect>
          </clipPath>
        </defs>
      </svg>
      GENERAR LISTA DE REWARDS
    </button>
  `);


  $('.kick-generar').click(async function () {

    if (authToken === "empty") {
      alert('⚠️ No se encontro TOKEN Bearer');
      return;
    }

    $('body').append(`
        <div class="kick-consola">
            <div class="kick-title">
                KICK REWARDS
                <button class="kick-close">×</button>
            </div>
            <div class="kick-content"></div>
        </div>
    `);

    // Evento de cierre del modal
    $('.kick-close').click(function () {
      const modal = $('.kick-consola');
      modal.css({
        'animation': 'modalOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      });
      
      setTimeout(() => {
        modal.remove();
        // Limpiar todos los event listeners relacionados con el modal (si no se hace me duplica las ptas lineas)
        $(document).off('keydown.modal');
        $(document).off('click.modal');
      }, 300);
    });

    getAllRewards()
      .then(rewards => {
        console.log('Todos los rewards obtenidos:', rewards.length);

        // Extrae info de los rewards
        const rewardnames = extractRewards(rewards);

        addSmallSpacer();
        const titleElement = $(`<div class="kick-log tit-s">🎯 Lista de rewards disponibles</div>`);
        $('.kick-content').append(titleElement);
        animateIn(titleElement);


        // Crear botones de rewards con delay escalonado
        rewardnames.forEach((rewardname, index) => {
          setTimeout(() => {
            const button = $(`<button class="kick-but" id="${rewardname.reward_id}">${rewardname.title}</button>`);
            $('.kick-content').append(button);
            animateIn(button);
          }, index * 100);
        });

        // Manejo de clicks en botones de rewards
        $(document).off('click', '.kick-but');
        $(document).on('click', '.kick-but', async function () {
          const clickedButton = $(this);
          const rewardId = clickedButton.attr("id");
          const rewardTitle = clickedButton.text();
          
          console.log('Reward ID seleccionado:', rewardId);
          
          // Mostrar estado de carga en el boton clickeado
          showLoading(clickedButton);
          
          // Limpiar contenido y mostrar informacion del reward seleccionado
          $('.kick-content').empty();
          addLog(`🎯 Procesando reward: "${rewardTitle}"`);
          addSmallSpacer();

          getAllRedemptions(rewardId)
            .then(redemptions => {
              console.log('Todos los redemptions obtenidos:', redemptions.length);

              // Obtener el top 10 de usuarios con más canjeos
              const top10Users = getTop10Users(redemptions);
              
              // Usar la nueva funcion para mostrar el top 10
              displayTop10(top10Users);

              // Extraer solo los usernames para la lista completa
              const usernames = extractUsernames(redemptions);

              setTimeout(() => {
                addSmallSpacer();
                const titleElement = $(`<div class="kick-log tit-s">LISTA DE PARTICIPANTES</div>`);
                $('.kick-content').append(titleElement);
                animateIn(titleElement);
                
                const copyButton = $(`<button class="kick-copy-btn" data-usernames='${JSON.stringify(usernames)}'>📋 Copiar la lista de nombres</button>`);
                $('.kick-content').append(copyButton);
                animateIn(copyButton, 200);
                
                addSmallSpacer();

                // Mostrar lista de usuarios con delay
                usernames.forEach((username, index) => {
                  setTimeout(() => {
                    addLog(`👤 ${username}`);
                  }, index * 30); // 30ms
                });
              }, 1200); // Reducido el delay inicial
            })
            .catch(error => {
              console.error('Error en el proceso:', error);
              addLog(`❌ Error en el proceso: ${error.message}`, 'error');
            })
            .finally(() => {
              hideLoading(clickedButton);
            });
        });
      })
      .catch(error => {
        console.error('Error en el proceso:', error);
        addLog(`❌ Error en el proceso: ${error.message}`, 'error');
      });
  });

  // Event listener para el boton de copiar
  $(document).off('click', '.kick-copy-btn');
  $(document).on('click', '.kick-copy-btn', function () {
    const button = $(this);
    const usernames = JSON.parse(button.attr('data-usernames'));
    const usernameList = usernames.join('\n'); // Une los usernames con salto de línea

    showLoading(button);

    // Copiar al portapapeles
    navigator.clipboard.writeText(usernameList).then(function () {
      hideLoading(button);
      button.html('✅ ¡COPIADO!');
      button.css('background', 'linear-gradient(135deg, #00d4aa, #00b894)');
      
      // Efecto de éxito
      addLog('📋 Lista copiada al portapapeles exitosamente', 'success');
      
      setTimeout(() => {
        button.html('📋 Copiar la lista de nombres');
        button.css('background', '');
      }, 2000);
    }).catch(function (err) {
      console.error('Error al copiar: ', err);
      
      // Fallback para navegadores que no soporten clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = usernameList;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      hideLoading(button);
      button.html('✅ ¡COPIADO!');
      button.css('background', 'linear-gradient(135deg, #00d4aa, #00b894)');
      
      addLog('📋 Lista copiada al portapapeles (método alternativo)', 'success');
      
      setTimeout(() => {
        button.html('📋 Copiar la lista de nombres');
        button.css('background', '');
      }, 2000);
    });
  });

  // // Cerrar modal al hacer click fuera de él (por si le interesa a la gente)
  // $(document).on('click.modal', '.kick-consola', function(e) {
  //   e.stopPropagation();
  // });

  // $(document).on('click.modal', function(e) {
  //   if ($(e.target).closest('.kick-consola').length === 0 && $(e.target).closest('.kick-generar').length === 0) {
  //     if ($('.kick-consola').length > 0) {
  //       $('.kick-close').click();
  //     }
  //   }
  // });

});

// Agregar estilos CSS adicionales para las animaciones de cierre
const additionalStyles = `
<style>
@keyframes modalOut {
    from {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
    to {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
    }
}

.kick-log.success {
    border-left-color: #00d4aa;
    background: rgba(0, 212, 170, 0.1);
}

.kick-log.error {
    border-left-color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
}
</style>
`;

$('head').append(additionalStyles);