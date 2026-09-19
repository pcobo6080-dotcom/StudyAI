/* =========================================================
   STUDYAI - SCRIPT PRINCIPAL
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

        if (!bruto) {
            return defecto;
        }

        const datos = JSON.parse(bruto);

        return datos ?? defecto;

    } catch (error) {

        console.warn(
            "StudyAI: error leyendo " + clave,
            error
        );

        return defecto;
    }
}


function guardarStorage(clave, datos) {

    try {

        localStorage.setItem(
            clave,
            JSON.stringify(datos)
        );

        return true;

    } catch (error) {

        console.error(
            "StudyAI: error guardando " + clave,
            error
        );

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

    pantallas.forEach(function(id) {

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
        "modo-estudio",
        "generador-video-screen"
    ];

    vistas.forEach(function(id) {

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

    window.location.href = "/auth/google";
}


async function comprobarUsuario() {

    try {

        const respuesta = await fetch(
            "/api/usuario",
            {
                credentials: "include"
            }
        );

        if (!respuesta.ok) {

            actualizarUsuarioUI(null);

            return null;
        }

        const datos = await respuesta.json();

        usuarioActual =
            datos.usuario ||
            datos.user ||
            null;

        if (usuarioActual) {

            actualizarUsuarioUI(
                usuarioActual
            );

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
   USUARIO
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

    if (!usuario) {
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

    const foto = candidatos.find(function(valor) {

        return (
            typeof valor === "string" &&
            valor.trim().length > 0
        );
    });

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
        nombre.textContent =
            obtenerNombreUsuario(usuario);
    }

    const foto =
        obtenerFotoUsuario(usuario);

    if (fotoHeader) {

        fotoHeader.onerror = function() {
            this.onerror = null;
            this.src = "/images/logo.png";
        };

        fotoHeader.src = foto;
    }

    const fotoGrande =
        $("perfil-foto-grande");

    if (fotoGrande) {

        fotoGrande.onerror = function() {
            this.onerror = null;
            this.src = "/images/logo.png";
        };

        fotoGrande.src = foto;
    }
}


/* =========================================================
   PERFIL
   ========================================================= */

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

    cargarPerfilUI(
        usuarioActual
    );
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

    const nombre =
        obtenerNombreUsuario(usuario);

    const email =
        obtenerEmailUsuario(usuario);

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

    const elementos = {
        "perfil-nombre-grande": {
            propiedad: "textContent",
            valor: nombre
        },

        "perfil-email": {
            propiedad: "textContent",
            valor: email
        },

        "perfil-username": {
            propiedad: "value",
            valor: username
        },

        "perfil-biografia": {
            propiedad: "value",
            valor: biografia
        },

        "perfil-curso": {
            propiedad: "value",
            valor: curso
        },

        "perfil-asignaturas": {
            propiedad: "value",
            valor: asignaturas
        },

        "editar-username": {
            propiedad: "value",
            valor: username
        },

        "editar-biografia": {
            propiedad: "value",
            valor: biografia
        },

        "editar-curso": {
            propiedad: "value",
            valor: curso
        },

        "editar-asignaturas": {
            propiedad: "value",
            valor: asignaturas
        }
    };

    Object.keys(elementos).forEach(function(id) {

        const elemento = $(id);

        if (!elemento) {
            return;
        }

        elemento[
            elementos[id].propiedad
        ] = elementos[id].valor;
    });
}


function editarPerfil() {

    if (!usuarioActual) {
        mostrarLogin();
        return;
    }

    const panel = $("perfil-panel");

    if (panel) {
        panel.classList.add("oculto");
    }

    const pantalla =
        $("editar-perfil-screen");

    if (pantalla) {
        pantalla.classList.remove("oculto");
    }

    cargarPerfilUI(
        usuarioActual
    );
}


function cerrarEditarPerfil() {

    const pantalla =
        $("editar-perfil-screen");

    if (pantalla) {
        pantalla.classList.add("oculto");
    }

    mostrarApp();

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
            .map(function(item) {
                return item.trim();
            })
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
            "No se pudo guardar el perfil:",
            error
        );

        usuarioActual = {
            ...usuarioActual,
            ...perfil
        };
    }

    actualizarUsuarioUI(
        usuarioActual
    );

    const pantalla =
        $("editar-perfil-screen");

    if (pantalla) {
        pantalla.classList.add("oculto");
    }

    mostrarApp();

    abrirPerfil();

    alert(
        "Perfil actualizado correctamente."
    );
}


/* =========================================================
   PUBLICIDAD
   ========================================================= */

function cerrarPublicidad() {

    const publicidad =
        $("studyai-publicidad");

    if (publicidad) {
        publicidad.classList.add("oculto");
    }
}


