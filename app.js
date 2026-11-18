const consejosSaludFumar = [
    "Bebe un vaso de agua lentamente cuando sientas la urgencia; el impulso dura solo 5 minutos.",
    "Respira hondo 4 veces: inhala en 4 segundos, mantén 4 y exhala en 4.",
    "Sal a caminar 10 minutos para despejar tu mente y cambiar de entorno.",
    "¡Cada hora de aire puro está regenerando tus pulmones y mejorando tu circulación!",
    "Tus niveles de monóxido de carbono en sangre se normalizan pocas horas después de dejar el cigarro."
];

const consejosSaludBeber = [
    "Cambia la bebida social por agua mineral con limón o té helado sin azúcar.",
    "Identifica qué emoción o situación detonó la tentación y escríbela en tu nota de hoy.",
    "Recuerda lo bien que se siente despertar sin resaca, con claridad mental y energía.",
    "Tu hígado y tu sistema digestivo comienzan a sanar y recuperar su equilibrio desde el primer día limpio.",
    "Rodéate de personas que apoyen tu decisión de cuidar tu bienestar físico y mental."
];

const recordatoriosAliento = [
    "¡Vas muy bien! Cada hora sin ceder es una victoria gigante para tu salud.",
    "No mires la montaña entera, concéntrate solo en dar el paso de hoy. ¡Falta poco!",
    "Tu cuerpo y tu mente te agradecen el esfuerzo y la valentía de este momento.",
    "Un día a la vez. Lo estás haciendo excelente, mantén el enfoque en tu bienestar.",
    "Recuerda por qué empezaste. Tu propósito es más fuerte que cualquier tentación pasajera."
];

const metasConfig = [
    { dias: 1, label: "Primer día superado (24h)" },
    { dias: 7, label: "Una semana limpia" },
    { dias: 15, label: "15 días de constancia" },
    { dias: 30, label: "Un mes completo" },
    { dias: 90, label: "3 meses de transformación" },
    { dias: 365, label: "¡Un año entero de libertad!" }
];

const STORAGE_KEY = 'libremente_data_v1';
let savedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

let appData = {
    activo: savedData.activo === true,
    habitos: savedData.habitos || { fumar: false, beber: false },
    fechasInicio: savedData.fechasInicio || { fumar: null, beber: null },
    historialLimpio: {
        fumar: (savedData.historialLimpio && Array.isArray(savedData.historialLimpio.fumar)) ? savedData.historialLimpio.fumar : [],
        beber: (savedData.historialLimpio && Array.isArray(savedData.historialLimpio.beber)) ? savedData.historialLimpio.beber : []
    },
    tropiezos: {
        fumar: (savedData.tropiezos && Array.isArray(savedData.tropiezos.fumar)) ? savedData.tropiezos.fumar : [],
        beber: (savedData.tropiezos && Array.isArray(savedData.tropiezos.beber)) ? savedData.tropiezos.beber : []
    },
    metasCelebradas: Array.isArray(savedData.metasCelebradas) ? savedData.metasCelebradas : [],
    proposito: savedData.proposito || "",
    diario: savedData.diario || {},
    foro: Array.isArray(savedData.foro) ? savedData.foro : []
};

let timerInterval = null;

const setupView = document.getElementById('setup-view');
const dashboardView = document.getElementById('dashboard-view');
const btnComenzar = document.getElementById('btn-comenzar');
const btnReiniciar = document.getElementById('btn-reiniciar');
const btnCancelarSetup = document.getElementById('btn-cancelar-setup');
const btnBorrarTodo = document.getElementById('btn-borrar-todo');
const btnGuardarDiario = document.getElementById('btn-guardar-diario');
const btnPublicarForo = document.getElementById('btn-publicar-foro');
const inputProposito = document.getElementById('input-proposito');
const inputDiario = document.getElementById('input-diario');
const inputForoNombre = document.getElementById('input-foro-nombre');
const inputForoMensaje = document.getElementById('input-foro-mensaje');
const countersContainer = document.getElementById('counters-container');
const calendarsContainer = document.getElementById('calendars-container');
const displayProposito = document.getElementById('display-proposito');
const goalsSectionsContainer = document.getElementById('goals-sections-container');
const activeHabitsBadge = document.getElementById('active-habits-badge');
const historialNotas = document.getElementById('historial-notas');
const foroMural = document.getElementById('foro-mural');

