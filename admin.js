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

// --- >>> !! IMPORTANTE: EMAIL DEL ADMINISTRADOR (CORREGIDO) !! <<< ---
const ADMIN_EMAIL = "huguitito@gmail.com"; // <<< TU EMAIL DE ADMIN

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
const modalProfileLink = document.getElementById('modal-profile-link');
const modalQrCodeImg = document.getElementById('modal-qr-code');
const modalQrError = document.getElementById('modal-qr-error');


// --- Variables Globales del Admin ---
const repoName = "mascotas-qr-v2"; // <<<--- !! NOMBRE REAL DE TU REPO !!
const placeholderImage = `/${repoName}/generic-pet.png`; // <<<--- !! RUTA COMPLETA AL PLACEHOLDER !!
const baseUrl = `https://huguitito.github.io/${repoName}/`; // URL base de tu sitio
const petSegment = 'p/';   // Segmento corto para la ruta

// ===========================================
// FUNCIONES DEL ADMIN (Sin cambios en la lógica interna)
// ===========================================

function showLoading(show) {
    if(loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none';
}

async function loadActivatedPets() {
    // ... (lógica igual que antes) ...
    if (!petsTableBody) return;
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
                    <td class="text-end">
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
    // ... (lógica igual que antes) ...
    document.querySelectorAll('.edit-btn').forEach(button => { button.addEventListener('click', (e) => { openEditModal(e.currentTarget.getAttribute('data-id')); }); });
    document.querySelectorAll('.delete-btn').forEach(button => { button.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); handleDeletePet(e.currentTarget.getAttribute('data-id')); }); });
    document.querySelectorAll('#pets-table-body tr[data-id]').forEach(row => { row.addEventListener('click', (e) => { if (!e.target.closest('button')) { openEditModal(row.getAttribute('data-id')); } }); });
}