function mostrarPublicidad() {

    const publicidad =
        $("studyai-publicidad");

    if (publicidad) {
        publicidad.classList.remove("oculto");
    }
}


/* =========================================================
   MODOS
   ========================================================= */

function seleccionarModo(
    modo,
    boton = null
) {

    const modosValidos = [
        "resumen",
        "preguntas",
        "flashcards",
        "examen"
    ];

    if (!modosValidos.includes(modo)) {
        return;
    }

    modoActual = modo;

    const tipo = $("tipo");

    if (tipo) {
        tipo.value = modo;
    }

    document
        .querySelectorAll(".modo")
        .forEach(function(elemento) {

            elemento.classList.remove(
                "activo"
            );
        });

    if (boton) {

        boton.classList.add(
            "activo"
        );

        return;
    }

    const candidatos =
        document.querySelectorAll(".modo");

    candidatos.forEach(function(elemento) {

        const dataModo =
            elemento.dataset.modo || "";

        const onclick =
            elemento.getAttribute("onclick") || "";

        if (
            dataModo === modo ||
            onclick.includes(
                "'" + modo + "'"
            ) ||
            onclick.includes(
                '"' + modo + '"'
            )
        ) {

            elemento.classList.add(
                "activo"
            );
        }
    });
}


/* =========================================================
   ARCHIVOS
   ========================================================= */

function seleccionarArchivos(event) {

    const input =
        event?.target;

    if (!input?.files) {
        return;
    }

    const MAX_ARCHIVOS = 5;
    const MAX_BYTES =
        10 * 1024 * 1024;

    const extensiones = [
        "txt",
        "pdf",
        "png",
        "jpg",
        "jpeg",
        "webp"
    ];

    const nuevos = [];

    Array.from(input.files)
        .forEach(function(archivo) {

            const extension =
                archivo.name
                    .toLowerCase()
                    .split(".")
                    .pop();

            if (!extensiones.includes(extension)) {

                alert(
                    "Archivo no compatible: " +
                    archivo.name
                );

                return;
            }

            if (archivo.size > MAX_BYTES) {

                alert(
                    archivo.name +
                    " supera el límite de 10 MB."
                );

                return;
            }

            const repetido =
                archivosSeleccionados.some(
                    function(actual) {

                        return (
                            actual.name === archivo.name &&
                            actual.size === archivo.size &&
                            actual.lastModified ===
                                archivo.lastModified
                        );
                    }
                );

            if (!repetido) {
                nuevos.push(archivo);
            }
        });

    const disponibles =
        MAX_ARCHIVOS -
        archivosSeleccionados.length;

    if (nuevos.length > disponibles) {

        alert(
            "Puedes adjuntar un máximo de 5 archivos."
        );
    }

    archivosSeleccionados =
        archivosSeleccionados
            .concat(nuevos)
            .slice(0, MAX_ARCHIVOS);

    mostrarArchivosSeleccionados();

    input.value = "";
}


function eliminarArchivo(indice) {

    if (
        indice < 0 ||
        indice >= archivosSeleccionados.length
    ) {
        return;
    }

    archivosSeleccionados.splice(
        indice,
        1
    );

    mostrarArchivosSeleccionados();
}


function mostrarArchivosSeleccionados() {

    const lista =
        $("archivos-seleccionados");

    const contador =
        $("archivos-contador");

    if (contador) {

        contador.textContent =
            archivosSeleccionados.length +
            "/5";
    }

    if (!lista) {
        return;
    }

    lista.innerHTML = "";

    archivosSeleccionados.forEach(
        function(archivo, indice) {

            const elemento =
                document.createElement("div");

            elemento.className =
                "archivo-seleccionado";

            const nombre =
                document.createElement("span");

            nombre.textContent =
                archivo.name;

            const boton =
                document.createElement("button");

            boton.type = "button";
            boton.textContent = "×";

            boton.addEventListener(
                "click",
                function() {
                    eliminarArchivo(indice);
                }
            );

            elemento.appendChild(nombre);
            elemento.appendChild(boton);

            lista.appendChild(elemento);
        }
    );
}


function obtenerTipoArchivo(archivo) {

    const nombre =
        String(
            archivo?.name || ""
        ).toLowerCase();

    if (nombre.endsWith(".pdf")) {
        return "PDF";
    }

    if (nombre.endsWith(".txt")) {
        return "TXT";
    }

    if (
        /\.(png|jpg|jpeg|webp)$/
            .test(nombre)
    ) {
        return "IMG";
    }

    return "FILE";
}


