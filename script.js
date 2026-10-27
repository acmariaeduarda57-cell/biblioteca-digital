
// --- ESTADO Y DATOS INICIALES ---
const KEY_LIBROS = 'bib_libros';
const KEY_PRESTAMOS = 'bib_prestamos';
const KEY_TEMA = 'bib_tema';
const KEY_USUARIO = 'bib_usuario';
const KEY_ORDEN = 'bib_orden';

let libros = [];
let prestamos = [];
let usuarioNombre = '';
let ordenActual = { campo: 'titulo', dir: 'asc' };

// --- UTILIDADES ---
const hoyStr = () => new Date().toISOString().split('T')[0];
const sumarDias = (fechaStr, dias) => {
    const fecha = new Date(fechaStr + 'T00:00:00');
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split('T')[0];
};
const formatearFecha = (fechaStr) => {

    const [a, m, d] = fechaStr.split('-');
    return `${d}/${m}/${a}`;
};
const calcularDiasRetraso = (fechaLimite) => {
    const hoy = new Date(hoyStr() + 'T00:00:00');
    const limite = new Date(fechaLimite + 'T00:00:00');
    const diff = hoy - limite;
    return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
};
const normalizarTexto = (txt) => txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// --- LÓGICA DE NEGOCIO ---
const getPrestamoActivo = (idLibro) => prestamos.find(p => p.idLibro === idLibro && p.fechaDevolucion === null);
const getPrestamosActivos = () => 

prestamos.filter(p => p.fechaDevolucion === null);
const estaVencido = (prestamo) => prestamo.fechaDevolucion === null && prestamo.fechaLimite < hoyStr();

const crearLibro = (datos) => {
    const nuevo = {
        id: crypto.randomUUID(),
        titulo: datos.titulo.trim(),
        autor: datos.autor.trim(),
        anio: parseInt(datos.anio),
        genero: datos.genero,
        comentario: datos.comentario ? datos.comentario.trim() : '',
        coleccion: datos.coleccion
    };
    libros.push(nuevo);
    guardarDatos();
    return nuevo;
};

const actualizarLibro = (id, datos) => {
    const index = libros.findIndex(l => l.id === id);
    if (index !== -1) {
        libros[index] = { ...libros[index], ...datos, anio: parseInt(datos.anio) };
        guardarDatos();
    }
};

const eliminarLibro = (id) => {
    libros = libros.filter(l => l.id !== id);
    prestamos = prestamos.filter(p => p.idLibro !== id);
    guardarDatos();
};

const prestarLibro = (idLibro, persona) => {
    if (getPrestamosActivos().length >= 3) return { ok: false, msg: "Máximo 3 préstamos activos permitidos." };
    if (getPrestamoActivo(idLibro)) return { ok: false, msg: "El libro ya está prestado." };
    
    const nuevoPrestamo = {
        id: crypto.randomUUID(),
        idLibro: idLibro,
        persona: persona.trim(),
        fechaPrestamo: hoyStr(),
        fechaLimite: sumarDias(hoyStr(), 14),
        fechaDevolucion: null
    };
    prestamos.push(nuevoPrestamo);
    guardarDatos();
    return { ok: true };
};

const devolverLibro = (idPrestamo) => {
    const prestamo = prestamos.find(p => p.id === idPrestamo);
    if (prestamo) {
        prestamo.fechaDevolucion = hoyStr();
        guardarDatos();
        return 

calcularDiasRetraso(prestamo.fechaLimite);
    }
    return 0;
};

