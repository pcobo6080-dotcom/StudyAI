/* =========================================================
   STUDYAI - SCRIPT PRINCIPAL
   Compatible con el index.html actual
   ========================================================= */

"use strict";

console.log("StudyAI: script cargado correctamente.");


/* =========================================================
   UTILIDADES
   ========================================================= */

const $ = (id) => document.getElementById(id);

const STORAGE = {
    sesiones: "studyai_sesiones",
    biblioteca: "studyai_biblioteca",
    materias: "studyai_materias",
    progreso: "studyai_progreso",
    estudio: "studyai_estudio"
};

let modoActual = "preguntas";
let usuarioActual = null;
let materiaActual = null;
let filtroBibliotecaActual = "todos";
let archivosSeleccionados = [];
let ultimaGeneracion = null;


/* =========================================================
   STORAGE
   ========================================================= */

function leerStorage(clave, defecto = []) {
    try {
        const bruto = localStorage.getItem(clave);
        if (bruto === null || bruto === "") return defecto;
        const datos = JSON.parse(bruto);
        return datos ?? defecto;
    } catch (error) {
        console.warn(`StudyAI: no se pudo leer ${clave}.`, error);
        return defecto;
    }
}


function guardarStorage(clave, datos) {
    try {
        localStorage.setItem(clave, JSON.stringify(datos));
        return true;
    } catch (error) {
        console.error(`StudyAI: no se pudo guardar ${clave}.`, error);
        return false;
    }
}


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function ocultarPantallasPrincipales() {

    const pantallas = [
        "inicio",
        "login-screen",
        "editar-perfil-screen"
    ];

    pantallas.forEach(id => {
        const elemento = $(id);

        if (elemento) {
            elemento.classList.add("oculto");
        }
    });
}


function ocultarVistasApp() {

    const vistas = [
        "perfil-panel",
        "biblioteca-screen",
        "materia-screen",
        "modo-estudio"
    ];

    vistas.forEach(id => {
        const elemento = $(id);

        if (elemento) {
            elemento.classList.add("oculto");
        }
    });
}


function mostrarApp() {

    ocultarPantallasPrincipales();

    const app = $("app");

    if (app) {
        app.classList.remove("oculto");
    }
}


function abrirStudyAI() {

    console.log("Abriendo StudyAI...");

    mostrarApp();
    ocultarVistasApp();

    comprobarUsuario();
    mostrarSesiones();
    actualizarBiblioteca();
}


function volverInicio() {

    ocultarVistasApp();

    const app = $("app");

    if (app) {
        app.classList.add("oculto");
    }

    const inicio = $("inicio");

    if (inicio) {
        inicio.classList.remove("oculto");
    }
}


function mostrarLogin() {

    const app = $("app");

    if (app) {
        app.classList.add("oculto");
    }

    ocultarVistasApp();

    const inicio = $("inicio");

    if (inicio) {
        inicio.classList.add("oculto");
    }

    const login = $("login-screen");

    if (login) {
        login.classList.remove("oculto");
    }
}


