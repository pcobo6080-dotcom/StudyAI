import * as THREE from "https://esm.sh/three@0.180.0";

import {
    OrbitControls
} from "https://esm.sh/three@0.180.0/examples/jsm/controls/OrbitControls.js";


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const CITY_SIZE = 1200;

const ROAD_WIDTH = 16;

const HALF_CITY = CITY_SIZE / 2;


/* =========================================================
   ESCENA
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x9bbbd3);

scene.fog = new THREE.Fog(
    0x9bbbd3,
    280,
    950
);


/* =========================================================
   CÁMARA
========================================================= */

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

camera.position.set(
    260,
    220,
    300
);


/* =========================================================
   RENDERER
========================================================= */

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.15;

document.body.appendChild(
    renderer.domElement
);


/* =========================================================
   CONTROLES
========================================================= */

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;

controls.dampingFactor = 0.06;

controls.minDistance = 20;

controls.maxDistance = 850;

controls.maxPolarAngle =
    Math.PI / 2.02;

controls.target.set(
    0,
    20,
    0
);


/* =========================================================
   LUCES
========================================================= */

const hemisphereLight =
    new THREE.HemisphereLight(
        0xcfe7ff,
        0x26301e,
        2.2
    );

scene.add(
    hemisphereLight
);


const sun =
    new THREE.DirectionalLight(
        0xffffff,
        3.2
    );

