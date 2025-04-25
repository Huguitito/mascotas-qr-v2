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
const ADMIN_EMAIL = "admin@tuweb.com"; // <<< REEMPLAZA con el email que creaste en Firebase Auth

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
const editPetModal = new bootstrap.Modal(editPetModalElement);
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
// --- >>> Referencias para Enlace y QR (AÑADIDO) <<< ---
const modalProfileLink = document.getElementById('modal-profile-link');
const modalQrCodeImg = document.getElementById('modal-qr-code');
const modalQrError = document.getElementById('modal-qr-error');


// --- Variables Globales del Admin ---
const placeholderImage = 'generic-pet.png';
const repoName = "petid"; // <<<--- !! NOMBRE CORTO DEL REPO !!
const baseUrl = `https://huguitito.github.io/${repoName}/`;
const petSegment = 'p/';   // <<<--- !! SEGMENTO CORTO !!


// ===========================================
// FUNCIONES DEL ADMIN
// ===========================================

function showLoading(show) {
    if(loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none';
}

async function loadActivatedPets() {
    if (!petsTableBody) return; // Verificar si la tabla existe
    petsTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Cargando datos... <i class="fas fa-spinner fa-spin ms-2"></i></td></tr>';
    try {
        const snapshot = await db.collection('pets').orderBy('registeredAt', 'desc').get();
        if (snapshot.empty) {
            petsTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-muted">No hay chapitas activadas todavía.</td></tr>';
            return;
        }

        let tableHTML = '';
        snapshot.forEach(doc => {
            const pet = doc.data();
            const petId = doc.id;
            const registeredDate = pet.registeredAt?.toDate ? pet.registeredAt.toDate().toLocaleDateString() : 'N/A';
            const petNameDisplay = pet.petName || '<em class="text-muted">Sin nombre</em>';
            const ownerNameDisplay = pet.ownerName || '<em class="text-muted">Sin nombre</em>';
            const ownerPhoneDisplay = pet.ownerPhone || '<em class="text-muted">N/A</em>';


            tableHTML += `
                <tr data-id="${petId}">
                    <td><code>${petId}</code></td>
                    <td>${petNameDisplay}</td>
                    <td>${ownerNameDisplay}</td>
                    <td>${ownerPhoneDisplay}</td>
                    <td>${registeredDate}</td>
                    <td class="text-end"> <!-- Alinear botones -->
                        <button class="btn btn-sm btn-info edit-btn me-1" data-id="${petId}" title="Ver / Editar">
                            <i class="fas fa-eye"></i><span class="d-none d-md-inline"> Ver</span> / <i class="fas fa-edit"></i><span class="d-none d-md-inline"> Editar</span>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${petId}" title="Borrar">
                            <i class="fas fa-trash-alt"></i><span class="d-none d-md-inline"> Borrar</span>
                        </button>
                    </td>
                </tr>
            `;
        });
        petsTableBody.innerHTML = tableHTML;
        addTableButtonListeners();

    } catch (error) {
        console.error("Error cargando mascotas:", error);
        petsTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger p-4">Error al cargar datos: ${error.message}</td></tr>`;
    }
}

function addTableButtonListeners() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const petId = e.currentTarget.getAttribute('data-id');
            openEditModal(petId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Prevenir cualquier acción por defecto
            e.stopPropagation(); // Prevenir que el clic active el modal si está en la fila
            const petId = e.currentTarget.getAttribute('data-id');
            handleDeletePet(petId);
        });
    });

    // Opcional: hacer clic en la fila también abre el modal
    document.querySelectorAll('#pets-table-body tr[data-id]').forEach(row => {
        row.addEventListener('click', (e) => {
            // Solo abrir si no se hizo clic en un botón dentro de la fila
            if (!e.target.closest('button')) {
                 const petId = row.getAttribute('data-id');
                openEditModal(petId);
            }
        });
    });
}