function volverStudyAI() {

    const login = $("login-screen");

    if (login) {
        login.classList.add("oculto");
    }

    const inicio = $("inicio");

    if (inicio) {
        inicio.classList.remove("oculto");
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

function iniciarSesionGoogle() {

    console.log("Iniciando sesión con Google...");

    window.location.href = "/auth/google";
}


async function comprobarUsuario() {

    try {

        const respuesta = await fetch("/api/usuario", {
            credentials: "include"
        });

        if (!respuesta.ok) {
            actualizarUsuarioUI(null);
            return null;
        }

        const datos = await respuesta.json();

        usuarioActual =
            datos.usuario ||
            datos.user ||
            datos ||
            null;

        if (
            datos &&
            (
                datos.usuario ||
                datos.user ||
                datos.autenticado === true ||
                datos.loggedIn === true
            )
        ) {
            actualizarUsuarioUI(usuarioActual);
        } else {
            actualizarUsuarioUI(null);
        }

        return usuarioActual;

    } catch (error) {

        console.warn(
            "No se pudo comprobar el usuario:",
            error
        );

        actualizarUsuarioUI(null);

        return null;
    }
}


/* =========================================================
   USUARIO / PERFIL
   ========================================================= */

function obtenerNombreUsuario(usuario) {

    if (!usuario) {
        return "Usuario";
    }

    return (
        usuario.username ||
        usuario.nombre_usuario ||
        usuario.nombre ||
        usuario.name ||
        usuario.displayName ||
        "Usuario"
    );
}


function obtenerEmailUsuario(usuario) {

    if (!usuario) {
        return "";
    }

    return (
        usuario.email ||
        usuario.correo ||
        ""
    );
}


function obtenerFotoUsuario(usuario) {

    if (!usuario || typeof usuario !== "object") {
        return "/images/logo.png";
    }

    const candidatos = [
        usuario.foto,
        usuario.foto_url,
        usuario.fotoUrl,
        usuario.avatar,
        usuario.avatar_url,
        usuario.avatarUrl,
        usuario.picture,
        usuario.imagen,
        usuario.image,
        usuario.photo,
        usuario.profilePhoto,
        usuario.profile_photo,
        usuario.googlePhoto,
        usuario.google_photo
    ];

    const foto = candidatos.find(
        valor =>
            typeof valor === "string" &&
            valor.trim().length > 0
    );

    return foto || "/images/logo.png";
}


function actualizarUsuarioUI(usuario) {
    const botonLogin = $("boton-login-header");
    const botonPerfil = $("boton-perfil-header");
    const nombre = $("nombre-usuario-header");
    const fotoHeader = $("foto-usuario-header");

    if (!usuario) {
        usuarioActual = null;

        if (botonLogin) {
            botonLogin.style.display = "inline-flex";
        }

        if (botonPerfil) {
            botonPerfil.style.display = "none";
        }

        if (nombre) {
            nombre.textContent = "Usuario";
        }

        return;
    }

    usuarioActual = usuario;

    if (botonLogin) {
        botonLogin.style.display = "none";
    }

    if (botonPerfil) {
        botonPerfil.style.display = "inline-flex";
        botonPerfil.removeAttribute("hidden");
    }

    if (nombre) {
        nombre.textContent = obtenerNombreUsuario(usuario);
    }

    const foto = obtenerFotoUsuario(usuario);

    if (fotoHeader) {
        fotoHeader.onerror = function () {
            this.onerror = null;
            this.src = "/images/logo.png";
        };

        fotoHeader.src = foto;
    }

    const fotoGrande = $("perfil-foto-grande");

    if (fotoGrande) {
        fotoGrande.onerror = function () {
            this.onerror = null;
            this.src = "/images/logo.png";
        };

        fotoGrande.src = foto;
    }
}
function abrirPerfil() {

    if (!usuarioActual) {
        mostrarLogin();
        return;
    }

    ocultarVistasApp();

    const panel = $("perfil-panel");

    if (!panel) {
        return;
    }

    panel.classList.remove("oculto");

    cargarPerfilUI(usuarioActual);
}


function cerrarPerfil() {

    const panel = $("perfil-panel");

    if (panel) {
        panel.classList.add("oculto");
    }
}


function cargarPerfilUI(usuario) {

    if (!usuario) {
        return;
    }

    const nombre = obtenerNombreUsuario(usuario);
    const email = obtenerEmailUsuario(usuario);

    const username =
        usuario.username ||
        usuario.nombre_usuario ||
        nombre;

    const biografia =
        usuario.biografia ||
        usuario.bio ||
        "";

    const curso =
        usuario.curso ||
        "";

    const asignaturas =
        Array.isArray(usuario.asignaturas)
            ? usuario.asignaturas.join(", ")
            : (
                usuario.asignaturas ||
                ""
            );

    const nombreGrande = $("perfil-nombre-grande");

    if (nombreGrande) {
        nombreGrande.textContent = nombre;
    }

    const emailElemento = $("perfil-email");

    if (emailElemento) {
        emailElemento.textContent = email;
    }

    const usernameElemento = $("perfil-username");

    if (usernameElemento) {
        usernameElemento.value = username;
    }

    const bioElemento = $("perfil-biografia");

    if (bioElemento) {
        bioElemento.value = biografia;
    }

    const cursoElemento = $("perfil-curso");

    if (cursoElemento) {
        cursoElemento.value = curso;
    }

    const asignaturasElemento = $("perfil-asignaturas");

    if (asignaturasElemento) {
        asignaturasElemento.value = asignaturas;
    }

    const editarUsername = $("editar-username");

    if (editarUsername) {
        editarUsername.value = username;
    }

    const editarBio = $("editar-biografia");

    if (editarBio) {
        editarBio.value = biografia;
    }

    const editarCurso = $("editar-curso");

    if (editarCurso) {
        editarCurso.value = curso;
    }

    const editarAsignaturas = $("editar-asignaturas");

    if (editarAsignaturas) {
        editarAsignaturas.value = asignaturas;
    }
}


function editarPerfil() {

    if (!usuarioActual) {
        return;
    }

    const panel = $("perfil-panel");

    if (panel) {
        panel.classList.add("oculto");
    }

    const pantalla = $("editar-perfil-screen");

    if (pantalla) {
        pantalla.classList.remove("oculto");
    }

    cargarPerfilUI(usuarioActual);
}


function cerrarEditarPerfil() {

    const pantalla = $("editar-perfil-screen");

    if (pantalla) {
        pantalla.classList.add("oculto");
    }

    const app = $("app");

    if (app) {
        app.classList.remove("oculto");
    }

    abrirPerfil();
}


async function guardarPerfil() {

    if (!usuarioActual) {
        mostrarLogin();
        return;
    }

    const username =
        $("editar-username")?.value.trim() || "";

    const biografia =
        $("editar-biografia")?.value.trim() || "";

    const curso =
        $("editar-curso")?.value || "";

    const asignaturasTexto =
        $("editar-asignaturas")?.value.trim() || "";

    const asignaturas =
        asignaturasTexto
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);

    const perfil = {
        username,
        biografia,
        curso,
        asignaturas
    };

    try {

        const respuesta = await fetch(
            "/api/perfil",
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(perfil)
            }
        );

        if (respuesta.ok) {

            let datos = {};

            try {
                datos = await respuesta.json();
            } catch (_) {}

            usuarioActual =
                datos.usuario ||
                datos.user ||
                {
                    ...usuarioActual,
                    ...perfil
                };

        } else {

            usuarioActual = {
                ...usuarioActual,
                ...perfil
            };
        }

    } catch (error) {

        console.warn(
            "No se pudo guardar el perfil en servidor:",
            error
        );

        usuarioActual = {
            ...usuarioActual,
            ...perfil
        };
    }

    actualizarUsuarioUI(usuarioActual);

    const pantalla = $("editar-perfil-screen");

    if (pantalla) {
        pantalla.classList.add("oculto");
    }

    mostrarApp();
    abrirPerfil();

    alert("Perfil actualizado correctamente.");
}


/* =========================================================
   PUBLICIDAD
   ========================================================= */

function cerrarPublicidad() {

    const publicidad = $("studyai-publicidad");

    if (publicidad) {
        publicidad.classList.add("oculto");
    }
}


function mostrarPublicidad() {

    const publicidad = $("studyai-publicidad");

    if (publicidad) {
        publicidad.classList.remove("oculto");
    }
}


/* =========================================================
   MODOS DE GENERACIÓN
   ========================================================= */

function seleccionarModo(modo, boton = null) {
    const modosValidos = new Set(["resumen", "preguntas", "flashcards", "examen"]);
    if (!modosValidos.has(modo)) return;

    modoActual = modo;

    const tipo = $("tipo");
    if (tipo) tipo.value = modo;

    document.querySelectorAll(".modo").forEach(elemento => {
        elemento.classList.remove("activo");
    });

    if (boton) {
        boton.classList.add("activo");
        return;
    }

    const candidato = [...document.querySelectorAll(".modo")].find(elemento => {
        const onclick = elemento.getAttribute("onclick") || "";
        const dataModo = elemento.dataset.modo || "";
        return dataModo === modo || onclick.includes(`'${modo}'`) || onclick.includes(`"${modo}"`);
    });

    if (candidato) candidato.classList.add("activo");
}


/* =========================================================
   ARCHIVOS
   ========================================================= */