sun.position.set(
    250,
    500,
    180
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;

sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -500;

sun.shadow.camera.right = 500;

sun.shadow.camera.top = 500;

sun.shadow.camera.bottom = -500;

sun.shadow.camera.near = 1;

sun.shadow.camera.far = 1200;

scene.add(sun);


/* =========================================================
   MATERIALES
========================================================= */

const materials = {

    ground:
        new THREE.MeshStandardMaterial({
            color: 0x64745c,
            roughness: 1
        }),

    asphalt:
        new THREE.MeshStandardMaterial({
            color: 0x20242a,
            roughness: 0.95
        }),

    sidewalk:
        new THREE.MeshStandardMaterial({
            color: 0xaeb3b3,
            roughness: 0.9
        }),

    concrete:
        new THREE.MeshStandardMaterial({
            color: 0x9ca2a4,
            roughness: 0.8
        }),

    white:
        new THREE.MeshStandardMaterial({
            color: 0xf0f0ed,
            roughness: 0.75
        }),

    darkBuilding:
        new THREE.MeshStandardMaterial({
            color: 0x26303b,
            roughness: 0.65
        }),

    blueBuilding:
        new THREE.MeshStandardMaterial({
            color: 0x405d70,
            roughness: 0.55
        }),

    glass:
        new THREE.MeshStandardMaterial({
            color: 0x4e7183,
            metalness: 0.3,
            roughness: 0.2
        }),

    glassDark:
        new THREE.MeshStandardMaterial({
            color: 0x152a36,
            metalness: 0.45,
            roughness: 0.18
        }),

    window:
        new THREE.MeshStandardMaterial({
            color: 0x8fc7df,
            emissive: 0x24495a,
            emissiveIntensity: 0.25
        }),

    grass:
        new THREE.MeshStandardMaterial({
            color: 0x477448,
            roughness: 1
        }),

    treeTrunk:
        new THREE.MeshStandardMaterial({
            color: 0x65452c
        }),

    treeLeaves:
        new THREE.MeshStandardMaterial({
            color: 0x2d6539,
            roughness: 1
        }),

    metal:
        new THREE.MeshStandardMaterial({
            color: 0x4d555a,
            metalness: 0.7,
            roughness: 0.3
        }),

    yellow:
        new THREE.MeshStandardMaterial({
            color: 0xffc928
        }),

    red:
        new THREE.MeshStandardMaterial({
            color: 0xd73333
        }),

    blue:
        new THREE.MeshStandardMaterial({
            color: 0x3277c7
        }),

    whiteCar:
        new THREE.MeshStandardMaterial({
            color: 0xe8e8e8,
            roughness: 0.4
        }),

    black:
        new THREE.MeshStandardMaterial({
            color: 0x15181b,
            roughness: 0.4
        })
};


/* =========================================================
   HELPERS
========================================================= */

function box(
    width,
    height,
    depth,
    material,
    x = 0,
    y = 0,
    z = 0
) {

    const geometry =
        new THREE.BoxGeometry(
            width,
            height,
            depth
        );

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    scene.add(mesh);

    return mesh;
}


function cylinder(
    radius,
    height,
    material,
    x = 0,
    y = 0,
    z = 0
) {

    const geometry =
        new THREE.CylinderGeometry(
            radius,
            radius,
            height,
            12
        );

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    scene.add(mesh);

    return mesh;
}


/* =========================================================
   TERRENO
========================================================= */

box(
    CITY_SIZE,
    4,
    CITY_SIZE,
    materials.ground,
    0,
    -2,
    0
);


/* =========================================================
   CARRETERAS PRINCIPALES
========================================================= */

function createRoad(
    x,
    z,
    width,
    depth
) {

    box(
        width,
        0.5,
        depth,
        materials.asphalt,
        x,
        0.1,
        z
    );

    const sidewalkSize = 3;

    if (width > depth) {

        box(
            width,
            0.7,
            sidewalkSize,
            materials.sidewalk,
            x,
            0.35,
            z - depth / 2 - sidewalkSize / 2
        );

        box(
            width,
            0.7,
            sidewalkSize,
            materials.sidewalk,
            x,
            0.35,
            z + depth / 2 + sidewalkSize / 2
        );

    } else {

        box(
            sidewalkSize,
            0.7,
            depth,
            materials.sidewalk,
            x - width / 2 - sidewalkSize / 2,
            0.35,
            z
        );

        box(
            sidewalkSize,
            0.7,
            depth,
            materials.sidewalk,
            x + width / 2 + sidewalkSize / 2,
            0.35,
            z
        );
    }
}


/* Grandes avenidas */

const avenuePositions = [
    -360,
    -180,
    0,
    180,
    360
];


for (const p of avenuePositions) {

    createRoad(
        0,
        p,
        CITY_SIZE,
        ROAD_WIDTH
    );

    createRoad(
        p,
        0,
        ROAD_WIDTH,
        CITY_SIZE
    );
}


/* =========================================================
   MARCAS VIALES
========================================================= */

function createRoadLine(
    x,
    z,
    horizontal = true
) {

    if (horizontal) {

        for (
            let i = -550;
            i < 550;
            i += 24
        ) {

            box(
                10,
                0.08,
                0.8,
                materials.white,
                i,
                0.42,
                z
            );
        }

    } else {

        for (
            let i = -550;
            i < 550;
            i += 24
        ) {

            box(
                0.8,
                0.08,
                10,
                materials.white,
                x,
                0.42,
                i
            );
        }
    }
}


for (const p of avenuePositions) {

    createRoadLine(
        0,
        p,
        true
    );

    createRoadLine(
        p,
        0,
        false
    );
}


/* =========================================================
   PASOS DE PEATONES
========================================================= */

function createCrosswalk(
    x,
    z,
    horizontal
) {

    for (
        let i = -6;
        i <= 6;
        i += 2
    ) {

        if (horizontal) {

            box(
                1.2,
                0.08,
                12,
                materials.white,
                x + i,
                0.46,
                z
            );

        } else {

            box(
                12,
                0.08,
                1.2,
                materials.white,
                x,
                0.46,
                z + i
            );
        }
    }
}


for (const p of avenuePositions) {

    createCrosswalk(
        0,
        p,
        true
    );

    createCrosswalk(
        p,
        0,
        false
    );
}


/* =========================================================
   EDIFICIOS
========================================================= */

let buildingCount = 0;


function createWindows(
    building,
    width,
    height,
    depth
) {

    const rows =
        Math.max(
            2,
            Math.floor(height / 6)
        );

    const columns =
        Math.max(
            2,
            Math.floor(width / 5)
        );

    for (
        let row = 0;
        row < rows;
        row++
    ) {

        for (
            let col = 0;
            col < columns;
            col++
        ) {

            const px =
                -width / 2 +
                2.5 +
                col *
                ((width - 5) /
                    Math.max(columns - 1, 1));

            const py =
                3 +
                row *
                ((height - 6) /
                    Math.max(rows - 1, 1));

            const window =
                box(
                    1.7,
                    2.3,
                    0.12,
                    materials.window
                );

            window.position.x =
                building.position.x + px;

            window.position.y =
                py;

            window.position.z =
                building.position.z -
                depth / 2 -
                0.08;
        }
    }
}


function createBuilding(
    x,
    z,
    width,
    depth,
    height,
    material
) {

    const building =
        box(
            width,
            height,
            depth,
            material,
            x,
            height / 2,
            z
        );

    buildingCount++;

    createWindows(
        building,
        width,
        height,
        depth
    );

    return building;
}


/* =========================================================
   CENTRO FINANCIERO
========================================================= */

function createSkyscraper(
    x,
    z,
    width,
    depth,
    height
) {

    const tower =
        box(
            width,
            height,
            depth,
            materials.glassDark,
            x,
            height / 2,
            z
        );

    buildingCount++;

    const floors =
        Math.floor(height / 5);

    for (
        let i = 0;
        i < floors;
        i++
    ) {

        const y =
            4 + i * 5;

        box(
            width * 0.78,
            1.4,
            0.08,
            materials.window,
            x,
            y,
            z - depth / 2 - 0.08
        );

        box(
            0.08,
            1.4,
            depth * 0.78,
            materials.window,
            x - width / 2 - 0.08,
            y,
            z
        );
    }

    return tower;
}


createSkyscraper(
    -60,
    -60,
    38,
    38,
    210
);

createSkyscraper(
    60,
    -60,
    32,
    32,
    270
);

createSkyscraper(
    -60,
    60,
    34,
    34,
    240
);

createSkyscraper(
    60,
    60,
    42,
    42,
    185
);

createSkyscraper(
    0,
    -100,
    28,
    28,
    150
);

createSkyscraper(
    0,
    100,
    35,
    35,
    190
);


/* =========================================================
   BLOQUES URBANOS
========================================================= */

const buildingMaterials = [
    materials.darkBuilding,
    materials.blueBuilding,
    materials.concrete,
    materials.white,
    materials.glass
];


function generateUrbanArea(
    startX,
    endX,
    startZ,
    endZ
) {

    for (
        let x = startX;
        x <= endX;
        x += 45
    ) {

        for (
            let z = startZ;
            z <= endZ;
            z += 45
        ) {

            const nearCenter =
                Math.abs(x) < 110 &&
                Math.abs(z) < 110;

            if (nearCenter) {
                continue;
            }

            const width =
                24 +
                Math.random() * 12;

            const depth =
                24 +
                Math.random() * 12;

            const height =
                20 +
                Math.random() * 90;

            const material =
                buildingMaterials[
                    Math.floor(
                        Math.random() *
                        buildingMaterials.length
                    )
                ];

            createBuilding(
                x,
                z,
                width,
                depth,
                height,
                material
            );
        }
    }
}


generateUrbanArea(
    -310,
    310,
    -310,
    310
);


/* =========================================================
   CASAS RESIDENCIALES
========================================================= */

function createHouse(
    x,
    z,
    scale = 1
) {

    const house =
        new THREE.Group();

    house.position.set(
        x,
        0,
        z
    );

    scene.add(house);

    const width =
        14 * scale;

    const depth =
        12 * scale;

    const height =
        7 * scale;


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                width,
                height,
                depth
            ),
            materials.white
        );

    body.position.y =
        height / 2;

    body.castShadow = true;

    body.receiveShadow = true;

    house.add(body);


    /* Techo */

    const roof =
        new THREE.Mesh(
            new THREE.ConeGeometry(
                width * 0.72,
                6 * scale,
                4
            ),
            materials.red
        );

    roof.rotation.y =
        Math.PI / 4;

    roof.position.y =
        height + 3 * scale;

    roof.castShadow = true;

    house.add(roof);


    /* Puerta */

    const door =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.3 * scale,
                4 * scale,
                0.3 * scale
            ),
            materials.darkBuilding
        );

    door.position.set(
        0,
        2 * scale,
        -depth / 2
    );

    house.add(door);


    /* Ventanas */

    for (
        const wx of [-4, 4]
    ) {

        const window =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.7 * scale,
                    2.2 * scale,
                    0.25 * scale
                ),
                materials.window
            );

        window.position.set(
            wx * scale,
            4 * scale,
            -depth / 2
        );

        house.add(window);
    }


    /* Jardín */

    box(
        width + 8 * scale,
        0.2,
        depth + 10 * scale,
        materials.grass,
        x,
        0.12,
        z + 5 * scale
    );


    /* Valla */

    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        box(
            width + 7,
            0.8,
            0.25,
            materials.white,
            x,
            0.8,
            z +
            depth / 2 +
            4
        );
    }

    buildingCount++;
}


