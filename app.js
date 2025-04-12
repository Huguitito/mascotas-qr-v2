// app.js

// 1. Configuración de Firebase (TUS DATOS)
const firebaseConfig = {
  apiKey: "AIzaSyCatSfVDRfqkBBbrUH-lS9kxPexbMVV6mw",
  authDomain: "mascotas-qr-v2.firebaseapp.com",
  projectId: "mascotas-qr-v2",
  storageBucket: "mascotas-qr-v2.firebasestorage.app", // Aunque no usemos Storage, puede estar aquí
  messagingSenderId: "139139331167",
  appId: "1:139139331167:web:7634d72ef1500f2fe757ea"
};

// 2. Inicializar Firebase (Solo App, Firestore, Auth)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Firestore Database
const auth = firebase.auth(); // Authentication

// 3. Referencias a Elementos del DOM
const loadingView = document.getElementById('loading-view');
const registerView = document.getElementById('register-view');
const publicProfileView = document.getElementById('public-profile-view');
const editView = document.getElementById('edit-view');
const loginView = document.getElementById('login-view');
const errorView = document.getElementById('error-view');
const errorMessage = document.getElementById('error-message');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const editForm = document.getElementById('edit-form');
const registerError = document.getElementById('register-error');
const loginError = document.getElementById('login-error');
const editError = document.getElementById('edit-error');
const editSuccess = document.getElementById('edit-success');
const publicPetName = document.getElementById('public-pet-name');
const publicOwnerName = document.getElementById('public-owner-name');
const publicObservationsSection = document.getElementById('public-observations-section');
const publicPetObservations = document.getElementById('public-pet-observations');
const whatsappButton = document.getElementById('whatsapp-button');
const mapsButton = document.getElementById('maps-button');
const goToLoginBtn = document.getElementById('go-to-login-btn');
const backToProfileBtn = document.getElementById('back-to-profile-btn');
const logoutBtn = document.getElementById('logout-btn');

// Variables Globales
let currentPetId = null;
let currentUser = null;
let currentPetData = null;

// ===========================================
// DEFINICIÓN DE FUNCIONES PRINCIPALES
// ===========================================

// 4. Función para mostrar una vista específica y ocultar las demás
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active-view');
    });
    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.add('active-view');
    } else {
        console.error("Error interno: Vista no encontrada:", viewId);
        // Intentamos mostrar el error genérico, asumiendo que showError y errorMessage ya existen
         if (typeof showError === 'function' && errorMessage) {
            showError(`Error interno: La vista solicitada ('${viewId}') no existe.`);
         } else {
             // Fallback muy básico si showError no está lista o falta el elemento
             alert(`Error crítico: Vista '${viewId}' no encontrada y no se puede mostrar mensaje de error.`);
         }
    }
}

// 5. Función para mostrar errores generales
function showError(message = "Ocurrió un error inesperado.") {
    if (errorMessage) {
        errorMessage.textContent = message;
         // Solo llamamos a showView si estamos seguros de que existe
         if (typeof showView === 'function') {
            showView('error-view');
         } else {
             console.error("Error al mostrar error: showView no está definida. Mensaje original:", message);
             alert("Error: " + message); // Fallback
         }
    } else {
        console.error("Error al mostrar error: Elemento 'errorMessage' no encontrado. Mensaje original:", message);
        alert("Error: " + message); // Fallback
    }
}

// ===========================================
// LÓGICA PRINCIPAL Y OTRAS FUNCIONES
// ===========================================