function formatearTamaño(bytes) {

    const numero =
        Number(bytes) || 0;

    if (numero < 1024) {
        return numero + " B";
    }

    if (
        numero <
        1024 * 1024
    ) {

        return (
            numero / 1024
        ).toFixed(1) + " KB";
    }

    return (
        numero /
        (1024 * 1024)
    ).toFixed(1) + " MB";
}


/* =========================================================
   GENERACIÓN IA
   ========================================================= */

async function generar() {

    const apuntesElemento =
        $("apuntes");

    if (!apuntesElemento) {
        return;
    }

    let texto =
        apuntesElemento.value.trim();

    if (
        !texto &&
        archivosSeleccionados.length
    ) {

        texto =
            await extraerTextoArchivos();
    }

    if (!texto) {

        alert(
            "Escribe o adjunta tus apuntes antes de generar."
        );

        return;
    }

    const resultado =
        $("resultado");

    if (resultado) {

        resultado.innerHTML =
            '<div class="studyai-empty">' +
                '<div class="studyai-empty-icon">⏳</div>' +
                '<h3>Generando...</h3>' +
                '<p>StudyAI está preparando tu contenido.</p>' +
            '</div>';
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
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({
                        texto: texto,
                        apuntes: texto,
                        tipo: tipo,
                        modo: tipo
                    })
                }
            );

        let datos = {};

        try {
            datos =
                await respuesta.json();
        } catch (_) {}

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
            tipo: tipo,
            textoOriginal: texto,
            contenido: contenido,
            fecha:
                new Date().toISOString()
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

            resultado.innerHTML =
                '<div class="studyai-empty">' +
                    '<div class="studyai-empty-icon">⚠️</div>' +
                    '<h3>No se pudo generar</h3>' +
                    '<p>' +
                        escaparHTML(
                            error.message ||
                            "Ha ocurrido un error."
                        ) +
                    '</p>' +
                '</div>';
        }
    }
}


async function extraerTextoArchivos() {

    let resultado = "";

    for (
        const archivo of archivosSeleccionados
    ) {

        if (
            archivo.type ===
                "text/plain" ||
            archivo.name
                .toLowerCase()
                .endsWith(".txt")
        ) {

            try {

                resultado +=
                    "\n\n--- " +
                    archivo.name +
                    " ---\n\n";

                resultado +=
                    await archivo.text();

            } catch (error) {

                console.warn(
                    "No se pudo leer " +
                    archivo.name,
                    error
                );
            }

        } else {

            resultado +=
                "\n\n--- Archivo adjunto: " +
                archivo.name +
                " ---\n\n";
        }
    }

    return resultado.trim();
}


/* =========================================================
   RESULTADO
   ========================================================= */

function mostrarResultado(
    contenido,
    tipo
) {

    const resultado =
        $("resultado");

    if (!resultado) {
        return;
    }

    let html = "";

    if (
        typeof contenido ===
        "object"
    ) {

        html =
            "<pre>" +
            escaparHTML(
                JSON.stringify(
                    contenido,
                    null,
                    2
                )
            ) +
            "</pre>";

    } else {

        html =
            convertirTextoHTML(
                String(contenido)
            );
    }

    const contenedor =
        document.createElement("div");

    contenedor.className =
        "resultado-generado";

    const cabecera =
        document.createElement("div");

    cabecera.className =
        "resultado-cabecera";

    cabecera.innerHTML =
        "<span>" +
        iconoModo(tipo) +
        "</span>" +
        "<strong>" +
        nombreModo(tipo) +
        "</strong>";

    const contenidoElemento =
        document.createElement("div");

    contenidoElemento.className =
        "resultado-contenido";

    contenidoElemento.innerHTML =
        html;

    contenedor.appendChild(
        cabecera
    );

    contenedor.appendChild(
        contenidoElemento
    );

    resultado.innerHTML = "";

    resultado.appendChild(
        contenedor
    );
}


function nombreModo(tipo) {

    const nombres = {
        examen: "Examen",
        preguntas: "Preguntas",
        resumen: "Resumen",
        flashcards: "Flashcards"
    };

    return (
        nombres[tipo] ||
        "Contenido generado"
    );
}


function iconoModo(tipo) {

    const iconos = {
        examen: "🎯",
        preguntas: "❓",
        resumen: "📚",
        flashcards: "🧠"
    };

    return (
        iconos[tipo] ||
        "✨"
    );
}