/* Barrios de casas */

const houseAreas = [

    [-450, -300, 250, 430],

    [-450, -300, -430, -250],

    [300, 450, 250, 430],

    [300, 450, -430, -250],

    [-150, 150, 350, 470]

];


for (
    const area of houseAreas
) {

    const [
        minX,
        maxX,
        minZ,
        maxZ
    ] = area;

    for (
        let x = minX;
        x < maxX;
        x += 30
    ) {

        for (
            let z = minZ;
            z < maxZ;
            z += 30
        ) {

            createHouse(
                x,
                z,
                0.9 +
                Math.random() * 0.35
            );
        }
    }
}


/* =========================================================
   ÁRBOLES
========================================================= */

function createTree(
    x,
    z,
    scale = 1
) {

    const trunk =
        cylinder(
            1.1 * scale,
            6 * scale,
            materials.treeTrunk,
            x,
            3 * scale,
            z
        );

    const leaves =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                4.5 * scale,
                10,
                8
            ),
            materials.treeLeaves
        );

    leaves.position.set(
        x,
        7 * scale,
        z
    );

    leaves.castShadow = true;

    scene.add(leaves);
}


/* Parques */

function createPark(
    x,
    z,
    size
) {

    box(
        size,
        0.25,
        size,
        materials.grass,
        x,
        0.15,
        z
    );

    for (
        let i = 0;
        i < 20;
        i++
    ) {

        const tx =
            x +
            (Math.random() - 0.5) *
            (size - 15);

        const tz =
            z +
            (Math.random() - 0.5) *
            (size - 15);

        createTree(
            tx,
            tz,
            0.8 +
            Math.random() * 0.6
        );
    }


    /* Bancos */

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        box(
            5,
            0.6,
            1,
            materials.wood || materials.darkBuilding,
            x - size / 3,
            1,
            z + i * 10 - 15
        );
    }
}


