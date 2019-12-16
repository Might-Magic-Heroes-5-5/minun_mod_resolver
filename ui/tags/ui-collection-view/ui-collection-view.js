module.exports = {
    "attributes": [ "sections", "cells-getter" ],
    "listeners": {
        "oncreated": function () {
            this.cellCaches = {
                "sectionHeaders": [],
                "cells": []
            };
        },
        "onconnected": function () {

            if (this.lastScrollingOffset) {
                let scrollView = this.filler.query("ui-scroll-view")[0];
                scrollView.scrollLeft = this.lastScrollingOffset.scrollLeft;
                scrollView.scrollTop = this.lastScrollingOffset.scrollTop;
            }

            this.resizeObserver = new ResizeObserver((entries) => {
                this.updateView();
            });
            this.resizeObserver.observe(this);

            this.updateView();

        },
        "ondisconnected": function () {
            this.resizeObserver.disconnect(this);
        },
        "onadopted": function () {
        },
        "onupdated": function (name, value, parameters) {
            if (name === "sections") {
                this.dataReloaded = true;
                this.updateView();
            }
        }
    },
    "methods": {
        "updateView": function () {

            if (this.sections && this["cells-getter"]) {

                let dataReloaded = this.dataReloaded;
                this.dataReloaded = false;

                const coast = $.dom.getDevicePixels(200);

                let scrollView = this.filler.query("ui-scroll-view");
                let placeholder = this.filler.query("#placeholder");

                let sizes = $(this).css(["--cell-width", "--cell-height", "--section-header-size", "width"]);
                sizes.cellWidth = parseFloat(sizes["--cell-width"]);
                if (!isFinite(sizes.cellWidth)) {
                    sizes.cellWidth = parseFloat(this.filler.parameters.css["default-cell-width"]);
                }
                sizes.cellHeight = parseFloat(sizes["--cell-height"]);
                if (!isFinite(sizes.cellHeight)) {
                    sizes.cellHeight = parseFloat(this.filler.parameters.css["default-cell-height"]);
                }
                sizes.sectionHeaderSize = parseFloat(sizes["--section-header-size"]);
                if (!isFinite(sizes.sectionHeaderSize)) {
                    sizes.sectionHeaderSize = parseFloat(this.filler.parameters.css["default-section-header-size"]);
                }
                sizes.clientWidth = this.clientWidth;
                sizes.clientHeight = this.clientHeight;
                let sizeChanged = sizes.clientWidth !== this.lastClientWidth;
                this.lastClientWidth = sizes.clientWidth;

                if (dataReloaded) {
                    Object.keys(this.cellCaches).forEach((key) => {
                        if (/^[0-9]+$/.test(key)) {
                            if (this.cellCaches[key].header) {
                                this.cellCaches[key].header.container.addClass("not-used").css({
                                    "top": (-sizes.sectionHeaderSize) + "px"
                                });
                                this.cellCaches.sectionHeaders.push(this.cellCaches[key].header);
                                delete this.cellCaches[key].header;
                            }
                            Object.keys(this.cellCaches[key]).forEach((key2) => {
                                if (/^[0-9]+$/.test(key2)) {
                                    if (this.cellCaches[key][key2].cellContainer) {
                                        this.cellCaches[key][key2].cellContainer.addClass("not-used").css({
                                            "left": (-sizes.cellWidth) + "px",
                                            "top": (-sizes.cellHeight) + "px"
                                        });
                                        this.cellCaches.cells.push(this.cellCaches[key][key2]);
                                        delete this.cellCaches[key][key2];
                                    }
                                }
                            });
                        }
                    });
                }

                let cellsGetter = this["cells-getter"];

                let x = 0;
                let y = 0;

                let sectionHeaderSlot = $.tmpl.slot(this, "section-header");
                let cellSlot = $.tmpl.slot(this, "cell");

                let firstVisibleSectionHeader = null;

                let sectionPositions = {};

                let scrollTop = scrollView[0].scrollTop;

                this.sections.forEach((section, sectionIndex) => {

                    if (x !== 0) {
                        y += sizes.cellHeight;
                        x = 0;
                    }

                    sectionPositions[sectionIndex] = y;

                    if (sectionHeaderSlot) {
                        y += sizes.sectionHeaderSize;
                    }

                    let cells = this["cells-getter"].call(null, null, Object.assign({}, this.filler.parameters, {
                        "section": section
                    }), {});
                    if (!cells) { cells = []; }

                    let cellIndex = 0;
                    while (cellIndex < cells.length) {

                        if ((x > 0) && (x + sizes.cellWidth > sizes.clientWidth)) {
                            x = 0;
                            y += sizes.cellHeight;
                        }

                        if ((y >= scrollTop - coast) && (y + sizes.cellHeight < scrollTop + sizes.clientHeight + coast)) {
                            if (!this.cellCaches[sectionIndex]) {
                                this.cellCaches[sectionIndex] = {};
                            }
                            let newCell = false;
                            if (!this.cellCaches[sectionIndex][cellIndex]) {
                                this.cellCaches[sectionIndex][cellIndex] = this.cellCaches.cells.pop();
                                newCell = true;
                            }
                            let newContainer = false;
                            if (!this.cellCaches[sectionIndex][cellIndex]) {
                                newContainer = true;
                                this.cellCaches[sectionIndex][cellIndex] = {};
                                this.cellCaches[sectionIndex][cellIndex].cell = cellSlot.factory.produce(Object.assign({}, this.filler.parameters, {
                                    "section": section,
                                    "sectionIndex": sectionIndex,
                                    "cell": cells[cellIndex],
                                    "cellIndex": cellIndex
                                }));
                                this.cellCaches[sectionIndex][cellIndex].cellContainer = $("<ui-collection-view-cell>");
                                this.cellCaches[sectionIndex][cellIndex].cell.render(this.cellCaches[sectionIndex][cellIndex].cellContainer);
                            }
                            if (newCell) {
                                if (newContainer) {
                                    $(this).append(this.cellCaches[sectionIndex][cellIndex].cellContainer);
                                } else {
                                    this.cellCaches[sectionIndex][cellIndex].cellContainer.removeClass("not-used");
                                }
                            }
                            if ((newCell || dataReloaded) && (!newContainer)) {
                                this.cellCaches[sectionIndex][cellIndex].cell.fill(Object.assign({}, this.filler.parameters, {
                                    "section": section,
                                    "sectionIndex": sectionIndex,
                                    "cell": cells[cellIndex],
                                    "cellIndex": cellIndex
                                }));
                            }
                            if (newCell || sizeChanged || dataReloaded) {
                                this.cellCaches[sectionIndex][cellIndex].cellContainer.css({
                                    "left": x + "px",
                                    "top": y + "px"
                                });
                            }
                        } else {
                            if (this.cellCaches[sectionIndex] && this.cellCaches[sectionIndex][cellIndex]) {
                                this.cellCaches[sectionIndex][cellIndex].cellContainer.addClass("not-used").css({
                                    "left": (-sizes.cellWidth) + "px",
                                    "top": (-sizes.cellHeight) + "px",
                                });
                                this.cellCaches.cells.push(this.cellCaches[sectionIndex][cellIndex]);
                                delete this.cellCaches[sectionIndex][cellIndex];
                            }
                        }

                        x += sizes.cellWidth;

                        ++cellIndex;
                    }

                });

                if (x !== 0) {
                    x = 0;
                    y += sizes.cellHeight;
                }

                let met = false;

                let sectionIndex = 0;
                while (sectionIndex < this.sections.length) {

                    let needed = false;
                    let adjust = false;

                    if ((sectionPositions[sectionIndex] >= scrollTop - coast) &&
                        (sectionPositions[sectionIndex] + sizes.sectionHeaderSize < scrollTop + sizes.clientHeight + coast)) {
                        needed = true;
                    }

                    if ((!met) &&
                        ((sectionIndex + 1 === this.sections.length) ||
                         (sectionPositions[sectionIndex + 1] > scrollTop))) {
                        adjust = true;
                        met = true;
                        needed = true;
                    }

                    if (needed) {

                        if (!this.cellCaches[sectionIndex]) {
                            this.cellCaches[sectionIndex] = {};
                        }

                        let newHeader = false;
                        if (!this.cellCaches[sectionIndex].header) {
                            this.cellCaches[sectionIndex].header = this.cellCaches.sectionHeaders.pop();
                            newHeader = true;
                        }

                        let newHeaderContainer = false;
                        if (!this.cellCaches[sectionIndex].header) {
                            newHeaderContainer = true;
                            if (sectionHeaderSlot) {
                                this.cellCaches[sectionIndex].header = {};
                                this.cellCaches[sectionIndex].header.slot = sectionHeaderSlot.factory.produce(Object.assign({}, this.filler.parameters, {
                                    "section": this.sections[sectionIndex],
                                    "sectionIndex": sectionIndex
                                }));
                                this.cellCaches[sectionIndex].header.container = $("<ui-collection-view-section-header>");
                                this.cellCaches[sectionIndex].header.slot.render(this.cellCaches[sectionIndex].header.container);
                                $(this).append(this.cellCaches[sectionIndex].header.container);
                            }
                        } else {
                            if (this.cellCaches[sectionIndex].header) {
                                this.cellCaches[sectionIndex].header.container.removeClass("not-used");
                            }
                        }

                        if (this.cellCaches[sectionIndex].header) {
                            if ((newHeader && (!newHeaderContainer)) || dataReloaded) {
                                this.cellCaches[sectionIndex].header.slot.fill(Object.assign({}, this.filler.parameters, {
                                    "section": this.sections[sectionIndex],
                                    "sectionIndex": sectionIndex
                                }));
                            }

                            if (adjust) {
                                if ((sectionIndex + 1 < this.sections.length) &&
                                    (sectionPositions[sectionIndex + 1] - sizes.sectionHeaderSize < scrollTop)) {
                                    if (this.cellCaches[sectionIndex].header.fixed || dataReloaded || newHeader) {
                                        this.cellCaches[sectionIndex].header.fixed = false;
                                        this.cellCaches[sectionIndex].header.container.css({
                                            "top": (sectionPositions[sectionIndex + 1] - sizes.sectionHeaderSize) + "px"
                                        }).attr({"slot": null});
                                    }
                                } else {
                                    if ((!this.cellCaches[sectionIndex].header.fixed) || dataReloaded || newHeader) {
                                        this.cellCaches[sectionIndex].header.fixed = true;
                                        this.cellCaches[sectionIndex].header.container.css({
                                            "top": "0"
                                        }).attr({"slot": "fixed"});
                                    }
                                }
                            } else {
                                if (this.cellCaches[sectionIndex].header.fixed || dataReloaded || newHeader) {
                                    this.cellCaches[sectionIndex].header.fixed = false;
                                    this.cellCaches[sectionIndex].header.container.css({
                                        "top": sectionPositions[sectionIndex] + "px"
                                    }).attr({"slot": null});
                                }
                            }
                        }

                    } else {
                        if (this.cellCaches[sectionIndex] && this.cellCaches[sectionIndex].header) {
                            this.cellCaches.sectionHeaders.push(this.cellCaches[sectionIndex].header);
                            this.cellCaches[sectionIndex].header.container.addClass("not-used").css({
                                "top": (-sizes.sectionHeaderSize) + "px"
                            });
                            delete this.cellCaches[sectionIndex].header;
                        }
                    }

                    ++sectionIndex;
                }

                placeholder.css("height", y + "px");

            }

        }
    },
    "functors": {
        "updateView": function () {
            let scrollView = this.filler.query("ui-scroll-view")[0];
            this.lastScrollingOffset = {
                "scrollLeft": scrollView.scrollLeft,
                "scrollTop": scrollView.scrollTop,
            };
            this.updateView();
        }
    }
};
