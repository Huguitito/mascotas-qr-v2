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
// const storage = firebase.storage(); // NO NECESITAMOS STORAGE

// 3. Referencias a Elementos del DOM (sin elementos de foto)
const loadingView = document.getElementById('loading-view');
const registerView = document.getElementById('register-view');
const publicProfileView = document.getElementById('public-profile-view');
const editView = document.getElementById('edit-view');
const loginView = document.getElementById('login-view');
const errorView = document.getElementById('error-view');
const errorMessage = document.getElementById('error-message');

// --- Formularios ---
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const editForm = document.getElementById('edit-form');

// --- Campos y Botones específicos (sin fotos) ---
const registerError = document.getElementById('register-error');
const loginError = document.getElementById('login-error');
const editError = document.getElementById('edit-error');
const editSuccess = document.getElementById('edit-success');
// const petPhotoInput = document.getElementById('pet-photo'); // No existe
// const photoPreview = document.getElementById('photo-preview'); // No existe
// const editPetPhotoInput = document.getElementById('edit-pet-photo'); // No existe
// const currentPetPhoto = document.getElementById('current-pet-photo'); // No existe
// const publicPetPhoto = document.getElementById('public-pet-photo'); // No existe (usamos icono)
const publicPetName = document.getElementById('public-pet-name');
const publicOwnerName = document.getElementById('public-owner-name');
const publicObservationsSection = document.getElementById('public-observations-section');
const publicPetObservations = document.getElementById('public-pet-observations');
const whatsappButton = document.getElementById('whatsapp-button');
const mapsButton = document.getElementById('maps-button');
const goToLoginBtn = document.getElementById('go-to-login-btn');
const backToProfileBtn = document.getElementById('back-to-profile-btn');
const logoutBtn = document.getElementById('logout-btn');

// Variable Global para guardar el ID de la mascota actual
let currentPetId = null;
let currentUser = null; // Guardará el usuario autenticado
let currentPetData = null; // Guardará los datos de la mascota cargada

// 4. Función para mostrar una vista específica y ocultar las demás
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active-view');
    });
    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.add('active-view');
    } else {
        console.error("Vista no encontrada:", viewId);
        showView('error-view');
    }
}

// 5. Función para mostrar errores generales
function showError(message = "Ocurrió un error inesperado.") {
    errorMessage.textContent = message;
    showView('error-view');
}

// 6. Lógica Principal al Cargar la Página
document.addEventListener('DOMContentLoaded', () => {
    showView('loading-view');

    // Extraer el ID de la mascota de la URL (ej: .../pet/ID_CORTO)
    const pathParts = window.location.pathname.split('/');
    const petIdIndex = pathParts.indexOf('pet');
    if (petIdIndex !== -1 && pathParts.length > petIdIndex + 1) {
        currentPetId = pathParts[petIdIndex + 1];
        if (currentPetId) { // Asegurarse de que el ID no esté vacío
             listenToAuthState();
        } else {
             showError("ID de mascota no válido en la URL.");
        }
    } else {
        // URL base o inválida sin 'pet/ID'
        listenToAuthState(); // Escucha igual por si el usuario quiere loguearse
        console.log("No se encontró 'pet/ID_MASCOTA' en la URL.");
        showError("URL no válida. Escanea un código QR válido o revisa el enlace.");
    }

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

     // No necesitamos listener para preview de fotos
});