const validarLibro = (datos, idEditando = null) => {
    const errores = {};
    if (!datos.titulo || datos.titulo.trim().length < 3 || datos.titulo.trim().length > 60) errores.titulo = "Título debe tener entre 3 y 60 caracteres.";
    if (!datos.autor || datos.autor.trim() === '') errores.autor = "Autor no puede estar vacío.";
    if (!datos.anio || isNaN(datos.anio) || datos.anio < 1000 || datos.anio > 2026) errores.anio = "Año debe estar entre 1000 y 2026.";
    
    const duplicado = libros.find(l => 

        l.id !== idEditando && 
        normalizarTexto(l.titulo) === normalizarTexto(datos.titulo) && 
        normalizarTexto(l.autor) === normalizarTexto(datos.autor)
    );
    if (duplicado) errores.titulo = "Ya existe un libro con este título y autor.";
    
    return errores;
};

// --- PERSISTENCIA ---
const guardarDatos = () => {
    localStorage.setItem(KEY_LIBROS, JSON.stringify(libros));
    localStorage.setItem(KEY_PRESTAMOS, JSON.stringify(prestamos));
};


const inicializarDatos = () => {
    const hoy = hoyStr();
    libros = [
        { id: "l1", titulo: "El nombre de la rosa", autor: "Umberto Eco", anio: 1980, genero: "Misterio", coleccion: false },
        { id: "l2", titulo: "Orgullo y prejuicio", autor: "Jane Austen", anio: 1813, genero: "Romance", coleccion: false },
        { id: "l3", titulo: "1984", autor: "George Orwell", anio: 1949, genero: "Ciencia Ficción", coleccion: false },
        { id: "l4", titulo: "Matar a un ruiseñor", autor: "Harper Lee", anio: 1960, genero: "Drama", coleccion: false },
        { id: "l5", titulo: "La sombra del viento", autor: "Carlos Ruiz Zafón", anio: 2001, genero: "Misterio", coleccion: false },
        { id: "l6", titulo: "El arte de la guerra", autor: "Sun Tzu", anio: 500, genero: "Filosofía", coleccion: true },
        { id: "l7", titulo: "Meditaciones", autor: "Marco Aurelio", anio: 180, genero: "Filosofía", coleccion: true },
        { id: "l8", titulo: "Fahrenheit 451", autor: "Ray Bradbury", anio: 1953, genero: "Ciencia Ficción", coleccion: false }
    ];

    prestamos = [
        // Préstamo activo VENCIDO (l2 - Orgullo y prejuicio)
        { id: "p1", idLibro: "l2", persona: "Elena", fechaPrestamo: sumarDias(hoy, -20), fechaLimite: sumarDias(hoy, -6), fechaDevolucion: null },
        
        // Préstamo activo A TIEMPO (l8 - Fahrenheit 451)
        { id: "p2", idLibro: "l8", persona: "Roberto", fechaPrestamo: sumarDias(hoy, -2), fechaLimite: sumarDias(hoy, 12), fechaDevolucion: null },
        

        // Préstamo DEVUELTO A TIEMPO (l3 - 1984)
        { id: "p3", idLibro: "l3", persona: "Lucía", fechaPrestamo: sumarDias(hoy, -10), fechaLimite: sumarDias(hoy, 4), fechaDevolucion: sumarDias(hoy, -5) },
        
        // Préstamo DEVUELTO CON RETRASO (l1 - El nombre de la rosa)
        { id: "p4", idLibro: "l1", persona: "Javier", fechaPrestamo: sumarDias(hoy, -30), fechaLimite: sumarDias(hoy, -16), fechaDevolucion: sumarDias(hoy, -10) }
    ];
    
    guardarDatos();
};


const cargarDatos = () => {
    const l = localStorage.getItem(KEY_LIBROS);
    const p = localStorage.getItem(KEY_PRESTAMOS);
    usuarioNombre = localStorage.getItem(KEY_USUARIO) || '';
    const ordenGuardado = localStorage.getItem(KEY_ORDEN);
    
    if (ordenGuardado) ordenActual = JSON.parse(ordenGuardado);
    
    if (l && p) {
        libros = JSON.parse(l);

        prestamos = JSON.parse(p);
    } else {
        inicializarDatos();
    }
    
    document.getElementById('nombre-usuario').value = usuarioNombre;
    const tema = localStorage.getItem(KEY_TEMA);
    if (tema === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
};

// --- INTERFAZ / RENDERIZADO ---
const mostrarVista = (idVista) => {
    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.getElementById(`vista-${idVista}`).classList.add('activa');
    
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === idVista);
    });
};