createPark(
    -270,
    -270,
    100
);

createPark(
    270,
    -270,
    100
);

createPark(
    -270,
    270,
    100
);

createPark(
    270,
    270,
    100
);


/* =========================================================
   PLAZAS
========================================================= */

function createPlaza(
    x,
    z,
    size
) {

    box(
        size,
        0.3,
        size,
        materials.concrete,
        x,
        0.2,
        z
    );

    const fountain =
        cylinder(
            size * 0.12,
            1,
            materials.glass,
            x,
            0.7,
            z
        );

    fountain.scale.y = 0.25;

    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const angle =
            (i / 8) *
            Math.PI *
            2;

        box(
            5,
            0.6,
            1.2,
            materials.darkBuilding,
            x +
            Math.cos(angle) *
            size *
            0.32,
            0.7,
            z +
            Math.sin(angle) *
            size *
            0.32
        );
    }
}


createPlaza(
    0,
    260,
    70
);


/* =========================================================
   FAROLAS
========================================================= */

const lamps = [];


function createLamp(
    x,
    z
) {

    const group =
        new THREE.Group();

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);

    const pole =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.25,
                0.35,
                7,
                8
            ),
            materials.metal
        );

    pole.position.y = 3.5;

    pole.castShadow = true;

    group.add(pole);


    const lamp =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.8,
                8,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0xffffcc,
                emissive: 0xffff99,
                emissiveIntensity: 0
            })
        );

    lamp.position.y = 7;

    group.add(lamp);

    lamps.push(lamp);
}


