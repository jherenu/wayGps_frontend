// Configuración de la API (desde config.js)
const API_BASE_URL = WAYGPS_CONFIG.API_BASE_URL;
const EQUIPOS_API_URL = `${API_BASE_URL}/equipos/`;

// Variables globales
let equiposData = [];

// Función para obtener CSRF token de las cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('WayGPS Equipos Frontend iniciado');
    initializeApp();
});

// Función principal de inicialización
async function initializeApp() {
    try {
        debugLog('Iniciando módulo de Equipos GPS');
        await loadEquipos();
        setupEventListeners();
        debugLog('Módulo de Equipos inicializado correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showAlert('Error al cargar los datos', 'danger');
    }
}

// Cargar datos de equipos desde la API
async function loadEquipos() {
    try {
        showLoading(true);
        
        // Obtener headers con token de autenticación
        const headers = auth ? auth.getHeaders() : {'Content-Type': 'application/json'};
        
        const response = await fetch(EQUIPOS_API_URL, {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Manejar respuesta paginada o no paginada
        if (data.results && Array.isArray(data.results)) {
            equiposData = data.results;
        } else if (Array.isArray(data)) {
            equiposData = data;
        } else {
            console.error('Formato de respuesta desconocido:', data);
            equiposData = [];
        }
        
        debugLog(`Cargados ${equiposData.length} equipos`);
        
        // Actualizar tabla
        updateEquiposTable();
        
    } catch (error) {
        console.error('Error al cargar equipos:', error);
        showAlert('Error al cargar los datos de equipos', 'danger');
    } finally {
        showLoading(false);
    }
}

// Mostrar/ocultar indicador de carga
function showLoading(show) {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.style.display = show ? 'block' : 'none';
    });
}

// Actualizar tabla de equipos
function updateEquiposTable() {
    const tbody = document.getElementById('tbody-equipos');
    tbody.innerHTML = '';
    
    if (equiposData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay equipos registrados</td></tr>';
        return;
    }
    
    equiposData.forEach(equipo => {
        const row = createEquipoRow(equipo);
        tbody.appendChild(row);
    });
}

// Crear fila de tabla para un equipo
function createEquipoRow(equipo) {
    const tr = document.createElement('tr');
    
    // IMEI
    const imei = equipo.imei || 'Sin IMEI';
    
    // Número de serie
    const numeroSerie = equipo.numero_serie || '-';
    
    // Marca/Modelo
    const marcaModelo = `${equipo.marca || 'Sin marca'} ${equipo.modelo || ''}`.trim();
    
    // Estado
    let estadoBadge = '';
    switch(equipo.estado) {
        case 'activo':
            estadoBadge = '<span class="badge badge-operativo">Activo</span>';
            break;
        case 'inactivo':
            estadoBadge = '<span class="badge badge-stock">Inactivo</span>';
            break;
        case 'mantenimiento':
            estadoBadge = '<span class="badge badge-mantenimiento">Mantenimiento</span>';
            break;
        case 'baja':
            estadoBadge = '<span class="badge badge-baja">Baja</span>';
            break;
        default:
            estadoBadge = '<span class="badge bg-secondary">Sin estado</span>';
    }
    
    // Móvil asignado
    const movilAsignado = equipo.movil_info ? 
        `${equipo.movil_info.patente || equipo.movil_info.alias || 'Móvil #' + equipo.movil_info.id}` : 
        '<span class="text-muted">Sin asignar</span>';
    
    // Fecha instalación
    const fechaInstalacion = equipo.fecha_instalacion ? 
        new Date(equipo.fecha_instalacion).toLocaleString('es-ES') : 
        '<span class="text-muted">-</span>';
    
    tr.innerHTML = `
        <td><strong>${imei}</strong></td>
        <td><small>${numeroSerie}</small></td>
        <td>${marcaModelo}</td>
        <td>${estadoBadge}</td>
        <td>${movilAsignado}</td>
        <td><small>${fechaInstalacion}</small></td>
        <td>
            <button class="btn btn-sm btn-outline-primary" onclick="verDetalleEquipo(${equipo.id})" title="Ver detalles">
                <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-warning" onclick="editarEquipo(${equipo.id})" title="Editar">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarEquipo(${equipo.id})" title="Eliminar">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    return tr;
}

// Configurar event listeners
function setupEventListeners() {
    document.getElementById('filtro-busqueda').addEventListener('input', aplicarFiltros);
    document.getElementById('filtro-estado').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-asignacion').addEventListener('change', aplicarFiltros);
}

// Aplicar filtros a la tabla
function aplicarFiltros() {
    const busqueda = document.getElementById('filtro-busqueda').value.toLowerCase();
    const estado = document.getElementById('filtro-estado').value;
    const asignacion = document.getElementById('filtro-asignacion').value;
    
    const equiposFiltrados = equiposData.filter(equipo => {
        // Filtro de búsqueda
        const coincideBusqueda = !busqueda || 
            (equipo.imei && equipo.imei.toLowerCase().includes(busqueda)) ||
            (equipo.numero_serie && equipo.numero_serie.toLowerCase().includes(busqueda)) ||
            (equipo.marca && equipo.marca.toLowerCase().includes(busqueda)) ||
            (equipo.modelo && equipo.modelo.toLowerCase().includes(busqueda));
        
        // Filtro de estado
        const coincideEstado = !estado || equipo.estado === estado;
        
        // Filtro de asignación
        let coincideAsignacion = true;
        if (asignacion === 'asignado') {
            coincideAsignacion = equipo.movil_info !== null;
        } else if (asignacion === 'sin_asignar') {
            coincideAsignacion = equipo.movil_info === null;
        }
        
        return coincideBusqueda && coincideEstado && coincideAsignacion;
    });
    
    // Actualizar tabla con datos filtrados
    const tbody = document.getElementById('tbody-equipos');
    tbody.innerHTML = '';
    
    if (equiposFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No se encontraron equipos con los filtros aplicados</td></tr>';
        return;
    }
    
    equiposFiltrados.forEach(equipo => {
        const row = createEquipoRow(equipo);
        tbody.appendChild(row);
    });
}

// Mostrar formulario de equipo
function mostrarFormularioEquipo(equipo = null) {
    const modal = new bootstrap.Modal(document.getElementById('modalEquipo'));
    const titulo = document.getElementById('modalEquipoTitulo');
    const form = document.getElementById('formEquipo');
    
    // Limpiar formulario
    form.reset();
    
    if (equipo) {
        // Editar equipo existente
        titulo.textContent = 'Editar Equipo GPS';
        document.getElementById('equipo-id').value = equipo.id;
        document.getElementById('imei').value = equipo.imei || '';
        document.getElementById('numero-serie').value = equipo.numero_serie || '';
        document.getElementById('marca').value = equipo.marca || '';
        document.getElementById('modelo').value = equipo.modelo || '';
        document.getElementById('estado').value = equipo.estado || 'inactivo';
        
        // Convertir fecha ISO a formato datetime-local (YYYY-MM-DDTHH:mm)
        if (equipo.fecha_instalacion) {
            const fecha = new Date(equipo.fecha_instalacion);
            const year = fecha.getFullYear();
            const month = String(fecha.getMonth() + 1).padStart(2, '0');
            const day = String(fecha.getDate()).padStart(2, '0');
            const hours = String(fecha.getHours()).padStart(2, '0');
            const minutes = String(fecha.getMinutes()).padStart(2, '0');
            document.getElementById('fecha-instalacion').value = `${year}-${month}-${day}T${hours}:${minutes}`;
        } else {
            document.getElementById('fecha-instalacion').value = '';
        }
    } else {
        // Nuevo equipo
        titulo.textContent = 'Nuevo Equipo GPS';
        document.getElementById('equipo-id').value = '';
        document.getElementById('estado').value = 'inactivo';
    }
    
    modal.show();
}

// Guardar equipo
async function guardarEquipo() {
    try {
        const form = document.getElementById('formEquipo');
        const equipoId = document.getElementById('equipo-id').value;
        
        // Preparar datos, enviando null para campos vacíos
        const data = {
            imei: document.getElementById('imei').value.trim(),
            numero_serie: document.getElementById('numero-serie').value.trim() || null,
            marca: document.getElementById('marca').value.trim() || null,
            modelo: document.getElementById('modelo').value.trim() || null,
            estado: document.getElementById('estado').value || 'inactivo',  // Por defecto: inactivo (en stock)
            fecha_instalacion: document.getElementById('fecha-instalacion').value || null
        };
        
        // Validar IMEI obligatorio
        if (!data.imei) {
            showAlert('El IMEI es obligatorio', 'danger');
            return;
        }
        
        // Obtener headers con autenticación
        const headers = auth ? auth.getHeaders() : {'Content-Type': 'application/json'};
        
        // Obtener CSRF token
        const csrftoken = getCookie('csrftoken');
        if (csrftoken) {
            headers['X-CSRFToken'] = csrftoken;
        }
        
        let response;
        if (equipoId) {
            // Actualizar equipo existente
            response = await fetch(`${EQUIPOS_API_URL}${equipoId}/`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(data)
            });
        } else {
            // Crear nuevo equipo
            response = await fetch(EQUIPOS_API_URL, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });
        }
        
        if (!response.ok) {
            // Intentar obtener el mensaje de error del servidor
            let errorMessage = `Error HTTP: ${response.status}`;
            try {
                const errorData = await response.json();
                console.error('Error del servidor:', errorData);
                console.log('Datos enviados:', data);
                
                // Construir mensaje de error detallado
                let errores = [];
                
                for (const [campo, mensajes] of Object.entries(errorData)) {
                    if (Array.isArray(mensajes)) {
                        errores.push(`${campo}: ${mensajes.join(', ')}`);
                    } else if (typeof mensajes === 'string') {
                        errores.push(`${campo}: ${mensajes}`);
                    }
                }
                
                if (errores.length > 0) {
                    errorMessage = errores.join('<br>');
                } else {
                    errorMessage = JSON.stringify(errorData);
                }
                
            } catch (e) {
                console.error('No se pudo parsear el error:', e);
            }
            
            showAlert(errorMessage, 'danger', true);
            return;
        }
        
        // Cerrar modal y recargar datos
        bootstrap.Modal.getInstance(document.getElementById('modalEquipo')).hide();
        await loadEquipos();
        showAlert(equipoId ? 'Equipo actualizado correctamente' : 'Equipo creado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al guardar equipo:', error);
        showAlert('Error al guardar el equipo: ' + error.message, 'danger');
    }
}

// Editar equipo
function editarEquipo(id) {
    const equipo = equiposData.find(e => e.id === id);
    if (equipo) {
        mostrarFormularioEquipo(equipo);
    }
}

// Ver detalle de equipo
function verDetalleEquipo(id) {
    const equipo = equiposData.find(e => e.id === id);
    if (equipo) {
        const movilInfo = equipo.movil_info ? 
            `${equipo.movil_info.patente || equipo.movil_info.alias}` : 
            'Sin asignar';
        
        const detalles = `
            <strong>Equipo GPS: ${equipo.imei}</strong><br>
            <strong>Número de Serie:</strong> ${equipo.numero_serie || 'N/A'}<br>
            <strong>Marca/Modelo:</strong> ${equipo.marca || 'N/A'} ${equipo.modelo || ''}<br>
            <strong>Estado:</strong> ${equipo.estado || 'Sin estado'}<br>
            <strong>Móvil Asignado:</strong> ${movilInfo}<br>
            <strong>Fecha Instalación:</strong> ${equipo.fecha_instalacion ? new Date(equipo.fecha_instalacion).toLocaleString('es-ES') : 'N/A'}<br>
            <strong>Creado:</strong> ${equipo.created_at ? new Date(equipo.created_at).toLocaleString('es-ES') : 'N/A'}<br>
            <strong>Última Actualización:</strong> ${equipo.updated_at ? new Date(equipo.updated_at).toLocaleString('es-ES') : 'N/A'}
        `;
        
        showAlert(detalles, 'info', true);
    }
}

// Eliminar equipo
async function eliminarEquipo(id) {
    if (confirm('¿Está seguro de que desea eliminar este equipo?')) {
        try {
            const headers = auth ? auth.getHeaders() : {'Content-Type': 'application/json'};
            
            // Obtener CSRF token
            const csrftoken = getCookie('csrftoken');
            if (csrftoken) {
                headers['X-CSRFToken'] = csrftoken;
            }
            
            const response = await fetch(`${EQUIPOS_API_URL}${id}/`, {
                method: 'DELETE',
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            await loadEquipos();
            showAlert('Equipo eliminado correctamente', 'success');
            
        } catch (error) {
            console.error('Error al eliminar equipo:', error);
            showAlert('Error al eliminar el equipo', 'danger');
        }
    }
}

// Refrescar datos
async function refreshData() {
    await loadEquipos();
    showAlert('Datos actualizados correctamente', 'success');
}

// Mostrar alertas
function showAlert(message, type = 'info', html = false) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    
    if (html) {
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    } else {
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
    }
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, WAYGPS_CONFIG.UI.ALERT_DURATION);
}

// Función para actualizar automáticamente
setInterval(() => {
    loadEquipos();
}, WAYGPS_CONFIG.AUTO_REFRESH_INTERVAL);

console.log('WayGPS Equipos Frontend cargado');

