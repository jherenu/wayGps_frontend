/**
 * Módulo de autenticación para WayGPS
 * Maneja login, logout, verificación de sesión y permisos
 */

const AUTH_API_URL = 'http://127.0.0.1:8000/api/auth';

// Obtener token de autenticación
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

// Obtener datos del usuario
function getUserData() {
    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Obtener permisos del usuario
function getUserPermisos() {
    const permisos = localStorage.getItem('userPermisos') || sessionStorage.getItem('userPermisos');
    return permisos ? JSON.parse(permisos) : null;
}

// Obtener perfiles del usuario
function getUserPerfiles() {
    const perfiles = localStorage.getItem('userPerfiles') || sessionStorage.getItem('userPerfiles');
    return perfiles ? JSON.parse(perfiles) : [];
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
    return getAuthToken() !== null;
}

// Verificar si tiene permiso sobre una entidad
function tienePermiso(entidad, accion = 'ver') {
    const permisos = getUserPermisos();
    
    if (!permisos) return false;
    
    // Superusuario tiene todos los permisos
    if (permisos.es_superusuario) return true;
    
    // Verificar permiso específico
    if (permisos.entidades && permisos.entidades[entidad]) {
        return permisos.entidades[entidad][accion] === true;
    }
    
    return false;
}

// Verificar si tiene acceso a un perfil
function tieneAccesoPerfil(codigoPerfil) {
    const perfiles = getUserPerfiles();
    return perfiles.some(p => p.codigo === codigoPerfil);
}

// Verificar autenticación en cada carga de página
async function verificarAutenticacion() {
    const token = getAuthToken();
    
    if (!token) {
        // No hay token, redirigir a login
        if (window.location.pathname !== '/login/') {
            window.location.href = '/login/';
        }
        return false;
    }
    
    try {
        // Verificar si el token es válido
        const response = await fetch(`${AUTH_API_URL}/me/`, {
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            // Token inválido, limpiar y redirigir
            limpiarSesion();
            if (window.location.pathname !== '/login/') {
                window.location.href = '/login/';
            }
            return false;
        }
        
        // Token válido
        const userData = await response.json();
        
        // Actualizar datos del usuario en storage
        if (localStorage.getItem('authToken')) {
            localStorage.setItem('userData', JSON.stringify(userData));
        } else {
            sessionStorage.setItem('userData', JSON.stringify(userData));
        }
        
        return true;
        
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        return false;
    }
}

// Logout
async function logout() {
    const token = getAuthToken();
    
    console.log('Iniciando logout...');
    
    if (token) {
        try {
            await fetch(`${AUTH_API_URL}/logout/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Logout exitoso en servidor');
        } catch (error) {
            console.error('Error en logout:', error);
        }
    } else {
        console.log('No hay token, limpiando sesión local');
    }
    
    // Limpiar datos locales
    limpiarSesion();
    
    console.log('Redirigiendo a login...');
    
    // Redirigir a login
    window.location.href = '/login/';
}

// Limpiar sesión
function limpiarSesion() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userPermisos');
    localStorage.removeItem('userPerfiles');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('userPermisos');
    sessionStorage.removeItem('userPerfiles');
}

// Agregar token a las peticiones
function getFetchHeaders() {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    
    return headers;
}

// Mostrar información del usuario en la interfaz
function mostrarInfoUsuario() {
    const userData = getUserData();
    
    if (userData) {
        // Actualizar nombre de usuario en la UI si existe el elemento
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userData.nombre_completo || userData.username;
        }
        
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = userData.email;
        }
    } else {
        // Si no hay datos del usuario, intentar cargarlos
        const token = getAuthToken();
        if (token) {
            // Simular datos de usuario para prueba
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = 'admin (Demo)';
            }
            
            const userEmailElement = document.getElementById('userEmail');
            if (userEmailElement) {
                userEmailElement.textContent = 'admin@waygps.com';
            }
        }
    }
}

// Función de prueba para simular login
function loginDemo() {
    console.log('=== INICIANDO LOGIN DEMO ===');
    
    // Simular token de prueba
    localStorage.setItem('authToken', 'demo-token-123');
    localStorage.setItem('userData', JSON.stringify({
        username: 'admin',
        nombre_completo: 'Administrador',
        email: 'admin@waygps.com'
    }));
    
    console.log('Token guardado:', localStorage.getItem('authToken'));
    console.log('UserData guardado:', localStorage.getItem('userData'));
    
    // Mostrar info del usuario
    mostrarInfoUsuario();
    
    console.log('Login demo completado');
    console.log('Usuario actual:', getUserData());
    console.log('¡Ahora puedes hacer clic en "Cerrar Sesión"!');
}

// Función para probar logout directamente
function testLogout() {
    console.log('=== PRUEBA DE LOGOUT ===');
    console.log('Token antes:', getAuthToken());
    logout();
}

// Exportar funciones para uso global
window.auth = {
    getToken: getAuthToken,
    getUserData: getUserData,
    getPermisos: getUserPermisos,
    getPerfiles: getUserPerfiles,
    isAuthenticated: isAuthenticated,
    tienePermiso: tienePermiso,
    tieneAccesoPerfil: tieneAccesoPerfil,
    verificar: verificarAutenticacion,
    logout: logout,
    getHeaders: getFetchHeaders,
    mostrarInfo: mostrarInfoUsuario,
    loginDemo: loginDemo,
    testLogout: testLogout
};

