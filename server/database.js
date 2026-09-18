const Database = require("better-sqlite3");
const path = require("path");

// =========================================================
// CONFIGURACIÓN
// =========================================================

const rutaBaseDatos = path.join(
    __dirname,
    "studyai.db"
);

const db = new Database(rutaBaseDatos);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// =========================================================
// FUNCIÓN: AÑADIR COLUMNA SI NO EXISTE
// =========================================================

function añadirColumnaSiNoExiste(
    tabla,
    columna,
    definicion
) {
    const columnas = db
        .prepare(
            "PRAGMA table_info(" + tabla + ")"
        )
        .all();

    const existe = columnas.some(
        function (item) {
            return item.name === columna;
        }
    );

    if (!existe) {
        db.exec(
            "ALTER TABLE " +
            tabla +
            " ADD COLUMN " +
            columna +
            " " +
            definicion
        );

        console.log(
            "Columna añadida: " +
            tabla +
            "." +
            columna
        );
    }
}

// =========================================================
// TABLA USUARIOS
// =========================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (

        id TEXT PRIMARY KEY,

        nombre TEXT NOT NULL DEFAULT '',

        email TEXT NOT NULL DEFAULT '',

        foto TEXT NOT NULL DEFAULT '',

        username TEXT UNIQUE,

        biografia TEXT NOT NULL DEFAULT '',

        curso TEXT NOT NULL DEFAULT '',

        asignaturas TEXT NOT NULL DEFAULT '',

        plan TEXT NOT NULL DEFAULT 'gratis',

        generaciones_hoy INTEGER NOT NULL DEFAULT 0,

        fecha_generaciones TEXT NOT NULL DEFAULT '',

        pro_desde TEXT NOT NULL DEFAULT '',

        pro_hasta TEXT NOT NULL DEFAULT '',

        admin INTEGER NOT NULL DEFAULT 0

    )
`);

// =========================================================
// COMPATIBILIDAD USUARIOS
// =========================================================

añadirColumnaSiNoExiste(
    "usuarios",
    "username",
    "TEXT"
);

añadirColumnaSiNoExiste(
    "usuarios",
    "biografia",
    "TEXT NOT NULL DEFAULT ''"
);

añadirColumnaSiNoExiste(
    "usuarios",
    "curso",
    "TEXT NOT NULL DEFAULT ''"
);

añadirColumnaSiNoExiste(
    "usuarios",
    "asignaturas",
    "TEXT NOT NULL DEFAULT ''"
);

añadirColumnaSiNoExiste(
    "usuarios",
    "foto",
    "TEXT NOT NULL DEFAULT ''"
);

añadirColumnaSiNoExiste(
    "usuarios",
    "plan",
    "TEXT NOT NULL DEFAULT 'gratis'"
);

añadirColumnaSiNoExiste(
    "usuarios",
    "generaciones_hoy",
    "INTEGER NOT NULL DEFAULT 0"
);

añadirColumnaSiNoExiste(
    "usuarios",
    "fecha_generaciones",
    "TEXT NOT NULL DEFAULT ''"
);

añadirColumnaSiNoExiste(
    "usuarios",
    "pro_desde",
    "TEXT NOT NULL DEFAULT ''"
);

añadirColumnaSiNoExiste(
    "usuarios",
    "pro_hasta",
    "TEXT NOT NULL DEFAULT ''"
);

añadirColumnaSiNoExiste(
    "usuarios",
    "admin",
    "INTEGER NOT NULL DEFAULT 0"
);

// =========================================================
// NORMALIZAR PLANES
// =========================================================

db.prepare(`
    UPDATE usuarios

    SET plan = 'gratis'

    WHERE plan IS NULL

       OR plan = ''

       OR plan NOT IN (
            'gratis',
            'pro'
       )
`).run();

// =========================================================
// TABLA SESIONES
// =========================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS sesiones (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        usuario_id TEXT NOT NULL,

        tipo TEXT NOT NULL,

        titulo TEXT NOT NULL DEFAULT '',

        apuntes TEXT NOT NULL,

        resultado TEXT NOT NULL,

        fecha TEXT NOT NULL,

        FOREIGN KEY (usuario_id)

            REFERENCES usuarios(id)

            ON DELETE CASCADE

    )
`);

