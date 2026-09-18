require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const express = require("express");
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { GoogleGenAI } = require("@google/genai");
const db = require("./database.js");

// =========================================================
// CONFIGURACIÓN GENERAL
// =========================================================

const app = express();

const PORT =
    Number(process.env.PORT) || 3000;

const carpetaPrincipal =
    path.join(__dirname, "..");

// =========================================================
// ARCHIVOS ADJUNTOS
// =========================================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        files: 5,
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {

        const tiposPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
            "text/plain"
        ];

        if (!tiposPermitidos.includes(file.mimetype)) {

            return cb(
                new Error(
                    "Tipo de archivo no permitido. Usa JPG, PNG, WEBP, PDF o TXT."
                )
            );
        }

        cb(null, true);
    }
});

// =========================================================
// JSON
// =========================================================

app.use(
    express.json({
        limit: "2mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb"
    })
);

// =========================================================
// SESIONES
// =========================================================

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            "studyai-clave-temporal",

        resave: false,

        saveUninitialized: false,

        cookie: {
            maxAge:
                1000 *
                60 *
                60 *
                24 *
                7,

            httpOnly: true,

            sameSite: "lax",

            secure: false
        }
    })
);

// =========================================================
// PASSPORT
// =========================================================

app.use(
    passport.initialize()
);

app.use(
    passport.session()
);

// =========================================================
// SERIALIZAR USUARIO
// =========================================================

passport.serializeUser(
    function (usuario, done) {

        done(
            null,
            usuario.id
        );
    }
);

// =========================================================
// DESERIALIZAR USUARIO
// =========================================================

passport.deserializeUser(
    function (id, done) {

        try {

            const usuario =
                db
                    .prepare(
                        "SELECT * FROM usuarios WHERE id = ?"
                    )
                    .get(id);

            if (!usuario) {

                return done(
                    null,
                    false
                );
            }

            done(
                null,
                usuario
            );

        } catch (error) {

            console.error(
                "Error recuperando usuario:",
                error
            );

            done(error);
        }
    }
);

// =========================================================
// GOOGLE OAUTH
// =========================================================

const googleConfigurado =
    Boolean(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET
    );

if (!googleConfigurado) {

    console.warn("");
    console.warn(
        "⚠️ GOOGLE LOGIN NO CONFIGURADO"
    );
    console.warn(
        "Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en server/.env"
    );
    console.warn("");

} else {

    const callbackURL =
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/auth/google/callback";

    console.log(
        "Google OAuth callback:",
        callbackURL
    );

    passport.use(
        new GoogleStrategy(
            {
                clientID:
                    process.env.GOOGLE_CLIENT_ID,

                clientSecret:
                    process.env.GOOGLE_CLIENT_SECRET,

                callbackURL:
                    callbackURL
            },

            async function (
                accessToken,
                refreshToken,
                profile,
                done
            ) {

                try {

                    const id =
                        String(profile.id);

                    const nombre =
                        profile.displayName ||
                        "";

                    const email =
                        profile.emails &&
                        profile.emails[0]
                            ? profile.emails[0].value
                            : "";

                    const foto =
                        profile.photos &&
                        profile.photos[0]
                            ? profile.photos[0].value
                            : "";

                    const usuarioExistente =
                        db
                            .prepare(
                                "SELECT * FROM usuarios WHERE id = ?"
                            )
                            .get(id);

                    if (!usuarioExistente) {

                        db
                            .prepare(`
                                INSERT INTO usuarios (
                                    id,
                                    nombre,
                                    email,
                                    foto
                                )
                                VALUES (?, ?, ?, ?)
                            `)
                            .run(
                                id,
                                nombre,
                                email,
                                foto
                            );

                    } else {

                        db
                            .prepare(`
                                UPDATE usuarios
                                SET
                                    nombre = ?,
                                    email = ?,
                                    foto = ?
                                WHERE id = ?
                            `)
                            .run(
                                nombre,
                                email,
                                foto,
                                id
                            );
                    }

                    const usuario =
                        db
                            .prepare(
                                "SELECT * FROM usuarios WHERE id = ?"
                            )
                            .get(id);

                    done(
                        null,
                        usuario
                    );

                } catch (error) {

                    console.error(
                        "Error guardando usuario:",
                        error
                    );

                    done(error);
                }
            }
        )
    );
}