// 7. Escuchar Cambios de Estado de Autenticación
function listenToAuthState() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (currentPetId) {
            handlePetId(currentPetId, user);
        } else {
            // Sin petId, manejar login/logout en página base/error
             if (user) {
                 // Si está logueado pero sin petId, ¿qué hacer?
                 // Podría mostrar un dashboard, pero no lo tenemos.
                 // Por ahora, si no está en una vista activa, muestra error.
                 if (!document.querySelector('.active-view') || document.getElementById('loading-view').classList.contains('active-view')) {
                    showError("Estás logueado. Escanea el QR de tu mascota para ver o editar su perfil.");
                 }
            } else {
                // Si no está logueado y no hay petId
                // Si estaba en edición, lo mandamos a login.
                 if (document.getElementById('edit-view').classList.contains('active-view')) {
                    showView('login-view');
                 } else if (!document.querySelector('.active-view') || document.getElementById('loading-view').classList.contains('active-view')) {
                     // Si no había vista activa, mostramos el error de URL inválida que ya estaba
                     showError("URL no válida. Escanea un código QR válido o revisa el enlace.");
                 }
            }
        }
    });
}


// 8. Función Principal para Manejar un ID de Mascota
async function handlePetId(petId, user) {
    showView('loading-view');
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
                backToProfileBtn.style.display = 'none';
            }
        } else {
            // --- El ID NO Existe ---
            console.log("No existe documento para el ID:", petId);
            // QR Nuevo -> Registrar
            if(registerForm) registerForm.reset();
            registerError.textContent = '';
            showView('register-view');
            backToProfileBtn.style.display = 'none';
        }
    } catch (error) {
        console.error("Error al obtener datos:", error);
        showError(`Error al cargar datos: ${error.message}`);
    }
}


// 9. Poblar el Perfil Público (sin foto)
function populatePublicProfile(data) {
    // No hay foto que poblar
    publicPetName.textContent = data.petName || 'Nombre no disponible';
    publicOwnerName.textContent = data.ownerName || 'Dueño no disponible';

    if (data.petObservations && data.petObservations.trim() !== '') {
        publicPetObservations.textContent = data.petObservations;
        publicObservationsSection.style.display = 'block';
    } else {
        publicObservationsSection.style.display = 'none';
    }

    if (data.ownerPhone) {
        const cleanPhone = data.ownerPhone.replace(/[\s+-]/g, '');
        // Asegúrate de que el número incluya código de país para wa.me
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`¡Hola! Encontré a tu mascota ${data.petName || ''}.`)}`;
        whatsappButton.href = whatsappUrl;
        whatsappButton.style.display = 'block';
    } else {
        whatsappButton.style.display = 'none';
    }

    if (data.ownerAddress && data.showAddressPublicly === true) {
        const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(data.ownerAddress)}`;
        mapsButton.href = mapsUrl;
        mapsButton.style.display = 'block';
    } else {
        mapsButton.style.display = 'none';
    }
}

// 10. Poblar el Formulario de Edición (sin foto)
function populateEditForm(data) {
    if (!editForm) return;
    document.getElementById('edit-owner-name').value = data.ownerName || '';
    document.getElementById('edit-owner-phone').value = data.ownerPhone || '';
    document.getElementById('edit-owner-address').value = data.ownerAddress || '';
    document.getElementById('edit-show-address').checked = data.showAddressPublicly === true;
    document.getElementById('edit-pet-name').value = data.petName || '';
    // No hay foto actual que mostrar
    document.getElementById('edit-pet-observations').value = data.petObservations || '';
    editError.textContent = '';
    editSuccess.textContent = '';
    // No hay input de archivo que limpiar
}