async function openEditModal(petId) {
    if (!editPetModalElement) return;
    console.log("Abriendo modal para:", petId);
    if (modalEditError) modalEditError.textContent = '';
    showLoading(true);

    // Resetear QR y enlace antes de cargar nuevos datos
    if (modalProfileLink) { modalProfileLink.href = "#"; modalProfileLink.textContent = "Cargando..."; }
    if (modalQrCodeImg) { modalQrCodeImg.src = ""; modalQrCodeImg.style.display = 'none'; }
    if (modalQrError) { modalQrError.style.display = 'none'; }

    try {
        const docRef = db.collection('pets').doc(petId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new Error("El registro de la mascota no fue encontrado.");
        }

        const data = docSnap.data();
        if(modalPetIdInput) modalPetIdInput.value = petId;
        if(modalOwnerIdInput) modalOwnerIdInput.value = data.ownerUserId || '';
        if(modalCurrentPhotoUrlInput) modalCurrentPhotoUrlInput.value = data.petPhotoUrl || '';

        if(modalPetPhoto) {
            modalPetPhoto.src = data.petPhotoUrl || placeholderImage;
            modalPetPhoto.onerror = () => { if(modalPetPhoto) modalPetPhoto.src = placeholderImage; };
        }
        if(modalPetNameInput) modalPetNameInput.value = data.petName || '';
        if(modalOwnerNameInput) modalOwnerNameInput.value = data.ownerName || '';
        if(modalOwnerPhoneInput) modalOwnerPhoneInput.value = data.ownerPhone || '';
        if(modalOwnerAddressInput) modalOwnerAddressInput.value = data.ownerAddress || '';
        if(modalPetObservationsInput) modalPetObservationsInput.value = data.petObservations || '';
        if(modalShowAddressCheckbox) modalShowAddressCheckbox.checked = data.showAddressPublicly === true;

        // --- >>> Cargar Enlace y QR (AÑADIDO) <<< ---
        const profileUrl = `${baseUrl}${petSegment}${petId}`;
        if (modalProfileLink) {
            modalProfileLink.href = profileUrl;
            modalProfileLink.textContent = profileUrl;
        }
        if (modalQrCodeImg && modalQrError) {
            const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(profileUrl)}`;
            modalQrCodeImg.src = qrCodeApiUrl;
            modalQrCodeImg.style.display = 'block';
            modalQrCodeImg.onerror = () => {
                console.error("Error al cargar imagen QR desde la API");
                modalQrCodeImg.style.display = 'none';
                modalQrError.textContent = "Error al generar QR.";
                modalQrError.style.display = 'block';
            };
             modalQrError.style.display = 'none'; // Ocultar error si todo va bien
        }
        // --- >>> FIN Enlace y QR <<< ---


        showLoading(false);
        editPetModal.show();

    } catch (error) {
        console.error("Error abriendo modal:", error);
        showLoading(false);
        alert(`Error al cargar datos para editar: ${error.message}`);
    }
}

async function handleSaveChanges() {
    const petId = modalPetIdInput?.value;
    if (!petId) return;
    if(modalEditError) modalEditError.textContent = '';
    showLoading(true);

    const updatedData = {
        ownerName: modalOwnerNameInput?.value.trim(),
        ownerPhone: modalOwnerPhoneInput?.value.trim(),
        ownerAddress: modalOwnerAddressInput?.value.trim(),
        showAddressPublicly: modalShowAddressCheckbox?.checked,
        petName: modalPetNameInput?.value.trim(),
        petObservations: modalPetObservationsInput?.value.trim(),
        lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (!updatedData.petName || !updatedData.ownerName || !updatedData.ownerPhone) {
        if(modalEditError) modalEditError.textContent = "Nombre Mascota, Nombre Dueño y Teléfono son obligatorios.";
        showLoading(false);
        return;
    }

    try {
        await db.collection('pets').doc(petId).update(updatedData);
        showLoading(false);
        editPetModal.hide();
        await loadActivatedPets(); // Recargar la lista

    } catch (error) {
        console.error("Error guardando cambios:", error);
        showLoading(false);
        if(modalEditError) modalEditError.textContent = `Error al guardar: ${error.message}`;
    }
}

async function handleDeletePet(petId) {
    if (!petId) return;
    const petRow = document.querySelector(`tr[data-id="${petId}"]`);
    const petName = petRow?.querySelector('td:nth-child(2)')?.textContent || `ID ${petId}`;

    if (!confirm(`¿Estás SEGURO de borrar el perfil de "${petName}" (ID: ${petId})?\n\n¡ESTA ACCIÓN NO SE PUEDE DESHACER!`)) return;
     if (!confirm(`ÚLTIMA OPORTUNIDAD:\n\nBORRARÁS PERMANENTEMENTE los datos de "${petName}".\n\n¿Continuar?`)) return;

    console.log(`Iniciando borrado de ${petId}...`);
    showLoading(true);

    try {
        // Obtener URL de la foto ANTES de borrar (si es posible)
        let photoUrlToDelete = null;
        try {
            const docSnap = await db.collection('pets').doc(petId).get();
            if(docSnap.exists) photoUrlToDelete = docSnap.data()?.petPhotoUrl;
        } catch (e) { console.warn("No se pudo obtener URL de foto antes de borrar", e); }


        // Borrar documento de Firestore
        await db.collection('pets').doc(petId).delete();
        console.log(`Documento ${petId} borrado de Firestore.`);

        alert(`¡Perfil borrado!\n\nIMPORTANTE: Si deseas eliminar la foto asociada (${photoUrlToDelete ? 'detectada' : 'no detectada'}), debes hacerlo manualmente desde tu panel de Cloudinary.`);

        showLoading(false);
        await loadActivatedPets();

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
        console.log("Admin autenticado:", user.email);
        if (adminLoginView) adminLoginView.style.display = 'none';
        if (adminMainView) adminMainView.style.display = 'block';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'block';
        loadActivatedPets();
    } else {
        console.log("Usuario no es admin o no está logueado.");
        if (adminLoginView) adminLoginView.style.display = 'block';
        if (adminMainView) adminMainView.style.display = 'none';
        if (adminLogoutBtn) adminLogoutBtn.style.display = 'none';
        if (user) {
            auth.signOut(); // Desloguear si no es el admin
            if (adminLoginError) adminLoginError.textContent = "Acceso denegado. Cuenta no autorizada.";
        }
    }
});

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if(adminLoginError) adminLoginError.textContent = '';
        const email = adminLoginEmailInput?.value;
        const password = adminLoginPasswordInput?.value;

        if(!email || !password) {
             if(adminLoginError) adminLoginError.textContent = "Ingresa email y contraseña.";
             return;
        }
        showLoading(true);

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // onAuthStateChanged verificará si es el email correcto
                if (userCredential.user.email !== ADMIN_EMAIL) {
                     auth.signOut();
                     if(adminLoginError) adminLoginError.textContent = "Acceso denegado.";
                }
                showLoading(false);
                adminLoginForm.reset();
            })
            .catch((error) => {
                console.error("Error de login admin:", error);
                if(adminLoginError) adminLoginError.textContent = `Error: ${error.message}`;
                showLoading(false);
            });
    });
}

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
        auth.signOut().catch(error => {
            console.error("Error al desloguear admin:", error);
            alert("Error al cerrar sesión.");
        });
    });
}

 if(refreshListBtn) {
     refreshListBtn.addEventListener('click', () => {
         console.log("Refrescando lista...");
         loadActivatedPets();
     });
 }

 if(modalSaveBtn) {
     modalSaveBtn.addEventListener('click', handleSaveChanges);
 }

 if(modalDeleteBtn) {
     modalDeleteBtn.addEventListener('click', () => {
         const petId = modalPetIdInput?.value;
         if(petId) {
             editPetModal.hide(); // Ocultar modal antes de confirmar
             handleDeletePet(petId);
         }
     });
 }

 // Limpiar modal al cerrar
 if (editPetModalElement) {
    editPetModalElement.addEventListener('hidden.bs.modal', event => {
        if (modalProfileLink) { modalProfileLink.href = "#"; modalProfileLink.textContent = "Cargando..."; }
        if (modalQrCodeImg) { modalQrCodeImg.src = ""; modalQrCodeImg.style.display = 'none'; }
        if (modalQrError) { modalQrError.style.display = 'none'; }
        if (modalEditError) modalEditError.textContent = ''; // Limpiar errores del modal
        // Resetear el formulario del modal si es necesario
        // const modalForm = document.getElementById('modal-edit-form');
        // if(modalForm) modalForm.reset();
        console.log("Modal cerrado, limpiando enlace/QR.");
    });
}

// --- Fin del código ---