// =========================================================
// LOGIN GOOGLE
// =========================================================

app.get(
    "/auth/google",

    function (req, res, next) {

        if (!googleConfigurado) {

            return res
                .status(500)
                .send(`
                    <h1>StudyAI</h1>
                    <h2>Google Login no está configurado</h2>
                    <p>
                        Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET
                        en server/.env.
                    </p>
                `);
        }

        passport.authenticate(
            "google",
            {
                scope: [
                    "profile",
                    "email"
                ]
            }
        )(req, res, next);
    }
);

// =========================================================
// CALLBACK GOOGLE
// =========================================================

app.get(
    "/auth/google/callback",

    function (req, res, next) {

        if (!googleConfigurado) {

            return res.redirect("/");
        }

        passport.authenticate(
            "google",
            {
                failureRedirect: "/"
            }
        )(req, res, next);
    },

    function (req, res) {

        res.redirect("/");
    }
);

// =========================================================
// API USUARIO
// =========================================================

app.get(
    "/api/usuario",

    function (req, res) {

        if (!req.user) {

            return res.json({
                conectado: false,
                usuario: null
            });
        }

        res.json({
            conectado: true,
            usuario: req.user
        });
    }
);

// =========================================================
// FOTO DE PERFIL
// =========================================================

app.get(
    "/api/foto-perfil",

    async function (req, res) {

        try {

            if (
                !req.user ||
                !req.user.foto
            ) {

                return res
                    .status(404)
                    .end();
            }

            const respuesta =
                await fetch(
                    req.user.foto
                );

            if (!respuesta.ok) {

                console.error(
                    "Error obteniendo foto:",
                    respuesta.status
                );

                return res
                    .status(502)
                    .end();
            }

            const tipo =
                respuesta.headers.get(
                    "content-type"
                ) ||
                "image/jpeg";

            const datos =
                Buffer.from(
                    await respuesta.arrayBuffer()
                );

            res.setHeader(
                "Content-Type",
                tipo
            );

            res.setHeader(
                "Cache-Control",
                "private, max-age=3600"
            );

            res.send(datos);

        } catch (error) {

            console.error(
                "Error sirviendo foto:",
                error
            );

            res
                .status(500)
                .end();
        }
    }
);

// =========================================================
// REQUIERE LOGIN
// =========================================================

function requiereLogin(
    req,
    res,
    next
) {

    if (!req.user) {

        return res
            .status(401)
            .json({
                ok: false,
                error:
                    "Necesitas iniciar sesión."
            });
    }

    next();
}

// =========================================================
// LISTAR SESIONES
// =========================================================

app.get(
    "/api/sesiones",

    requiereLogin,

    function (req, res) {

        try {

            const sesiones =
                db
                    .prepare(`
                        SELECT
                            id,
                            tipo,
                            titulo,
                            apuntes,
                            resultado,
                            fecha
                        FROM sesiones
                        WHERE usuario_id = ?
                        ORDER BY id DESC
                    `)
                    .all(
                        req.user.id
                    );

            res.json({
                ok: true,
                sesiones
            });

        } catch (error) {

            console.error(
                "Error cargando sesiones:",
                error
            );

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudieron cargar las sesiones."
                });
        }
    }
);

// =========================================================
// GUARDAR SESIÓN
// =========================================================