const actualizarBotonOrden = () => {
    const btn = document.getElementById('btn-orden');
    btn.textContent = ordenActual.dir === 'asc' ? 'Ascendente' : 'Descendente';
    btn.dataset.orden = ordenActual.dir;
    document.getElementById('ordenar-por').value = ordenActual.campo;
};


const renderMenu = () => {
    const activos = getPrestamosActivos().length;
    document.getElementById('contador-prestamos').textContent = activos;
    
    const saludoSpan = document.getElementById('saludo-usuario');
    // Aquí comprobamos que el nombre exista y no esté vacío
    if (usuarioNombre && usuarioNombre.trim() !== '') {
        saludoSpan.textContent = `Hola, ${usuarioNombre.trim()}`;
        saludoSpan.classList.remove('saludo-oculto');
    } else {
        saludoSpan.textContent = '';
        saludoSpan.classList.add('saludo-oculto');
    }

};


const renderCatalogo = () => {
    const busqueda = normalizarTexto(document.getElementById('busqueda').value);
    const filtroEstado = document.querySelector('.filtro-btn.active').dataset.filtro;
    const filtroGenero = document.getElementById('filtro-genero').value;
    
    const generos = [...new Set(libros.map(l => l.genero))].sort();
    const selectGen = document.getElementById('filtro-genero');
    const valActual = selectGen.value;

    selectGen.innerHTML = '<option value="todos">Todos los géneros</option>' + generos.map(g => `<option value="${g}">${g}</option>`).join('');
    selectGen.value = generos.includes(valActual) ? valActual : 'todos';

    let filtrados = libros.filter(libro => {
        const coincideBusqueda = normalizarTexto(libro.titulo).includes(busqueda) || normalizarTexto(libro.autor).includes(busqueda);
        const coincideGenero = filtroGenero === 'todos' || libro.genero === filtroGenero;
        const prestamoActivo = getPrestamoActivo(libro.id);
        
        let coincideEstado = true;
        if (filtroEstado === 'disponibles') coincideEstado = !libro.coleccion && !prestamoActivo;
        if (filtroEstado === 'prestados') coincideEstado = !!prestamoActivo;
        
        return coincideBusqueda && coincideGenero && coincideEstado;
    });

    filtrados.sort((a, b) => {
        let valA = a[ordenActual.campo];
        let valB = b[ordenActual.campo];
        if (typeof valA === 'string') valA = normalizarTexto(valA);
        if (typeof valB === 'string') valB = normalizarTexto(valB);
        
        if (valA < valB) return ordenActual.dir === 'asc' ? -1 : 1;
        if (valA > valB) return ordenActual.dir === 'asc' ? 1 : -1;
        return 0;
    });


    document.getElementById('contador-libros').textContent = `Mostrando ${filtrados.length} de ${libros.length} libros`;
    
    const contenedor = document.getElementById('lista-libros');
    contenedor.innerHTML = '';
    
    filtrados.forEach(libro => {
        const prestamo = getPrestamoActivo(libro.id);
        const esColeccion = libro.coleccion;
        const estaPrestado = !!prestamo;
        const vencido = prestamo && estaVencido(prestamo);
        
        const div = document.createElement('div');
        div.className = `tarjeta ${estaPrestado ? 'prestado' : ''} ${esColeccion ? 'coleccion' : ''}`;

        
        let estadoTxt = 'Disponible';
        let detalleTxt = '';
        let btnPrestarDisabled = '';
        
        if (esColeccion) {
            estadoTxt = 'De colección';
            btnPrestarDisabled = 'disabled';
        } else if (estaPrestado) {
            estadoTxt = `Prestado a ${prestamo.persona}`;
            detalleTxt = `<p>Devolver antes del ${formatearFecha(prestamo.fechaLimite)}</p>`;
            if (vencido) detalleTxt += `<span class="etiqueta-vencido">Vencido (${calcularDiasRetraso(prestamo.fechaLimite)} días)</span>`;
        }

        div.innerHTML = `
            <h3>${libro.titulo}</h3>
            <p>${libro.autor} (${libro.anio})</p>

            <p><strong>${libro.genero}</strong></p>
            <p>Estado: <strong>${estadoTxt}</strong></p>
            ${detalleTxt}
            <div class="acciones-tarjeta">
                ${estaPrestado 
                    ? `<button class="btn-devolver" data-id="${prestamo.id}">Devolver</button>`
                    : `<button class="btn-prestar" data-id="${libro.id}" ${btnPrestarDisabled}>Prestar</button>`
                }
                <button class="btn-editar" data-id="${libro.id}">Editar</button>
                <button class="btn-eliminar" data-id="${libro.id}">Eliminar</button>
            </div>
        `;
        contenedor.appendChild(div);
    });

};