// =========================================================
// ÍNDICES SESIONES
// =========================================================

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_sesiones_usuario

    ON sesiones(usuario_id)
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_sesiones_tipo

    ON sesiones(tipo)
`);

// =========================================================
// ÍNDICE PLANES
// =========================================================

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_usuarios_plan

    ON usuarios(plan)
`);

// =========================================================
// TABLA PATROCINADORES
// =========================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS patrocinadores (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        nombre TEXT NOT NULL DEFAULT '',

        descripcion TEXT NOT NULL DEFAULT '',

        logo TEXT NOT NULL DEFAULT '',

        enlace TEXT NOT NULL DEFAULT '',

        activo INTEGER NOT NULL DEFAULT 1,

        fecha_creacion TEXT NOT NULL DEFAULT ''

    )
`);

// =========================================================
// COMPATIBILIDAD PATROCINADORES
// =========================================================

añadirColumnaSiNoExiste(
    "patrocinadores",
    "descripcion",
    "TEXT NOT NULL DEFAULT ''"
);

añadirColumnaSiNoExiste(
    "patrocinadores",
    "logo",
    "TEXT NOT NULL DEFAULT ''"
);

añadirColumnaSiNoExiste(
    "patrocinadores",
    "enlace",
    "TEXT NOT NULL DEFAULT ''"
);

añadirColumnaSiNoExiste(
    "patrocinadores",
    "activo",
    "INTEGER NOT NULL DEFAULT 1"
);

añadirColumnaSiNoExiste(
    "patrocinadores",
    "fecha_creacion",
    "TEXT NOT NULL DEFAULT ''"
);

// =========================================================
// ÍNDICE PATROCINADORES
// =========================================================

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_patrocinadores_activo

    ON patrocinadores(activo)
`);

// =========================================================
// TABLA USO DE LA IA
// =========================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS uso_ia (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        usuario_id TEXT NOT NULL,

        tipo TEXT NOT NULL,

        fecha TEXT NOT NULL,

        FOREIGN KEY (usuario_id)

            REFERENCES usuarios(id)

            ON DELETE CASCADE

    )
`);

// =========================================================
// ÍNDICES USO IA
// =========================================================

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_uso_ia_usuario

    ON uso_ia(usuario_id)
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_uso_ia_fecha

    ON uso_ia(fecha)
`);

// =========================================================
// TABLA SUSCRIPCIONES
// =========================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS suscripciones (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        usuario_id TEXT NOT NULL,

        plan TEXT NOT NULL DEFAULT 'pro',

        estado TEXT NOT NULL DEFAULT 'activa',

        proveedor TEXT NOT NULL DEFAULT '',

        referencia TEXT NOT NULL DEFAULT '',

        fecha_inicio TEXT NOT NULL DEFAULT '',

        fecha_fin TEXT NOT NULL DEFAULT '',

        fecha_creacion TEXT NOT NULL DEFAULT '',

        FOREIGN KEY (usuario_id)

            REFERENCES usuarios(id)

            ON DELETE CASCADE

    )
`);

// =========================================================
// ÍNDICES SUSCRIPCIONES
// =========================================================

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_suscripciones_usuario

    ON suscripciones(usuario_id)
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS
    idx_suscripciones_estado

    ON suscripciones(estado)
`);

// =========================================================
// TABLA CONFIGURACIÓN
// =========================================================

db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion (

        clave TEXT PRIMARY KEY,

        valor TEXT NOT NULL DEFAULT ''

    )
`);

// =========================================================
// CONFIGURACIÓN INICIAL
// =========================================================

const configuracionesIniciales = [
    [
        "limite_gratis_diario",
        "5"
    ],
    [
        "limite_pro_diario",
        "100"
    ],
    [
        "nombre_plan_pro",
        "StudyAI PRO"
    ],
    [
        "precio_pro_mensual",
        "4.99"
    ],
    [
        "precio_pro_anual",
        "39.99"
    ]
];

// =========================================================
// INSERTAR CONFIGURACIÓN
// =========================================================

const insertarConfiguracion = db.prepare(`
    INSERT OR IGNORE INTO configuracion
    (
        clave,
        valor
    )
    VALUES (?, ?)