app.post(
    "/api/sesiones",

    requiereLogin,

    function (req, res) {

        try {

            const tipo =
                String(
                    req.body.tipo || ""
                ).trim();

            const titulo =
                String(
                    req.body.titulo || ""
                ).trim();

            const apuntes =
                String(
                    req.body.apuntes || ""
                ).trim();

            const resultado =
                String(
                    req.body.resultado || ""
                ).trim();

            const tiposPermitidos = [
                "resumen",
                "preguntas",
                "flashcards",
                "examen"
            ];

            if (
                !tiposPermitidos.includes(tipo)
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "Tipo de sesión no válido."
                    });
            }

            if (
                !apuntes ||
                !resultado
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "Faltan datos para guardar la sesión."
                    });
            }

            const fecha =
                new Date()
                    .toLocaleString(
                        "es-ES"
                    );

            const insert =
                db
                    .prepare(`
                        INSERT INTO sesiones (
                            usuario_id,
                            tipo,
                            titulo,
                            apuntes,
                            resultado,
                            fecha
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                    `)
                    .run(
                        req.user.id,
                        tipo,
                        titulo,
                        apuntes,
                        resultado,
                        fecha
                    );

            res.json({
                ok: true,
                id:
                    insert.lastInsertRowid
            });

        } catch (error) {

            console.error(
                "Error guardando sesión:",
                error
            );

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudo guardar la sesión."
                });
        }
    }
);

// =========================================================
// ABRIR SESIÓN
// =========================================================

app.get(
    "/api/sesiones/:id",

    requiereLogin,

    function (req, res) {

        try {

            const sesion =
                db
                    .prepare(`
                        SELECT
                            id,
                            tipo,
                            titulo,
                            apuntes,
                            resultado,
                            fecha
                        FROM sesiones
                        WHERE id = ?
                        AND usuario_id = ?
                    `)
                    .get(
                        req.params.id,
                        req.user.id
                    );

            if (!sesion) {

                return res
                    .status(404)
                    .json({
                        ok: false,
                        error:
                            "Sesión no encontrada."
                    });
            }

            res.json({
                ok: true,
                sesion
            });

        } catch (error) {

            console.error(
                "Error cargando sesión:",
                error
            );

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudo cargar la sesión."
                });
        }
    }
);

// =========================================================
// ELIMINAR SESIÓN
// =========================================================

app.delete(
    "/api/sesiones/:id",

    requiereLogin,

    function (req, res) {

        try {

            const resultado =
                db
                    .prepare(`
                        DELETE FROM sesiones
                        WHERE id = ?
                        AND usuario_id = ?
                    `)
                    .run(
                        req.params.id,
                        req.user.id
                    );

            if (
                resultado.changes === 0
            ) {

                return res
                    .status(404)
                    .json({
                        ok: false,
                        error:
                            "Sesión no encontrada."
                    });
            }

            res.json({
                ok: true
            });

        } catch (error) {

            console.error(
                "Error eliminando sesión:",
                error
            );

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudo eliminar la sesión."
                });
        }
    }
);

// =========================================================
// GUARDAR PERFIL
// =========================================================

app.post(
    "/api/perfil",

    requiereLogin,

    function (req, res) {

        try {

            const username =
                String(
                    req.body.username || ""
                ).trim();

            const biografia =
                String(
                    req.body.biografia || ""
                ).trim();

            const curso =
                String(
                    req.body.curso || ""
                ).trim();

            const asignaturas =
                String(
                    req.body.asignaturas || ""
                ).trim();

            if (!username) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "El nombre de usuario es obligatorio."
                    });
            }

            if (
                username.length < 3 ||
                username.length > 20
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "El nombre de usuario debe tener entre 3 y 20 caracteres."
                    });
            }

            if (
                !/^[a-zA-Z0-9_.-]+$/.test(
                    username
                )
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos."
                    });
            }

            const otroUsuario =
                db
                    .prepare(`
                        SELECT id
                        FROM usuarios
                        WHERE username = ?
                        AND id != ?
                    `)
                    .get(
                        username,
                        req.user.id
                    );

            if (otroUsuario) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "Ese nombre de usuario ya está ocupado."
                    });
            }

            db
                .prepare(`
                    UPDATE usuarios
                    SET
                        username = ?,
                        biografia = ?,
                        curso = ?,
                        asignaturas = ?
                    WHERE id = ?
                `)
                .run(
                    username,
                    biografia,
                    curso,
                    asignaturas,
                    req.user.id
                );

            const usuarioActualizado =
                db
                    .prepare(
                        "SELECT * FROM usuarios WHERE id = ?"
                    )
                    .get(
                        req.user.id
                    );

            res.json({
                ok: true,
                usuario:
                    usuarioActualizado
            });

        } catch (error) {

            console.error(
                "Error guardando perfil:",
                error
            );

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudo guardar el perfil."
                });
        }
    }
);