const renderPrestamos = () => {
    const activos = getPrestamosActivos().sort((a,b) => a.fechaLimite.localeCompare(b.fechaLimite));
    const contActivos = document.getElementById('lista-prestamos-activos');
    const msgActivos = document.getElementById('mensaje-prestamos');
    
    contActivos.innerHTML = '';
    if (activos.length === 0) {
        msgActivos.textContent = "No hay préstamos activos.";
        msgActivos.classList.remove('oculto');
    } else {
        msgActivos.classList.add('oculto');
        activos.forEach(p => {

            const libro = libros.find(l => l.id === p.idLibro);
            if (!libro) return;
            const vencido = estaVencido(p);
            const dias = vencido ? calcularDiasRetraso(p.fechaLimite) : 0;
            
            const div = document.createElement('div');
            div.className = 'prestamo-item';
            div.innerHTML = `
                <div>
                    <strong>${libro.titulo}</strong> - ${p.persona}<br>
                    Límite: ${formatearFecha(p.fechaLimite)}
                    ${vencido ? `<span class="etiqueta-vencido">Vencido (${dias} días de retraso)</span>` : ''}
                </div>
                <button class="btn-devolver" data-id="${p.id}">Devolver</button>

            `;
            contActivos.appendChild(div);
        });
    }

    const historial = prestamos.filter(p => p.fechaDevolucion !== null).sort((a,b) => b.fechaDevolucion.localeCompare(a.fechaDevolucion));
    const contHist = document.getElementById('lista-historial');
    const msgHist = document.getElementById('mensaje-historial');
    
    contHist.innerHTML = '';
    if (historial.length === 0) {
        msgHist.textContent = "El historial está vacío.";
        msgHist.classList.remove('oculto');
    } else {
        msgHist.classList.add('oculto');

        historial.forEach(p => {
            const libro = libros.find(l => l.id === p.idLibro);
            if (!libro) return;
            let diffTiempo = new Date(p.fechaDevolucion) - new Date(p.fechaLimite);
            let diasTarde = Math.floor(diffTiempo / (1000 * 60 * 60 * 24));
            const devueltoTarde = p.fechaDevolucion > p.fechaLimite;
            
            const div = document.createElement('div');
            div.className = 'historial-item';
            div.innerHTML = `
                <div>
                    <strong>${libro.titulo}</strong> - ${p.persona}<br>
                    Prestado: ${formatearFecha(p.fechaPrestamo)} | Devuelto: ${formatearFecha(p.fechaDevolucion)}<br>
                    ${devueltoTarde ? `<span class="etiqueta-vencido">Con retraso (${diasTarde} días)</span>` : '<span>A tiempo</span>'}
                </div>
            `;
            contHist.appendChild(div);
        });
    }
};