`);

// =========================================================
// INSERTAR CONFIGURACIONES EN TRANSACCIÓN
// =========================================================

const insertarConfiguraciones = db.transaction(
    function () {
        for (
            const configuracion
            of configuracionesIniciales
        ) {
            insertarConfiguracion.run(
                configuracion[0],
                configuracion[1]
            );
        }
    }
);

insertarConfiguraciones();

// =========================================================
// FUNCIÓN: OBTENER CONFIGURACIÓN
// =========================================================

function obtenerConfiguracion(
    clave,
    valorPorDefecto = ""
) {
    const resultado = db
        .prepare(`
            SELECT valor

            FROM configuracion

            WHERE clave = ?
        `)
        .get(clave);

    if (!resultado) {
        return valorPorDefecto;
    }

    return resultado.valor;
}

// =========================================================
// FUNCIÓN: USUARIO ES PRO
// =========================================================

function usuarioEsPro(usuario) {

    if (!usuario) {
        return false;
    }

    // ADMINISTRADOR
    if (
        Number(usuario.admin) === 1
    ) {
        return true;
    }

    // PLAN
    if (
        usuario.plan !== "pro"
    ) {
        return false;
    }

    // SIN FECHA DE FINALIZACIÓN
    if (
        !usuario.pro_hasta ||
        String(usuario.pro_hasta).trim() === ""
    ) {
        return true;
    }

    // COMPROBAR FECHA
    const fechaFin = new Date(
        usuario.pro_hasta
    );

    if (
        Number.isNaN(
            fechaFin.getTime()
        )
    ) {
        return false;
    }

    // COMPROBAR EXPIRACIÓN
    return fechaFin >= new Date();
}

// =========================================================
// FUNCIÓN: OBTENER LÍMITE DIARIO
// =========================================================

function obtenerLimiteDiario(usuario) {

    if (
        usuarioEsPro(usuario)
    ) {
        return Number(
            obtenerConfiguracion(
                "limite_pro_diario",
                "100"
            )
        );
    }

    return Number(
        obtenerConfiguracion(
            "limite_gratis_diario",
            "5"
        )
    );
}

// =========================================================
// FUNCIÓN: PREPARAR CONTADOR DIARIO
// =========================================================

function prepararContadorDiario(usuario) {

    if (!usuario) {
        return;
    }

    const hoy = new Date()
        .toISOString()
        .slice(0, 10);

    if (
        usuario.fecha_generaciones !== hoy
    ) {
        db.prepare(`
            UPDATE usuarios

            SET
                generaciones_hoy = 0,
                fecha_generaciones = ?

            WHERE id = ?
        `).run(
            hoy,
            usuario.id
        );

        usuario.generaciones_hoy = 0;

        usuario.fecha_generaciones = hoy;
    }
}

// =========================================================
// FUNCIÓN: REGISTRAR USO DE IA
// =========================================================

function registrarUsoIA(
    usuario,
    tipo
) {

    if (!usuario) {
        return;
    }

    if (!usuario.id) {
        console.error(
            "No se puede registrar el uso de IA: usuario sin ID."
        );
        return;
    }

    const fecha = new Date()
        .toISOString();

    db.prepare(`
        INSERT INTO uso_ia
        (
            usuario_id,
            tipo,
            fecha
        )
        VALUES (?, ?, ?)
    `).run(
        String(usuario.id),
        String(tipo || "desconocido"),
        fecha
    );
}

// =========================================================
// EXPORTAR FUNCIONES
// =========================================================

db.obtenerConfiguracion =
    obtenerConfiguracion;

db.usuarioEsPro =
    usuarioEsPro;

db.obtenerLimiteDiario =
    obtenerLimiteDiario;

db.prepararContadorDiario =
    prepararContadorDiario;

db.registrarUsoIA =
    registrarUsoIA;

// =========================================================
// MENSAJES
// =========================================================

console.log(
    "Base de datos StudyAI cargada correctamente."
);

console.log(
    "Base de datos:",
    rutaBaseDatos
);

// =========================================================
// EXPORTAR BASE DE DATOS
// =========================================================

module.exports = db;