// =========================================================
// CERRAR SESIÓN
// =========================================================

app.get(
    "/auth/logout",

    function (req, res) {

        req.logout(
            function (error) {

                if (error) {

                    console.error(
                        "Error cerrando sesión:",
                        error
                    );

                    return res.redirect("/");
                }

                req.session.destroy(
                    function (error) {

                        if (error) {

                            console.error(
                                "Error destruyendo sesión:",
                                error
                            );
                        }

                        res.clearCookie(
                            "connect.sid"
                        );

                        res.redirect("/");
                    }
                );
            }
        );
    }
);

// =========================================================
// ADMIN
// =========================================================

function esAdministrador(req) {

    return Boolean(
        req.user &&
        Number(req.user.admin) === 1
    );
}

// =========================================================
// LISTAR PATROCINADORES - ADMIN
// =========================================================

app.get(
    "/api/admin/patrocinadores",

    function (req, res) {

        if (!esAdministrador(req)) {

            return res
                .status(403)
                .json({
                    ok: false,
                    error:
                        "No tienes permisos de administrador."
                });
        }

        try {

            const patrocinadores =
                db
                    .prepare(`
                        SELECT
                            id,
                            nombre,
                            descripcion,
                            logo,
                            enlace,
                            activo,
                            fecha_creacion
                        FROM patrocinadores
                        ORDER BY id DESC
                    `)
                    .all();

            res.json({
                ok: true,
                patrocinadores
            });

        } catch (error) {

            console.error(
                "Error cargando patrocinadores:",
                error
            );

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudieron cargar los patrocinadores."
                });
        }
    }
);

// =========================================================
// AÑADIR PATROCINADOR - ADMIN
// =========================================================

app.post(
    "/api/admin/patrocinadores",

    function (req, res) {

        if (!esAdministrador(req)) {

            return res
                .status(403)
                .json({
                    ok: false,
                    error:
                        "No tienes permisos de administrador."
                });
        }

        try {

            const nombre =
                String(
                    req.body.nombre || ""
                ).trim();

            const descripcion =
                String(
                    req.body.descripcion || ""
                ).trim();

            const logo =
                String(
                    req.body.logo || ""
                ).trim();

            const enlace =
                String(
                    req.body.enlace || ""
                ).trim();

            if (!nombre) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "El nombre del patrocinador es obligatorio."
                    });
            }

            if (
                nombre.length > 100
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "El nombre del patrocinador es demasiado largo."
                    });
            }

            const fechaCreacion =
                new Date().toISOString();

            const resultado =
                db
                    .prepare(`
                        INSERT INTO patrocinadores (
                            nombre,
                            descripcion,
                            logo,
                            enlace,
                            activo,
                            fecha_creacion
                        )
                        VALUES (?, ?, ?, ?, 1, ?)
                    `)
                    .run(
                        nombre,
                        descripcion,
                        logo,
                        enlace,
                        fechaCreacion
                    );

            res.json({
                ok: true,
                id:
                    resultado.lastInsertRowid
            });

        } catch (error) {

            console.error(
                "Error creando patrocinador:",
                error
            );

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudo crear el patrocinador."
                });
        }
    }
);

// =========================================================
// ACTIVAR / DESACTIVAR PATROCINADOR
// =========================================================

