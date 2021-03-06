const THREE = require("/scripts/three.js");

$.dom.registerTagTemplate("pkmsm", "~pkmsm/tags/${tag}/${tag}");
$.dom.registerTagTemplate("pkm", "~pkmsm/tags/${tag}/${tag}");

$.dom.autoregisterTag("m3d-object");
$.dom.autoregisterTag("m3d-skeleton");
$.dom.autoregisterTag("m3d-bone");
$.dom.autoregisterTag("m3d-mesh");
$.dom.autoregisterTag("m3d-texture");
$.dom.autoregisterTag("m3d-material");
$.dom.autoregisterTag("m3d-uniform");
$.dom.autoregisterTag("m3d-clip");
$.dom.autoregisterTag("m3d-track");

const getM3DElements = function (app, id, query) {

    let from = app.filler.query("#diagram ui-diagram-frame").filter((index, dom) => {
        return $(dom).attr("wire-id") === id;
    })[0];
    if (!from) {
        return;
    }

    let objects = from.frame.filler.query("m3d-object#pokemon-model").children().filter("m3d-object").filter((index, dom) => {
        return $(dom).attr("base").split("/").slice(-1)[0] !== "shadow";
    });

    if (!query) {
        return objects;
    }

    return objects.find(query);

};

const EditableField = function (id, query, type, setter) {
    this.id = id;
    this.query = query;
    this.type = type;
    this.setter = setter;
};

const BackgroundColorField = function (value) {
    this.value = value;
};

const ToggleField = function (value, setter) {
    this.value = value;
    this.setter = setter;
};

const NumberField = function (value, setter) {
    this.value = value;
    this.setter = setter;
};

const LinkField = function (id, query, text) {
    this.id = id;
    this.text = text;
    this.query = query;
};

const MeshField = function Mesh(id, query, text) {
    this.id = id;
    this.text = text;
    this.query = query;
};

const MaterialField = function Material(id, query, text) {
    this.id = id;
    this.text = text;
    this.query = query;
};

const TokenField = function (value) {
    if ((value === undefined) || (value === null)) {
        return value;
    }
    this.value = value;
};

const TokenListField = function (value) {
    this.value = value.split(",");
};

const ResourceField = function (id, target) {
    this.id = id;
    this.target = target;
};

const VectorField = function (value) {
    if (typeof value === "string") {
        value = value.split(",").map(x => parseFloat(x));
    }
    this.value = value;
};

const TexturesField = function Textures(value) {
    Object.assign(this, value);
};

const BlendingField = function Blending(value) {
    Object.assign(this, value);
};

const StencilField = function StencilTest(value) {
    Object.assign(this, value);
};

const DepthField = function DepthTest(value) {
    Object.assign(this, value);
};

const StencilOperationsField = function StencilOperations(value) {
    Object.assign(this, value);
};

const App = function App(dom, filler) {

    this.dom = dom;
    this.filler = filler;

};

App.prototype.onKeyPressed = function (event) {
    switch (event.keyCode) {
        case 115: { // s
            this.filler.query("#search-field").select();
            break;
        };
        default: {
            // console.log(event.keyCode);
            break;
        };
    }
};

App.prototype.getNextFrameTopLeft = function (from, size) {

    let coast = $.dom.getDevicePixels(30);

    let diagram = this.filler.query("#diagram");

    let { scrollLeft, scrollTop, viewportLeft, viewportTop } = diagram[0];
    let { width, height } = diagram.css(["width", "height"]);
    width = parseFloat(width);
    height = parseFloat(height);

    let mins = [viewportLeft + scrollLeft, viewportTop + scrollTop];
    let maxes = [mins[0] + width, mins[1] + height];

    let children = diagram.children();
    if (children.length === 0) {
        return {
            "left": mins[0] + coast,
            "top": mins[1] + coast + $.dom.getDevicePixels(40)
        };
    }

    let frames = [];
    for (let looper = 0; looper < children.length; ++looper) {
        let node = children[looper];
        let zIndex = $(node).css("z-index");
        frames.push({
            "node": node,
            "index": looper,
            "z-index": zIndex
        });
    }
    frames.sort((a, b) => {
        if (a["z-index"] && b["z-index"]) {
            let result = parseInt(a["z-index"]) - parseInt(b["z-index"]);
            if (result) {
                return result;
            }
        }
        return a.index - b.index;
    });

    let topmost = $(frames[frames.length - 1].node);

    let frame = topmost.css(["left", "top", "width", "height"]);

    let suggested = {
        "left": parseFloat(frame.left) + parseFloat(frame.width) + $.dom.getDevicePixels(40),
        "top": parseFloat(frame.top),
    };

    return suggested;

};