// 11. Manejar el Envío del Formulario de Registro (sin foto)
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showView('loading-view');
        registerError.textContent = '';

        const ownerName = document.getElementById('owner-name').value.trim();
        const ownerPhone = document.getElementById('owner-phone').value.trim();
        const ownerAddress = document.getElementById('owner-address').value.trim();
        const showAddress = document.getElementById('show-address').checked;
        const petName = document.getElementById('pet-name').value.trim();
        const petObservations = document.getElementById('pet-observations').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        // const photoFile = petPhotoInput.files[0]; // No existe

         if (password.length < 6) {
            registerError.textContent = "La contraseña debe tener al menos 6 caracteres.";
            showView('register-view');
            return;
         }
         // Validaciones adicionales (ej: que los nombres no estén vacíos) se manejan con 'required' en HTML

        try {
            // 1. Crear usuario en Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log("Usuario creado:", user.uid);

            // 2. NO hay que subir foto a Storage

            // 3. Guardar datos en Firestore (sin petPhotoUrl)
            const petData = {
                ownerUserId: user.uid,
                ownerName: ownerName,
                ownerPhone: ownerPhone,
                ownerAddress: ownerAddress,
                showAddressPublicly: showAddress,
                petName: petName,
                // petPhotoUrl: photoUrl, // No existe
                petObservations: petObservations,
                registeredAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('pets').doc(currentPetId).set(petData);
            console.log("Datos guardados en Firestore para ID:", currentPetId);

            // 4. Mostrar perfil público recién creado
            currentPetData = { ...petData, id: currentPetId };
            populatePublicProfile(currentPetData);
            showView('public-profile-view');

        } catch (error) {
            console.error("Error durante el registro:", error);
            registerError.textContent = `Error: ${mapFirebaseError(error)}`;
            showView('register-view');
        }
    });
}


// 12. Manejar el Envío del Formulario de Login (sin cambios)
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            console.log("Usuario logueado exitosamente");
            loginForm.reset();
            backToProfileBtn.style.display = 'none';
            // onAuthStateChanged se encarga del resto

        } catch (error) {
            console.error("Error de login:", error);
            loginError.textContent = mapFirebaseError(error);
        }
    });
}

// 13. Manejar el Envío del Formulario de Edición (sin foto)
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showView('loading-view');
        editError.textContent = '';
        editSuccess.textContent = '';

        const ownerName = document.getElementById('edit-owner-name').value.trim();
        const ownerPhone = document.getElementById('edit-owner-phone').value.trim();
        const ownerAddress = document.getElementById('edit-owner-address').value.trim();
        const showAddress = document.getElementById('edit-show-address').checked;
        const petName = document.getElementById('edit-pet-name').value.trim();
        const petObservations = document.getElementById('edit-pet-observations').value.trim();
        // const newPhotoFile = editPetPhotoInput.files[0]; // No existe

        try {
            // No hay foto que subir/actualizar

            // Datos a actualizar en Firestore (sin petPhotoUrl)
            const updatedData = {
                ownerName: ownerName,
                ownerPhone: ownerPhone,
                ownerAddress: ownerAddress,
                showAddressPublicly: showAddress,
                petName: petName,
                // petPhotoUrl: photoUrl, // No existe
                petObservations: petObservations,
                lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Actualizar Firestore
            await db.collection('pets').doc(currentPetId).update(updatedData);
            console.log("Datos actualizados en Firestore");

            // Actualizar datos locales y repoblar
            currentPetData = { ...currentPetData, ...updatedData };
            populateEditForm(currentPetData);
            editSuccess.textContent = "¡Información actualizada con éxito!";
            showView('edit-view');

        } catch (error) {
            console.error("Error al actualizar:", error);
            editError.textContent = `Error al guardar: ${mapFirebaseError(error)}`;
            populateEditForm(currentPetData); // Repoblar con datos previos si falla
            showView('edit-view');
        }
    });
}

// 14. Función Auxiliar para Traducir Errores Comunes de Firebase (sin errores de Storage)
function mapFirebaseError(error) {
    switch (error.code) {
        case 'auth/invalid-email': return 'El formato del email no es válido.';
        case 'auth/user-not-found': return 'No se encontró una cuenta con ese email.';
        case 'auth/wrong-password': return 'La contraseña es incorrecta.';
        case 'auth/email-already-in-use': return 'Ese email ya está registrado. Intenta iniciar sesión.';
        case 'auth/weak-password': return 'La contraseña es muy débil (mínimo 6 caracteres).';
        case 'permission-denied': return 'No tienes permiso para esta acción. ¿Iniciaste sesión correctamente?';
        case 'unavailable': return 'El servicio no está disponible temporalmente. Intenta de nuevo.';
        default: return error.message || 'Ocurrió un error desconocido.';
    }
}