for (
    let x = -500;
    x <= 500;
    x += 50
) {

    createLamp(
        x,
        10
    );

    createLamp(
        x,
        -10
    );
}


/* =========================================================
   SEMÁFOROS
========================================================= */

function createTrafficLight(
    x,
    z,
    rotation = 0
) {

    const group =
        new THREE.Group();

    group.position.set(
        x,
        0,
        z
    );

    group.rotation.y =
        rotation;

    scene.add(group);


    const pole =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.22,
                0.3,
                7,
                8
            ),
            materials.metal
        );

    pole.position.y = 3.5;

    group.add(pole);


    const housing =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.2,
                3.4,
                0.8
            ),
            materials.black
        );

    housing.position.y = 6;

    group.add(housing);


    const colors = [
        0xff3333,
        0xffcc22,
        0x32dd55
    ];

    colors.forEach(
        (color, index) => {

            const light =
                new THREE.Mesh(
                    new THREE.SphereGeometry(
                        0.3,
                        12,
                        12
                    ),
                    new THREE.MeshStandardMaterial({
                        color,
                        emissive: color,
                        emissiveIntensity: 0.2
                    })
                );

            light.position.set(
                0,
                6.9 - index * 0.9,
                -0.43
            );

            group.add(light);
        }
    );
}


for (
    const p of [-180, 0, 180]
) {

    createTrafficLight(
        10,
        p,
        0
    );

    createTrafficLight(
        -10,
        p,
        Math.PI
    );

    createTrafficLight(
        p,
        10,
        Math.PI / 2
    );

    createTrafficLight(
        p,
        -10,
        -Math.PI / 2
    );
}


/* =========================================================
   COCHES
========================================================= */

const cars = [];


function createCar(
    colorMaterial,
    x,
    z,
    horizontal = true
) {

    const group =
        new THREE.Group();

    group.position.set(
        x,
        0.7,
        z
    );

    scene.add(group);


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                5.5,
                1.4,
                2.5
            ),
            colorMaterial
        );

    body.castShadow = true;

    group.add(body);


    const roof =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.8,
                1,
                2
            ),
            materials.glassDark
        );

    roof.position.y = 1.15;

    roof.castShadow = true;

    group.add(roof);


    const wheels = [];

    for (
        const wx of [-2, 2]
    ) {

        for (
            const wz of [-1.25, 1.25]
        ) {

            const wheel =
                new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        0.5,
                        0.5,
                        0.35,
                        12
                    ),
                    materials.black
                );

            wheel.rotation.z =
                Math.PI / 2;

            wheel.position.set(
                wx,
                -0.6,
                wz
            );

            group.add(wheel);

            wheels.push(wheel);
        }
    }


    group.rotation.y =
        horizontal
            ? 0
            : Math.PI / 2;


    cars.push({
        group,
        horizontal,
        speed:
            0.25 +
            Math.random() * 0.35
    });
}


const carColors = [
    materials.red,
    materials.blue,
    materials.yellow,
    materials.whiteCar,
    materials.black
];


for (
    let i = 0;
    i < 35;
    i++
) {

    const road =
        avenuePositions[
            Math.floor(
                Math.random() *
                avenuePositions.length
            )
        ];

    const horizontal =
        Math.random() > 0.5;

    const material =
        carColors[
            Math.floor(
                Math.random() *
                carColors.length
            )
        ];

    if (horizontal) {

        createCar(
            material,
            -550 +
            Math.random() * 1100,
            road + 4
        );

    } else {

        createCar(
            material,
            road + 4,
            -550 +
            Math.random() * 1100,
            false
        );
    }
}