app.patch(
    "/api/admin/patrocinadores/:id",

    function (req, res) {

        if (!esAdministrador(req)) {

            return res
                .status(403)
                .json({
                    ok: false,
                    error:
                        "No tienes permisos de administrador."
                });
        }

        try {

            const id =
                Number(req.params.id);

            const activo =
                req.body.activo ? 1 : 0;

            if (!Number.isInteger(id)) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "ID de patrocinador no válido."
                    });
            }

            const resultado =
                db
                    .prepare(`
                        UPDATE patrocinadores
                        SET activo = ?
                        WHERE id = ?
                    `)
                    .run(
                        activo,
                        id
                    );

            if (
                resultado.changes === 0
            ) {

                return res
                    .status(404)
                    .json({
                        ok: false,
                        error:
                            "Patrocinador no encontrado."
                    });
            }

            res.json({
                ok: true
            });

        } catch (error) {

            console.error(
                "Error modificando patrocinador:",
                error
            );

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudo modificar el patrocinador."
                });
        }
    }
);

// =========================================================
// ELIMINAR PATROCINADOR
// =========================================================

app.delete(
    "/api/admin/patrocinadores/:id",

    function (req, res) {

        if (!esAdministrador(req)) {

            return res
                .status(403)
                .json({
                    ok: false,
                    error:
                        "No tienes permisos de administrador."
                });
        }

        try {

            const id =
                Number(req.params.id);

            if (!Number.isInteger(id)) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "ID de patrocinador no válido."
                    });
            }

            const resultado =
                db
                    .prepare(`
                        DELETE FROM patrocinadores
                        WHERE id = ?
                    `)
                    .run(id);

            if (
                resultado.changes === 0
            ) {

                return res
                    .status(404)
                    .json({
                        ok: false,
                        error:
                            "Patrocinador no encontrado."
                    });
            }

            res.json({
                ok: true
            });

        } catch (error) {

            console.error(
                "Error eliminando patrocinador:",
                error
            );

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudo eliminar el patrocinador."
                });
        }
    }
);

// =========================================================
// PATROCINADORES PÚBLICOS
// =========================================================

app.get(
    "/api/patrocinadores",

    function (req, res) {

        try {

            const patrocinadores =
                db
                    .prepare(`
                        SELECT
                            id,
                            nombre,
                            descripcion,
                            logo,
                            enlace
                        FROM patrocinadores
                        WHERE activo = 1
                        ORDER BY id DESC
                    `)
                    .all();

            res.json({
                ok: true,
                patrocinadores
            });

        } catch (error) {

            console.error(
                "Error cargando patrocinadores:",
                error
            );

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudieron cargar los patrocinadores."
                });
        }
    }
);

// =========================================================
// GEMINI
// =========================================================

const apiKey =
    process.env.GEMINI_API_KEY;

if (!apiKey) {

    console.error(
        "ERROR: No se encontró GEMINI_API_KEY en server/.env"
    );

    process.exit(1);
}

const ai =
    new GoogleGenAI({
        apiKey
    });

const GEMINI_MODEL =
    process.env.GEMINI_MODEL ||
    "gemini-3.6-flash";

// =========================================================
// GENERACIONES ILIMITADAS
// =========================================================

function registrarGeneracion(usuario) {
    // Las generaciones de StudyAI son ilimitadas.
    // No se aplica ningún límite diario.
    return true;
}

// =========================================================
// ESPERAR
// =========================================================

function esperar(ms) {

    return new Promise(
        function (resolve) {

            setTimeout(
                resolve,
                ms
            );
        }
    );
}

// =========================================================
// GENERAR CON GEMINI
// =========================================================

