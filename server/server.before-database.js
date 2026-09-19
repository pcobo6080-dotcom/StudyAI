require("dotenv").config({
    path: require("path").join(__dirname, ".env")
});

const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = 3000;

const carpetaPrincipal = path.join(__dirname, "..");

/* =========================================================
   GOOGLE LOGIN
========================================================= */

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
                7
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());


/* =========================================================
   PASSPORT
========================================================= */

passport.serializeUser(
    function (usuario, done) {

        done(null, usuario);

    }
);

passport.deserializeUser(
    function (usuario, done) {

        done(null, usuario);

    }
);


/* =========================================================
   GOOGLE STRATEGY
========================================================= */

passport.use(
    new GoogleStrategy(
        {
            clientID:
                process.env.GOOGLE_CLIENT_ID,

            clientSecret:
                process.env.GOOGLE_CLIENT_SECRET,

            callbackURL:
                "http://localhost:3000/auth/google/callback"
        },

        function (
            accessToken,
            refreshToken,
            profile,
            done
        ) {

            return done(
                null,
                {
                    id:
                        profile.id,

                    nombre:
                        profile.displayName,

                    email:
                        profile.emails &&
                        profile.emails[0]
                            ? profile.emails[0].value
                            : "",

                    foto:
                        profile.photos &&
                        profile.photos[0]
                            ? profile.photos[0].value
                            : "",

                    username:
                        "",

                    biografia:
                        "",

                    curso:
                        "",

                    asignaturas:
                        ""
                }
            );

        }
    )
);


/* =========================================================
   GEMINI
========================================================= */

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
        apiKey: apiKey
    });


/* =========================================================
   CONFIGURACIÓN
========================================================= */

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


/* =========================================================
   RUTAS GOOGLE
========================================================= */

app.get(
    "/auth/google",
    passport.authenticate(
        "google",
        {
            scope: [
                "profile",
                "email"
            ]
        }
    )
);


app.get(
    "/auth/google/callback",

    passport.authenticate(
        "google",
        {
            failureRedirect: "/"
        }
    ),

    function (req, res) {

        console.log(
            "GOOGLE LOGIN CORRECTO:",
            req.user
        );

        console.log(
            "SESION CREADA"
        );

        res.redirect("/");
    }
);


/* =========================================================
   USUARIO ACTUAL
========================================================= */

app.get(
    "/api/usuario",

    function (req, res) {

        if (!req.user) {

            return res.json({
                conectado: false
            });

        }

        res.json({
            conectado: true,
            usuario: req.user
        });

    }
);


/* =========================================================
   GUARDAR PERFIL
========================================================= */

app.post(
    "/api/perfil",

    function (req, res) {

        if (!req.user) {

            return res.status(401).json({

                error:
                    "Necesitas iniciar sesión."

            });

        }


        const {
            username,
            biografia,
            curso,
            asignaturas
        } = req.body;


        if (!username) {

            return res.status(400).json({

                error:
                    "El nombre de usuario es obligatorio."

            });

        }


        const usernameLimpio =
            String(username)
                .trim()
                .toLowerCase()
                .replace(
                    /[^a-z0-9_]/g,
                    ""
                )
                .slice(0, 20);


        if (!usernameLimpio) {

            return res.status(400).json({

                error:
                    "El nombre de usuario no es válido."

            });

        }


        req.user.username =
            usernameLimpio;


        req.user.biografia =
            String(
                biografia || ""
            )
            .trim()
            .slice(0, 160);


        req.user.curso =
            String(
                curso || ""
            )
            .trim();


        req.user.asignaturas =
            String(
                asignaturas || ""
            )
            .trim();


        req.session.save(
            function (error) {

                if (error) {

                    console.error(
                        "Error guardando perfil:",
                        error
                    );

                    return res.status(500).json({

                        error:
                            "No se pudo guardar el perfil."

                    });

                }


                console.log(
                    "PERFIL ACTUALIZADO:",
                    req.user
                );


                res.json({

                    correcto: true,

                    usuario:
                        req.user

                });

            }
        );

    }
);


/* =========================================================
   CERRAR SESIÓN
========================================================= */

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

                        res.redirect("/");

                    }
                );

            }
        );

    }
);


/* =========================================================
   GEMINI
========================================================= */

function esperar(ms) {

    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                ms
            );

        }
    );

}


async function generarConGemini(
    prompt,
    intentos = 3
) {

    for (
        let intento = 1;
        intento <= intentos;
        intento++
    ) {

        try {

            const respuesta =
                await ai.models.generateContent({

                    model:
                        "gemini-3.6-flash",

                    contents:
                        prompt

                });


            return respuesta.text;


        } catch (error) {

            console.error(

                `Error Gemini, intento ${intento}/${intentos}:`,

                error.message

            );


            const codigo =
                error.status ||
                error.code;


            if (
                codigo === 503 &&
                intento < intentos
            ) {

                console.log(
                    "Gemini está ocupado. Reintentando..."
                );


                await esperar(
                    intento * 2000
                );


            } else {

                throw error;

            }

        }

    }

}


/* =========================================================
   LIMPIAR TEXTO
========================================================= */

function limpiarTexto(texto) {

    if (!texto) {

        return "";

    }


    let limpio =
        String(texto);


    limpio =
        limpio.replace(
            /```[\s\S]*?```/g,
            ""
        );


    limpio =
        limpio.replace(
            /^#{1,6}\s*/gm,
            ""
        );


    limpio =
        limpio.replace(
            /\*\*(.*?)\*\*/g,
            "$1"
        );


    limpio =
        limpio.replace(
            /\*(.*?)\*/g,
            "$1"
        );


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


    limpio =
        limpio.replace(
            /\s+:/g,
            ":"
        );


    limpio =
        limpio.replace(
            /[ \t]{2,}/g,
            " "
        );


    limpio =
        limpio.replace(
            /\n{3,}/g,
            "\n\n"
        );


    return limpio.trim();

}