/* =========================================================
   AUTOBUSES
========================================================= */

function createBus(
    x,
    z,
    horizontal = true
) {

    const bus =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                12,
                3,
                3
            ),
            materials.blue
        );

    bus.position.set(
        x,
        1.8,
        z
    );

    bus.castShadow = true;

    scene.add(bus);

    cars.push({
        group: bus,
        horizontal,
        speed: 0.12
    });
}


createBus(
    -400,
    184,
    true
);

createBus(
    400,
    -184,
    true
);

createBus(
    184,
    -400,
    false
);


/* =========================================================
   PEATONES
========================================================= */

const people = [];


function createPerson(
    x,
    z
) {

    const group =
        new THREE.Group();

    group.position.set(
        x,
        0,
        z
    );

    scene.add(group);


    const body =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.7,
                0.8,
                2.5,
                8
            ),
            materials.blue
        );

    body.position.y = 1.7;

    body.castShadow = true;

    group.add(body);


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.65,
                10,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0xc99472
            })
        );

    head.position.y = 3.5;

    group.add(head);


    people.push({
        group,

        angle:
            Math.random() *
            Math.PI *
            2,

        speed:
            0.008 +
            Math.random() *
            0.012
    });
}


for (
    let i = 0;
    i < 80;
    i++
) {

    createPerson(
        (Math.random() - 0.5) *
        700,
        (Math.random() - 0.5) *
        700
    );
}


/* =========================================================
   COLEGIO
========================================================= */

function createSchool(
    x,
    z
) {

    const building =
        box(
            55,
            15,
            35,
            materials.white,
            x,
            7.5,
            z
        );

    buildingCount++;


    box(
        12,
        20,
        3,
        materials.red,
        x,
        10,
        z - 19
    );


    for (
        let i = -2;
        i <= 2;
        i++
    ) {

        box(
            6,
            4,
            0.4,
            materials.window,
            x + i * 10,
            9,
            z - 18
        );
    }
}


createSchool(
    -430,
    100
);


/* =========================================================
   HOSPITAL
========================================================= */

function createHospital(
    x,
    z
) {

    const building =
        box(
            70,
            30,
            45,
            materials.white,
            x,
            15,
            z
        );

    buildingCount++;


    box(
        18,
        8,
        2,
        materials.red,
        x,
        32,
        z - 23
    );


    box(
        4,
        2,
        2.2,
        materials.white,
        x,
        35,
        z - 24
    );


    box(
        2,
        5,
        2.2,
        materials.white,
        x,
        35,
        z - 24
    );
}


createHospital(
    430,
    100
);


/* =========================================================
   POLICÍA
========================================================= */

function createPolice(
    x,
    z
) {

    const building =
        box(
            42,
            16,
            30,
            materials.blueBuilding,
            x,
            8,
            z
        );

    buildingCount++;


    box(
        14,
        7,
        3,
        materials.white,
        x,
        12,
        z - 16
    );
}


createPolice(
    -430,
    -100
);


/* =========================================================
   BOMBEROS
========================================================= */

function createFireStation(
    x,
    z
) {

    const building =
        box(
            55,
            13,
            32,
            materials.red,
            x,
            6.5,
            z
        );

    buildingCount++;


    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        box(
            10,
            8,
            2,
            materials.black,
            x + i * 14,
            4,
            z - 17
        );
    }
}


createFireStation(
    430,
    -100
);


/* =========================================================
   CENTRO COMERCIAL
========================================================= */

function createMall(
    x,
    z
) {

    const building =
        box(
            100,
            25,
            60,
            materials.glass,
            x,
            12.5,
            z
        );

    buildingCount++;


    for (
        let i = -4;
        i <= 4;
        i++
    ) {

        box(
            8,
            5,
            0.4,
            materials.window,
            x + i * 10,
            12,
            z - 31
        );
    }
}


createMall(
    300,
    0
);


/* =========================================================
   ZONA INDUSTRIAL
========================================================= */

