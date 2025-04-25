// admin.js

// 1. Configuración de Firebase (MISMA que app.js)
const firebaseConfig = {
  apiKey: "AIzaSyCatSfVDRfqkBBbrUH-lS9kxPexbMVV6mw",
  authDomain: "mascotas-qr-v2.firebaseapp.com",
  projectId: "mascotas-qr-v2",
  storageBucket: "mascotas-qr-v2.firebasestorage.app",
  messagingSenderId: "139139331167",
  appId: "1:139139331167:web:7634d72ef1500f2fe757ea"
};

// --- >>> !! IMPORTANTE: EMAIL DEL ADMINISTRADOR !! <<< ---
const ADMIN_EMAIL = "huguitito@gmail.com"; // <<< REEMPLAZA con el email que creaste en Firebase Auth

// 2. Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// 3. Referencias al DOM del Admin
const adminLoginView = document.getElementById('admin-login-view');
const adminMainView = document.getElementById('admin-main-view');
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginEmailInput = document.getElementById('admin-login-email');
const adminLoginPasswordInput = document.getElementById('admin-login-password');
const adminLoginError = document.getElementById('admin-login-error');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const petsTableBody = document.getElementById('pets-table-body');
const refreshListBtn = document.getElementById('refresh-list-btn');
const loadingOverlay = document.getElementById('loading-overlay');

// --- Referencias al Modal ---
const editPetModalElement = document.getElementById('editPetModal');
const editPetModal = new bootstrap.Modal(editPetModalElement); // Inicializar modal de Bootstrap
const modalPetIdInput = document.getElementById('modal-pet-id');
const modalOwnerIdInput = document.getElementById('modal-owner-id');
const modalCurrentPhotoUrlInput = document.getElementById('modal-current-photo-url');
const modalPetPhoto = document.getElementById('modal-pet-photo');
const modalPetNameInput = document.getElementById('modal-pet-name');
const modalOwnerNameInput = document.getElementById('modal-owner-name');
const modalOwnerPhoneInput = document.getElementById('modal-owner-phone');
const modalOwnerAddressInput = document.getElementById('modal-owner-address');
const modalPetObservationsInput = document.getElementById('modal-pet-observations');
const modalShowAddressCheckbox = document.getElementById('modal-show-address');
const modalSaveBtn = document.getElementById('modal-save-btn');
const modalDeleteBtn = document.getElementById('modal-delete-btn');
const modalEditError = document.getElementById('modal-edit-error');

const placeholderImage = 'generic-pet.png'; // Mismo placeholder

// ===========================================
// FUNCIONES DEL ADMIN
// ===========================================

function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Función para cargar y mostrar las mascotas activadas
async function loadActivatedPets() {
    petsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando datos... <i class="fas fa-spinner fa-spin"></i></td></tr>';
    try {
        const snapshot = await db.collection('pets').orderBy('registeredAt', 'desc').get(); // Ordenar por más reciente
        if (snapshot.empty) {
            petsTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay chapitas activadas todavía.</td></tr>';
            return;
        }

        let tableHTML = '';
        snapshot.forEach(doc => {
            const pet = doc.data();
            const petId = doc.id;
            const registeredDate = pet.registeredAt?.toDate ? pet.registeredAt.toDate().toLocaleDateString() : 'N/A';

            tableHTML += `
                <tr data-id="${petId}">
                    <td><code>${petId}</code></td>
                    <td>${pet.petName || 'N/A'}</td>
                    <td>${pet.ownerName || 'N/A'}</td>
                    <td>${pet.ownerPhone || 'N/A'}</td>
                    <td>${registeredDate}</td>
                    <td>
                        <button class="btn btn-sm btn-info edit-btn" data-id="${petId}" title="Ver / Editar">
                            <i class="fas fa-eye"></i> / <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${petId}" title="Borrar">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        petsTableBody.innerHTML = tableHTML;

        // Añadir listeners a los botones recién creados
        addTableButtonListeners();

    } catch (error) {
        console.error("Error cargando mascotas:", error);
        petsTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar datos: ${error.message}</td></tr>`;
    }
}

// Añadir listeners a los botones de la tabla
function addTableButtonListeners() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const petId = e.currentTarget.getAttribute('data-id');
            openEditModal(petId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const petId = e.currentTarget.getAttribute('data-id');
            handleDeletePet(petId);
        });
    });
}