App.prototype.openModel = function (id, from) {

    let sceneSize = $.local["pkmsm.model-viewer.size"];
    if (sceneSize) {
        sceneSize = sceneSize.map((x) => $.dom.getDesignPixels(x));
    } else {
        sceneSize = [240, 240];
    }

    let size = {
        "width": $.dom.getDevicePixels(sceneSize[0]),
        "height": $.dom.getDevicePixels(sceneSize[1])
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("#")[0].split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": `Model “${filename}”`,
        "resizable": "yes",
        "wire-id": id
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/model-viewer/model-viewer", {
        "id": id
    });

    this.loadModel(id, (error, result) => {

        if (error) {
            console.error(error); return;
        }

        let mins = result.bounds.pose.mins;
        let maxes = result.bounds.pose.maxes;

        // we need adjust the model to make it render in the window correctly
        let size = Math.max((maxes[0] - mins[0]),
                            Math.max(maxes[1], maxes[1] - mins[1]),
                            (maxes[2] - mins[2]));

        // scale to fit
        let scale = 60 / size;

        let m3dObject = $("<m3d-object>").attr({
            "id": "pokemon-model",
            "model-scale": scale,
            "frustom-culled": "no"
        });

        const prepareDOM = (html, prefix) => {

            let dom = $(html);

            let id = result.id;

            let decoded = undefined;
            let binaryCallbacks = Object.create(null);
            $.ajax("/~pkmsm/model/data/mesh/" + result.id + (prefix ? "/" + prefix : ""), {
                "success": (result) => {

                    decoded = Object.create(null);
                    dom[0].binDecoded = decoded;
                    if (!prefix) {
                        m3dObject[0].binDecoded = decoded;
                    }
                    for (let key in result) {
                        let value = $.base64.decode(result[key]);
                        if (key.split(".").slice(-1)[0] === "bin") {
                            let type = key.split(".").slice(-2)[0];
                            switch (type) {
                                case "f32": { decoded[key] = new Float32Array(value); break; }
                                case "i8": { decoded[key] = new Int8Array(value); break; }
                                case "i16": { decoded[key] = new Int16Array(value); break; }
                                case "i32": { decoded[key] = new Int32Array(value); break; }
                                case "u8": { decoded[key] = new Uint8Array(value); break; }
                                case "u16": { decoded[key] = new Uint16Array(value); break; }
                                case "u32": { decoded[key] = new Uint32Array(value); break; }
                                default: { decoded[key] = value; break; }
                            }
                        } else {
                            decoded[key] = value;
                        }
                    }
                    if (binaryCallbacks) {
                        let callbacks = binaryCallbacks;
                        binaryCallbacks = null;
                        for (let key in callbacks) {
                            for (let callback of callbacks[key]) {
                                try {
                                    if (decoded[key]) {
                                        callback(undefined, decoded[key]);
                                    } else {
                                        callback(new Error(`Resource[${key}] not found`));
                                    }
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        }
                    }

                    if (!prefix) {
                        $.ajax(`/~pkmsm/model/res/${id}/animation.xml`, {
                            "dataType": "text",
                            "success": (html) => {
                                let animations = $(html);
                                frame[0].frame.animations = animations;
                                $.ajax(`/~pkmsm/model/data/animation/${id}`, {
                                    "success": (result) => {
                                        for (let key in result) {
                                            let value = $.base64.decode(result[key]);
                                            if (key.split(".").slice(-1)[0] === "bin") {
                                                let type = key.split(".").slice(-2)[0];
                                                switch (type) {
                                                    case "u8": { 
                                                        decoded[key] = [];
                                                        let array = new Uint8Array(value); 
                                                        for (let value of array) {
                                                            decoded[key].push(value ? true : false);
                                                        }
                                                        break; 
                                                    }
                                                    case "f32": 
                                                    default: { 
                                                        decoded[key] = [];
                                                        let array = new Float32Array(value); 
                                                        for (let value of array) {
                                                            decoded[key].push(value);
                                                        }
                                                        break; 
                                                    }
                                                }
                                            } else {
                                                decoded[key] = value;
                                            }
                                        }
                                        dom.append(animations);
                                        let animationSet = Object.create(null);
                                        for (let animation of animations) {
                                            if (animation.id) {
                                                animationSet[animation.id] = true;
                                            }
                                        }
                                        if (animationSet["FightingAction1"]) {
                                            frame[0].frame.playAnimationSeries(["FightingAction1"], {
                                                "channel": "action",
                                                "priority": 1,
                                                "fading": 0,
                                                "loop": "last"
                                            });
                                        }
                                        let paused = id.split("-")[1] === "327";
                                        for (let id of [26, 27, 28, 29]) {
                                            let action = `FightingAction${id}`;
                                            let pausedFrame = paused ? 128 : 0;
                                            if (animationSet[action]) {
                                                m3dObject[0].playM3DClip(action, {
                                                    "channel": `state-${id - 25}`,
                                                    "priority": (3 + id - 26),
                                                    "fading": 0,
                                                    "paused": paused,
                                                    "frame": pausedFrame,
                                                    "loop": Infinity
                                                });
                                            }
                                        }
                                    },
                                    "error": () => {
                                        console.error("Failed to get animations data");
                                    }
                                });
                            },
                            "error": () => {
                                console.error("Failed to list animations");
                            }
                        });
                    }

                },
                "error": () => {
                    if (binaryCallbacks) {
                        let callbacks = binaryCallbacks;
                        binaryCallbacks = null;
                        for (let key in callbacks) {
                            for (let callback of callbacks[key]) {
                                try {
                                    callback(new Error(`Resource[${prefix ? prefix + "/" : ""}${key}] not found`));
                                } catch (error) {
                                    console.error(error);
                                }
                            }
                        }
                    }
                    console.error("Failed to load model data");
                }
            });

            dom[0].m3dGetBin = function (id, callback) {
                if (decoded) {
                    try {
                        if (decoded[id]) {
                            callback(undefined, decoded[id]);
                        } else {
                            callback(new Error(`Resource[${id}] not found`));
                        }
                    } catch (error) {
                        console.error(error);
                    }
                    return;
                }
                if (!binaryCallbacks[id]) {
                    binaryCallbacks[id] = [];
                }
                binaryCallbacks[id].push(callback);
            };

            let patches = Object.create(null);

            dom[0].m3dLoadPatch = function (id, callback) {

                if (patches[id]) {
                    if (patches[id] instanceof Array) {
                        patches[id].push(callback);
                    } else {
                        callback(patches[id].error, patches[id].module); 
                    }
                    return;
                }

                patches[id] = [];

                let path = `/~pkmsm/model/res/${result.id}/${prefix ? prefix + "/" : ""}${id}`;
                $.res.load(path, (error, result) => {
                    let callbacks = patches[id];
                    if (callbacks && (!(callbacks instanceof Array))) {
                        return;
                    }
                    if (error) {
                        patches[id] = { "error": error };
                    } else {
                        let module = undefined;
                        try {
                            let functor = eval([
                                "(({ Vector2, Vector3, Vector4, Quaternion, Matrix3, Matrix4 }, module) => {" + result,
                                `}) //# sourceURL=${path}`,
                                ""
                            ].join("\n"));
                            let sandbox = { "exports": {} };
                            functor(require("/scripts/three.js"), sandbox);
                            module = sandbox.exports;
                            patches[id] = { "module": module };
                        } catch (error) {
                            patches[id] = { "error": error };
                        }
                    }
                    if (callbacks) {
                        for (let callback of callbacks) {
                            try {
                                callback(patches[id].error, patches[id].module);
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }
                });

            };

            return dom;

        };

        let modelDOM = prepareDOM(result.html.model, "");
        let shadowDOM = prepareDOM(result.html.shadow, "shadow");

        let needShadow = $.local["pkmsm.model-viewer.shadow"];
        if (needShadow === undefined) {
            needShadow = true;
        }
        shadowDOM.attr("visible", needShadow ? "yes" : "no");

        m3dObject.append(shadowDOM);
        m3dObject.append(modelDOM);

        m3dObject[0].m3dGetBin = function (id, callback) {
            return modelDOM[0].m3dGetBin(id, callback);
        };

        let scene = frame[0].frame.filler.query("m3d-scene");

        scene.append(m3dObject);

    });

    this.filler.query("#diagram").append(frame);

    frame[0].bringToFirst();

};

App.prototype.openAnimationController = function (id, from) {

    if (!from.animations) {
        console.error("Animations not available"); return;
    }

    let modelID = id.split("/")[0];

    let viewer = this.filler.query("#diagram").children("ui-diagram-frame").filter((index, dom) => {
        return $(dom).attr("wire-id") === modelID;
    })[0];

    if (!viewer) {
        viewer = from;
    } else {
        viewer = viewer.frame;
    }
    let size = {
        "width": $.dom.getDevicePixels(480),
        "height": $.dom.getDevicePixels(160)
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("#")[0].split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": `Animation Controller of “${filename}”`,
        "resizable": "yes",
        "wire-id": id + "/animation-controller"
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/animation-controller/animation-controller", {
        "id": id,
    });

    let animations = Object.create(null);
    for (let animation of viewer.animations) {
        if (animation.localName && 
            (animation.localName.toLowerCase() === "m3d-clip")) {
            let id = $(animation).attr("id");
            let group = id.split("Action")[0];
            let duration = parseFloat($(animation).attr("duration"));
            animations[id] = {
                "id": id,
                "group": group,
                "duration": duration,
                "tracks": $(animation).children("m3d-track").length
            };
        }
    }

    frame[0].frame.updateAnimationState(
        viewer.getPlayingAnimationSeries(),
        viewer.getPlayingAnimations(),
        animations
    );

    this.filler.query("#diagram").append(frame);

    frame[0].bringToFirst();

};

App.prototype.openAnimationList = function (id, from) {

    if (!from.animations) {
        console.error("Animations not available"); return;
    }

    let modelID = id.split("/")[0];

    let viewer = this.filler.query("#diagram").children("ui-diagram-frame").filter((index, dom) => {
        return $(dom).attr("wire-id") === modelID;
    })[0];

    if (!viewer) {
        viewer = from;
    } else {
        viewer = viewer.frame;
    }

    let animations = Object.create(null);
    for (let animation of viewer.animations) {
        if (animation.localName && 
            (animation.localName.toLowerCase() === "m3d-clip")) {
            let id = $(animation).attr("id");
            let group = id.split("Action")[0];
            let duration = parseFloat($(animation).attr("duration"));
            if (!animations[group]) {
                animations[group] = [];
            }
            animations[group].push({
                "id": id,
                "group": group,
                "duration": duration,
                "tracks": $(animation).children("m3d-track").length
            });
        }
    }

    let size = {
        "width": $.dom.getDevicePixels(200),
        "height": $.dom.getDevicePixels(340)
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("#")[0].split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": `Animations of “${filename}”`,
        "resizable": "yes",
        "wire-id": id + "/animation-list"
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/animation-list/animation-list", {
        "id": id,
        "groups": Object.keys(animations).sort().map((group) => ({
            "name": group,
            "animations": animations[group]
        }))
    });

    this.filler.query("#diagram").append(frame);

    frame[0].bringToFirst();

};

App.prototype.openResourceList = function (id, from) {

    let size = {
        "width": $.dom.getDevicePixels(200),
        "height": $.dom.getDevicePixels(340)
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("#")[0].split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": `Resources of “${filename}”`,
        "resizable": "yes",
        "wire-id": id + "/resource-list"
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/resource-list/resource-list", {
        "id": id
    });

    $.ajax(`/~pkmsm/model/files/${id}`, {
        "success": function (result) {

            let files = result.split("\n").map((file) => file.trim()).filter((file) => file);

            let groups = Object.create(null);

            for (let file of files) {
                let group = file.split("/").slice(0, -1).join("/");
                let filename = file.split("/").slice(-1)[0];
                let basename = filename.split(".").slice(0, -1).join(".");
                let extname = filename.split(".").slice(-1)[0];
                if (extname) {
                    extname = "." + extname;
                }
                if (!groups[group]) {
                    groups[group] = [];
                } 
                groups[group].push({
                    "group": group,
                    "id": file,
                    "filename": filename,
                    "basename": basename,
                    "extname": extname
                });
            }

            frame[0].frame.filler.fill({
                "groups": Object.keys(groups).map((name) => ({
                    "name": name,
                    "files": groups[name].sort((a, b) => a.id.localeCompare(b.id))
                }))
            });

        },
        "error": function () {
            console.error("Failed list reource files");
        }
    });

    this.filler.query("#diagram").append(frame);

    frame[0].bringToFirst();

};