async function openEditModal(petId) {
    // ... (lógica igual que antes, usa placeholderImage correcto) ...
     if (!editPetModalElement) return;
    console.log("Abriendo modal para:", petId);
    if (modalEditError) modalEditError.textContent = '';
    showLoading(true);
    if (modalProfileLink) { modalProfileLink.href = "#"; modalProfileLink.textContent = "Cargando..."; }
    if (modalQrCodeImg) { modalQrCodeImg.src = ""; modalQrCodeImg.style.display = 'none'; }
    if (modalQrError) { modalQrError.style.display = 'none'; }
    try {
        const docRef = db.collection('pets').doc(petId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) throw new Error("El registro no fue encontrado.");
        const data = docSnap.data();
        if(modalPetIdInput) modalPetIdInput.value = petId;
        if(modalOwnerIdInput) modalOwnerIdInput.value = data.ownerUserId || '';
        if(modalCurrentPhotoUrlInput) modalCurrentPhotoUrlInput.value = data.petPhotoUrl || '';
        if(modalPetPhoto) {
            modalPetPhoto.src = data.petPhotoUrl || placeholderImage; // <--- Usa la ruta completa
            modalPetPhoto.onerror = () => { if(modalPetPhoto) modalPetPhoto.src = placeholderImage; }; // <--- Usa la ruta completa
        }
        if(modalPetNameInput) modalPetNameInput.value = data.petName || '';
        if(modalOwnerNameInput) modalOwnerNameInput.value = data.ownerName || '';
        if(modalOwnerPhoneInput) modalOwnerPhoneInput.value = data.ownerPhone || '';
        if(modalOwnerAddressInput) modalOwnerAddressInput.value = data.ownerAddress || '';
        if(modalPetObservationsInput) modalPetObservationsInput.value = data.petObservations || '';
        if(modalShowAddressCheckbox) modalShowAddressCheckbox.checked = data.showAddressPublicly === true;
        const profileUrl = `${baseUrl}${petSegment}${petId}`;
        if (modalProfileLink) { modalProfileLink.href = profileUrl; modalProfileLink.textContent = profileUrl; }
        if (modalQrCodeImg && modalQrError) {
            const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(profileUrl)}`;
            modalQrCodeImg.src = qrCodeApiUrl;
            modalQrCodeImg.style.display = 'block';
            modalQrCodeImg.onerror = () => { console.error("Error al cargar QR"); modalQrCodeImg.style.display = 'none'; modalQrError.textContent = "Error al generar QR."; modalQrError.style.display = 'block'; };
             modalQrError.style.display = 'none';
        }
        showLoading(false);
        editPetModal.show();
    } catch (error) {
        console.error("Error abriendo modal:", error);
        showLoading(false);
        alert(`Error al cargar datos: ${error.message}`);
    }
}

async function handleSaveChanges() {
    // ... (lógica igual que antes) ...
    const petId = modalPetIdInput?.value;
    if (!petId) return;
    if(modalEditError) modalEditError.textContent = '';
    showLoading(true);
    const updatedData = {
        ownerName: modalOwnerNameInput?.value.trim(), ownerPhone: modalOwnerPhoneInput?.value.trim(),
        ownerAddress: modalOwnerAddressInput?.value.trim(), showAddressPublicly: modalShowAddressCheckbox?.checked,
        petName: modalPetNameInput?.value.trim(), petObservations: modalPetObservationsInput?.value.trim(),
        lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (!updatedData.petName || !updatedData.ownerName || !updatedData.ownerPhone) {
        if(modalEditError) modalEditError.textContent = "Campos obligatorios: Nombre Mascota, Nombre Dueño, Teléfono.";
        showLoading(false);
        return;
    }
    try {
        await db.collection('pets').doc(petId).update(updatedData);
        showLoading(false);
        editPetModal.hide();
        await loadActivatedPets();
    } catch (error) {
        console.error("Error guardando:", error);
        showLoading(false);
        if(modalEditError) modalEditError.textContent = `Error al guardar: ${error.message}`;
    }
}

async function handleDeletePet(petId) {
    // ... (lógica igual que antes) ...
    if (!petId) return;
    const petRow = document.querySelector(`tr[data-id="${petId}"]`);
    const petName = petRow?.querySelector('td:nth-child(2)')?.textContent || `ID ${petId}`;
    if (!confirm(`¿Estás SEGURO de borrar "${petName}" (ID: ${petId})?\n\n¡NO SE PUEDE DESHACER!`)) return;
    if (!confirm(`ÚLTIMA OPORTUNIDAD:\n\nBORRARÁS PERMANENTEMENTE los datos de "${petName}".\n\n¿Continuar?`)) return;
    showLoading(true);
    try {
        let photoUrlToDelete = null;
        try { const docSnap = await db.collection('pets').doc(petId).get(); if(docSnap.exists) photoUrlToDelete = docSnap.data()?.petPhotoUrl; } catch (e) { console.warn("No se pudo obtener URL de foto", e); }
        await db.collection('pets').doc(petId).delete();
        alert(`¡Perfil borrado!\n\nRecuerda borrar manualmente la foto de Cloudinary si es necesario.`);
        showLoading(false);
        await loadActivatedPets();
    } catch (error) {
        console.error("Error borrando:", error);
        showLoading(false);
        alert(`Error al borrar: ${error.message}`);
    }
}

// ===========================================
// MANEJO DE AUTENTICACIÓN ADMIN (Usa ADMIN_EMAIL correcto)
// ===========================================

auth.onAuthStateChanged(user => {
    if (user && user.email === ADMIN_EMAIL) { // <-- Usa el email correcto
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
            auth.signOut();
            if (adminLoginError) adminLoginError.textContent = "Acceso denegado.";
        }
    }
});

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
        // ... (lógica igual que antes, usa ADMIN_EMAIL para verificar) ...
        e.preventDefault();
        if(adminLoginError) adminLoginError.textContent = '';
        const email = adminLoginEmailInput?.value;
        const password = adminLoginPasswordInput?.value;
        if(!email || !password) { if(adminLoginError) adminLoginError.textContent = "Ingresa email y contraseña."; return; }
        showLoading(true);
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                if (userCredential.user.email !== ADMIN_EMAIL) { // <-- Verifica contra el email correcto
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
    // ... (lógica igual que antes) ...
     adminLogoutBtn.addEventListener('click', () => { auth.signOut().catch(error => { console.error("Error al desloguear", error); alert("Error al cerrar sesión."); }); });
}

 if(refreshListBtn) {
     // ... (lógica igual que antes) ...
      refreshListBtn.addEventListener('click', () => { console.log("Refrescando..."); loadActivatedPets(); });
 }

 if(modalSaveBtn) {
     // ... (lógica igual que antes) ...
      modalSaveBtn.addEventListener('click', handleSaveChanges);
 }

 if(modalDeleteBtn) {
     // ... (lógica igual que antes) ...
      modalDeleteBtn.addEventListener('click', () => { const petId = modalPetIdInput?.value; if(petId) { editPetModal.hide(); handleDeletePet(petId); } });
 }

 if (editPetModalElement) {
    // ... (lógica igual que antes) ...
     editPetModalElement.addEventListener('hidden.bs.modal', event => { if (modalProfileLink) { modalProfileLink.href = "#"; modalProfileLink.textContent = "Cargando..."; } if (modalQrCodeImg) { modalQrCodeImg.src = ""; modalQrCodeImg.style.display = 'none'; } if (modalQrError) { modalQrError.style.display = 'none'; } if (modalEditError) modalEditError.textContent = ''; console.log("Modal cerrado, limpiando."); });
}

// --- Fin del código ---