// Abrir y poblar el modal de edición
async function openEditModal(petId) {
    console.log("Abriendo modal para:", petId);
    modalEditError.textContent = ''; // Limpiar errores previos
    showLoading(true);
    try {
        const docRef = db.collection('pets').doc(petId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new Error("El registro de la mascota no fue encontrado.");
        }

        const data = docSnap.data();
        modalPetIdInput.value = petId;
        modalOwnerIdInput.value = data.ownerUserId || '';
        modalCurrentPhotoUrlInput.value = data.petPhotoUrl || ''; // Guardar URL actual

        modalPetPhoto.src = data.petPhotoUrl || placeholderImage;
        modalPetPhoto.onerror = () => { modalPetPhoto.src = placeholderImage; };
        modalPetNameInput.value = data.petName || '';
        modalOwnerNameInput.value = data.ownerName || '';
        modalOwnerPhoneInput.value = data.ownerPhone || '';
        modalOwnerAddressInput.value = data.ownerAddress || '';
        modalPetObservationsInput.value = data.petObservations || '';
        modalShowAddressCheckbox.checked = data.showAddressPublicly === true;

        showLoading(false);
        editPetModal.show();

    } catch (error) {
        console.error("Error abriendo modal:", error);
        showLoading(false);
        alert(`Error al cargar datos para editar: ${error.message}`);
    }
}