// 6. Lógica Principal al Cargar la Página (Modificada para manejar redirección 404)
document.addEventListener('DOMContentLoaded', () => {
    // Ahora SÍ podemos llamar a showView porque está definida arriba
    showView('loading-view');

    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');
    let effectivePath = "";

    if (redirectPath) {
        effectivePath = "/" + redirectPath.replace(/^\//, ''); // Asegura un solo / al inicio
        console.log("Redirección detectada desde 404. Ruta efectiva:", effectivePath);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
    } else {
        effectivePath = window.location.pathname;
        console.log("Acceso directo. Ruta efectiva:", effectivePath);
    }

    const pathParts = effectivePath.split('/');
    const repoName = "mascotas-qr-v2"; // Nombre del repositorio
    const petSegment = "pet";
    let idFound = false;

    // Lógica para encontrar el ID:
    // Puede estar en /repoName/pet/ID o /pet/ID (si viene del redirect)
    for (let i = 0; i < pathParts.length - 1; i++) {
        // Verificar si la parte actual es 'pet' Y si la siguiente parte existe (el ID)
        if (pathParts[i] === petSegment && pathParts[i + 1]) {
             // Verificar si el segmento anterior es el nombre del repo O si estamos en la raíz virtual (del redirect)
            if ((i > 0 && pathParts[i - 1] === repoName) || (i === 1 && effectivePath.startsWith('/' + petSegment))) {
                 currentPetId = pathParts[i + 1];
                 idFound = true;
                 break; // Encontramos el ID, salimos del bucle
            }
        }
    }


    if (idFound && currentPetId) {
        console.log("ID de mascota encontrado:", currentPetId);
        listenToAuthState(); // Procedemos a verificar auth y cargar datos
    } else {
        console.log("No se encontró un patrón '/pet/ID_MASCOTA' válido en la ruta efectiva:", effectivePath);
        listenToAuthState(); // Escucha igual por si el usuario quiere loguearse en la raíz
        // Solo muestra error si NO estamos en la página raíz del proyecto
        if (effectivePath !== `/${repoName}/` && effectivePath !== '/') {
           showError("URL no válida. Escanea un código QR válido o revisa el enlace.");
        } else {
           // Estamos en la raíz, podría ser un acceso normal sin ID
           // Podríamos mostrar una bienvenida o directamente el login
           showView('login-view'); // Por ejemplo, mostrar login si acceden a la raíz
        }
    }

    // Listeners de Botones (dentro de DOMContentLoaded)
    if(goToLoginBtn) {
        goToLoginBtn.addEventListener('click', () => {
            showView('login-view');
            if (currentPetId) {
               backToProfileBtn.style.display = 'block';
            } else {
               backToProfileBtn.style.display = 'none';
            }
        });
    }

    if(backToProfileBtn) {
        backToProfileBtn.addEventListener('click', () => {
             if (currentPetId) {
                handlePetId(currentPetId, currentUser); // Re-evaluar qué mostrar
             } else {
                showView('login-view'); // O a donde corresponda
             }
         });
    }

    if(logoutBtn) {
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
    }

}); // Fin del addEventListener('DOMContentLoaded')


// 7. Escuchar Cambios de Estado de Autenticación
function listenToAuthState() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        // Solo re-manejamos el petId si efectivamente tenemos uno
        if (currentPetId) {
            handlePetId(currentPetId, user);
        } else {
            // Sin petId: decidir qué mostrar basado solo en el estado de auth
            if (!user) {
                // Si no está logueado y no hay ID, generalmente mostramos login
                // (Excepto si ya se está mostrando una vista de error)
                if (!errorView.classList.contains('active-view')) {
                     showView('login-view');
                }
            } else {
                // Está logueado pero no hay petId
                 // Podríamos mostrar un dashboard o un mensaje
                 // Si no estamos mostrando ya algo (como edición o error), mostramos un mensaje
                 if (!editView.classList.contains('active-view') && !errorView.classList.contains('active-view')) {
                    showError("Estás logueado. Escanea el QR de tu mascota para ver o editar su perfil.");
                 }
            }
        }
    });
}


// 8. Función Principal para Manejar un ID de Mascota
async function handlePetId(petId, user) {
    // Solo mostramos loading si no es la vista que ya está activa
    if (!loadingView.classList.contains('active-view')) {
        showView('loading-view');
    }
    try {
        const docRef = db.collection('pets').doc(petId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            // --- El ID Existe ---
            currentPetData = docSnap.data();
            currentPetData.id = docSnap.id;

            if (user && user.uid === currentPetData.ownerUserId) {
                // Dueño Logueado -> Editar
                populateEditForm(currentPetData);
                showView('edit-view');
            } else {
                // No Dueño o No Logueado -> Perfil Público
                populatePublicProfile(currentPetData);
                showView('public-profile-view');
                if (backToProfileBtn) backToProfileBtn.style.display = 'none';
            }
        } else {
            // --- El ID NO Existe ---
            console.log("No existe documento para el ID:", petId);
            // QR Nuevo -> Registrar
            if (registerForm) registerForm.reset();
            if (registerError) registerError.textContent = '';
            showView('register-view');
            if (backToProfileBtn) backToProfileBtn.style.display = 'none';
        }
    } catch (error) {
        console.error("Error al obtener datos de la mascota:", error);
        showError(`Error al cargar datos para ${petId}: ${error.message}`);
    }
}