function convertirTextoHTML(texto) {

    const limpio =
        String(texto ?? "")
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/```(?:text|markdown|md)?/gi, "")
            .replace(/```/g, "")
            .trim();

    if (!limpio) {
        return "<p>Sin contenido.</p>";
    }

    const lineas =
        limpio.split("\n");

    const html = [];

    let lista = null;

    function cerrarLista() {

        if (lista === "ul") {
            html.push("</ul>");
        }

        if (lista === "ol") {
            html.push("</ol>");
        }

        lista = null;
    }

    function inline(valor) {

        let salida =
            escaparHTML(valor);

        salida =
            salida.replace(
                /\*\*(.+?)\*\*/g,
                "<strong>$1</strong>"
            );

        salida =
            salida.replace(
                /__(.+?)__/g,
                "<strong>$1</strong>"
            );

        salida =
            salida.replace(
                /`([^`]+)`/g,
                "<code>$1</code>"
            );

        return salida;
    }

    lineas.forEach(
        function(lineaOriginal) {

            const linea =
                lineaOriginal.trim();

            if (!linea) {

                cerrarLista();

                return;
            }

            const heading =
                linea.match(
                    /^#{1,3}\s+(.+)$/
                );

            if (heading) {

                cerrarLista();

                const nivel =
                    Math.min(
                        3,
                        (
                            linea.match(/^#+/) ||
                            [""]
                        )[0].length
                    );

                html.push(
                    "<h" +
                    nivel +
                    ">" +
                    inline(heading[1]) +
                    "</h" +
                    nivel +
                    ">"
                );

                return;
            }

            const numerada =
                linea.match(
                    /^\d+[.)]\s+(.+)$/
                );

            if (numerada) {

                if (lista !== "ol") {

                    cerrarLista();

                    html.push("<ol>");

                    lista = "ol";
                }

                html.push(
                    "<li>" +
                    inline(numerada[1]) +
                    "</li>"
                );

                return;
            }

            const viñeta =
                linea.match(
                    /^[-•·]\s+(.+)$/
                );

            if (viñeta) {

                if (lista !== "ul") {

                    cerrarLista();

                    html.push("<ul>");

                    lista = "ul";
                }

                html.push(
                    "<li>" +
                    inline(viñeta[1]) +
                    "</li>"
                );

                return;
            }

            cerrarLista();

            html.push(
                "<p>" +
                inline(linea) +
                "</p>"
            );
        }
    );

    cerrarLista();

    return html.join("");
}


function escaparHTML(valor) {

    const texto =
        String(valor ?? "");

    const elemento =
        document.createElement("div");

    elemento.textContent =
        texto;

    return elemento.innerHTML;
}


/* =========================================================
   SESIONES
   ========================================================= */

function registrarSesion(generacion) {

    const sesiones =
        leerStorage(
            STORAGE.sesiones,
            []
        );

    sesiones.unshift({
        id: generacion.id,
        tipo: generacion.tipo,
        fecha: generacion.fecha,
        textoOriginal:
            generacion.textoOriginal,
        contenido:
            generacion.contenido
    });

    guardarStorage(
        STORAGE.sesiones,
        sesiones.slice(0, 50)
    );

    mostrarSesiones();
}


function mostrarSesiones() {

    const contenedor =
        $("lista-sesiones");

    if (!contenedor) {
        return;
    }

    const sesiones =
        leerStorage(
            STORAGE.sesiones,
            []
        );

    if (!sesiones.length) {

        contenedor.innerHTML =
            '<div class="studyai-empty">' +
                '<div class="studyai-empty-icon">📚</div>' +
                '<h3>Aún no tienes sesiones</h3>' +
                '<p>Cuando generes contenido aparecerá aquí.</p>' +
            '</div>';

        return;
    }

    contenedor.innerHTML = "";

    sesiones.forEach(
        function(sesion) {

            const elemento =
                document.createElement("div");

            elemento.className =
                "sesion-item";

            const titulo =
                document.createElement("strong");

            titulo.textContent =
                nombreModo(
                    sesion.tipo
                );

            const fecha =
                document.createElement("span");

            fecha.textContent =
                new Date(
                    sesion.fecha
                ).toLocaleDateString(
                    "es-ES"
                );

            elemento.appendChild(
                titulo
            );

            elemento.appendChild(
                fecha
            );

            elemento.addEventListener(
                "click",
                function() {

                    mostrarResultado(
                        sesion.contenido,
                        sesion.tipo
                    );
                }
            );

            contenedor.appendChild(
                elemento
            );
        }
    );
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
}


function abrirBiblioteca() {

    mostrarApp();

    ocultarVistasApp();

    const pantalla =
        $("biblioteca-screen");

    if (!pantalla) {
        return;
    }

    pantalla.classList.remove(
        "oculto"
    );

    actualizarBiblioteca();
}


function cerrarBiblioteca() {

    const pantalla =
        $("biblioteca-screen");

    if (pantalla) {
        pantalla.classList.add(
            "oculto"
        );
    }
}


function actualizarBiblioteca() {

    const lista =
        $("lista-biblioteca");

    if (!lista) {
        return;
    }

    const biblioteca =
        obtenerBiblioteca();

    lista.innerHTML = "";

    if (!biblioteca.length) {

        lista.innerHTML =
            '<div class="studyai-empty">' +
                '<div class="studyai-empty-icon">📚</div>' +
                '<h3>Tu biblioteca está vacía</h3>' +
                '<p>Aquí podrás guardar tus materiales.</p>' +
            '</div>';

        return;
    }

    biblioteca.forEach(
        function(material) {

            const elemento =
                document.createElement("div");

            elemento.className =
                "biblioteca-item";

            elemento.textContent =
                material.titulo ||
                material.nombre ||
                "Material";

            elemento.addEventListener(
                "click",
                function() {

                    abrirContenidoBiblioteca(
                        material
                    );
                }
            );

            lista.appendChild(
                elemento
            );
        }
    );
}


function guardarEnBiblioteca(material) {

    const biblioteca =
        obtenerBiblioteca();

    biblioteca.unshift({
        id: Date.now(),
        titulo:
            material.titulo ||
            "Nuevo material",
        contenido:
            material.contenido ||
            "",
        tipo:
            material.tipo ||
            "material",
        fecha:
            new Date().toISOString()
    });

    guardarBiblioteca(
        biblioteca
    );

    actualizarBiblioteca();
}


function abrirContenidoBiblioteca(
    material
) {

    const modal =
        $("biblioteca-contenido-modal");

    if (!modal) {
        return;
    }

    const titulo =
        modal.querySelector(
            ".biblioteca-contenido-titulo"
        );

    const contenido =
        modal.querySelector(
            ".biblioteca-contenido"
        );

    if (titulo) {
        titulo.textContent =
            material.titulo ||
            "Material";
    }

    if (contenido) {

        contenido.innerHTML =
            convertirTextoHTML(
                material.contenido ||
                ""
            );
    }

    modal.classList.remove(
        "oculto"
    );
}


function cerrarContenidoBiblioteca() {

    const modal =
        $("biblioteca-contenido-modal");

    if (modal) {
        modal.classList.add(
            "oculto"
        );
    }
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


function abrirMaterias() {

    mostrarApp();

    ocultarVistasApp();

    const pantalla =
        $("materia-screen");

    if (pantalla) {

        pantalla.classList.remove(
            "oculto"
        );

        renderizarMaterias();
    }
}


function renderizarMaterias() {

    const lista =
        $("lista-materias");

    if (!lista) {
        return;
    }

    const materias =
        obtenerMaterias();

    lista.innerHTML = "";

    if (!materias.length) {

        lista.innerHTML =
            '<div class="studyai-empty">' +
                '<h3>No hay materias todavía</h3>' +
                '<p>Añade tus asignaturas para organizar tu estudio.</p>' +
            '</div>';

        return;
    }

    materias.forEach(
        function(materia) {

            const elemento =
                document.createElement("button");

            elemento.type =
                "button";

            elemento.className =
                "materia-item";

            elemento.textContent =
                materia.nombre ||
                "Materia";

            elemento.addEventListener(
                "click",
                function() {

                    materiaActual =
                        materia;

                    abrirModoEstudio(
                        materia
                    );
                }
            );

            lista.appendChild(
                elemento
            );
        }
    );
}


/* =========================================================
   MODO ESTUDIO
   ========================================================= */

function abrirModoEstudio(
    materia = null
) {

    mostrarApp();

    ocultarVistasApp();

    const pantalla =
        $("modo-estudio");

    if (!pantalla) {
        return;
    }

    pantalla.classList.remove(
        "oculto"
    );

    if (materia) {
        materiaActual =
            materia;
    }
}


function cerrarModoEstudio() {

    const pantalla =
        $("modo-estudio");

    if (pantalla) {
        pantalla.classList.add(
            "oculto"
        );
    }
}


/* =========================================================
   GENERADOR DE VÍDEOS 3D
   ========================================================= */

let video3D = {
    escena: null,
    camara: null,
    renderizador: null,
    reloj: null,
    animando: false,
    iniciado: false,
    frame: null,
    duracion: 10,
    tiempo: 0,
    tipo: "cinematico",
    formato: "16:9",
    calidad: "1080p",
    prompt: ""
};

let video3DObjetos = [];


function abrirGeneradorVideo() {

    mostrarApp();

    ocultarVistasApp();

    const pantalla =
        $("generador-video-screen");

    if (!pantalla) {

        console.warn(
            "No existe generador-video-screen."
        );

        return;
    }

    pantalla.classList.remove(
        "oculto"
    );

    actualizarContadorVideoPrompt();

    inicializarMotorVideo3D();
}


function cerrarGeneradorVideo() {

    const pantalla =
        $("generador-video-screen");

    if (pantalla) {
        pantalla.classList.add(
            "oculto"
        );
    }

    pausarVideoPreview();
}


async function cargarThreeJS() {

    if (window.THREE) {
        return window.THREE;
    }

    try {

        const THREE =
            await import(
                "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
            );

        window.THREE =
            THREE;

        return THREE;

    } catch (error) {

        console.error(
            "No se pudo cargar Three.js:",
            error
        );

        throw new Error(
            "No se pudo cargar el motor 3D."
        );
    }
}


async function inicializarMotorVideo3D() {

    const contenedor =
        $("video-preview");

    if (!contenedor) {
        return;
    }

    if (video3D.iniciado) {

        redimensionarVideo3D();

        return;
    }

    try {

        await cargarThreeJS();

        crearEscenaVideo3D(
            contenedor
        );

        video3D.iniciado =
            true;

    } catch (error) {

        console.error(
            "Error inicializando Three.js:",
            error
        );
    }
}


function crearEscenaVideo3D(
    contenedor
) {

    const THREE =
        window.THREE;

    if (!THREE) {
        return;
    }

    contenedor.innerHTML = "";

    const escena =
        new THREE.Scene();

    escena.background =
        new THREE.Color(
            0x101116
        );

    const camara =
        new THREE.PerspectiveCamera(
            55,
            contenedor.clientWidth /
                Math.max(
                    contenedor.clientHeight,
                    1
                ),
            0.1,
            1000
        );

    camara.position.set(
        8,
        5,
        10
    );

    const renderizador =
        new THREE.WebGLRenderer({
            antialias: true
        });

    renderizador.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );

    renderizador.setSize(
        contenedor.clientWidth,
        contenedor.clientHeight
    );

    renderizador.shadowMap.enabled =
        true;

    contenedor.appendChild(
        renderizador.domElement
    );

    const luz =
        new THREE.HemisphereLight(
            0xffffff,
            0x222222,
            2
        );

    escena.add(luz);

    const luzDireccional =
        new THREE.DirectionalLight(
            0xffffff,
            3
        );

    luzDireccional.position.set(
        5,
        10,
        5
    );

    luzDireccional.castShadow =
        true;

    escena.add(
        luzDireccional
    );

    const suelo =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                100,
                100
            ),
            new THREE.MeshStandardMaterial({
                color: 0x22252b
            })
        );

    suelo.rotation.x =
        -Math.PI / 2;

    suelo.receiveShadow =
        true;

    escena.add(
        suelo
    );

    video3D.escena =
        escena;

    video3D.camara =
        camara;

    video3D.renderizador =
        renderizador;

    video3D.reloj =
        new THREE.Clock();

    redimensionarVideo3D();

    animarVideo3D();
}


function redimensionarVideo3D() {

    if (
        !video3D.camara ||
        !video3D.renderizador
    ) {
        return;
    }

    const contenedor =
        $("video-preview");

    if (!contenedor) {
        return;
    }

    const ancho =
        Math.max(
            contenedor.clientWidth,
            1
        );

    const alto =
        Math.max(
            contenedor.clientHeight,
            1
        );

    video3D.camara.aspect =
        ancho / alto;

    video3D.camara.updateProjectionMatrix();

    video3D.renderizador.setSize(
        ancho,
        alto
    );
}


function animarVideo3D() {

    if (
        !video3D.renderizador ||
        !video3D.escena ||
        !video3D.camara
    ) {
        return;
    }

    video3D.frame =
        requestAnimationFrame(
            animarVideo3D
        );

    const delta =
        video3D.reloj
            ? video3D.reloj.getDelta()
            : 0.016;

    if (video3D.animando) {

        video3D.tiempo +=
            delta;

        if (
            video3D.tiempo >=
            video3D.duracion
        ) {

            video3D.tiempo =
                video3D.duracion;

            video3D.animando =
                false;
        }

        actualizarTimelineVideo();
    }

    video3D.renderizador.render(
        video3D.escena,
        video3D.camara
    );
}


function construirEscenaDesdePrompt(
    prompt
) {

    const THREE =
        window.THREE;

    if (
        !THREE ||
        !video3D.escena
    ) {
        return;
    }

    limpiarEscenaVideo3D();

    const texto =
        prompt.toLowerCase();

    if (
        texto.includes("tren")
    ) {

        crearTrenVideo3D();

    } else if (
        texto.includes("ciudad") ||
        texto.includes("edificios")
    ) {

        crearCiudadVideo3D();

    } else {

        crearCiudadVideo3D();
    }

    if (
        texto.includes("nieve")
    ) {

        crearNieveVideo3D();
    }

    video3D.prompt =
        prompt;
}


function limpiarEscenaVideo3D() {

    video3DObjetos.forEach(
        function(objeto) {

            if (
                objeto.parent
            ) {

                objeto.parent.remove(
                    objeto
                );
            }
        }
    );

    video3DObjetos = [];
}


function crearCiudadVideo3D() {

    const THREE =
        window.THREE;

    if (!THREE) {
        return;
    }

    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const altura =
            2 +
            Math.random() * 7;

        const edificio =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2,
                    altura,
                    2
                ),
                new THREE.MeshStandardMaterial({
                    color:
                        0x30343c
                })
            );

        const x =
            (i % 4) * 4 - 6;

        const z =
            Math.floor(i / 4) * -4;

        edificio.position.set(
            x,
            altura / 2,
            z
        );

        edificio.castShadow =
            true;

        edificio.receiveShadow =
            true;

        video3D.escena.add(
            edificio
        );

        video3DObjetos.push(
            edificio
        );
    }
}


function crearTrenVideo3D() {

    const THREE =
        window.THREE;

    if (!THREE) {
        return;
    }

    const tren =
        new THREE.Group();

    const cuerpo =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                5,
                1.5,
                2
            ),
            new THREE.MeshStandardMaterial({
                color: 0x7b2020
            })
        );

    cuerpo.position.y =
        1.2;

    tren.add(
        cuerpo
    );

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const rueda =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.5,
                    0.5,
                    0.35,
                    24
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x151515
                })
            );

        rueda.rotation.z =
            Math.PI / 2;

        rueda.position.set(
            -1.5 + i,
            0.5,
            1.05
        );

        tren.add(
            rueda
        );
    }

    tren.position.set(
        0,
        0,
        4
    );

    video3D.escena.add(
        tren
    );

    video3DObjetos.push(
        tren
    );
}


function crearNieveVideo3D() {

    const THREE =
        window.THREE;

    if (!THREE) {
        return;
    }

    const grupo =
        new THREE.Group();

    const geometria =
        new THREE.SphereGeometry(
            0.035,
            6,
            6
        );

    const material =
        new THREE.MeshBasicMaterial({
            color: 0xffffff
        });

    for (
        let i = 0;
        i < 500;
        i++
    ) {

        const particula =
            new THREE.Mesh(
                geometria,
                material
            );

        particula.position.set(
            (Math.random() - 0.5) * 30,
            Math.random() * 15,
            (Math.random() - 0.5) * 30
        );

        grupo.add(
            particula
        );
    }

    video3D.escena.add(
        grupo
    );

    video3DObjetos.push(
        grupo
    );
}


async function generarVideo3D() {

    const prompt =
        $("video-prompt");

    if (!prompt) {
        return;
    }

    const texto =
        prompt.value.trim();

    if (!texto) {

        alert(
            "Describe primero el vídeo que quieres crear."
        );

        prompt.focus();

        return;
    }

    video3D.prompt =
        texto;

    video3D.duracion =
        Number(
            $("video-duracion")?.value ||
            10
        );

    video3D.calidad =
        $("video-calidad")?.value ||
        "1080p";

    try {

        if (!video3D.iniciado) {

            await inicializarMotorVideo3D();
        }

        construirEscenaDesdePrompt(
            texto
        );

        const titulo =
            $("video-escena-titulo");

        if (titulo) {

            titulo.textContent =
                "Escena generada";
        }

        video3D.tiempo =
            0;

        const timeline =
            $("video-timeline");

        if (timeline) {

            timeline.max =
                video3D.duracion;

            timeline.value =
                0;
        }

        actualizarTimelineVideo();

        reiniciarVideoPreview();

        console.log(
            "StudyAI: vídeo 3D generado."
        );

    } catch (error) {

        console.error(
            "Error generando vídeo 3D:",
            error
        );

        alert(
            "No se pudo generar la escena 3D."
        );
    }
}


function reproducirVideoPreview() {

    video3D.animando =
        true;
}


function pausarVideoPreview() {

    video3D.animando =
        false;
}


function reiniciarVideoPreview() {

    video3D.tiempo =
        0;

    video3D.animando =
        false;

    actualizarTimelineVideo();
}


function actualizarTimelineVideo() {

    const timeline =
        $("video-timeline");

    const actual =
        $("video-tiempo-actual");

    const total =
        $("video-tiempo-total");

    if (timeline) {
        timeline.value =
            video3D.tiempo;
    }

    if (actual) {
        actual.textContent =
            formatearTiempoVideo(
                video3D.tiempo
            );
    }

    if (total) {
        total.textContent =
            formatearTiempoVideo(
                video3D.duracion
            );
    }
}


function formatearTiempoVideo(
    segundos
) {

    const total =
        Math.max(
            0,
            Math.floor(
                Number(segundos) || 0
            )
        );

    const minutos =
        Math.floor(
            total / 60
        );

    const segundosRestantes =
        total % 60;

    return (
        String(minutos).padStart(2, "0") +
        ":" +
        String(
            segundosRestantes
        ).padStart(2, "0")
    );
}


function seleccionarTipoVideo(
    tipo,
    boton
) {

    video3D.tipo =
        tipo;

    document
        .querySelectorAll(
            "[data-video-tipo]"
        )
        .forEach(
            function(elemento) {

                elemento.classList.remove(
                    "activo"
                );
            }
        );

    if (boton) {
        boton.classList.add(
            "activo"
        );
    }
}


function seleccionarFormatoVideo(
    formato,
    boton
) {

    video3D.formato =
        formato;

    document
        .querySelectorAll(
            "[data-video-formato]"
        )
        .forEach(
            function(elemento) {

                elemento.classList.remove(
                    "activo"
                );
            }
        );

    if (boton) {
        boton.classList.add(
            "activo"
        );
    }
}


function actualizarContadorVideoPrompt() {

    const prompt =
        $("video-prompt");

    const contador =
        $("video-prompt-contador");

    if (!prompt || !contador) {
        return;
    }

    contador.textContent =
        prompt.value.length +
        "/1000";
}


function usarPromptVideo(
    texto
) {

    const prompt =
        $("video-prompt");

    if (!prompt) {
        return;
    }

    prompt.value =
        texto;

    actualizarContadorVideoPrompt();

    prompt.focus();
}


function pantallaCompletaVideo() {

    const preview =
        $("video-preview");

    if (!preview) {
        return;
    }

    if (
        document.fullscreenElement
    ) {

        document.exitFullscreen();

    } else {

        preview.requestFullscreen();
    }
}


function descargarVideoGenerado() {

    alert(
        "La exportación de vídeo está preparada para una fase posterior. Actualmente puedes previsualizar la escena 3D."
    );
}


/* =========================================================
   EVENTOS
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "StudyAI: DOM cargado."
        );

        const prompt =
            $("video-prompt");

        if (prompt) {

            prompt.addEventListener(
                "input",
                actualizarContadorVideoPrompt
            );
        }

        window.addEventListener(
            "resize",
            redimensionarVideo3D
        );

        comprobarUsuario();
        mostrarSesiones();
        actualizarBiblioteca();
    }
);


/* =========================================================
   EXPONER FUNCIONES PARA index.html
   ========================================================= */

window.abrirStudyAI =
    abrirStudyAI;

window.volverInicio =
    volverInicio;

window.mostrarLogin =
    mostrarLogin;

window.volverStudyAI =
    volverStudyAI;

window.iniciarSesionGoogle =
    iniciarSesionGoogle;

window.abrirPerfil =
    abrirPerfil;

window.cerrarPerfil =
    cerrarPerfil;

window.editarPerfil =
    editarPerfil;

window.cerrarEditarPerfil =
    cerrarEditarPerfil;

window.guardarPerfil =
    guardarPerfil;

window.cerrarPublicidad =
    cerrarPublicidad;

window.mostrarPublicidad =
    mostrarPublicidad;

window.seleccionarModo =
    seleccionarModo;

window.seleccionarArchivos =
    seleccionarArchivos;

window.eliminarArchivo =
    eliminarArchivo;

window.generar =
    generar;

window.abrirBiblioteca =
    abrirBiblioteca;

window.cerrarBiblioteca =
    cerrarBiblioteca;

window.abrirModoEstudio =
    abrirModoEstudio;

window.cerrarModoEstudio =
    cerrarModoEstudio;

window.abrirGeneradorVideo =
    abrirGeneradorVideo;

window.cerrarGeneradorVideo =
    cerrarGeneradorVideo;

window.generarVideo3D =
    generarVideo3D;

window.reproducirVideoPreview =
    reproducirVideoPreview;

window.pausarVideoPreview =
    pausarVideoPreview;

window.reiniciarVideoPreview =
    reiniciarVideoPreview;

window.pantallaCompletaVideo =
    pantallaCompletaVideo;

window.seleccionarTipoVideo =
    seleccionarTipoVideo;

window.seleccionarFormatoVideo =
    seleccionarFormatoVideo;

window.usarPromptVideo =
    usarPromptVideo;

window.descargarVideoGenerado =
    descargarVideoGenerado;

console.log(
    "StudyAI: funciones globales preparadas."
);