/* =========================================================
   CREAR PROMPT
========================================================= */

function crearPrompt(
    apuntes,
    tipo
) {

    return `

Eres StudyAI, una herramienta educativa especializada
en ayudar a estudiantes.

Tu trabajo es transformar los apuntes del estudiante
en material de estudio claro, ordenado y fácil de memorizar.

APUNTES DEL ESTUDIANTE:

${apuntes}

TIPO SOLICITADO:

${tipo}

REGLAS IMPORTANTES:

1. Utiliza principalmente la información proporcionada
en los apuntes.

2. NO inventes datos, fechas, nombres, acontecimientos
o explicaciones que no aparezcan en los apuntes.

3. NO añadas información externa.

4. Puedes reorganizar las ideas para que sean más fáciles
de estudiar.

5. Si algo no aparece en los apuntes, no lo inventes.

6. No empieces con saludos.

7. No termines con mensajes motivacionales.

8. NO UTILICES MARKDOWN.

9. NO UTILICES el símbolo #.

10. NO UTILICES asteriscos.

11. NO UTILICES negritas ni cursivas.

12. NO UTILICES emojis.

13. NO UTILICES viñetas con símbolos.

14. NO UTILICES símbolos decorativos.

15. Utiliza solamente texto normal, números y puntuación.

16. Puedes utilizar títulos escritos normalmente y listas
numeradas.

FORMATO:

RESUMEN: [TÍTULO]

IDEA PRINCIPAL

[Explicación]

FECHAS CLAVE

1. [Fecha]: [Explicación]

2. [Fecha]: [Explicación]

CAUSAS

1. [Causa]

2. [Causa]

CONSECUENCIAS

1. [Consecuencia]

2. [Consecuencia]

Si el tipo es RESUMEN:

Haz un resumen claro, corto y organizado.

Si el tipo es PREGUNTAS:

Crea preguntas basadas exclusivamente en los apuntes.

Utiliza:

Pregunta 1: ...

Respuesta: ...

Pregunta 2: ...

Respuesta: ...

Si el tipo es FLASHCARDS:

Utiliza:

TARJETA 1

Pregunta: ...

Respuesta: ...

TARJETA 2

Pregunta: ...

Respuesta: ...

Si el tipo es EXAMEN:

Crea 10 preguntas tipo test.

Utiliza:

PREGUNTA 1

A) ...

B) ...

C) ...

D) ...

Al final escribe:

SOLUCIONES

1. A

2. B

3. C

No muestres las soluciones junto a las preguntas.

RESPONDE DIRECTAMENTE CON EL CONTENIDO.

NO AÑADAS SALUDOS.

NO AÑADAS DESPEDIDAS.

`;

}


/* =========================================================
   ARCHIVOS ESTÁTICOS
========================================================= */

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


/* =========================================================
   API — GENERAR
========================================================= */

app.post(
    "/api/generar",

    async function (req, res) {

        /* LOGIN OBLIGATORIO */

        if (!req.user) {

            return res.status(401).json({

                ok: false,

                error:
                    "Debes iniciar sesión para utilizar StudyAI."

            });

        }


        try {

            const apuntes =
                String(
                    req.body.apuntes || ""
                )
                .trim();


            const tipo =
                String(
                    req.body.tipo ||
                    "resumen"
                )
                .trim();


            if (!apuntes) {

                return res.status(400).json({

                    ok: false,

                    error:
                        "No has introducido apuntes."

                });

            }


            const tiposPermitidos = [

                "resumen",

                "preguntas",

                "flashcards",

                "examen"

            ];


            if (
                !tiposPermitidos.includes(
                    tipo
                )
            ) {

                return res.status(400).json({

                    ok: false,

                    error:
                        "Tipo de contenido no válido."

                });

            }


            console.log(
                `Generando ${tipo}...`
            );


            const prompt =
                crearPrompt(
                    apuntes,
                    tipo
                );


            const respuesta =
                await generarConGemini(
                    prompt
                );


            const resultado =
                limpiarTexto(
                    respuesta
                );


            return res.status(200).json({

                ok: true,

                resultado:
                    resultado

            });


        } catch (error) {

            console.error(
                "Error generando contenido:",
                error
            );


            return res.status(500).json({

                ok: false,

                error:
                    "No se pudo generar el contenido. Inténtalo de nuevo."

            });

        }

    }
);


/* =========================================================
   PÁGINA PRINCIPAL
========================================================= */

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


/* =========================================================
   MANEJO DE ERRORES
========================================================= */

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


        if (res.headersSent) {

            return next(error);

        }


        res.status(500).json({

            ok: false,

            error:
                "Error interno del servidor."

        });

    }
);


/* =========================================================
   ARRANCAR SERVIDOR
========================================================= */

const server =
    app.listen(
        PORT,

        function () {

            console.log("");

            console.log(
                "========================================"
            );

            console.log(
                "        STUDYAI"
            );

            console.log(
                "========================================"
            );

            console.log(
                `🚀 Servidor: http://localhost:${PORT}`
            );

            console.log(
                "========================================"
            );

            console.log("");

        }
    );


/* =========================================================
   ERROR DEL PUERTO
========================================================= */

server.on(
    "error",

    function (error) {

        if (
            error.code ===
            "EADDRINUSE"
        ) {

            console.error("");

            console.error(
                `❌ El puerto ${PORT} ya está ocupado.`
            );

            console.error(
                "Cierra el servidor anterior con Ctrl + C."
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