const renderResumen = () => {
    document.getElementById('res-total').textContent = libros.length;
    document.getElementById('res-disponibles').textContent = libros.filter(l => !l.coleccion && !getPrestamoActivo(l.id)).length;
    document.getElementById('res-prestados').textContent = getPrestamosActivos().length;

    document.getElementById('res-vencidos').textContent = getPrestamosActivos().filter(p => estaVencido(p)).length;
    
    const generos = {};
    libros.forEach(l => generos[l.genero] = (generos[l.genero] || 0) + 1);
    const listaGen = document.getElementById('res-generos');
    listaGen.innerHTML = '';
    for (const [gen, cant] of Object.entries(generos)) {
        const li = document.createElement('li');
        li.textContent = `${gen}: ${cant}`;
        listaGen.appendChild(li);
    }
};

const actualizarTodo = () => {
    renderMenu();
    renderCatalogo();

    renderPrestamos();
    renderResumen();
};

// --- EVENTOS Y MANEJO DEL DOM ---
const resetFormulario = () => {
    document.getElementById('form-libro').reset();
    document.getElementById('libro-id').value = '';
    document.getElementById('titulo-formulario').textContent = "Agregar Nuevo Libro";
    document.getElementById('btn-submit').textContent = "Agregar Libro";
    document.getElementById('btn-cancelar-edicion').classList.add('oculto');
    document.getElementById('contador-comentario').textContent = "120 restantes";
    document.querySelectorAll('.error').forEach(el => el.textContent = '');

};