function createFactory(
    x,
    z
) {

    const factory =
        box(
            75,
            18,
            50,
            materials.concrete,
            x,
            9,
            z
        );

    buildingCount++;


    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        cylinder(
            4,
            28,
            materials.metal,
            x + i * 22,
            14,
            z + 20
        );
    }
}


for (
    let i = 0;
    i < 6;
    i++
) {

    createFactory(
        -400 +
        (i % 3) * 100,

        520 +
        Math.floor(i / 3) * 80
    );
}


/* =========================================================
   ESTACIÓN
========================================================= */

function createStation(
    x,
    z
) {

    const building =
        box(
            90,
            20,
            35,
            materials.glassDark,
            x,
            10,
            z
        );

    buildingCount++;


    for (
        let i = -4;
        i <= 4;
        i++
    ) {

        box(
            5,
            8,
            0.5,
            materials.window,
            x + i * 9,
            10,
            z - 18
        );
    }


    /* Andenes */

    for (
        let i = -1;
        i <= 1;
        i++
    ) {

        box(
            110,
            0.8,
            6,
            materials.concrete,
            x,
            0.8,
            z + i * 12
        );
    }
}


createStation(
    0,
    500
);


/* =========================================================
   ZONA COSTERA / LAGO
========================================================= */

function createWater(
    x,
    z,
    width,
    depth
) {

    const water =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                width,
                depth
            ),
            new THREE.MeshStandardMaterial({
                color: 0x287fa0,
                metalness: 0.2,
                roughness: 0.15,
                transparent: true,
                opacity: 0.88
            })
        );

    water.rotation.x =
        -Math.PI / 2;

    water.position.set(
        x,
        0.1,
        z
    );

    scene.add(water);
}


createWater(
    0,
    -560,
    1000,
    180
);


/* =========================================================
   MUELLE
========================================================= */

for (
    let x = -250;
    x <= 250;
    x += 35
) {

    box(
        25,
        0.8,
        8,
        materials.wood || materials.darkBuilding,
        x,
        1,
        -500
    );
}


/* =========================================================
   ZONA INDUSTRIAL EXTRA
========================================================= */

for (
    let i = 0;
    i < 8;
    i++
) {

    box(
        45,
        10 +
        Math.random() * 15,
        30,
        materials.darkBuilding,
        250 +
        (i % 4) * 70,
        10,
        430 +
        Math.floor(i / 4) * 60
    );

    buildingCount++;
}


/* =========================================================
   ÁRBOLES POR LA CIUDAD
========================================================= */

for (
    let i = 0;
    i < 160;
    i++
) {

    let x =
        (Math.random() - 0.5) *
        950;

    let z =
        (Math.random() - 0.5) *
        950;


    const nearRoad =
        avenuePositions.some(
            p =>
                Math.abs(x - p) < 14 ||
                Math.abs(z - p) < 14
        );


    if (!nearRoad) {

        createTree(
            x,
            z,
            0.7 +
            Math.random() * 0.8
        );
    }
}


/* =========================================================
   CONTADORES
========================================================= */

document.getElementById(
    "buildings"
).textContent =
    buildingCount.toLocaleString(
        "es-ES"
    );

document.getElementById(
    "cars"
).textContent =
    cars.length.toLocaleString(
        "es-ES"
    );

document.getElementById(
    "population"
).textContent =
    "128.450";


/* =========================================================
   MOVIMIENTO DE COCHES
========================================================= */

function updateCars() {

    for (
        const car of cars
    ) {

        if (
            !car.group
        ) {
            continue;
        }


        if (
            car.horizontal
        ) {

            car.group.position.x +=
                car.speed;

            if (
                car.group.position.x >
                560
            ) {

                car.group.position.x =
                    -560;
            }

        } else {

            car.group.position.z +=
                car.speed;

            if (
                car.group.position.z >
                560
            ) {

                car.group.position.z =
                    -560;
            }
        }
    }
}


/* =========================================================
   MOVIMIENTO PEATONES
========================================================= */