function seleccionarArchivos(event) {
    const input = event?.target;
    if (!input?.files) return;

    const permitidos = new Set([
        "text/plain",
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp"
    ]);

    const MAX_ARCHIVOS = 5;
    const MAX_BYTES = 10 * 1024 * 1024;
    const nuevos = [];

    for (const archivo of Array.from(input.files)) {
        const extension = archivo.name.toLowerCase().split(".").pop();
        const extensionValida = ["txt", "pdf", "png", "jpg", "jpeg", "webp"].includes(extension);

        if (!extensionValida && !permitidos.has(archivo.type)) {
            alert(`Archivo no compatible: ${archivo.name}`);
            continue;
        }

        if (archivo.size > MAX_BYTES) {
            alert(`${archivo.name} supera el límite de 10 MB.`);
            continue;
        }

        const repetido = archivosSeleccionados.some(
            actual => actual.name === archivo.name &&
                      actual.size === archivo.size &&
                      actual.lastModified === archivo.lastModified
        );

        if (!repetido) nuevos.push(archivo);
    }

    archivosSeleccionados = [...archivosSeleccionados, ...nuevos].slice(0, MAX_ARCHIVOS);

    if (Array.from(input.files).length + archivosSeleccionados.length > MAX_ARCHIVOS) {
        alert("Puedes adjuntar un máximo de 5 archivos.");
    }

    mostrarArchivosSeleccionados();
    input.value = "";
}


function eliminarArchivo(indice) {

    archivosSeleccionados.splice(
        indice,
        1
    );

    mostrarArchivosSeleccionados();
}


function mostrarArchivosSeleccionados() {
    const lista = $("archivos-seleccionados");
    const contador = $("archivos-contador");

    if (contador) contador.textContent = `${archivosSeleccionados.length}/5`;
    if (!lista) return;

    if (!archivosSeleccionados.length) {
        lista.innerHTML = "";
        return;
    }

    lista.innerHTML = archivosSeleccionados.map((archivo, indice) => {
        const tamaño = formatearTamaño(archivo.size);
        const tipo = obtenerTipoArchivo(archivo);

        return `
            <div class="archivo-item" data-indice="${indice}">
                <span aria-hidden="true">${tipo}</span>
                <div>
                    <strong title="${escaparHTML(archivo.name)}">${escaparHTML(archivo.name)}</strong>
                    <small>${escaparHTML(tamaño)}</small>
                </div>
                <button type="button"
                    onclick="eliminarArchivo(${indice})"
                    aria-label="Eliminar ${escaparHTML(archivo.name)}">×</button>
            </div>
        `;
    }).join("");
}


function obtenerTipoArchivo(archivo) {
    const nombre = String(archivo?.name || "").toLowerCase();
    if (nombre.endsWith(".pdf")) return "PDF";
    if (nombre.endsWith(".txt")) return "TXT";
    if (/\.(png|jpg|jpeg|webp)$/.test(nombre)) return "IMG";
    return "FILE";
}

function formatearTamaño(bytes) {
    const numero = Number(bytes) || 0;
    if (numero < 1024) return `${numero} B`;
    if (numero < 1024 * 1024) return `${(numero / 1024).toFixed(1)} KB`;
    return `${(numero / (1024 * 1024)).toFixed(1)} MB`;
}


/* =========================================================
   GENERADOR
   ========================================================= */

async function generar() {

    const apuntesElemento = $("apuntes");

    if (!apuntesElemento) {
        return;
    }

    let texto =
        apuntesElemento.value.trim();

    if (!texto && archivosSeleccionados.length) {

        texto =
            await extraerTextoArchivos();

    }

    if (!texto) {

        alert(
            "Escribe o adjunta tus apuntes antes de generar."
        );

        return;
    }

    const resultado = $("resultado");

    if (resultado) {

        resultado.innerHTML = `
            <div class="studyai-empty">
                <div class="studyai-empty-icon">⏳</div>
                <h3>Generando...</h3>
                <p>StudyAI está preparando tu contenido.</p>
            </div>
        `;
    }

    const tipo =
        $("tipo")?.value ||
        modoActual ||
        "preguntas";

    try {

        const respuesta =
            await fetch(
                "/api/generar",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        texto,
                        apuntes: texto,
                        tipo,
                        modo: tipo
                    })
                }
            );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {

            throw new Error(
                datos.error ||
                datos.mensaje ||
                "Error generando contenido."
            );
        }

        const contenido =
            datos.resultado ||
            datos.contenido ||
            datos.respuesta ||
            datos.texto ||
            datos.output ||
            datos.generacion ||
            "";

        if (!contenido) {
            throw new Error(
                "El servidor no devolvió contenido."
            );
        }

        ultimaGeneracion = {
            id: Date.now(),
            tipo,
            textoOriginal: texto,
            contenido,
            fecha: new Date().toISOString()
        };

        mostrarResultado(
            contenido,
            tipo
        );

        registrarSesion(
            ultimaGeneracion
        );

    } catch (error) {

        console.error(
            "Error al generar:",
            error
        );

        if (resultado) {

            resultado.innerHTML = `
                <div class="studyai-empty">
                    <div class="studyai-empty-icon">⚠️</div>

                    <h3>No se pudo generar</h3>

                    <p>
                        ${escaparHTML(
                            error.message ||
                            "Ha ocurrido un error."
                        )}
                    </p>
                </div>
            `;
        }
    }
}


async function extraerTextoArchivos() {

    let resultado = "";

    for (const archivo of archivosSeleccionados) {

        if (
            archivo.type === "text/plain" ||
            archivo.name.toLowerCase().endsWith(".txt")
        ) {

            try {

                resultado +=
                    `\n\n--- ${archivo.name} ---\n\n`;

                resultado +=
                    await archivo.text();

            } catch (error) {

                console.warn(
                    "No se pudo leer:",
                    archivo.name,
                    error
                );
            }

        } else {

            resultado +=
                `\n\n--- Archivo adjunto: ${archivo.name} ---\n\n`;

        }
    }

    return resultado.trim();
}


/* =========================================================
   MOSTRAR RESULTADO
   ========================================================= */