// Guardar cambios desde el modal
async function handleSaveChanges() {
    const petId = modalPetIdInput.value;
    modalEditError.textContent = '';
    showLoading(true);

    // Obtener datos del modal
    const updatedData = {
        ownerName: modalOwnerNameInput.value.trim(),
        ownerPhone: modalOwnerPhoneInput.value.trim(),
        ownerAddress: modalOwnerAddressInput.value.trim(),
        showAddressPublicly: modalShowAddressCheckbox.checked,
        petName: modalPetNameInput.value.trim(),
        petObservations: modalPetObservationsInput.value.trim(),
        // No actualizamos ownerUserId, registeredAt ni photoUrl desde aquí (por simplicidad)
        lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Validación simple
    if (!updatedData.petName || !updatedData.ownerName || !updatedData.ownerPhone) {
        modalEditError.textContent = "Nombre Mascota, Nombre Dueño y Teléfono son obligatorios.";
        showLoading(false);
        return;
    }

    try {
        console.log(`Actualizando datos para ${petId}...`);
        await db.collection('pets').doc(petId).update(updatedData);
        console.log("Datos actualizados con éxito.");
        showLoading(false);
        editPetModal.hide();
        await loadActivatedPets(); // Recargar la lista para ver los cambios

    } catch (error) {
        console.error("Error guardando cambios:", error);
        showLoading(false);
        modalEditError.textContent = `Error al guardar: ${error.message}`;
    }
}

// Manejar borrado de mascota
async function handleDeletePet(petId) {
    const petName = document.querySelector(`tr[data-id="${petId}"] td:nth-child(2)`)?.textContent || `ID ${petId}`;

    // --- CONFIRMACIÓN ---
    if (!confirm(`¿Estás SEGURO de que quieres borrar el perfil de "${petName}" (ID: ${petId})?\n\n¡¡ESTA ACCIÓN NO SE PUEDE DESHACER!!`)) {
        return; // Cancelado por el usuario
    }
     // --- SEGUNDA CONFIRMACIÓN (más enfática) ---
     if (!confirm(`ÚLTIMA OPORTUNIDAD:\n\nBORRARÁS PERMANENTEMENTE los datos de "${petName}".\n\n¿Continuar?`)) {
         return;
     }

    console.log(`Iniciando borrado de ${petId}...`);
    showLoading(true);

    try {
        // 1. Borrar documento de Firestore
        await db.collection('pets').doc(petId).delete();
        console.log(`Documento ${petId} borrado de Firestore.`);

        // 2. Recordatorio de borrar foto de Cloudinary (MANUALMENTE)
        const photoUrl = document.querySelector(`tr[data-id="${petId}"]`)?.dataset.photoUrl || // Intentar obtenerla si la guardamos en el futuro
                         (await db.collection('pets').doc(petId).get()).data()?.petPhotoUrl; // O intentar obtenerla antes de borrar (arriesgado)
                         // Como no la tenemos fácil, mostramos mensaje genérico:

        alert(`¡Perfil borrado de la base de datos!\n\nIMPORTANTE: Recuerda borrar manualmente la foto asociada a este perfil desde tu panel de Cloudinary para liberar espacio.`);

        showLoading(false);
        await loadActivatedPets(); // Recargar la lista

    } catch (error) {
        console.error("Error borrando mascota:", error);
        showLoading(false);
        alert(`Error al borrar el perfil: ${error.message}`);
    }
}


// ===========================================
// MANEJO DE AUTENTICACIÓN ADMIN
// ===========================================

auth.onAuthStateChanged(user => {
    if (user && user.email === ADMIN_EMAIL) {
        // Usuario logueado Y es el admin
        console.log("Admin autenticado:", user.email);
        adminLoginView.style.display = 'none';
        adminMainView.style.display = 'block';
        adminLogoutBtn.style.display = 'block';
        loadActivatedPets(); // Cargar datos al entrar
    } else {
        // No logueado o no es el admin
        console.log("Usuario no es admin o no está logueado.");
        adminLoginView.style.display = 'block';
        adminMainView.style.display = 'none';
        adminLogoutBtn.style.display = 'none';
        if (user) {
            // Si está logueado pero NO es el admin, desloguearlo
            auth.signOut();
            adminLoginError.textContent = "Acceso denegado. Esta cuenta no es administradora.";
        }
    }
});

// Listener para el login del admin
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        adminLoginError.textContent = '';
        const email = adminLoginEmailInput.value;
        const password = adminLoginPasswordInput.value;

        showLoading(true);

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // El onAuthStateChanged manejará la visualización si es el admin correcto
                if (userCredential.user.email !== ADMIN_EMAIL) {
                     auth.signOut(); // Desloguear si no es el admin
                     adminLoginError.textContent = "Acceso denegado.";
                }
                showLoading(false);
                adminLoginForm.reset();
            })
            .catch((error) => {
                console.error("Error de login admin:", error);
                adminLoginError.textContent = `Error: ${error.message}`;
                showLoading(false);
            });
    });
}

// Listener para logout del admin
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
        auth.signOut().catch(error => {
            console.error("Error al desloguear admin:", error);
            alert("Error al cerrar sesión.");
        });
    });
}

 // Listener para el botón de refrescar
 if(refreshListBtn) {
     refreshListBtn.addEventListener('click', () => {
         console.log("Refrescando lista...");
         loadActivatedPets();
     });
 }

 // Listener para el botón Guardar del Modal
 if(modalSaveBtn) {
     modalSaveBtn.addEventListener('click', handleSaveChanges);
 }

 // Listener para el botón Borrar del Modal
 if(modalDeleteBtn) {
     modalDeleteBtn.addEventListener('click', () => {
         const petId = modalPetIdInput.value;
         editPetModal.hide(); // Ocultar modal antes de confirmar
         handleDeletePet(petId); // Llama a la función que ya tiene las confirmaciones
     });
 }