function updatePeople() {

    for (
        const person of people
    ) {

        person.angle +=
            person.speed;

        person.group.position.x +=
            Math.cos(person.angle) *
            0.035;

        person.group.position.z +=
            Math.sin(person.angle) *
            0.035;


        if (
            person.group.position.x >
            500
        ) {

            person.group.position.x =
                -500;
        }

        if (
            person.group.position.x <
            -500
        ) {

            person.group.position.x =
                500;
        }

        if (
            person.group.position.z >
            500
        ) {

            person.group.position.z =
                -500;
        }

        if (
            person.group.position.z <
            -500
        ) {

            person.group.position.z =
                500;
        }
    }
}


/* =========================================================
   DÍA / NOCHE
========================================================= */

let isNight = false;


function setDay() {

    isNight = false;

    scene.background.set(
        0x9bbbd3
    );

    scene.fog.color.set(
        0x9bbbd3
    );

    hemisphereLight.intensity =
        2.2;

    sun.intensity =
        3.2;

    renderer.toneMappingExposure =
        1.15;


    lamps.forEach(
        lamp => {

            lamp.material
                .emissiveIntensity =
                0;
        }
    );
}


function setNight() {

    isNight = true;

    scene.background.set(
        0x050b18
    );

    scene.fog.color.set(
        0x050b18
    );

    hemisphereLight.intensity =
        0.35;

    sun.intensity =
        0.25;

    renderer.toneMappingExposure =
        0.8;


    lamps.forEach(
        lamp => {

            lamp.material
                .emissiveIntensity =
                4;
        }
    );
}


document.getElementById(
    "dayButton"
).addEventListener(
    "click",
    setDay
);


document.getElementById(
    "nightButton"
).addEventListener(
    "click",
    setNight
);


/* =========================================================
   RESET
========================================================= */

document.getElementById(
    "resetButton"
).addEventListener(
    "click",
    () => {

        camera.position.set(
            260,
            220,
            300
        );

        controls.target.set(
            0,
            20,
            0
        );

        controls.update();

        setDay();
    }
);


/* =========================================================
   CINEMÁTICA
========================================================= */

let cinematic = false;

let cinematicTime = 0;


const cinematicPanel =
    document.getElementById(
        "cinematicPanel"
    );

const cinematicText =
    document.getElementById(
        "cinematicText"
    );


document.getElementById(
    "cinematicButton"
).addEventListener(
    "click",
    () => {

        cinematic =
            !cinematic;

        cinematicTime = 0;

        if (cinematic) {

            controls.enabled =
                false;

            cinematicPanel.classList.add(
                "visible"
            );

        } else {

            controls.enabled =
                true;

            cinematicPanel.classList.remove(
                "visible"
            );
        }
    }
);


function updateCinematic(
    delta
) {

    if (!cinematic) {
        return;
    }

    cinematicTime +=
        delta * 0.00005;


    const radius = 500;


    camera.position.x =
        Math.cos(cinematicTime) *
        radius;

    camera.position.z =
        Math.sin(cinematicTime) *
        radius;

    camera.position.y =
        120 +
        Math.sin(
            cinematicTime * 0.6
        ) *
        50;


    controls.target.set(
        0,
        35,
        0
    );


    const phase =
        cinematicTime %
        (Math.PI * 2);


    if (
        phase < 1
    ) {

        cinematicText.textContent =
            "Vista aérea de MEGACITY";

    } else if (
        phase < 2.5
    ) {

        cinematicText.textContent =
            "Centro financiero";

    } else if (
        phase < 4
    ) {

        cinematicText.textContent =
            "Barrios residenciales";

    } else {

        cinematicText.textContent =
            "La ciudad cobra vida";
    }
}


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);


/* =========================================================
   ANIMACIÓN
========================================================= */

const clock =
    new THREE.Clock();


function animate() {

    requestAnimationFrame(
        animate
    );


    const delta =
        clock.getDelta();


    controls.update();

    updateCars();

    updatePeople();

    updateCinematic(
        delta
    );


    renderer.render(
        scene,
        camera
    );
}


animate();