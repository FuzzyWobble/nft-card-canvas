var _G = { 

    DEBUG:                          false,   
    // ALLOW_MOUSE_CONTROL:            false, //if true, can still use mouse to change cam
    LIGHTS: {
        hlight:             0.10,
        dlight:             1.30,
        dlightpos:          {x:0,y:0,z:0},
        dlightcolor:        0xffffff,
        hlightcolor:        0xffffff,
        hlightcolorground:  0xffffff,
        fognear:            15,
        fogfar:             60,
        fogcolor:           0xffffff
    },
    ASSETS: {
        card: "assets/gltf/card.glb",
    },
    AVATAR:                         document.getElementById("avatar"),
    DATGUI:                         undefined, //dat gui sliders
    MYSCENE:                        undefined, //scene.js
    MYCARD:                         undefined, //card.js
};