document.addEventListener('DOMContentLoaded', () => {
    if (appData.activo) {
        mostrarDashboard();
    } else {
        mostrarSetup(false);
    }
});

const ZONA_GDL = 'America/Mexico_City';

function obtenerFechaGDL_YYYYMMDD(fecha = new Date()) {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: ZONA_GDL,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(fecha);
    const y = partes.find(p => p.type === 'year').value;
    const m = partes.find(p => p.type === 'month').value;
    const d = partes.find(p => p.type === 'day').value;
    return `${y}-${m}-${d}`;
}

function formatearFechaHoraGDL(timestampMs) {
    if (!timestampMs) return '';
    return new Intl.DateTimeFormat('es-MX', {
        timeZone: ZONA_GDL,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(timestampMs));
}

function convertirParaInputDatetimeGDL(timestampMs) {
    const fecha = timestampMs ? new Date(timestampMs) : new Date();
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: ZONA_GDL,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(fecha);

    const y = partes.find(p => p.type === 'year').value;
    const m = partes.find(p => p.type === 'month').value;
    const d = partes.find(p => p.type === 'day').value;
    let h = partes.find(p => p.type === 'hour').value;
    if (h === '24') h = '00';
    const min = partes.find(p => p.type === 'minute').value;
    return `${y}-${m}-${d}T${h}:${min}`;
}

function calcularTiempoTranscurrido(inicioMs) {
    if (!inicioMs) return { dias: 0, horas: 0, minutos: 0, segundos: 0 };
    const ahoraMs = Date.now();
    const diffMs = Math.max(0, ahoraMs - Number(inicioMs));

    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { dias, horas, minutos, segundos };
}

window.cambiarPestaña = function(seccion) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));

    if (seccion === 'progreso') {
        document.getElementById('tab-progreso').classList.add('active');
        document.querySelectorAll('.nav-tab')[0].classList.add('active');
    } else if (seccion === 'foro') {
        document.getElementById('tab-foro').classList.add('active');
        document.querySelectorAll('.nav-tab')[1].classList.add('active');
        renderizarForo();
    }
};

btnComenzar.addEventListener('click', () => {
    const chkFumar = document.getElementById('chk-fumar').checked;
    const chkBeber = document.getElementById('chk-beber').checked;
    const propositoTexto = inputProposito.value.trim();

    if (!chkFumar && !chkBeber) {
        Swal.fire('Selecciona un hábito', 'Elige al menos dejar de fumar, dejar de beber o ambos.', 'warning');
        return;
    }
    if (!propositoTexto) {
        Swal.fire('Falta tu propósito', 'Escribe el motivo por el cual estás tomando esta decisión antes de continuar.', 'warning');
        return;
    }

    const instanteExacto = Date.now();
    appData.activo = true;
    appData.proposito = propositoTexto;

    if (chkFumar && !appData.habitos.fumar) {
        appData.fechasInicio.fumar = instanteExacto;
        appData.historialLimpio.fumar = [];
        appData.tropiezos.fumar = [];
    } else if (!chkFumar) {
        appData.habitos.fumar = false;
        appData.fechasInicio.fumar = null;
    }

    if (chkBeber && !appData.habitos.beber) {
        appData.fechasInicio.beber = instanteExacto;
        appData.historialLimpio.beber = [];
        appData.tropiezos.beber = [];
    } else if (!chkBeber) {
        appData.habitos.beber = false;
        appData.fechasInicio.beber = null;
    }

    appData.habitos = { fumar: chkFumar, beber: chkBeber };

    registrarDiaLimpioHoy();
    guardarDatos();

    Swal.fire({
        icon: 'success',
        title: '¡Configuración guardada!',
        text: 'Tus progresos anteriores se han conservado intactos.',
        timer: 1400,
        showConfirmButton: false
    }).then(() => mostrarDashboard());
});