async function generarConGemini(
    prompt,
    archivos = [],
    intentos = 3
) {

    const partes = [
        {
            text: prompt
        }
    ];

    for (
        const archivo of archivos
    ) {

        if (
            archivo.mimetype ===
            "text/plain"
        ) {

            const textoArchivo =
                archivo.buffer.toString(
                    "utf-8"
                );

            partes.push({
                text:
                    "\n\nCONTENIDO DEL ARCHIVO " +
                    archivo.originalname +
                    ":\n\n" +
                    textoArchivo
            });

            continue;
        }

        partes.push({
            inlineData: {
                mimeType:
                    archivo.mimetype,

                data:
                    archivo.buffer.toString(
                        "base64"
                    )
            }
        });
    }

    for (
        let intento = 1;
        intento <= intentos;
        intento++
    ) {

        try {

            const respuesta =
                await ai.models.generateContent({
                    model:
                        GEMINI_MODEL,

                    contents: [
                        {
                            role: "user",

                            parts:
                                partes
                        }
                    ]
                });

            const texto =
                respuesta &&
                typeof respuesta.text ===
                    "string"
                    ? respuesta.text
                    : "";

            if (
                !texto.trim()
            ) {

                throw new Error(
                    "Gemini no devolvió texto."
                );
            }

            return texto;

        } catch (error) {

            console.error(
                `Error Gemini, intento ${intento}/${intentos}:`,
                error.message
            );

            const codigo =
                error.status ||
                error.code;

            const reintentable =
                codigo === 429 ||
                codigo === 500 ||
                codigo === 502 ||
                codigo === 503 ||
                codigo === 504;

            if (
                reintentable &&
                intento < intentos
            ) {

                await esperar(
                    intento * 2000
                );

                continue;
            }

            throw error;
        }
    }

    throw new Error(
        "No se pudo generar contenido."
    );
}

// =========================================================
// LIMPIAR TEXTO
// =========================================================

function limpiarTexto(
    texto
) {

    if (!texto) {
        return "";
    }

    let limpio =
        String(texto);

    // Bloques Markdown
    limpio =
        limpio.replace(
            /```[\s\S]*?```/g,
            ""
        );

    // Títulos Markdown
    limpio =
        limpio.replace(
            /^#{1,6}\s*/gm,
            ""
        );

    // Negrita
    limpio =
        limpio.replace(
            /\*\*(.*?)\*\*/g,
            "$1"
        );

    // Cursiva
    limpio =
        limpio.replace(
            /\*(.*?)\*/g,
            "$1"
        );

    // Subrayado
    limpio =
        limpio.replace(
            /__(.*?)__/g,
            "$1"
        );

    limpio =
        limpio.replace(
            /_(.*?)_/g,
            "$1"
        );

    // Viñetas
    limpio =
        limpio.replace(
            /^\s*[-–—]\s+/gm,
            ""
        );

    limpio =
        limpio.replace(
            /^\s*\*\s+/gm,
            ""
        );

    // Espacios antes de :
    limpio =
        limpio.replace(
            /\s+:/g,
            ":"
        );

    // Espacios duplicados
    limpio =
        limpio.replace(
            /[ \t]{2,}/g,
            " "
        );

    // Saltos excesivos
    limpio =
        limpio.replace(
            /\n{3,}/g,
            "\n\n"
        );

    return limpio.trim();
}

// =========================================================
// CREAR PROMPT
// =========================================================