App.prototype.openImage = function (id, from) {

    let size = {
        "width": $.dom.getDevicePixels(240),
        "height": $.dom.getDevicePixels(240)
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": filename,
        "resizable": "yes",
        "wire-id": id
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/image-viewer/image-viewer");

    frame[0].frame.filler.fill({
        "target": id
    });

    this.filler.query("#diagram").append(frame);

    frame[0].bringToFirst();

};

App.prototype.openLUT = function (id, from) {

    let size = {
        "width": $.dom.getDevicePixels(240),
        "height": $.dom.getDevicePixels(80)
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": filename,
        "resizable": "yes",
        "wire-id": id
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/lut-viewer/lut-viewer");

    frame[0].frame.filler.fill({
        "target": id
    });

    this.filler.query("#diagram").append(frame);

    frame[0].bringToFirst();

};

App.prototype.openShader = function (id, from) {

    let size = {
        "width": $.dom.getDevicePixels(240),
        "height": $.dom.getDevicePixels(240)
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": filename,
        "resizable": "yes",
        "wire-id": id
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/shader-editor/shader-editor");

    $.ajax(`/~pkmsm/model/res/${id}`, {
        "dataType": "text",
        "success": (result) => {
            frame[0].frame.filler.fill({
                "code": result
            });
        },
        "error": () => {
            console.error("Failed to load shader codes");
        }
    });

    this.filler.query("#diagram").append(frame);

    frame[0].bringToFirst();
};

App.prototype.inspectModel = function (id, from) {

    let size = {
        "width": $.dom.getDevicePixels(240),
        "height": $.dom.getDevicePixels(180)
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": `Inspector of “${id}”`,
        "resizable": "yes",
        "wire-id": id + "/inspector"
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/model-inspector/model-inspector");

    this.filler.query("#diagram").append(frame);

    let meshes = [];
    for (let mesh of getM3DElements(this, id, "m3d-mesh")) {
        meshes.push(new MeshField(id, `m3d-mesh#${$(mesh).attr("id")}`, $(mesh).attr("name")));
    }

    let modelFrame = this.filler.query("#diagram ui-diagram-frame").filter((index, dom) => {
        return $(dom).attr("wire-id") === id;
    })[0];
    if (!modelFrame) {
        modelFrame = from;
    }

    let background = { "r": 255, "g": 255, "b": 255, "a": 255 };
    let scene = modelFrame.frame.filler.query("m3d-scene")[0];
    if (scene) {
        let clearColor = scene.m3dRenderer.getClearColor();
        background.r = clearColor.r * 255;
        background.g = clearColor.g * 255;
        background.b = clearColor.b * 255;
        background.a = scene.m3dRenderer.getClearAlpha() * 255;
    }

    let m3dShadow = modelFrame.filler.query("m3d-object").filter((index, element) => {
        let base = $(element).attr("base");
        return base && (base.split("/").slice(-1)[0] === "shadow");
    });

    frame[0].frame.filler.fill({
        "target": {
            "background": new BackgroundColorField(background),
            "shadow": new ToggleField(m3dShadow.attr("visible") !== "no", (value) => {

                let modelFrame = this.filler.query("#diagram ui-diagram-frame").filter((index, dom) => {
                    return $(dom).attr("wire-id") === id;
                })[0];
                if (!modelFrame) { return; }

                let m3dShadow = modelFrame.filler.query("m3d-object").filter((index, element) => {
                    let base = $(element).attr("base");
                    return base && (base.split("/").slice(-1)[0] === "shadow");
                });

                m3dShadow.attr("visible", value ? "yes" : "no");

                frame[0].frame.filler.parameters.target.shadow.value = value;
                frame[0].frame.filler.fill({});

                $.local["pkmsm.model-viewer.shadow"] = value;

            }),
            "outline": new ToggleField(
                modelFrame.filler.query("m3d-scene")[0].m3dRenderer.drawPokemonOutline !== false, (value) => {

                let modelFrame = this.filler.query("#diagram ui-diagram-frame").filter((index, dom) => {
                    return $(dom).attr("wire-id") === id;
                })[0];
                if (!modelFrame) { return; }

                modelFrame.filler.query("m3d-scene")[0].m3dRenderer.drawPokemonOutline = value;

                frame[0].frame.filler.parameters.target.outline.value = value;
                frame[0].frame.filler.fill({});

                $.local["pkmsm.model-viewer.outline"] = value;

            }),
            // "width": new NumberField(parseInt($(modelFrame).css("width")), (value) => {}),
            // "height": new NumberField(parseInt($(modelFrame).css("height")), (value) => {}),
            // "statusHelper": false,
            "meshes": meshes
        }
    });

    frame[0].bringToFirst();
};

App.prototype.inspectMesh = function (id, query, from) {

    let size = {
        "width": $.dom.getDevicePixels(240),
        "height": $.dom.getDevicePixels(200)
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": `Inspector of “${id} ${query}”`,
        "resizable": "yes",
        "wire-id": id + "/inspector/" + query
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/model-inspector/model-inspector");

    this.filler.query("#diagram").append(frame);

    let mesh = getM3DElements(this, id, query);

    let extra = $(mesh).attr("extra");
    if (extra) {
        extra = JSON.parse(extra);
    }
    let order = $(mesh).attr("rendering-order");
    order = order ? parseInt(order) : 0;
    if (!isFinite(order)) {
        order = 0;
    }

    let materials = $(mesh).attr("materials").split(";").map((material) => {
        return new MaterialField(id, "m3d-material#" + material);
    });

    frame[0].frame.filler.fill({
        "target": {
            "visible": true,
            "materials": materials,
            "order": order,
            "bones": extra.bones
        }
    });

    frame[0].bringToFirst();
};

App.prototype.inspectMaterial = function (id, query, from) {

    let size = {
        "width": $.dom.getDevicePixels(240),
        "height": $.dom.getDevicePixels(360)
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": `Inspector of “${id} ${query}”`,
        "resizable": "yes",
        "wire-id": id + "/inspector/" + query
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/model-inspector/model-inspector");

    this.filler.query("#diagram").append(frame);

    let material = getM3DElements(this, id, query);

    let materialExtra = $(material).attr("extra");
    if (materialExtra) {
        materialExtra = JSON.parse(materialExtra);
    }
    let textures = {};
    $(material).attr("textures").split(";").forEach((texture) => {
        let query = "m3d-texture#" + texture.split(":")[1];
        let name = getM3DElements(this, id, query).attr("name");
        textures[texture.split(":")[0].slice(1)] = new LinkField(id, query, name);
    });

    frame[0].frame.filler.fill({
        "target": {
            "vertexShader": new ResourceField(id, $(material).attr("vertex-shader").slice(1)),
            "fragmentShader": new ResourceField(id, $(material).attr("fragment-shader").slice(1)),
            "geometryShader": materialExtra.isGeometryShader === "yes",
            "polygonOffset": parseInt($(material).attr("polygon-offset")),
            "side": new TokenField($(material).attr("side")),
            "depthTest": new DepthField({
                "enabled": $(material).attr("depth-test") === "yes",
                "writable": $(material).attr("depth-write") === "yes",
                "function": new TokenField($(material).attr("depth-test-function")),
            }),
            "stencilTest": new StencilField({
                "enabled": $(material).attr("stencil-test") === "yes",
                "function": new TokenField($(material).attr("stencil-test-function")),
                "reference": parseInt($(material).attr("stencil-test-reference")),
                "testMask": parseInt($(material).attr("stencil-test-mask")),
                "writeMask": parseInt($(material).attr("stencil-write-mask")),
                "operator": new StencilOperationsField({
                    "failed": new TokenField($(material).attr("stencil-failed")),
                    "zFailed": new TokenField($(material).attr("stencil-z-failed")),
                    "zPassed": new TokenField($(material).attr("stencil-z-passed")),
                })
            }),
            "blending": new BlendingField({
                "destination": new TokenListField($(material).attr("blending-destination")),
                "equation": new TokenListField($(material).attr("blending-equation")),
                "source": new TokenListField($(material).attr("blending-source")),
            }),
            "textures": new TexturesField(textures)
        }
    });

    frame[0].bringToFirst();

};

App.prototype.inspectTexture = function (id, query, from) {

    let size = {
        "width": $.dom.getDevicePixels(240),
        "height": $.dom.getDevicePixels(200)
    };
    let position = this.getNextFrameTopLeft(from, size);

    let filename = id.split("/").slice(-1)[0];
    let frame = $("<ui-diagram-frame>").attr({
        "caption": `Inspector of “${id} ${query}”`,
        "resizable": "yes",
        "wire-id": id + "/inspector/" + query
    }).css({
        "left": position.left + "px",
        "top": position.top + "px",
        "width": size.width + "px",
        "height": size.height + "px",
    });

    frame[0].loadUI("/~pkmsm/frames/model-inspector/model-inspector");

    this.filler.query("#diagram").append(frame);

    let texture = getM3DElements(this, id, query);

    frame[0].frame.filler.fill({
        "target": {
            "src": new ResourceField(id, $(texture).attr("src").slice(1)),
            "wrapS": $(texture).attr("wrap-s") ? new TokenField($(texture).attr("wrap-s")) : undefined,
            "wrapT": $(texture).attr("wrap-t") ? new TokenField($(texture).attr("wrap-t")) : undefined,
            "minFilter": $(texture).attr("min-filter") ? new TokenField($(texture).attr("min-filter")) : undefined,
            "magFilter": $(texture).attr("mag-filter") ? new TokenField($(texture).attr("mag-filter")) : undefined,
            "mipmap": $(texture).attr("mipmap") !== undefined ? ($(texture).attr("mipmap") === "yes") : undefined,
            "offset": $(texture).attr("offset") ? new VectorField($(texture).attr("offset")) : undefined,
            "repeat": $(texture).attr("repeat") ? new VectorField($(texture).attr("repeat")) : undefined,
            "rotation": $(texture).attr("rotation") !== undefined ? parseFloat($(texture).attr("rotation")) : undefined,
        }
    });

    frame[0].bringToFirst();

};

App.prototype.smartOpen = function (id, from) {

    let frames = this.filler.query("#diagram").children("ui-diagram-frame");
    for (let frame of frames) {
        if ($(frame).attr("wire-id") === id) {
            frame.bringToFirst();
            return;
        }
    }

    let extname = id.split(".").slice(-1)[0];
    switch (extname) {
        case "png": { 
            if (id.split("/")[1] === "luts") {
                this.openLUT(id, from); 
            } else {
                this.openImage(id, from); 
            }
            break; 
        }
        case "vert": { this.openShader(id, from); break; }
        case "frag": { this.openShader(id, from); break; }
        default: { 
            if (/^pokemon-([0-9]+)-([0-9]+)$/.test(id)) {
                this.openModel(id, from);
            } else {
                console.log(`Unknown target[${id}]`);
            }
            break; 
        }
    }

};

App.prototype.loadModel = function (id, callback) {

    $.ajax(`/~pkmsm/model/${id}`, {
        "success": (result) => {
            $.ajax(`/~pkmsm/model/res/${result.id}/normal-model.xml`, {
                "dataType": "text",
                "success": (html) => {
                    $.ajax(`/~pkmsm/model/res/${result.id}/shadow/model.xml`, {
                        "dataType": "text",
                        "success": (html2) => {
                            callback(null, Object.assign(result, {
                                "html": {
                                    "model": html,
                                    "shadow": html2
                                }
                            }));
                        },
                        "error": () => {
                            callback(new Error("Failed to get model"));
                        }
                    });
                },
                "error": () => {
                    callback(new Error("Failed to get model"));
                }
            });
        }
    });

};

App.prototype.pickColor = function (color, callback) {

    if (!this.colorPicker) {
        this.colorPicker = this.createWindow("/windows/color-picker/color-picker", {
            "caption": "Color Picker",
            "left": 50, "top": 100,
            "width": $.dom.getDevicePixels(240), 
            "height": $.dom.getDevicePixels(340),
            "resizable": false,
            "justHideWhenClose": true
        });
    }

    this.colorPicker.colorCallback = callback;

    this.colorPicker.setColor(color);
    
    this.colorPicker.dom.showWindow();

};

App.prototype.title = "Pokemon Ultra Sun/Moon - 3DS";

App.functors = {
    "preventSystemShortcut": function (event) {
        if (event.altKey) {
            event.preventDefault();
        }
    },
    "advanceSearch": function (event) {

        switch (event.keyCode) {
            case 13: { // return
                if (this.searchOverlay) {
                    if (this.searchOverlay.filler.parameters.results) {
                        let item = this.searchOverlay.filler.parameters.results[0];
                        this.smartOpen(item.id);
                        event.target.blur();
                        this.searchOverlay.dom.hideOverlay();
                    }
                }
                break;
            };
            case 27: { // escape
                event.target.blur();
                if (this.searchOverlay) {
                    this.searchOverlay.dom.hideOverlay();
                }
                break;
            };
            default: {
                break;
            };
        }

    },
    "updateSearchResult": function () {

        let width = $.dom.getDevicePixels(340);
        let height = $.dom.getDevicePixels(400);

        let left = parseInt($("body").css("width")) - $.dom.getDevicePixels(60) - width - $.dom.getDevicePixels(6);
        let top = $.dom.getDevicePixels(40 + 6);

        if (!this.searchOverlay) {
            this.searchOverlay = this.createOverlay("~pkmsm/overlays/search/search", {
                "left": left, "top": top,
                "width": width, "height": height,
                "justHideWhenClose": true
            });
        } else {
            $(this.searchOverlay.dom).css({
                "left": `${left}px`, "top": `${top}px`
            });
        }

        let keyword = this.filler.query("ui-input-field").val();

        this.searchOverlay.searchWithKeyword(keyword);

        this.searchOverlay.dom.showOverlay();

    },
    "smartOpen": function (id) {

        this.smartOpen(id);
        
    }
};

module.exports.App = App;

module.exports.ToggleField = ToggleField;
module.exports.NumberField = NumberField;
module.exports.LinkField = LinkField;
module.exports.MaterialField = MaterialField;
module.exports.MeshField = MeshField;
module.exports.TokenField = TokenField;
module.exports.ResourceField = ResourceField;
module.exports.VectorField = VectorField;
module.exports.TokenListField = TokenListField;
module.exports.BackgroundColorField = BackgroundColorField;

module.exports.getM3DElements = getM3DElements;