// Función auxiliar para mostrar mensaje de devolución
const mostrarMensajeDevolucion = (diasRetraso) => {
    const contenedor = document.getElementById('vista-prestamos');
    let msg = document.getElementById('mensaje-devolucion-temporal');
    if (!msg) {
        msg = document.createElement('p');
        msg.id = 'mensaje-devolucion-temporal';
        msg.style.padding = '1rem';
        msg.style.marginBottom = '1rem';
        msg.style.borderRadius = '4px';
        msg.style.fontWeight = 'bold';
        contenedor.insertBefore(msg, contenedor.firstChild);

    }
    
    if (diasRetraso > 0) {
        msg.textContent = `Libro devuelto con ${diasRetraso} días de retraso.`;
        msg.style.backgroundColor = '#efebe9';
        msg.style.color = '#4e342e';
        msg.style.border = '1px solid #a1887f';
    } else {
        msg.textContent = "Libro devuelto a tiempo.";
        msg.style.backgroundColor = '#e8f5e9';
        msg.style.color = '#2e7d32';
        msg.style.border = '1px solid #81c784';
    }
    
    setTimeout(() => { msg.remove(); }, 4000);
};

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    actualizarBotonOrden();
    actualizarTodo();

    // Navegación
    document.getElementById('menu-principal').addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-btn')) {
            mostrarVista(e.target.dataset.view);
        }
    });

    // Tema
    document.getElementById('btn-tema').addEventListener('click', () => {
        const root = document.documentElement;
        const esOscuro = root.getAttribute('data-theme') === 'dark';
        if (esOscuro) {

            root.removeAttribute('data-theme');
            localStorage.setItem(KEY_TEMA, 'light');
        } else {
            root.setAttribute('data-theme', 'dark');
            localStorage.setItem(KEY_TEMA, 'dark');
        }
    });

    // Filtros Catálogo
    document.getElementById('busqueda').addEventListener('input', renderCatalogo);
    document.querySelector('.filtros').addEventListener('click', (e) => {
        if (e.target.classList.contains('filtro-btn')) {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));

            e.target.classList.add('active');
            renderCatalogo();
        }
    });
    document.getElementById('filtro-genero').addEventListener('change', renderCatalogo);
    
    // Orden
    document.getElementById('ordenar-por').addEventListener('change', (e) => {
        ordenActual.campo = e.target.value;
        localStorage.setItem(KEY_ORDEN, JSON.stringify(ordenActual));
        renderCatalogo();
    });
    
    document.getElementById('btn-orden').addEventListener('click', (e) => {
        ordenActual.dir = ordenActual.dir === 'asc' ? 'desc' : 'asc';
        localStorage.setItem(KEY_ORDEN, 

JSON.stringify(ordenActual));
        actualizarBotonOrden();
        renderCatalogo();
    });

    // Acciones Catálogo (Delegación)
    document.getElementById('lista-libros').addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (e.target.classList.contains('btn-editar')) {
            const libro = libros.find(l => l.id === id);
            if (libro) {
                document.getElementById('libro-id').value = libro.id;
                document.getElementById('titulo').value = libro.titulo;
                document.getElementById('autor').value = libro.autor;

                document.getElementById('anio').value = libro.anio;
                document.getElementById('genero').value = libro.genero;
                document.getElementById('comentario').value = libro.comentario || '';
                document.getElementById('coleccion').checked = libro.coleccion;
                
                document.getElementById('titulo-formulario').textContent = "Editar Libro";
                document.getElementById('btn-submit').textContent = "Guardar cambios";
                document.getElementById('btn-cancelar-edicion').classList.remove('oculto');
                mostrarVista('formulario');
            }

        } else if (e.target.classList.contains('btn-eliminar')) {
            const libro = libros.find(l => l.id === id);
            const prestamo = getPrestamoActivo(id);
            const modal = document.getElementById('modal-eliminar');
            const texto = document.getElementById('modal-eliminar-texto');
            
            if (prestamo) {
                texto.innerHTML = `No se puede eliminar "<strong>${libro.titulo}</strong>" porque tiene un préstamo activo.`;
                document.getElementById('btn-confirmar-eliminar').classList.add('oculto');
            } else {
                texto.innerHTML = `¿Eliminar 

"<strong>${libro.titulo}</strong>"? Esta acción borrará también su historial.`;
                document.getElementById('btn-confirmar-eliminar').classList.remove('oculto');
            }
            modal.classList.remove('oculto');
            modal.dataset.id = id;
        } else if (e.target.classList.contains('btn-prestar')) {
            const libro = libros.find(l => l.id === id);
            if (libro.coleccion) return;
            
            const modal = document.getElementById('modal-prestamo');
            document.getElementById('modal-prestamo-libro').textContent = `Libro: ${libro.titulo}`;
            document.getElementById('input-persona').value = usuarioNombre || '';
            document.getElementById('error-persona').textContent = '';
            modal.classList.remove('oculto');
            modal.dataset.id = id;
            document.getElementById('input-persona').focus();
        } else if (e.target.classList.contains('btn-devolver')) {
            const diasRetraso = devolverLibro(id);
            actualizarTodo();
            mostrarMensajeDevolucion(diasRetraso);
            mostrarVista('prestamos');
        }
    });

    // Escuchar los clics en la lista de PRÉSTAMOS ACTIVOS (Delegación)
    document.getElementById('lista-prestamos-activos').addEventListener('click', (e) => {

        if (e.target.classList.contains('btn-devolver')) {
            const idPrestamo = e.target.dataset.id;
            const diasRetraso = devolverLibro(idPrestamo);
            actualizarTodo();
            mostrarMensajeDevolucion(diasRetraso);
            mostrarVista('prestamos');
        }
    });

    // Modal Préstamo
    document.getElementById('btn-cancelar-prestamo').addEventListener('click', () => {
        document.getElementById('modal-prestamo').classList.add('oculto');
    });
    
    document.getElementById('btn-confirmar-prestamo').addEventListener('click', () => {
        const modal = document.getElementById('modal-prestamo');
        const idLibro = modal.dataset.id;
        const persona = document.getElementById('input-persona').value;
        const errorSpan = document.getElementById('error-persona');
        
        if (persona.trim().length < 2 || persona.trim().length > 40) {
            errorSpan.textContent = "El nombre debe tener entre 2 y 40 caracteres.";
            return;
        }
        
        const resultado = prestarLibro(idLibro, persona);
        if (resultado.ok) {
            modal.classList.add('oculto');

            actualizarTodo();
        } else {
            errorSpan.textContent = resultado.msg;
        }
    });

    // Modal Eliminar
    document.getElementById('btn-cancelar-eliminar').addEventListener('click', () => {
        document.getElementById('modal-eliminar').classList.add('oculto');
    });
    
    document.getElementById('btn-confirmar-eliminar').addEventListener('click', () => {
        const modal = document.getElementById('modal-eliminar');
        eliminarLibro(modal.dataset.id);
        modal.classList.add('oculto');

        actualizarTodo();
    });

    // Formulario
    document.getElementById('comentario').addEventListener('input', (e) => {
        const restantes = 120 - e.target.value.length;
        document.getElementById('contador-comentario').textContent = `${restantes} restantes`;
    });

    document.getElementById('form-libro').addEventListener('submit', (e) => {
        e.preventDefault();
        const idEditando = document.getElementById('libro-id').value;
        const datos = {
            titulo: document.getElementById('titulo').value,
            autor: 

document.getElementById('autor').value,
            anio: document.getElementById('anio').value,
            genero: document.getElementById('genero').value,
            comentario: document.getElementById('comentario').value,
            coleccion: document.getElementById('coleccion').checked
        };

        if (idEditando) {
            const libroOrig = libros.find(l => l.id === idEditando);
            if (libroOrig && getPrestamoActivo(idEditando) && datos.coleccion) {
                document.getElementById('error-coleccion').textContent = "No se puede marcar como colección un libro prestado.";

                return;
            }
        }

        const errores = validarLibro(datos, idEditando || null);
        document.querySelectorAll('.error').forEach(el => el.textContent = '');
        
        if (Object.keys(errores).length > 0) {
            for (const [campo, msg] of Object.entries(errores)) {
                const span = document.getElementById(`error-${campo}`);
                if (span) span.textContent = msg;
            }
            const primerCampo = Object.keys(errores)[0];
            const input = document.getElementById(primerCampo);

            if (input) input.focus();
            return;
        }

        if (idEditando) {
            actualizarLibro(idEditando, datos);
        } else {
            crearLibro(datos);
        }
        
        document.getElementById('mensaje-exito-form').textContent = idEditando ? "Libro actualizado correctamente." : "Libro agregado correctamente.";
        document.getElementById('mensaje-exito-form').classList.remove('oculto');
        
        resetFormulario();
        actualizarTodo();
    });

    document.getElementById('btn-cancelar-edicion').addEventListener('click', () => {
        resetFormulario();
        document.getElementById('mensaje-exito-form').classList.add('oculto');
    });

    // Ajustes
    document.getElementById('nombre-usuario').addEventListener('input', (e) => {
        usuarioNombre = e.target.value;
        localStorage.setItem(KEY_USUARIO, usuarioNombre);
        renderMenu();
    });

    document.getElementById('btn-restablecer').addEventListener('click', () => {
        localStorage.removeItem(KEY_LIBROS);
        localStorage.removeItem(KEY_PRESTAMOS);

        location.reload(); 
    });

    // Manejo de Tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modalPrestamo = document.getElementById('modal-prestamo');
            const modalEliminar = document.getElementById('modal-eliminar');
            
            if (!modalPrestamo.classList.contains('oculto')) {
                modalPrestamo.classList.add('oculto');
                return;
            }
            if (!

modalEliminar.classList.contains('oculto')) {
                modalEliminar.classList.add('oculto');
                return;
            }
            
            resetFormulario();
        }
    });
});