function crearPrompt(
    apuntes,
    tipo,
    hayArchivos = false
) {

    return `
Eres StudyAI, una herramienta educativa especializada en ayudar a estudiantes.

Tu trabajo es transformar los apuntes del estudiante y los archivos adjuntos en material de estudio claro, ordenado y fácil de memorizar.

APUNTES DEL ESTUDIANTE:

${apuntes}

FUENTES ADJUNTAS:

${
    hayArchivos
        ? "El estudiante ha adjuntado uno o varios archivos. DEBES analizar su contenido y utilizarlo como fuente principal para responder."
        : "No hay archivos adjuntos."
}

TIPO SOLICITADO:

${tipo}

REGLAS IMPORTANTES:

1. Utiliza principalmente la información proporcionada en los apuntes.

2. Si hay archivos adjuntos, utiliza también su contenido como fuente principal.

3. No inventes datos, fechas, nombres, acontecimientos o explicaciones.

4. No añadas información externa innecesaria.

5. Puedes reorganizar las ideas para que sean más fáciles de estudiar.

6. Mantén la información importante del contenido original.

7. No cambies el significado de la información.

8. Si encuentras información repetida, puedes organizarla.

9. Si hay información importante en una imagen, tabla o esquema, utilízala.

10. Si un archivo contiene texto, analiza ese texto antes de responder.

11. Si un archivo es un PDF, analiza su contenido antes de responder.

12. Si un archivo es una imagen, analiza el texto, esquemas, tablas y demás información visible.

13. Si también hay apuntes escritos manualmente, combina ambos contenidos.

14. Si el archivo y los apuntes contienen información diferente, utiliza ambas fuentes.

15. No ignores ningún archivo adjunto relevante.

16. Si no puedes encontrar información suficiente para responder, no inventes la respuesta.

17. Analiza todo el contenido proporcionado antes de responder.

FORMATO:

No utilices Markdown.

No utilices emojis.

No utilices símbolos innecesarios.

Utiliza títulos claros y listas numeradas cuando sea necesario.

TIPO DE MATERIAL:

${tipo}

Ahora analiza TODO el contenido proporcionado y genera el material solicitado.
`;
}

// =========================================================
// API PLAN
// =========================================================
// Se mantiene esta ruta para evitar errores en versiones
// antiguas del frontend. StudyAI ya no tiene planes ni límites.

app.get(
    "/api/plan",
    function (req, res) {

        if (!req.user) {
            return res.status(401).json({
                ok: false,
                error: "Necesitas iniciar sesión."
            });
        }

        res.json({
            ok: true,

            plan: "ilimitado",

            pro: false,

            precioProMensual: 0,

            generaciones: {
                usadas: 0,
                limite: null,
                restantes: null,
                ilimitadas: true
            }
        });
    }
);

// =========================================================
// API GENERAR
// =========================================================

app.post(
    "/api/generar",

    requiereLogin,

    upload.array(
        "archivos",
        5
    ),

    async function (req, res) {

        try {

            const usuario =
                req.user;

            const apuntes =
                String(
                    req.body.apuntes || ""
                ).trim();

            const tipo =
                String(
                    req.body.tipo ||
                    "preguntas"
                ).trim();

            const archivos =
                Array.isArray(req.files)
                    ? req.files
                    : [];

            console.log("");

            console.log(
                "========================================"
            );

            console.log(
                "NUEVA GENERACIÓN STUDYAI"
            );

            console.log(
                "========================================"
            );

            console.log(
                "Usuario:",
                usuario.email ||
                usuario.id
            );

            console.log(
                "Tipo:",
                tipo
            );

            console.log(
                "Archivos:",
                archivos.map(
                    archivo =>
                        archivo.originalname
                )
            );

            console.log(
                "========================================"
            );

            // -----------------------------------------
            // VALIDAR CONTENIDO
            // -----------------------------------------

            if (
                !apuntes &&
                archivos.length === 0
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "Escribe apuntes o adjunta al menos un archivo."
                    });
            }

            // -----------------------------------------
            // VALIDAR TIPO
            // -----------------------------------------

            const tiposPermitidos = [
                "resumen",
                "preguntas",
                "flashcards",
                "examen"
            ];

            if (
                !tiposPermitidos.includes(tipo)
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "Tipo de contenido no válido."
                    });
            }

        // -----------------------------------------
// GENERACIONES ILIMITADAS
// -----------------------------------------

console.log(
    "Generaciones: ILIMITADAS"
);

            // -----------------------------------------
            // PROMPT
            // -----------------------------------------

            const prompt =
                crearPrompt(
                    apuntes ||
                        "El contenido principal se encuentra en los archivos adjuntos.",

                    tipo,

                    archivos.length > 0
                );

            // -----------------------------------------
            // GEMINI
            // -----------------------------------------

            const respuesta =
                await generarConGemini(
                    prompt,
                    archivos
                );

            const resultado =
                limpiarTexto(
                    respuesta
                );

            if (!resultado) {

                return res
                    .status(500)
                    .json({
                        ok: false,
                        error:
                            "La IA no devolvió contenido."
                    });
            }

            // -----------------------------------------
