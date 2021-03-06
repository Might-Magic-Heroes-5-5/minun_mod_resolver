// searches

@servlet.get("/~hmm5/search//*", function (request, response) {

    this.break();

    let keywords = [];

    response.headers["Content-Type"] = "text/plain";

    request.path.slice("/~hmm5/search/".length).split(/[\s,;\+]/).forEach((word) => {
        word = word.trim().toLowerCase();
        if (word && keywords.indexOf(word) === -1) {
            keywords.push(word);
        }
    });

    return @mew.rpc("hmm5.searchFiles", {
        "keywords": keywords
    }).then(function (files) {
        response.writer.end(files.map((file) => file.path).join("\n"), this.test);
    });

});

@servlet.get("/~hmm5/list/files//*", function (request, response) {

    this.break();

    let dirname = request.path.slice("/~hmm5/list/files/".length);
    while (dirname[dirname.length - 1] == "/") {
        dirname = dirname.slice(0, -1);
    }

    response.headers["Content-Type"] = "text/plain";

    return @mew.rpc("hmm5.listFiles", {
        "dirname": dirname
    }).then(function (files) {
        response.writer.end(files.map((file) => {
            if (file.type === "dir") {
                return file.name + "/";
            } else {
                return file.name;
            }
        }).join("\n"), this.test);
    });

});

@servlet.get("/~hmm5/list/bindings//*", function (request, response) {

    this.break();

    response.headers["Content-Type"] = "text/plain";

    let path = request.path.slice("/~hmm5/list/bindings".length);

    return @mew.rpc("hmm5.listBindings", {
        "path": path
    }).then(function (links) {
        response.writer.end(links.join("\n"), this.test);
    });

});

@servlet.get("/~hmm5/list/tokens//*", function (request, response) {

    this.break();

    let keywords = [];

    response.headers["Content-Type"] = "text/plain";

    request.path.slice("/~hmm5/list/tokens/".length).split(/[\s,;\+]/).forEach((word) => {
        word = word.trim().toLowerCase();
        if (word && keywords.indexOf(word) === -1) {
            keywords.push(word);
        }
    });

    return @mew.rpc("hmm5.listTokens", {
        "keywords": keywords
    }).then(function (tokens) {
        response.writer.end(tokens.join("\n"), this.test);
    });

});

@servlet.get("/~hmm5/list/models//*", function (request, response) {

    this.break();

    let keywords = [];

    response.headers["Content-Type"] = "text/plain";

    request.path.slice("/~hmm5/list/models/".length).split(/[\s,;\+]/).forEach((word) => {
        word = word.trim().toLowerCase();
        if (word && keywords.indexOf(word) === -1) {
            keywords.push(word);
        }
    });

    return @mew.rpc("hmm5.listModels", {
        "keywords": keywords
    }).then(function (models) {
        response.writer.end(models.join("\n"), this.test);
    });

});

@servlet.get("/~hmm5/list/arenas//*", function (request, response) {

    this.break();

    let keywords = [];

    response.headers["Content-Type"] = "text/plain";

    request.path.slice("/~hmm5/list/arenas/".length).split(/[\s,;\+]/).forEach((word) => {
        word = word.trim().toLowerCase();
        if (word && keywords.indexOf(word) === -1) {
            keywords.push(word);
        }
    });

    return @mew.rpc("hmm5.listArenas", {
        "keywords": keywords
    }).then(function (arenas) {
        response.writer.end(arenas.join("\n"), this.test);
    });

});

@servlet.get("/~hmm5/list/screens//*", function (request, response) {

    this.break();

    let keywords = [];

    response.headers["Content-Type"] = "text/plain";

    request.path.slice("/~hmm5/list/screens/".length).split(/[\s,;\+]/).forEach((word) => {
        word = word.trim().toLowerCase();
        if (word && keywords.indexOf(word) === -1) {
            keywords.push(word);
        }
    });

    return @mew.rpc("hmm5.listScreens", {
        "keywords": keywords
    }).then(function (screens) {
        response.writer.end(screens.join("\n"), this.test);
    });

});

@servlet.get("/~hmm5/list/deps//*", function (request, response) {

    this.break();

    response.headers["Content-Type"] = "text/plain";

    let path = request.path.slice("/~hmm5/list/deps".length);

    let hash = request.get.hash;

    let link = path;
    if (hash) {
        link += "#" + hash;
    }

    return @mew.rpc("hmm5.analyzeDependencies", {
        "link": link
    }).then(function (files) {
        response.writer.end(files.join("\n"), this.test);
    });

});