function mostrarResultado(contenido, tipo) {

    const resultado = $("resultado");

    if (!resultado) {
        return;
    }

    let html;

    if (typeof contenido === "object") {

        html =
            `<pre>${escaparHTML(
                JSON.stringify(
                    contenido,
                    null,
                    2
                )
            )}</pre>`;

    } else {

        html =
            convertirTextoHTML(
                String(contenido)
            );
    }

    resultado.innerHTML = `
        <div class="resultado-generado">

            <div class="resultado-cabecera">

                <span>
                    ${iconoModo(tipo)}
                </span>

                <strong>
                    ${nombreModo(tipo)}
                </strong>

            </div>

            <div class="resultado-contenido">
                ${html}
            </div>

        </div>
    `;
}


function nombreModo(tipo) {

    const nombres = {
        examen: "Examen",
        preguntas: "Preguntas",
        resumen: "Resumen",
        flashcards: "Flashcards"
    };

    return nombres[tipo] || "Contenido generado";
}


function iconoModo(tipo) {

    const iconos = {
        examen: "🎯",
        preguntas: "❓",
        resumen: "📚",
        flashcards: "🧠"
    };

    return iconos[tipo] || "✨";
}


function convertirTextoHTML(texto) {
    const limpio = String(texto ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/```(?:text|markdown|md)?/gi, "")
        .replace(/```/g, "")
        .trim();

    if (!limpio) return "<p>Sin contenido.</p>";

    const lineas = limpio.split("\n");
    const html = [];
    let lista = null;

    const cerrarLista = () => {
        if (lista === "ul") html.push("</ul>");
        if (lista === "ol") html.push("</ol>");
        lista = null;
    };

    const inline = valor => {
        let salida = escaparHTML(valor);
        salida = salida.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        salida = salida.replace(/__(.+?)__/g, "<strong>$1</strong>");
        salida = salida.replace(/`([^`]+)`/g, "<code>$1</code>");
        return salida;
    };

    for (const lineaOriginal of lineas) {
        const linea = lineaOriginal.trim();

        if (!linea) {
            cerrarLista();
            continue;
        }

        const heading = linea.match(/^#{1,3}\s+(.+)$/);
        if (heading) {
            cerrarLista();
            const nivel = Math.min(3, (linea.match(/^#+/) || [""])[0].length);
            html.push(`<h${nivel}>${inline(heading[1])}</h${nivel}>`);
            continue;
        }

        const numerada = linea.match(/^\d+[.)]\s+(.+)$/);
        if (numerada) {
            if (lista !== "ol") {
                cerrarLista();
                html.push("<ol>");
                lista = "ol";
            }
            html.push(`<li>${inline(numerada[1])}</li>`);
            continue;
        }

        const viñeta = linea.match(/^[-•·]\s+(.+)$/);
        if (viñeta) {
            if (lista !== "ul") {
                cerrarLista();
                html.push("<ul>");
                lista = "ul";
            }
            html.push(`<li>${inline(viñeta[1])}</li>`);
            continue;
        }

        cerrarLista();
        html.push(`<p>${inline(linea)}</p>`);
    }

    cerrarLista();
    return html.join("");
}


/* =========================================================
   SESIONES
   ========================================================= */

function obtenerSesiones() {

    return leerStorage(
        STORAGE.sesiones,
        []
    );
}


function registrarSesion(sesion) {
    const sesiones = obtenerSesiones();

    const nueva = {
        id: Number(sesion.id) || Date.now(),
        tipo: sesion.tipo || "preguntas",
        textoOriginal: String(sesion.textoOriginal || ""),
        contenido: sesion.contenido ?? "",
        fecha: sesion.fecha || new Date().toISOString(),
        guardadaManualmente: Boolean(sesion.guardadaManualmente)
    };

    const duplicada = sesiones.some(item =>
        String(item.textoOriginal || "") === nueva.textoOriginal &&
        String(item.tipo || "") === nueva.tipo &&
        JSON.stringify(item.contenido) === JSON.stringify(nueva.contenido)
    );

    if (!duplicada) {
        sesiones.unshift(nueva);
        guardarStorage(STORAGE.sesiones, sesiones.slice(0, 100));
    }

    mostrarSesiones();
}


function guardarSesion() {

    if (!ultimaGeneracion) {

        alert(
            "Primero genera contenido para poder guardar la sesión."
        );

        return;
    }

    registrarSesion({
        ...ultimaGeneracion,
        id: Date.now(),
        guardadaManualmente: true
    });

    alert(
        "Sesión guardada correctamente."
    );
}


function mostrarSesiones() {
    const contenedor = $("sesiones");

    if (!contenedor) {
        return;
    }

    const sesiones = obtenerSesiones();

    const busqueda =
        $("buscar-sesiones")?.value.trim().toLowerCase() || "";

    const filtro =
        $("filtro-sesiones")?.value || "todas";

    const filtradas = sesiones.filter(sesion => {
        const contenido = String(
            sesion.contenido || ""
        ).toLowerCase();

        const textoOriginal = String(
            sesion.textoOriginal || ""
        ).toLowerCase();

        const coincideBusqueda =
            !busqueda ||
            contenido.includes(busqueda) ||
            textoOriginal.includes(busqueda) ||
            nombreModo(sesion.tipo)
                .toLowerCase()
                .includes(busqueda);

        const coincideTipo =
            filtro === "todas" ||
            sesion.tipo === filtro;

        return coincideBusqueda && coincideTipo;
    });

    if (!filtradas.length) {
        contenedor.innerHTML = `
            <div class="studyai-empty sesiones-vacio">
                <div class="studyai-empty-icon">💾</div>
                <h3>No hay sesiones</h3>
                <p>
                    ${busqueda
                        ? "No hemos encontrado ninguna sesión con esa búsqueda."
                        : "Tus sesiones aparecerán aquí cuando generes contenido."
                    }
                </p>
            </div>
        `;

        return;
    }

    contenedor.innerHTML = filtradas.map(sesion => {
        const fecha = formatearFecha(sesion.fecha);

        const texto =
            String(sesion.textoOriginal || "")
                .replace(/\s+/g, " ")
                .trim();

        const descripcion =
            texto.length > 100
                ? texto.substring(0, 100) + "..."
                : texto || "Contenido generado con StudyAI.";

        return `
            <article class="sesion-item" data-sesion-id="${sesion.id}">

                <div class="sesion-info">

                    <div class="sesion-icono">
                        ${iconoModo(sesion.tipo)}
                    </div>

                    <div class="sesion-textos">

                        <strong>
                            ${escaparHTML(nombreModo(sesion.tipo))}
                        </strong>

                        <span class="sesion-descripcion">
                            ${escaparHTML(descripcion)}
                        </span>

                        <small>
                            ${escaparHTML(fecha)}
                        </small>

                    </div>

                </div>

                <div class="sesion-acciones">

                    <button
                        type="button"
                        class="sesion-btn-ver"
                        onclick="abrirSesion(${Number(sesion.id)})"
                    >
                        Ver sesión
                    </button>

                    <button
                        type="button"
                        class="sesion-btn-eliminar"
                        onclick="eliminarSesion(${Number(sesion.id)})"
                        aria-label="Eliminar sesión"
                    >
                        ×
                    </button>

                </div>

            </article>
        `;
    }).join("");
}
function abrirSesion(id) {
    const sesiones = obtenerSesiones();

    const sesion = sesiones.find(
        item => Number(item.id) === Number(id)
    );

    if (!sesion) {
        console.warn("StudyAI: sesión no encontrada:", id);
        return;
    }

    ultimaGeneracion = {
        ...sesion
    };

    const apuntes = $("apuntes");

    if (apuntes) {
        apuntes.value = sesion.textoOriginal || "";
    }

    seleccionarModo(sesion.tipo);

    mostrarResultado(
        sesion.contenido,
        sesion.tipo
    );

    const resultado = $("resultado");

    if (resultado) {
        setTimeout(() => {
            resultado.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 100);
    }
}
function eliminarSesion(id) {

    const confirmar =
        confirm(
            "¿Quieres eliminar esta sesión?"
        );

    if (!confirmar) {
        return;
    }

    const sesiones =
        obtenerSesiones()
            .filter(
                sesion => sesion.id !== id
            );

    guardarStorage(
        STORAGE.sesiones,
        sesiones
    );

    mostrarSesiones();
}


function nuevaSesion() {
    const apuntes = $("apuntes");

    if (apuntes) {
        apuntes.value = "";
    }

    archivosSeleccionados = [];

    mostrarArchivosSeleccionados();

    ultimaGeneracion = null;

    seleccionarModo("preguntas");

    const resultado = $("resultado");

    if (resultado) {
        resultado.innerHTML = `
            <div class="studyai-empty">
                <div class="studyai-empty-icon">✨</div>
                <h3>Listo para estudiar</h3>
                <p>
                    Pega tus apuntes y genera contenido con StudyAI.
                </p>
            </div>
        `;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   BIBLIOTECA
   ========================================================= */

function obtenerBiblioteca() {

    return leerStorage(
        STORAGE.biblioteca,
        []
    );
}


function guardarBiblioteca(datos) {

    guardarStorage(
        STORAGE.biblioteca,
        datos
    );

    actualizarBiblioteca();
}


function abrirBiblioteca() {

    mostrarApp();
    ocultarVistasApp();

    const pantalla =
        $("biblioteca-screen");

    if (!pantalla) {
        return;
    }

    pantalla.classList.remove("oculto");

    actualizarBiblioteca();
}


function abrirBibliotecaAgregar() {

    const modal =
        $("biblioteca-modal");

    if (!modal) {
        return;
    }

    prepararSelectMaterias();

    modal.classList.remove("oculto");
}


function cerrarBibliotecaAgregar() {

    const modal =
        $("biblioteca-modal");

    if (modal) {
        modal.classList.add("oculto");
    }
}


function prepararSelectMaterias() {

    const select =
        $("biblioteca-materia");

    if (!select) {
        return;
    }

    const materias =
        obtenerMaterias();

    select.innerHTML = `
        <option value="">
            Selecciona una materia
        </option>

        ${materias
            .map(materia => `
                <option value="${escaparHTML(materia.nombre)}">
                    ${escaparHTML(materia.nombre)}
                </option>
            `)
            .join("")}
    `;
}


function guardarMaterialBiblioteca() {

    const titulo =
        $("biblioteca-titulo")
            ?.value
            .trim();

    const materia =
        $("biblioteca-materia")
            ?.value
            .trim();

    const texto =
        $("biblioteca-texto")
            ?.value
            .trim();

    if (!titulo) {

        alert(
            "Escribe un título."
        );

        return;
    }

    if (!texto) {

        alert(
            "Escribe los apuntes."
        );

        return;
    }

    const materiales =
        obtenerBiblioteca();

    materiales.unshift({
        id: Date.now(),
        titulo,
        materia:
            materia || "Sin materia",
        texto,
        fecha:
            new Date().toISOString()
    });

    guardarBiblioteca(
        materiales
    );

    const tituloInput =
        $("biblioteca-titulo");

    const textoInput =
        $("biblioteca-texto");

    if (tituloInput) {
        tituloInput.value = "";
    }

    if (textoInput) {
        textoInput.value = "";
    }

    cerrarBibliotecaAgregar();

    alert(
        "Material guardado correctamente."
    );
}


function actualizarBiblioteca() {

    const materiales =
        obtenerBiblioteca();

    const total =
        $("biblioteca-total");

    const materias =
        $("biblioteca-materias");

    const recientes =
        $("biblioteca-recientes");

    if (total) {
        total.textContent =
            materiales.length;
    }

    if (materias) {

        const nombres =
            new Set(
                materiales
                    .map(item => item.materia)
                    .filter(Boolean)
            );

        materias.textContent =
            nombres.size;
    }

    if (recientes) {

        const limite =
            Date.now() -
            7 * 24 * 60 * 60 * 1000;

        const cantidad =
            materiales.filter(item =>
                new Date(item.fecha).getTime() >=
                limite
            ).length;

        recientes.textContent =
            cantidad;
    }

    mostrarBiblioteca();
}


function filtrarBiblioteca(filtro) {

    filtroBibliotecaActual =
        filtro;

    document
        .querySelectorAll(".biblioteca-filtro")
        .forEach(boton => {

            boton.classList.toggle(
                "activo",
                boton.dataset.filtro === filtro
            );

        });

    mostrarBiblioteca();
}


function mostrarBiblioteca() {

    const lista =
        $("biblioteca-lista");

    if (!lista) {
        return;
    }

    let materiales =
        obtenerBiblioteca();

    const busqueda =
        $("biblioteca-busqueda")
            ?.value
            .trim()
            .toLowerCase() || "";

    if (filtroBibliotecaActual === "recientes") {

        const limite =
            Date.now() -
            7 * 24 * 60 * 60 * 1000;

        materiales =
            materiales.filter(item =>
                new Date(item.fecha).getTime() >=
                limite
            );
    }

    if (busqueda) {

        materiales =
            materiales.filter(item => {

                const contenido = `
                    ${item.titulo}
                    ${item.materia}
                    ${item.texto}
                `.toLowerCase();

                return contenido.includes(
                    busqueda
                );
            });
    }

    if (!materiales.length) {

        lista.innerHTML = `
            <div class="estudio-vacio">
                <div>📚</div>
                <h3>No hay materiales</h3>
                <p>
                    Añade apuntes para empezar a construir tu biblioteca.
                </p>
            </div>
        `;

        return;
    }

    lista.innerHTML =
        materiales
            .map(item => `

                <article class="biblioteca-item">

                    <div class="biblioteca-item-icon">
                        📖
                    </div>

                    <div class="biblioteca-item-info">

                        <h3>
                            ${escaparHTML(item.titulo)}
                        </h3>

                        <p>
                            ${escaparHTML(item.materia)}
                        </p>

                        <small>
                            ${formatearFecha(item.fecha)}
                        </small>

                    </div>

                    <div class="biblioteca-item-acciones">

                        <button
                            type="button"
                            onclick="verMaterialBiblioteca(${item.id})"
                        >
                            Ver
                        </button>

                        <button
                            type="button"
                            onclick="eliminarMaterialBiblioteca(${item.id})"
                        >
                            🗑️
                        </button>

                    </div>

                </article>

            `)
            .join("");
}


function verMaterialBiblioteca(id) {

    const materiales =
        obtenerBiblioteca();

    const material =
        materiales.find(
            item => item.id === id
        );

    if (!material) {
        return;
    }

    const titulo =
        $("biblioteca-contenido-titulo");

    const materia =
        $("biblioteca-contenido-materia");

    const contenido =
        $("biblioteca-modal-contenido");

    if (titulo) {
        titulo.textContent =
            material.titulo;
    }

    if (materia) {
        materia.textContent =
            material.materia;
    }

    if (contenido) {
        contenido.innerHTML =
            convertirTextoHTML(
                material.texto
            );
    }

    const modal =
        $("biblioteca-contenido-modal");

    if (modal) {
        modal.classList.remove("oculto");
    }
}


function cerrarContenidoBiblioteca() {

    const modal =
        $("biblioteca-contenido-modal");

    if (modal) {
        modal.classList.add("oculto");
    }
}


function eliminarMaterialBiblioteca(id) {

    if (
        !confirm(
            "¿Eliminar este material?"
        )
    ) {
        return;
    }

    const materiales =
        obtenerBiblioteca()
            .filter(
                item => item.id !== id
            );

    guardarBiblioteca(
        materiales
    );
}


/* =========================================================
   MATERIAS
   ========================================================= */

function obtenerMaterias() {

    return leerStorage(
        STORAGE.materias,
        []
    );
}


function guardarMaterias(materias) {

    guardarStorage(
        STORAGE.materias,
        materias
    );
}


function crearMateria() {

    const nombre =
        prompt(
            "Nombre de la nueva materia:"
        );

    if (!nombre) {
        return;
    }

    const nombreLimpio =
        nombre.trim();

    if (!nombreLimpio) {
        return;
    }

    const materias =
        obtenerMaterias();

    const existe =
        materias.some(
            materia =>
                materia.nombre.toLowerCase() ===
                nombreLimpio.toLowerCase()
        );

    if (existe) {

        alert(
            "Esa materia ya existe."
        );

        return;
    }

    materias.push({
        id: Date.now(),
        nombre: nombreLimpio,
        progreso: 0,
        contenidos: [],
        fecha:
            new Date().toISOString()
    });

    guardarMaterias(
        materias
    );

    mostrarMaterias();
    actualizarEstadisticasEstudio();
}


function mostrarMaterias() {

    const lista =
        $("lista-materias");

    if (!lista) {
        return;
    }

    const materias =
        obtenerMaterias();

    if (!materias.length) {

        lista.innerHTML = `
            <div class="estudio-vacio">
                <div>📖</div>
                <h3>Todavía no tienes materias</h3>
                <p>
                    Crea tu primera materia para empezar a organizar tu estudio.
                </p>

                <button
                    type="button"
                    onclick="crearMateria()"
                    class="estudio-btn-principal"
                >
                    Crear materia
                </button>
            </div>
        `;

        return;
    }

    lista.innerHTML =
        materias
            .map(materia => `

                <article
                    class="materia-item"
                    onclick="abrirMateria(${materia.id})"
                >

                    <div class="materia-item-icon">
                        📚
                    </div>

                    <div class="materia-item-info">

                        <h3>
                            ${escaparHTML(materia.nombre)}
                        </h3>

                        <p>
                            ${
                                (materia.contenidos || []).length
                            } contenidos
                        </p>

                    </div>

                    <div class="materia-item-progreso">

                        <strong>
                            ${Number(materia.progreso || 0)}%
                        </strong>

                        <div class="progreso-barra">
                            <span
                                style="width:${Number(materia.progreso || 0)}%"
                            ></span>
                        </div>

                    </div>

                    <span>
                        →
                    </span>

                </article>

            `)
            .join("");
}


function abrirMateria(id) {

    const materias =
        obtenerMaterias();

    materiaActual =
        materias.find(
            materia => materia.id === id
        );

    if (!materiaActual) {
        return;
    }

    ocultarVistasApp();

    const pantalla =
        $("materia-screen");

    if (pantalla) {
        pantalla.classList.remove("oculto");
    }

    const titulo =
        $("materia-titulo");

    if (titulo) {
        titulo.textContent =
            `📚 ${materiaActual.nombre}`;
    }

    actualizarMateriaUI();
}


function cerrarMateria() {

    materiaActual = null;

    const pantalla =
        $("materia-screen");

    if (pantalla) {
        pantalla.classList.add("oculto");
    }

    abrirModoEstudio();
}


function actualizarMateriaUI() {

    if (!materiaActual) {
        return;
    }

    const contenidos =
        materiaActual.contenidos || [];

    const contador =
        $("materia-contenidos");

    if (contador) {
        contador.textContent =
            contenidos.length;
    }

    const progreso =
        $("materia-progreso");

    if (progreso) {
        progreso.textContent =
            `${Number(materiaActual.progreso || 0)}%`;
    }

    const lista =
        $("lista-contenido-materia");

    if (!lista) {
        return;
    }

    if (!contenidos.length) {

        lista.innerHTML = `
            <div class="estudio-vacio">
                <div>📝</div>
                <h3>Todavía no hay contenido</h3>
                <p>
                    Añade tus primeros apuntes para empezar.
                </p>
            </div>
        `;

        return;
    }

    lista.innerHTML =
        contenidos
            .map(contenido => `

                <article class="contenido-materia-item">

                    <div>
                        <strong>
                            ${escaparHTML(contenido.titulo)}
                        </strong>

                        <small>
                            ${formatearFecha(contenido.fecha)}
                        </small>
                    </div>

                    <button
                        type="button"
                        onclick="verContenidoMateria(${contenido.id})"
                    >
                        Ver
                    </button>

                </article>

            `)
            .join("");
}


function agregarContenidoMateria() {

    if (!materiaActual) {
        return;
    }

    const titulo =
        prompt(
            "Título del contenido:"
        );

    if (!titulo) {
        return;
    }

    const texto =
        prompt(
            "Escribe o pega tus apuntes:"
        );

    if (!texto) {
        return;
    }

    const materias =
        obtenerMaterias();

    const materia =
        materias.find(
            item =>
                item.id === materiaActual.id
        );

    if (!materia) {
        return;
    }

    if (!materia.contenidos) {
        materia.contenidos = [];
    }

    materia.contenidos.push({
        id: Date.now(),
        titulo: titulo.trim(),
        texto: texto.trim(),
        fecha:
            new Date().toISOString()
    });

    guardarMaterias(
        materias
    );

    materiaActual = materia;

    actualizarMateriaUI();
    actualizarEstadisticasEstudio();
}


function verContenidoMateria(id) {

    if (!materiaActual) {
        return;
    }

    const contenido =
        (materiaActual.contenidos || [])
            .find(item => item.id === id);

    if (!contenido) {
        return;
    }

    alert(
        `${contenido.titulo}\n\n${contenido.texto}`
    );
}


/* =========================================================
   ACCIONES DE MATERIA
   ========================================================= */

function materiaFlashcards() {

    if (!materiaActual) {
        return;
    }

    generarDesdeMateria(
        "flashcards"
    );
}


function materiaTest() {

    if (!materiaActual) {
        return;
    }

    generarDesdeMateria(
        "preguntas"
    );
}


function materiaRepasar() {

    if (!materiaActual) {
        return;
    }

    generarDesdeMateria(
        "resumen"
    );
}


async function generarDesdeMateria(tipo) {

    if (!materiaActual) {
        return;
    }

    const contenidos =
        materiaActual.contenidos || [];

    if (!contenidos.length) {

        alert(
            "Esta materia todavía no tiene contenido."
        );

        return;
    }

    const texto =
        contenidos
            .map(item =>
                `${item.titulo}\n${item.texto}`
            )
            .join("\n\n");

    const apuntes =
        $("apuntes");

    if (apuntes) {
        apuntes.value = texto;
    }

    seleccionarModo(tipo);

    mostrarApp();
    ocultarVistasApp();

    await generar();
}


/* =========================================================
   MODO ESTUDIO
   ========================================================= */

function abrirModoEstudio() {

    mostrarApp();
    ocultarVistasApp();

    const pantalla =
        $("modo-estudio");

    if (pantalla) {
        pantalla.classList.remove("oculto");
    }

    mostrarMaterias();
    actualizarEstadisticasEstudio();
    prepararRecomendacionEstudio();
}


function cerrarModoEstudio() {

    const pantalla =
        $("modo-estudio");

    if (pantalla) {
        pantalla.classList.add("oculto");
    }
}


function obtenerDatosEstudio() {

    return leerStorage(
        STORAGE.estudio,
        {
            sesiones: 0,
            racha: 0,
            ultimoDia: null
        }
    );
}


function actualizarEstadisticasEstudio() {

    const materias =
        obtenerMaterias();

    const sesiones =
        obtenerSesiones();

    const datos =
        obtenerDatosEstudio();

    const materiasElemento =
        $("estudio-materias");

    if (materiasElemento) {
        materiasElemento.textContent =
            materias.length;
    }

    const sesionesElemento =
        $("estudio-sesiones");

    if (sesionesElemento) {
        sesionesElemento.textContent =
            sesiones.length;
    }

    const rachaElemento =
        $("estudio-racha");

    if (rachaElemento) {
        rachaElemento.textContent =
            datos.racha || 0;
    }

    let progreso = 0;

    if (materias.length) {

        progreso =
            Math.round(
                materias.reduce(
                    (total, materia) =>
                        total +
                        Number(
                            materia.progreso || 0
                        ),
                    0
                ) /
                materias.length
            );
    }

    const progresoElemento =
        $("estudio-progreso");

    if (progresoElemento) {
        progresoElemento.textContent =
            `${progreso}%`;
    }
}


function prepararRecomendacionEstudio() {

    const materias =
        obtenerMaterias();

    const titulo =
        $("recomendacion-titulo");

    const descripcion =
        $("recomendacion-descripcion");

    if (!materias.length) {

        if (titulo) {
            titulo.textContent =
                "Crea tu primera materia";
        }

        if (descripcion) {
            descripcion.textContent =
                "Añade una materia para que StudyAI pueda recomendarte qué estudiar.";
        }

        return;
    }

    const materia =
        materias
            .slice()
            .sort(
                (a, b) =>
                    Number(a.progreso || 0) -
                    Number(b.progreso || 0)
            )[0];

    if (titulo) {
        titulo.textContent =
            `Repasa ${materia.nombre}`;
    }

    if (descripcion) {

        descripcion.textContent =
            materia.contenidos?.length
                ? `Tienes ${materia.contenidos.length} contenidos. Es un buen momento para continuar avanzando.`
                : "Añade contenido a esta materia para empezar a estudiarla.";
    }
}


function ejecutarRecomendacionEstudio() {

    const materias =
        obtenerMaterias();

    if (!materias.length) {

        crearMateria();
        return;
    }

    const materia =
        materias
            .slice()
            .sort(
                (a, b) =>
                    Number(a.progreso || 0) -
                    Number(b.progreso || 0)
            )[0];

    if (!materia.contenidos?.length) {

        abrirMateria(materia.id);

        return;
    }

    materiaActual = materia;

    materiaRepasar();
}


function estudioRepasar() {

    const materias =
        obtenerMaterias();

    if (!materias.length) {

        crearMateria();
        return;
    }

    abrirMateria(
        materias[0].id
    );
}


function estudioTest() {

    const materias =
        obtenerMaterias();

    if (!materias.length) {

        crearMateria();
        return;
    }

    const materia =
        materias.find(
            item =>
                item.contenidos?.length
        );

    if (!materia) {

        alert(
            "Añade contenido a una materia primero."
        );

        return;
    }

    materiaActual =
        materia;

    materiaTest();
}


function estudioFlashcards() {

    const materias =
        obtenerMaterias();

    if (!materias.length) {

        crearMateria();
        return;
    }

    const materia =
        materias.find(
            item =>
                item.contenidos?.length
        );

    if (!materia) {

        alert(
            "Añade contenido a una materia primero."
        );

        return;
    }

    materiaActual =
        materia;

    materiaFlashcards();
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }

    try {

        return new Date(fecha)
            .toLocaleDateString(
                "es-ES",
                {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                }
            );

    } catch (_) {

        return "";
    }
}


function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}



/* =========================================================
   MEJORAS DE INTERACCIÓN
   ========================================================= */

function configurarArchivos() {
    const zona = document.querySelector(".archivos-studyai");
    const input = document.querySelector("#archivos-input, #archivo-input, input[type='file']");

    if (!zona || !input) return;

    zona.addEventListener("dragover", event => {
        event.preventDefault();
        zona.classList.add("arrastrando");
    });

    zona.addEventListener("dragleave", () => {
        zona.classList.remove("arrastrando");
    });

    zona.addEventListener("drop", event => {
        event.preventDefault();
        zona.classList.remove("arrastrando");

        const archivos = event.dataTransfer?.files;
        if (!archivos?.length) return;

        seleccionarArchivos({ target: { files: archivos, value: "" } });
    });
}

function cerrarModalesConEscape(event) {
    if (event.key !== "Escape") return;

    [
        "biblioteca-modal",
        "biblioteca-contenido-modal",
        "planes-modal"
    ].forEach(id => {
        const elemento = $(id);
        if (elemento) elemento.classList.add("oculto");
    });
}

function inicializarStudyAI() {
    seleccionarModo(modoActual);

    const busquedaSesiones = $("buscar-sesiones");
    const filtroSesiones = $("filtro-sesiones");
    const busquedaBiblioteca = $("biblioteca-busqueda");

    busquedaSesiones?.addEventListener("input", mostrarSesiones);
    filtroSesiones?.addEventListener("change", mostrarSesiones);
    busquedaBiblioteca?.addEventListener("input", mostrarBiblioteca);

    document.addEventListener("keydown", cerrarModalesConEscape);
    configurarArchivos();

    mostrarArchivosSeleccionados();
    mostrarSesiones();
    actualizarBiblioteca();
    mostrarMaterias();
    comprobarUsuario();

    console.log("StudyAI: interfaz inicializada correctamente.");
}


/* =========================================================
   EVENTOS
   ========================================================= */

document.addEventListener("DOMContentLoaded", inicializarStudyAI);


/* =========================================================
   HACER FUNCIONES DISPONIBLES PARA EL HTML
   ========================================================= */

window.abrirStudyAI = abrirStudyAI;
window.volverInicio = volverInicio;

window.mostrarLogin = mostrarLogin;
window.iniciarSesionGoogle = iniciarSesionGoogle;
window.volverStudyAI = volverStudyAI;

window.abrirPerfil = abrirPerfil;
window.cerrarPerfil = cerrarPerfil;
window.editarPerfil = editarPerfil;
window.cerrarEditarPerfil = cerrarEditarPerfil;
window.guardarPerfil = guardarPerfil;

window.cerrarPublicidad = cerrarPublicidad;
window.mostrarPublicidad = mostrarPublicidad;

window.seleccionarModo = seleccionarModo;

window.obtenerTipoArchivo = obtenerTipoArchivo;

window.seleccionarArchivos = seleccionarArchivos;
window.eliminarArchivo = eliminarArchivo;

window.generar = generar;
window.guardarSesion = guardarSesion;
window.nuevaSesion = nuevaSesion;

window.abrirSesion = abrirSesion;
window.eliminarSesion = eliminarSesion;

window.abrirBiblioteca = abrirBiblioteca;
window.abrirBibliotecaAgregar = abrirBibliotecaAgregar;
window.cerrarBibliotecaAgregar = cerrarBibliotecaAgregar;
window.guardarMaterialBiblioteca = guardarMaterialBiblioteca;
window.filtrarBiblioteca = filtrarBiblioteca;
window.verMaterialBiblioteca = verMaterialBiblioteca;
window.cerrarContenidoBiblioteca = cerrarContenidoBiblioteca;
window.eliminarMaterialBiblioteca =
    eliminarMaterialBiblioteca;

window.crearMateria = crearMateria;
window.abrirMateria = abrirMateria;
window.cerrarMateria = cerrarMateria;
window.agregarContenidoMateria =
    agregarContenidoMateria;
window.verContenidoMateria =
    verContenidoMateria;

window.materiaFlashcards =
    materiaFlashcards;
window.materiaTest =
    materiaTest;
window.materiaRepasar =
    materiaRepasar;

window.abrirModoEstudio =
    abrirModoEstudio;
window.cerrarModoEstudio =
    cerrarModoEstudio;

window.ejecutarRecomendacionEstudio =
    ejecutarRecomendacionEstudio;

window.estudioRepasar =
    estudioRepasar;
window.estudioTest =
    estudioTest;
window.estudioFlashcards =
    estudioFlashcards;

console.log(
    "StudyAI: todas las funciones cargadas."
);