// 9. Poblar el Perfil Público (sin foto)
function populatePublicProfile(data) {
    if (publicPetName) publicPetName.textContent = data.petName || 'Nombre no disponible';
    if (publicOwnerName) publicOwnerName.textContent = data.ownerName || 'Dueño no disponible';

    if (publicObservationsSection && publicPetObservations) {
        if (data.petObservations && data.petObservations.trim() !== '') {
            publicPetObservations.textContent = data.petObservations;
            publicObservationsSection.style.display = 'block';
        } else {
            publicObservationsSection.style.display = 'none';
        }
    }

    if (whatsappButton) {
        if (data.ownerPhone) {
            const cleanPhone = data.ownerPhone.replace(/[\s+-]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`¡Hola! Encontré a tu mascota ${data.petName || ''}.`)}`;
            whatsappButton.href = whatsappUrl;
            whatsappButton.style.display = 'block';
        } else {
            whatsappButton.style.display = 'none';
        }
    }

    if (mapsButton) {
        if (data.ownerAddress && data.showAddressPublicly === true) {
            const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(data.ownerAddress)}`;
            mapsButton.href = mapsUrl;
            mapsButton.style.display = 'block';
        } else {
            mapsButton.style.display = 'none';
        }
    }
}

// 10. Poblar el Formulario de Edición (sin foto)
function populateEditForm(data) {
    if (!editForm) return;
    const ownerNameInput = document.getElementById('edit-owner-name');
    const ownerPhoneInput = document.getElementById('edit-owner-phone');
    const ownerAddressInput = document.getElementById('edit-owner-address');
    const showAddressCheckbox = document.getElementById('edit-show-address');
    const petNameInput = document.getElementById('edit-pet-name');
    const petObservationsTextarea = document.getElementById('edit-pet-observations');

    if (ownerNameInput) ownerNameInput.value = data.ownerName || '';
    if (ownerPhoneInput) ownerPhoneInput.value = data.ownerPhone || '';
    if (ownerAddressInput) ownerAddressInput.value = data.ownerAddress || '';
    if (showAddressCheckbox) showAddressCheckbox.checked = data.showAddressPublicly === true;
    if (petNameInput) petNameInput.value = data.petName || '';
    if (petObservationsTextarea) petObservationsTextarea.value = data.petObservations || '';

    if (editError) editError.textContent = '';
    if (editSuccess) editSuccess.textContent = '';
}


// 11. Manejar el Envío del Formulario de Registro (sin foto)
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showView('loading-view');
        if (registerError) registerError.textContent = '';

        const ownerName = document.getElementById('owner-name')?.value.trim();
        const ownerPhone = document.getElementById('owner-phone')?.value.trim();
        const ownerAddress = document.getElementById('owner-address')?.value.trim();
        const showAddress = document.getElementById('show-address')?.checked;
        const petName = document.getElementById('pet-name')?.value.trim();
        const petObservations = document.getElementById('pet-observations')?.value.trim();
        const email = document.getElementById('register-email')?.value.trim();
        const password = document.getElementById('register-password')?.value;

        if (!ownerName || !ownerPhone || !petName || !email || !password) {
             showError("Por favor, completa todos los campos obligatorios.");
             showView('register-view'); // Volver a la vista de registro
             return;
        }
        if (password.length < 6) {
            if (registerError) registerError.textContent = "La contraseña debe tener al menos 6 caracteres.";
            showView('register-view');
            return;
        }

        try {
            // 1. Crear usuario en Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log("Usuario creado:", user.uid);

            // 3. Guardar datos en Firestore
            const petData = {
                ownerUserId: user.uid,
                ownerName: ownerName,
                ownerPhone: ownerPhone,
                ownerAddress: ownerAddress,
                showAddressPublicly: showAddress,
                petName: petName,
                petObservations: petObservations,
                registeredAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('pets').doc(currentPetId).set(petData);
            console.log("Datos guardados en Firestore para ID:", currentPetId);

            // 4. Mostrar perfil público recién creado
            currentPetData = { ...petData, id: currentPetId }; // Actualizar datos locales
            populatePublicProfile(currentPetData);
            showView('public-profile-view');

        } catch (error) {
            console.error("Error durante el registro:", error);
            if (registerError) registerError.textContent = `Error: ${mapFirebaseError(error)}`;
            showView('register-view');
        }
    });
}


