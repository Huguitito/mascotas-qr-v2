// 6. Lógica Principal al Cargar la Página (Modificada para manejar redirección 404)
document.addEventListener('DOMContentLoaded', () => {
    showView('loading-view'); // Muestra "Cargando" inicialmente

    // --- NUEVO: Detectar redirección desde 404.html ---
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect'); // Busca ?redirect=...

    let effectivePath = ""; // La ruta que realmente usaremos

    if (redirectPath) {
        // Si encontramos ?redirect=, esa es la ruta que queríamos originalmente
        effectivePath = "/" + redirectPath; // Añadir slash inicial si no lo tiene
        console.log("Redirección detectada desde 404. Ruta efectiva:", effectivePath);
        // Opcional: Limpiar la URL para que no se vea el ?redirect=...
         const cleanUrl = window.location.pathname; // Solo la parte base (ej: /mascotas-qr-v2/)
         window.history.replaceState({}, document.title, cleanUrl);
    } else {
        // Si no hay ?redirect=, usamos la ruta actual directamente
        effectivePath = window.location.pathname;
        console.log("Acceso directo. Ruta efectiva:", effectivePath);
    }

    // Ahora usamos effectivePath para extraer el ID
    const pathParts = effectivePath.split('/');

    // Ajustar índice esperado si la ruta viene del redirect (sin /mascotas-qr-v2/ al inicio)
    // o si es la ruta completa (con /mascotas-qr-v2/)
    let petSegment = "pet";
    let expectedPetIndex = -1;

    // Si la ruta efectiva empieza con /mascotas-qr-v2/, buscamos "pet" en el índice 2
    // (Índice 0: '', Índice 1: 'mascotas-qr-v2', Índice 2: 'pet')
    if (effectivePath.startsWith('/mascotas-qr-v2/')) {
         expectedPetIndex = 2;
    }
    // Si no (viene del redirect sin el nombre del repo), buscamos "pet" en el índice 1
    // (Índice 0: '', Índice 1: 'pet')
    else {
        expectedPetIndex = 1;
    }

     console.log("Buscando segmento '"+petSegment+"' en índice:", expectedPetIndex);
     console.log("Partes de la ruta:", pathParts);


    if (pathParts.length > expectedPetIndex && pathParts[expectedPetIndex] === petSegment && pathParts.length > expectedPetIndex + 1) {
        currentPetId = pathParts[expectedPetIndex + 1];
        if (currentPetId) {
            console.log("ID de mascota encontrado:", currentPetId);
            listenToAuthState();
        } else {
             console.error("ID de mascota vacío encontrado en la URL.");
             showError("ID de mascota no válido en la URL.");
        }
    } else {
        // URL no contiene /pet/ID_VALIDO en la posición esperada
        console.log("No se encontró '/pet/ID_MASCOTA' válido en la ruta efectiva:", effectivePath);
        listenToAuthState(); // Escucha igual por si es login o error general
        showError("URL no válida. Escanea un código QR válido o revisa el enlace.");
    }

    // --- El resto de los listeners (goToLoginBtn, backToProfileBtn, logoutBtn) permanecen igual ---
     // Listener para el botón de ir a login
    goToLoginBtn.addEventListener('click', () => {
        showView('login-view');
        if (currentPetId) {
           backToProfileBtn.style.display = 'block';
        } else {
           backToProfileBtn.style.display = 'none';
        }
    });

    // Listener para el botón de volver al perfil desde login
     backToProfileBtn.addEventListener('click', () => {
         if (currentPetId) {
            handlePetId(currentPetId, currentUser); // Re-evaluar qué mostrar
         } else {
            showView('login-view'); // O a donde corresponda
         }
     });

     // Listener para el botón de logout
     logoutBtn.addEventListener('click', () => {
         auth.signOut().then(() => {
             console.log("Usuario deslogueado");
             currentUser = null;
             currentPetData = null;
             if (currentPetId) {
                 handlePetId(currentPetId, null); // Muestra perfil público
             } else {
                 showView('login-view'); // O página de inicio/error
             }
         }).catch(error => {
             console.error("Error al desloguear:", error);
             showError("No se pudo cerrar sesión.");
         });
     });

}); // Fin del addEventListener('DOMContentLoaded')