// RESPUESTA
// -----------------------------------------

res.json({
    ok: true,

    resultado,

    plan: "ilimitado",

    desarrollo: false,

    archivos:
        archivos.map(
            archivo => ({
                nombre:
                    archivo.originalname,

                tipo:
                    archivo.mimetype,

                tamaño:
                    archivo.size
            })
        ),

    generaciones: {
        usadas: 0,
        limite: null,
        restantes: null,
        ilimitadas: true
    }
});

        } catch (error) {

            console.error(
                "Error generando contenido:",
                error
            );

            // -----------------------------------------
            // MULTER
            // -----------------------------------------

            if (
                error instanceof
                multer.MulterError
            ) {

                if (
                    error.code ===
                    "LIMIT_FILE_SIZE"
                ) {

                    return res
                        .status(400)
                        .json({
                            ok: false,
                            error:
                                "Uno de los archivos supera el límite de 10 MB."
                        });
                }

                if (
                    error.code ===
                    "LIMIT_FILE_COUNT"
                ) {

                    return res
                        .status(400)
                        .json({
                            ok: false,
                            error:
                                "Puedes adjuntar como máximo 5 archivos."
                        });
                }

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            "Error al subir los archivos."
                    });
            }

            // -----------------------------------------
            // TIPO DE ARCHIVO
            // -----------------------------------------

            if (
                error.message &&
                error.message.includes(
                    "Tipo de archivo no permitido"
                )
            ) {

                return res
                    .status(400)
                    .json({
                        ok: false,
                        error:
                            error.message
                    });
            }

            // -----------------------------------------
            // ERROR GENERAL
            // -----------------------------------------

            res
                .status(500)
                .json({
                    ok: false,
                    error:
                        "No se pudo generar el contenido. Inténtalo de nuevo."
                });
        }
    }
);

// =========================================================
// ARCHIVOS ESTÁTICOS
// =========================================================

app.use(
    "/images",

    express.static(
        path.join(
            carpetaPrincipal,
            "images"
        )
    )
);

app.use(
    "/components",

    express.static(
        path.join(
            carpetaPrincipal,
            "components"
        )
    )
);

app.use(
    express.static(
        carpetaPrincipal
    )
);

// =========================================================
// PÁGINA PRINCIPAL
// =========================================================

app.use(
    function (req, res) {

        res.sendFile(
            path.join(
                carpetaPrincipal,
                "index.html"
            )
        );
    }
);

// =========================================================
// ERRORES
// =========================================================

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        console.error(
            "Error del servidor:",
            error
        );

        if (
            res.headersSent
        ) {

            return next(error);
        }

        res
            .status(500)
            .json({
                ok: false,
                error:
                    error.message ||
                    "Error interno del servidor."
            });
    }
);

// =========================================================
// ARRANCAR SERVIDOR
// =========================================================

const server =
    app.listen(
        PORT,

        function () {

            console.log("");

            console.log(
                "========================================"
            );

            console.log(
                "                 STUDYAI"
            );

            console.log(
                "========================================"
            );

            console.log(
                `Servidor: http://localhost:${PORT}`
            );

            console.log(
                `Modelo Gemini: ${GEMINI_MODEL}`
            );

            console.log(
                `Google Login: ${
                    googleConfigurado
                        ? "CONFIGURADO"
                        : "NO CONFIGURADO"
                }`
            );

            console.log(
                "Sistema de patrocinadores: ACTIVO"
            );

            console.log(
                "========================================"
            );

            console.log("");
        }
    );

server.on(
    "error",

    function (error) {

        if (
            error.code ===
            "EADDRINUSE"
        ) {

            console.error("");

            console.error(
                `El puerto ${PORT} ya está ocupado.`
            );

            console.error(
                "Ejecuta: lsof -i :3000"
            );

            console.error("");

        } else {

            console.error(
                "Error del servidor:",
                error
            );
        }
    }
);