// 12. Manejar el Envío del Formulario de Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (loginError) loginError.textContent = '';
        const email = document.getElementById('login-email')?.value;
        const password = document.getElementById('login-password')?.value;

         if (!email || !password) {
            if(loginError) loginError.textContent = "Ingresa email y contraseña.";
            return;
        }

        try {
            await auth.signInWithEmailAndPassword(email, password);
            console.log("Usuario logueado exitosamente");
            loginForm.reset(); // Limpia el formulario
            if (backToProfileBtn) backToProfileBtn.style.display = 'none';
            // onAuthStateChanged se encarga del resto (redirigir a edición si hay petId)

        } catch (error) {
            console.error("Error de login:", error);
            if (loginError) loginError.textContent = mapFirebaseError(error);
        }
    });
}

// 13. Manejar el Envío del Formulario de Edición (sin foto)
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showView('loading-view');
        if (editError) editError.textContent = '';
        if (editSuccess) editSuccess.textContent = '';

        const ownerName = document.getElementById('edit-owner-name')?.value.trim();
        const ownerPhone = document.getElementById('edit-owner-phone')?.value.trim();
        const ownerAddress = document.getElementById('edit-owner-address')?.value.trim();
        const showAddress = document.getElementById('edit-show-address')?.checked;
        const petName = document.getElementById('edit-pet-name')?.value.trim();
        const petObservations = document.getElementById('edit-pet-observations')?.value.trim();

        if (!ownerName || !ownerPhone || !petName) {
             showError("Por favor, completa todos los campos obligatorios.");
             showView('edit-view'); // Volver a la vista de edición
             return;
        }

        try {
            // Datos a actualizar en Firestore
            const updatedData = {
                ownerName: ownerName,
                ownerPhone: ownerPhone,
                ownerAddress: ownerAddress,
                showAddressPublicly: showAddress,
                petName: petName,
                petObservations: petObservations,
                lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Actualizar Firestore
            await db.collection('pets').doc(currentPetId).update(updatedData);
            console.log("Datos actualizados en Firestore");

            // Actualizar datos locales y repoblar
            currentPetData = { ...currentPetData, ...updatedData }; // Combina lo viejo y lo nuevo
            populateEditForm(currentPetData);
            if (editSuccess) editSuccess.textContent = "¡Información actualizada con éxito!";
            showView('edit-view');

        } catch (error) {
            console.error("Error al actualizar:", error);
            if (editError) editError.textContent = `Error al guardar: ${mapFirebaseError(error)}`;
            // No repoblamos aquí, dejamos que el usuario corrija
            showView('edit-view');
        }
    });
}

// 14. Función Auxiliar para Traducir Errores Comunes de Firebase
function mapFirebaseError(error) {
    console.log("Código de error Firebase:", error.code); // Ayuda a depurar
    switch (error.code) {
        case 'auth/invalid-email': return 'El formato del email no es válido.';
        case 'auth/user-not-found': return 'No se encontró cuenta con ese email.';
        case 'auth/wrong-password': return 'La contraseña es incorrecta.';
        case 'auth/email-already-in-use': return 'Ese email ya está registrado. Intenta iniciar sesión.';
        case 'auth/weak-password': return 'Contraseña débil (mínimo 6 caracteres).';
        case 'auth/too-many-requests': return 'Demasiados intentos fallidos. Intenta más tarde.';
        case 'permission-denied': return 'Permiso denegado. ¿Estás logueado correctamente?';
        case 'unavailable': return 'Servicio no disponible temporalmente. Intenta de nuevo.';
        case 'internal-error': return 'Error interno del servidor. Intenta más tarde.';
        default: return error.message || 'Ocurrió un error desconocido.';
    }
}