btnReiniciar.addEventListener('click', () => {
    mostrarSetup(true);
});

window.cerrarConfiguracion = function() {
    if (appData.activo) {
        mostrarDashboard();
    }
};

btnBorrarTodo.addEventListener('click', () => {
    Swal.fire({
        title: '¿Reiniciar aplicación por completo?',
        text: 'Se borrarán todos los datos, calendarios, metas y notas de este navegador para empezar totalmente desde cero.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, borrar todo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444'
    }).then((result) => {
        if (result.isConfirmed) {
            if (timerInterval) clearInterval(timerInterval);
            localStorage.removeItem(STORAGE_KEY);
            appData = {
                activo: false,
                habitos: { fumar: false, beber: false },
                fechasInicio: { fumar: null, beber: null },
                historialLimpio: { fumar: [], beber: [] },
                tropiezos: { fumar: [], beber: [] },
                metasCelebradas: [],
                proposito: "",
                diario: {},
                foro: []
            };
            mostrarSetup(false);
            Swal.fire('¡Aplicación reiniciada!', 'Todos los registros han sido borrados con éxito.', 'success');
        }
    });
});

btnGuardarDiario.addEventListener('click', async () => {
    const nota = inputDiario.value.trim();
    if (!nota) {
        Swal.fire('Nota vacía', 'Escribe cómo te sentiste hoy antes de guardar.', 'info');
        return;
    }

    const hoy = obtenerFechaGDL_YYYYMMDD();
    btnGuardarDiario.disabled = true;
    btnGuardarDiario.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;

    await new Promise(resolve => setTimeout(resolve, 400));

    if (appData.diario[hoy]) {
        appData.diario[hoy] += ` | ${nota}`;
    } else {
        appData.diario[hoy] = nota;
    }
    
    guardarDatos();
    inputDiario.value = '';

    btnGuardarDiario.disabled = false;
    btnGuardarDiario.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar nota`;
    renderizarNotas();

    Swal.fire({ icon: 'success', title: '¡Nota agregada!', timer: 1200, showConfirmButton: false });
});

window.editarNotaDiario = function(fecha) {
    const notaActual = appData.diario[fecha] || '';
    Swal.fire({
        title: `Editar nota (${fecha})`,
        input: 'textarea',
        inputValue: notaActual,
        showCancelButton: true,
        confirmButtonText: 'Guardar cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2e8b57',
        inputValidator: (value) => {
            if (!value.trim()) {
                return 'La nota no puede estar vacía';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            appData.diario[fecha] = result.value.trim();
            guardarDatos();
            renderizarNotas();
            Swal.fire({ icon: 'success', title: 'Nota actualizada', timer: 1200, showConfirmButton: false });
        }
    });
};

window.borrarNotaDiario = function(fecha) {
    Swal.fire({
        title: '¿Eliminar esta nota?',
        text: 'Se borrará el registro de este día en tu bitácora.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626'
    }).then((result) => {
        if (result.isConfirmed) {
            delete appData.diario[fecha];
            guardarDatos();
            renderizarNotas();
            Swal.fire({ icon: 'success', title: 'Nota eliminada', timer: 1200, showConfirmButton: false });
        }
    });
};

btnPublicarForo.addEventListener('click', () => {
    const nombre = inputForoNombre.value.trim() || "Anónimo";
    const mensaje = inputForoMensaje.value.trim();

    if (!mensaje) {
        Swal.fire('Mensaje vacío', 'Escribe un mensaje para compartir con la comunidad.', 'warning');
        return;
    }

    appData.foro.unshift({
        id: Date.now(),
        autor: nombre,
        mensaje: mensaje,
        fecha: formatearFechaHoraGDL(Date.now())
    });
    guardarDatos();

    inputForoMensaje.value = '';
    inputForoNombre.value = '';
    renderizarForo();

    Swal.fire({
        icon: 'success',
        title: '¡Publicado en LibreMente!',
        timer: 1400,
        showConfirmButton: false
    });
});

window.editarPostForo = function(idPost) {
    const post = appData.foro.find(p => (p.id && p.id === idPost) || (!p.id && p.fecha === idPost));
    if (!post) return;

    Swal.fire({
        title: 'Editar publicación',
        html: `
            <input type="text" id="swal-edit-autor" value="${post.autor}" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #e8dfd0; border-radius:8px;" placeholder="Tu nombre">
            <textarea id="swal-edit-mensaje" rows="3" style="width:100%; padding:10px; border:1px solid #e8dfd0; border-radius:8px;" placeholder="Tu mensaje">${post.mensaje}</textarea>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2e8b57',
        preConfirm: () => {
            const nuevoAutor = document.getElementById('swal-edit-autor').value.trim();
            const nuevoMensaje = document.getElementById('swal-edit-mensaje').value.trim();
            if (!nuevoMensaje) {
                Swal.showValidationMessage('El mensaje no puede estar vacío');
            }
            return { autor: nuevoAutor || 'Anónimo', mensaje: nuevoMensaje };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            post.autor = result.value.autor;
            post.mensaje = result.value.mensaje;
            guardarDatos();
            renderizarForo();
            Swal.fire({ icon: 'success', title: 'Publicación actualizada', timer: 1200, showConfirmButton: false });
        }
    });
};