// redirections

@servlet.get("/~hmm5/uid/*", function (request, response) {

    this.break();

    response.headers["Content-Type"] = "text/plain";

    return @mew.rpc("hmm5.resolveUID", {
        "uid": request.path.slice("/~hmm5/uid/".length)
    }).then(function (path) {
        response.writer.end(path, this.test);
    });

});

@servlet.get("/~hmm5/link//*", function (request, response) {

    this.break();

    let path = request.path.slice("/~hmm5/link".length);

    let hash = request.get.hash;

    let link = path;
    if (hash) {
        link += "#" + hash;
    }

    response.headers["Content-Type"] = "application/json";

    return @mew.rpc("hmm5.restoreInstance", {
        "link": link
    }).then(function (instance) {
        response.writer.end(@.serialize(instance), this.test);
    });

});

@servlet.get("/~hmm5/inline//*", function (request, response) {

    this.break();

    let id = request.path.slice("/~hmm5/inline/".length);

    response.headers["Content-Type"] = "application/json";

    return @mew.rpc("hmm5.getInlineObject", {
        "id": id
    }).then(function (instance) {
        response.writer.end(@.serialize(instance), this.test);
    });

});

// resources

@servlet.get("/~hmm5/pak//*", function (request, response) {

    this.break();

    if (request.get.download === "yes") {
        response.headers["Content-Type"] = "application/x-download";
    } else {
        let extname = @.fs.extname(request.path.toLowerCase());
        switch (extname) {
            case ".xdb": {
                response.headers["Content-Type"] = "application/xml";
                break;
            };
            case ".dds": {
                response.headers["Content-Type"] = "image/vnd.ms-dds";
                break;
            };
            default: {
                response.headers["Content-Type"] = @.fs.mime(extname);
                break;
            };
        }
    }

    return @mew.rpc("hmm5.loadContent", {
        "path": request.path.slice("/~hmm5/pak/".length)
    }).then(function (binary) {
        response.writer.end(binary, this.test);
    });

});

@servlet.get("/~hmm5/png//*", function (request, response) {

    this.break();

    response.headers["Content-Type"] = "image/png";

    let path = request.path.slice("/~hmm5/png/".length);
    if (path.slice(-4) === ".png") {
        path = path.slice(0, -4);
    }

    return @mew.rpc("hmm5.loadImage", {
        "path": path
    }).then(function (dds) {
        response.writer.end(dds.encodeAsPNG(), this.test);
    });

});

@servlet.get("/~hmm5/wav//*", function (request, response) {

    this.break();

    response.headers["Content-Type"] = "audio/x-wav";

    return @mew.rpc("hmm5.loadContent", {
        "path": request.path.slice(11)
    }).then(function (binary) {
        response.writer.end(binary, this.test);
    });

});

@servlet.get("/~hmm5/xml//*", function (request, response) {

    this.break();

    let path = request.path.slice("/~hmm5/xml/".length);

    response.headers["Content-Type"] = "application/json";

    return @mew.rpc("hmm5.loadXML", {
        "path": path
    }).then(function (xml) {
        response.writer.end(@.serialize(xml), this.test);
    });

});

@servlet.get("/~hmm5/geom//*", function (request, response) {

    this.break();

    response.headers["Content-Type"] = "application/json";

    let uid = request.path.slice("/~hmm5/geom/".length).split("/").slice(-1)[0];

    return @mew.rpc("hmm5.loadGeometry", {
        "uid": uid
    }).then(function (instance) {
        response.writer.end(@.serialize(instance), this.test);
    });

});

@servlet.get("/~hmm5/skel//*", function (request, response) {

    this.break();

    response.headers["Content-Type"] = "application/json";

    let uid = request.path.slice("/~hmm5/skel/".length).split("/").slice(-1)[0];

    return @mew.rpc("hmm5.loadSkeleton", {
        "uid": uid
    }).then(function (instance) {
        response.writer.end(@.serialize(instance), this.test);
    });

});

@servlet.get("/~hmm5/anim//*", function (request, response) {

    this.break();

    response.headers["Content-Type"] = "application/json";

    let uid = request.path.slice("/~hmm5/anim/".length).split("/").slice(-1)[0];

    return @mew.rpc("hmm5.loadAnimation", {
        "uid": uid
    }).then(function (instance) {
        response.writer.end(@.serialize(instance), this.test);
    });

});