window.borrarPostForo = function(idPost) {
    Swal.fire({
        title: '¿Eliminar publicación?',
        text: 'Se borrará este mensaje del foro de la comunidad.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626'
    }).then((result) => {
        if (result.isConfirmed) {
            appData.foro = appData.foro.filter(p => p.id !== idPost && p.fecha !== idPost);
            guardarDatos();
            renderizarForo();
            Swal.fire({ icon: 'success', title: 'Publicación eliminada', timer: 1200, showConfirmButton: false });
        }
    });
};

window.editarFechaInicio = function(tipoHabito) {
    const nombreHabito = tipoHabito === 'fumar' ? 'dejar de fumar' : 'dejar de beber';
    const valorActual = convertirParaInputDatetimeGDL(appData.fechasInicio[tipoHabito]);
    const maxActual = convertirParaInputDatetimeGDL(Date.now());

    Swal.fire({
        title: `Editar inicio (${nombreHabito})`,
        html: `
            <p style="font-size: 0.85rem; color: #5c6d67; margin-bottom: 12px;">Horario de Guadalajara. Ajusta la fecha y hora exacta en que comenzaste:</p>
            <input type="datetime-local" id="swal-input-datetime" value="${valorActual}" max="${maxActual}" 
                   style="width: 100%; padding: 10px; border: 1px solid #e8dfd0; border-radius: 8px; font-size: 1rem;">
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar fecha',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2e8b57',
        preConfirm: () => {
            const val = document.getElementById('swal-input-datetime').value;
            if (!val) {
                Swal.showValidationMessage('Selecciona una fecha y hora válida');
                return false;
            }
            const timestampSeleccionado = new Date(val + ':00-06:00').getTime();
            if (timestampSeleccionado > Date.now()) {
                Swal.showValidationMessage('La fecha no puede ser en el futuro');
                return false;
            }
            return timestampSeleccionado;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            appData.fechasInicio[tipoHabito] = result.value;
            
            let d = new Date(result.value);
            const hoyDate = new Date();
            const tropiezos = appData.tropiezos[tipoHabito] || [];
            
            while (d <= hoyDate) {
                const dStr = obtenerFechaGDL_YYYYMMDD(d);
                if (!tropiezos.includes(dStr) && !appData.historialLimpio[tipoHabito].includes(dStr)) {
                    appData.historialLimpio[tipoHabito].push(dStr);
                }
                d.setDate(d.getDate() + 1);
            }

            guardarDatos();
            actualizarDashboardCompleto();
            Swal.fire({ icon: 'success', title: 'Horario y racha actualizados', timer: 1200, showConfirmButton: false });
        }
    });
};

window.registrarTropiezo = function(tipoHabito) {
    const nombreHabito = tipoHabito === 'fumar' ? 'dejar de fumar' : 'dejar de beber';
    const activosCount = (appData.habitos.fumar ? 1 : 0) + (appData.habitos.beber ? 1 : 0);
    
    let textoMensaje = 'No te preocupes, un tropiezo no borra tu esfuerzo en el calendario. ';
    if (activosCount > 1) {
        textoMensaje += 'Reiniciaremos únicamente este contador de racha a 0 ahora mismo.';
    } else {
        textoMensaje += 'Se reiniciará el contador de racha a 0 ahora mismo.';
    }

    Swal.fire({
        title: `¿Tuviste un tropiezo al ${nombreHabito}?`,
        text: textoMensaje,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, registrar tropiezo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2e8b57'
    }).then((result) => {
        if (result.isConfirmed) {
            const hoyYYYYMMDD = obtenerFechaGDL_YYYYMMDD();
            if (!appData.tropiezos[tipoHabito].includes(hoyYYYYMMDD)) {
                appData.tropiezos[tipoHabito].push(hoyYYYYMMDD);
            }
            appData.historialLimpio[tipoHabito] = appData.historialLimpio[tipoHabito].filter(d => d !== hoyYYYYMMDD);
            
            appData.fechasInicio[tipoHabito] = Date.now();
            guardarDatos();
            actualizarDashboardCompleto();
            Swal.fire('¡Ánimo, a levantarse!', 'Tu historial y calendario conservan tus días pasados, pero tu racha consecutiva de metas se reinicia hoy para superarla de nuevo.', 'success');
        }
    });
};

function mostrarSetup(esEdicion = false) {
    if (timerInterval) clearInterval(timerInterval);
    setupView.classList.add('active');
    dashboardView.classList.remove('active');

    document.getElementById('chk-fumar').checked = appData.habitos.fumar;
    document.getElementById('chk-beber').checked = appData.habitos.beber;
    inputProposito.value = esEdicion ? (appData.proposito || '') : '';

    if (esEdicion) {
        document.getElementById('setup-title').textContent = "Configurar hábitos";
        document.getElementById('setup-subtitle').textContent = "Puedes activar un nuevo hábito o actualizar tu propósito sin perder tu historial previo:";
        btnCancelarSetup.style.display = 'block';
    } else {
        document.getElementById('setup-title').textContent = "Bienvenido a LibreMente";
        document.getElementById('setup-subtitle').textContent = "El primer paso requiere valor. Selecciona el objetivo en el que deseas trabajar:";
        btnCancelarSetup.style.display = 'none';
    }
}

async function mostrarDashboard() {
    setupView.classList.remove('active');
    dashboardView.classList.add('active');
    displayProposito.textContent = `"${appData.proposito}"`;

    const hoy = obtenerFechaGDL_YYYYMMDD();
    inputDiario.value = '';

    registrarDiaLimpioHoy();
    await cargarMensajeMotivacional();
    actualizarDashboardCompleto();
    iniciarRelojEnVivo();
}

function registrarDiaLimpioHoy() {
    const hoyStr = obtenerFechaGDL_YYYYMMDD();
    ['fumar', 'beber'].forEach(tipo => {
        if (appData.habitos[tipo]) {
            const tropiezos = appData.tropiezos[tipo] || [];
            if (!tropiezos.includes(hoyStr) && !appData.historialLimpio[tipo].includes(hoyStr)) {
                appData.historialLimpio[tipo].push(hoyStr);
            }
        }
    });
    guardarDatos();
}

function actualizarDashboardCompleto() {
    renderizarContadores();
    renderizarCalendarios();
    renderizarNotas();
    renderizarMetas();
    renderizarForo();
}

function iniciarRelojEnVivo() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        let diaCambio = false;

        if (appData.habitos.fumar) {
            const t = calcularTiempoTranscurrido(appData.fechasInicio.fumar);
            const elDias = document.getElementById('dias-fumar');
            const elReloj = document.getElementById('reloj-fumar');
            if (elDias && elReloj) {
                const diasPrevios = parseInt(elDias.dataset.dias || '0', 10);
                if (t.dias !== diasPrevios) diaCambio = true;
                elDias.dataset.dias = t.dias;
                elDias.innerHTML = `${t.dias} <span>${t.dias === 1 ? 'día' : 'días'}</span>`;
                elReloj.textContent = `${String(t.horas).padStart(2, '0')}h ${String(t.minutos).padStart(2, '0')}m ${String(t.segundos).padStart(2, '0')}s`;
            }
        }

        if (appData.habitos.beber) {
            const t = calcularTiempoTranscurrido(appData.fechasInicio.beber);
            const elDias = document.getElementById('dias-beber');
            const elReloj = document.getElementById('reloj-beber');
            if (elDias && elReloj) {
                const diasPrevios = parseInt(elDias.dataset.dias || '0', 10);
                if (t.dias !== diasPrevios) diaCambio = true;
                elDias.dataset.dias = t.dias;
                elDias.innerHTML = `${t.dias} <span>${t.dias === 1 ? 'día' : 'días'}</span>`;
                elReloj.textContent = `${String(t.horas).padStart(2, '0')}h ${String(t.minutos).padStart(2, '0')}m ${String(t.segundos).padStart(2, '0')}s`;
            }
        }

        if (diaCambio) {
            registrarDiaLimpioHoy();
            renderizarCalendarios();
            renderizarMetas();
        }
    }, 1000);
}

async function cargarMensajeMotivacional() {
    let mensaje = recordatoriosAliento[Math.floor(Math.random() * recordatoriosAliento.length)];
    let recordatorioCard = document.getElementById('reminder-card');
    if (!recordatorioCard) {
        recordatorioCard = document.createElement('div');
        recordatorioCard.id = 'reminder-card';
        recordatorioCard.className = 'card reminder-card';
        const purposeCard = document.querySelector('.purpose-card');
        purposeCard.parentNode.insertBefore(recordatorioCard, purposeCard);
    }

    recordatorioCard.innerHTML = `
        <h3><i class="fa-solid fa-bullhorn" style="color: #2e8b57;"></i> Mensaje de aliento</h3>
        <p style="background: #ffffff; padding: 14px; border-radius: 12px; border-left: 4px solid #2e8b57; font-size: 0.95rem; border: 1px solid var(--border);">
            ${mensaje}
        </p>
    `;
}

function renderizarContadores() {
    countersContainer.innerHTML = '';
    let badgeText = [];

    if (appData.habitos.fumar) {
        badgeText.push("Sin fumar");
        const t = calcularTiempoTranscurrido(appData.fechasInicio.fumar);
        const consejo = consejosSaludFumar[Math.floor(Math.random() * consejosSaludFumar.length)];
        const relojTxt = `${String(t.horas).padStart(2, '0')}h ${String(t.minutos).padStart(2, '0')}m ${String(t.segundos).padStart(2, '0')}s`;

        countersContainer.innerHTML += `
            <div class="counter-card">
                <div>
                    <i class="fa-solid fa-smoking-ban habit-icon" style="color: #2e8b57;"></i>
                    <h3>Días sin fumar</h3>
                    <div class="counter-number" id="dias-fumar" data-dias="${t.dias}">${t.dias} <span>${t.dias === 1 ? 'día' : 'días'}</span></div>
                    <div class="live-clock" id="reloj-fumar">${relojTxt}</div>
                    <div class="start-date-label">Inicio (GDL): ${formatearFechaHoraGDL(appData.fechasInicio.fumar)}</div>
                    <p class="card-subtitle" style="margin-top: 10px; color: #5c6d67;">💡 ${consejo}</p>
                </div>
                <div class="card-actions">
                    <button onclick="editarFechaInicio('fumar')" class="btn-edit-time">
                        <i class="fa-regular fa-clock"></i> Editar fecha y hora de inicio
                    </button>
                    <button onclick="registrarTropiezo('fumar')" class="btn-danger-sm">
                        <i class="fa-solid fa-rotate-left"></i> Tuve un tropiezo con el cigarro
                    </button>
                </div>
            </div>
        `;
    }

    if (appData.habitos.beber) {
        badgeText.push("Sin beber");
        const t = calcularTiempoTranscurrido(appData.fechasInicio.beber);
        const consejo = consejosSaludBeber[Math.floor(Math.random() * consejosSaludBeber.length)];
        const relojTxt = `${String(t.horas).padStart(2, '0')}h ${String(t.minutos).padStart(2, '0')}m ${String(t.segundos).padStart(2, '0')}s`;

        countersContainer.innerHTML += `
            <div class="counter-card">
                <div>
                    <i class="fa-solid fa-wine-bottle habit-icon" style="color: #0284c7;"></i>
                    <h3>Días sin beber</h3>
                    <div class="counter-number" id="dias-beber" data-dias="${t.dias}">${t.dias} <span>${t.dias === 1 ? 'día' : 'días'}</span></div>
                    <div class="live-clock" id="reloj-beber">${relojTxt}</div>
                    <div class="start-date-label">Inicio (GDL): ${formatearFechaHoraGDL(appData.fechasInicio.beber)}</div>
                    <p class="card-subtitle" style="margin-top: 10px; color: #5c6d67;">💡 ${consejo}</p>
                </div>
                <div class="card-actions">
                    <button onclick="editarFechaInicio('beber')" class="btn-edit-time">
                        <i class="fa-regular fa-clock"></i> Editar fecha y hora de inicio
                    </button>
                    <button onclick="registrarTropiezo('beber')" class="btn-danger-sm">
                        <i class="fa-solid fa-rotate-left"></i> Tuve un tropiezo con la bebida
                    </button>
                </div>
            </div>
        `;
    }

    activeHabitsBadge.textContent = badgeText.join(" & ");
}

function renderizarCalendarios() {
    calendarsContainer.innerHTML = '';
    if (appData.habitos.fumar) {
        calendarsContainer.innerHTML += generarHTMLCalendario('fumar', 'Calendario: días sin fumar', '#2e8b57');
    }
    if (appData.habitos.beber) {
        calendarsContainer.innerHTML += generarHTMLCalendario('beber', 'Calendario: días sin beber', '#0284c7');
    }
}

function generarHTMLCalendario(tipo, titulo, colorHex) {
    const hoyStr = obtenerFechaGDL_YYYYMMDD();
    const [yearStr, monthStr] = hoyStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const nombresMeses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    
    const primerDiaSemana = new Date(year, month, 1).getDay();
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    
    const listaTropiezos = appData.tropiezos[tipo] || [];
    const diasLimpiosGuardados = appData.historialLimpio[tipo] || [];

    let celdasHTML = `
        <div class="cal-day-name">Do</div><div class="cal-day-name">Lu</div><div class="cal-day-name">Ma</div>
        <div class="cal-day-name">Mi</div><div class="cal-day-name">Ju</div><div class="cal-day-name">Vi</div><div class="cal-day-name">Sá</div>
    `;

    for (let i = 0; i < primerDiaSemana; i++) {
        celdasHTML += `<div class="cal-day empty"></div>`;
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
        const diaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        let clases = 'cal-day';
        if (diaStr === hoyStr) clases += ' today';
        
        if (listaTropiezos.includes(diaStr)) {
            clases += ' relapse';
        } else if (diasLimpiosGuardados.includes(diaStr)) {
            clases += tipo === 'fumar' ? ' clean-fumar' : ' clean-beber';
        }

        celdasHTML += `<div class="${clases}">${dia}</div>`;
    }

    return `
        <div class="card">
            <div class="calendar-header">
                <h3 style="font-size: 1.05rem;"><i class="fa-regular fa-calendar-check" style="color: ${colorHex};"></i> ${titulo} (${nombresMeses[month]})</h3>
                <div class="calendar-legend">
                    <span><i class="legend-dot" style="background: ${colorHex};"></i>Limpio / Racha</span>
                    <span><i class="legend-dot" style="background: #fee2e2;"></i>Tropiezo</span>
                </div>
            </div>
            <div class="calendar-grid">${celdasHTML}</div>
        </div>
    `;
}

function renderizarNotas() {
    const fechas = Object.keys(appData.diario).sort().reverse();
    if (fechas.length === 0) {
        historialNotas.innerHTML = '';
        return;
    }
    historialNotas.innerHTML = '<p style="font-size: 0.85rem; font-weight: 700; color: #5c6d67; margin-top: 10px;">Notas anteriores:</p>';
    
    fechas.slice(0, 5).forEach(f => {
        historialNotas.innerHTML += `
            <div class="nota-item">
                <div class="nota-item-content">
                    <strong>${f}:</strong> ${appData.diario[f]}
                </div>
                <div class="nota-item-actions">
                    <button onclick="editarNotaDiario('${f}')" class="btn-action-sm" title="Editar nota"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="borrarNotaDiario('${f}')" class="btn-action-sm btn-delete-sm" title="Borrar nota"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

function renderizarForo() {
    foroMural.innerHTML = '';
    if (appData.foro.length === 0) {
        foroMural.innerHTML = `
            <div class="foro-empty">
                <i class="fa-regular fa-comment-dots" style="font-size: 2.2rem; margin-bottom: 10px; display: block; color: #94a3b8;"></i>
                Aún no hay publicaciones en la comunidad.<br>¡Sé el primero en compartir tu experiencia o mensaje de aliento!
            </div>
        `;
        return;
    }

    appData.foro.forEach(post => {
        const postId = post.id ? post.id : `'${post.fecha}'`;
        foroMural.innerHTML += `
            <div class="foro-post">
                <div class="foro-post-header">
                    <span class="foro-post-author"><i class="fa-solid fa-user-circle" style="color: #2e8b57;"></i> ${post.autor}</span>
                    <div class="foro-post-header-right">
                        <span><i class="fa-regular fa-clock"></i> ${post.fecha}</span>
                        <button onclick="editarPostForo(${postId})" class="btn-action-sm" title="Editar publicación"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="borrarPostForo(${postId})" class="btn-action-sm btn-delete-sm" title="Borrar publicación"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="foro-post-body">${post.mensaje}</div>
            </div>
        `;
    });
}

function renderizarMetas() {
    goalsSectionsContainer.innerHTML = '';

    if (appData.habitos.fumar) {
        goalsSectionsContainer.innerHTML += generarHTMLSeccionMetas('fumar', 'Metas de constancia: dejar de fumar', '#2e8b57');
    }

    if (appData.habitos.beber) {
        goalsSectionsContainer.innerHTML += generarHTMLSeccionMetas('beber', 'Metas de constancia: dejar de beber', '#0284c7');
    }
}

function generarHTMLSeccionMetas(tipo, tituloSeccion, colorHex) {
    const diasConsecutivos = calcularTiempoTranscurrido(appData.fechasInicio[tipo]).dias;
    let listaMetasHTML = '';
    let huboNuevaMeta = false;

    metasConfig.forEach(meta => {
        const completada = diasConsecutivos >= meta.dias;
        const faltan = meta.dias - diasConsecutivos;
        const estadoHTML = completada 
            ? `<span class="goal-status completed"><i class="fa-solid fa-check"></i> ¡Completada!</span>` 
            : `<span class="goal-status pending">Faltan ${faltan} ${faltan === 1 ? 'día' : 'días'}</span>`;

        const metaKey = `${tipo}_${meta.dias}`;
        if (completada && !appData.metasCelebradas.includes(metaKey)) {
            appData.metasCelebradas.push(metaKey);
            huboNuevaMeta = true;
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        }

        listaMetasHTML += `
            <div class="goal-item">
                <span><i class="fa-solid fa-flag-checkered" style="color: ${completada ? colorHex : '#cbd5e1'}"></i> ${meta.label} (${meta.dias} ${meta.dias === 1 ? 'día' : 'días'})</span>
                ${estadoHTML}
            </div>
        `;
    });

    if (huboNuevaMeta) {
        guardarDatos();
    }

    return `
        <div class="card goals-card">
            <h3><i class="fa-solid fa-trophy" style="color: ${colorHex};"></i> ${tituloSeccion}</h3>
            <div class="goals-list" style="margin-top: 10px;">
                ${listaMetasHTML}
            </div>
        </div>
    `;
}

function guardarDatos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}