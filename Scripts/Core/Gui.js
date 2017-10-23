/*
  Dependencies:
    * Util.js

    TODO: canvas cachen voor performance (als tijd!!)
*/
function Gui(maatschappij, guiSettings) {
    this.maatschappij = maatschappij;
    this.settings = guiSettings;
    var canv = document.getElementById(guiSettings.layers.canvas.id);
    this.ctx = canv.getContext("2d");

    canv.width = window.innerWidth * .8;
    canv.height = window.innerHeight;

    var ctx = this;
    $(window).resize(function() {
        canv.width = window.innerWidth * .8;
        canv.height = window.innerHeight;
        ctx.invalidate();

        ctx.DIRTY_HTML_LAYERS.push(ctx.settings.layers.haltes);
        ctx.clear(true, true);
        ctx.draw(false);
    });

    this.cache = {};
    this.DIRTY_HTML_LAYERS = [];
    this.lastDrawTime = 0;
}


Gui.prototype = {
    drawBuslijn: function(buslijn) {
        // scale alle coordinates van dde haltes
        if (!(buslijn.lijnnr in this.cache)) {
            buslijn.sortHaltesRoughly();
            var x = [];
            var y = [];

            for (var i = 0; i < buslijn.haltes.length; i++) {
                var h = buslijn.haltes[i];
                x[i] = h.xcoordinaat;
                y[i] = h.ycoordinaat;
            }

            this.scaleCoords(x, y);
            this.cache[buslijn.lijnnr] = {
                haltes: {
                    x: [],
                    y: []
                }
            }
            this.cache[buslijn.lijnnr].haltes.x = x;
            this.cache[buslijn.lijnnr].haltes.y = y;

        }


        //draw haltes
        var style = this.settings.busLijn[buslijn.lijnnr];
        var offsetY = this.settings.busLijn[buslijn.lijnnr].offsetY;
        var layer = document.getElementById(this.settings.layers.haltes.id);

        var c = this.cache[buslijn.lijnnr].haltes;

        var rot = this.settings.rotation * Math.PI / 180;

        var Bx = this.cache["scale"].avgX;
        var By = this.cache["scale"].avgY;

        var Ax = [],
            Ay = [];

        // Transformations
        for (var i = 0; i < this.cache[buslijn.lijnnr].haltes.x.length; i++) {
            // rotate punt A rond punt B
            Ax[i] = Bx + (c.x[i] - Bx) * Math.cos(rot) + (c.y[i] - By) * Math.sin(rot);
            Ay[i] = By + (c.x[i] - Bx) * Math.sin(rot) - (c.y[i] - By) * Math.cos(rot);
        }

        var halteRadius = 10;
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = style.lijnKleur;

        var ctx = this;

        for (var i = 0; i < this.cache[buslijn.lijnnr].haltes.x.length; i++) {
            var id = buslijn.lijnnr + "_" + buslijn.haltes[i].haltenr;
            var div = document.getElementById(id);
            //draw haltes
            if (div === null) {
                div = document.createElement("div");

                div.addEventListener("click", function() {
                    var h;
                    for (var i = 0; i < ctx.maatschappij.traject.buslijnen.length; i++) {
                        h = ctx.maatschappij.traject.buslijnen[i].getHalte(this.getAttribute("haltenr"));
                        if (h != null) {
                            break;
                        }
                    }
                    var points = h.aantalInstappersDistributie.points;
                    if (points != undefined) {
                        Gui.plotGraph(points, "graph");
                    }
                });
                if (Gui.drawAantalInstappers) {
                    div.innerHTML = buslijn.haltes[i].getTotaalAantalInstapers();
                }
                div.className = "halte";
                div.id = id;
                div.setAttribute("data-balloon", buslijn.haltes[i].toString());
                div.setAttribute("data-balloon-pos", "up");
                div.setAttribute("haltenr", buslijn.haltes[i].haltenr);
                div.style.position = "fixed";
                div.style.backgroundColor = style.halteKleur;
                div.style.left = Ax[i] * window.innerWidth + "px";
                div.style.top = Ay[i] * window.innerHeight + offsetY + "px";
                layer.appendChild(div);
            } else {
                if (Gui.drawAantalInstappers) {
                    div.innerHTML = buslijn.haltes[i].getTotaalAantalInstapers();
                }
                div.style.left = Ax[i] * window.innerWidth + "px";
                div.style.top = Ay[i] * window.innerHeight + offsetY + "px";
            }

            //draw wegen
            this.ctx.beginPath();
            this.ctx.moveTo(Ax[i] * window.innerWidth + halteRadius, Ay[i] * window.innerHeight + halteRadius + offsetY);
            this.ctx.lineTo(Ax[i + 1] * window.innerWidth + halteRadius, Ay[i + 1] * window.innerHeight + halteRadius + offsetY);
            this.ctx.stroke();
        }

        var halteRadius = 10;
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = style.lijnKleur;

        for (var i = 0; i < this.cache[buslijn.lijnnr].haltes.x.length; i++) {

            this.ctx.beginPath();
            this.ctx.moveTo(Ax[i] * window.innerWidth + halteRadius, Ay[i] * window.innerHeight + halteRadius + offsetY);
            this.ctx.lineTo(Ax[i + 1] * window.innerWidth + halteRadius, Ay[i + 1] * window.innerHeight + halteRadius + offsetY);
            this.ctx.stroke();
        }
    },
    drawBus: function(buslijn) {
        var layer = document.getElementById(this.settings.layers.bussen.id);
        var offsetY = this.settings.busLijn[buslijn.lijnnr].offsetY;
        var Bx = this.cache["scale"].avgX;
        var By = this.cache["scale"].avgY;

        if (buslijn.DIRTY) {
            buslijn.DIRTY = false;
            this.DIRTY_HTML_LAYERS.push(this.settings.layers.bussen);
            this.clear(true, true);
            this.draw();
            return;
        }

        for (var i = 0; i < buslijn.rijdendeBussen.length; i++) {
            var b = buslijn.rijdendeBussen[i];

            var coords = buslijn.calculateCoordinatesOfBus(b);
            var x = [coords[0]];
            var y = [coords[1]];

            this.scaleCoords(x, y);
            var rot = this.settings.rotation * Math.PI / 180;

            var Ax = Bx + (x - Bx) * Math.cos(rot) + (y - By) * Math.sin(rot);
            var Ay = By + (x - Bx) * Math.sin(rot) - (y - By) * Math.cos(rot);


            var div = document.getElementById(b.id);
            if (div === null) {
                div = document.createElement("div");

                div.className = "bus";
                div.id = b.id;
                div.style.position = "fixed";
                div.style.left = Ax * window.innerWidth + "px";
                div.style.top = Ay * window.innerHeight + offsetY + "px";
                layer.appendChild(div);
            } else {
                div.style.left = Ax * window.innerWidth + "px";
                div.style.top = Ay * window.innerHeight + offsetY + "px";
            }
        }
    },
    scaleCoords: function(x, y) {
        var minX, maxX, minY, maxY;
        var scale;

        var init = (this.cache["scale"]);
        if (init) {
            minY = this.cache["scale"].minY;
            minX = this.cache["scale"].minX;
            scale = this.cache["scale"].scale;
        } else {
            minY = Math.min.apply(null, y);
            maxY = Math.max.apply(null, y);
            minX = Math.min.apply(null, x);
            maxX = Math.max.apply(null, x);

            scale = Math.max(maxX, maxY);

            this.cache["scale"] = {
                minY: minY,
                minX: minX,
                scale: scale,
                avgX: 0,
                avgY: 0
            };
        }

        for (var i = 0; i < x.length; i++) {

            x[i] = (x[i] - minX);
            y[i] = (y[i] - minY);

            x[i] = x[i] / (scale / 40) + .1;
            y[i] = y[i] / (scale / 50) + .2;
        }
        if (!init) {
            var sumF = function(a, b) {
                return a + b;
            };
            var sumX = x.reduce(sumF);
            this.cache["scale"].avgX = sumX / x.length;
            var sumY = y.reduce(sumF);
            this.cache["scale"].avgY = sumY / y.length;
        }

        return scale;
    },
    invalidate: function() {
        this.cache = {};
        this.clear();
    },
    clear: function(clearCanvas, clearHTML) {
        if (clearCanvas === undefined) {
            clearCanvas = true;
        }
        if (clearHTML === undefined) {
            clearHTML = true;
        }

        if (clearCanvas) {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }
        if (clearHTML) {
            for (var i = 0; i < this.DIRTY_HTML_LAYERS.length; i++) {
                document.getElementById(this.DIRTY_HTML_LAYERS[i].id).innerHTML = "";
            }
            this.DIRTY_HTML_LAYERS = [];
        }
    },
    draw: function() {
        if (!Gui.enabled) {
            return;
        }
        for (var i = 0; i < this.maatschappij.traject.buslijnen.length; i++) {
            var l = this.maatschappij.traject.buslijnen[i];
            this.drawBuslijn(l);
            this.drawBus(l);
        }
    },
    // hardcoded (id's enzo) bindings voor model controls
    bindControls: function() {
        var ctx = this;
        $("#rotation_slider").on("change mousemove", function() {
            var val = $(this).val();
            if (val != ctx.settings.rotation) {
                $(this).parent().find(".output").text(val);
                ctx.settings.rotation = val;
                ctx.DIRTY_HTML_LAYERS.push(ctx.settings.layers.haltes);
                ctx.clear(true, true);
                ctx.draw(true);
                Util.logGrouped("GUI", "DRAWING with rotation: " + val, "GUI");
            }
        });

        var control = $("#controls");

        //generate interval sliders
        for (var i = 0; i < this.maatschappij.traject.buslijnen.length; i++) {
            var lijn = this.maatschappij.traject.buslijnen[i];
            var id = "slider_" + lijn.lijnnr;
            var html = "<div class=\"control\"><\p>Vertrektijd interval " + lijn.lijnnr + "</p>" +
                "<div class=\"output\">0</div>" +
                "<input id=\"" + id + "\" lijnnr=\"" + lijn.lijnnr + "\" type=\"range\" min=\"0\" value=\"0\" max=\"60\" step=\"1\"/></div>";
            var slide = $.parseHTML(html);
            control.append(slide);
            $("#" + id).on("change mousemove", function() {
                var lijn = ctx.maatschappij.traject.getBuslijn(parseInt($(this).attr("lijnnr")));
                var val = parseInt($(this).val());
                if (val != lijn.vertrekTijdInterval) {
                    $(this).parent().find(".output").text(val);
                    lijn.setVertrektijdInterval(val);
                }
            });
        }

        window.addEventListener("change time", function(e) {
            $("#show_time").text(e.detail.toString());
            var t = e.detail.getRealPassedTime();
            //FPS control
            if (ctx.lastDrawTime + 1000 / Gui.fps < t || t < ctx.lastDrawTime) {
                var diff = t - ctx.lastDrawTime;
                if (t < ctx.lastDrawTime) {
                    diff = 1000 - ctx.lastDrawTime + t;
                }
                var realFps = Math.round(1000 / diff);

                Util.logGrouped("GUI", "DRAWING after " + diff.toString() + " ms ( " + realFps + " -> " + Gui.fps + " fps)", "GUI");
                ctx.lastDrawTime = t;

                ctx.clear(true, false);
                ctx.draw();
            }
        });

        var toggleTime = false; // true if started
        // time_control
        $("#start_button").click(function() {
            toggleTime = !toggleTime;
            if (toggleTime) {
                ctx.maatschappij.start();
            } else {
                ctx.maatschappij.pause();
            }
        });

        $("#gui_button").click(function() {
            Gui.enabled = $(this).is(":checked");
            ctx.DIRTY_HTML_LAYERS.push(ctx.settings.layers.haltes);
            ctx.DIRTY_HTML_LAYERS.push(ctx.settings.layers.bussen);
            ctx.clear(true, true);
        });

        $("#refresh_button").click(function() {
            ctx.maatschappij.reset();
        });

        var graph = $("#graph_layer");
        $("#graph_close_button").click(function() {
            graph.animate({
                "left": -graph.width()
            }, "slow", function() {
                graph.hide();
            });
        });
        var results_layer = $("#results_overlay");
        var toggleResults = false;
        $("#results").click(function() {
            toggleResults = !toggleResults;
            if (toggleResults) {
                results_layer.animate({
                    "top": 0
                }, "slow");
                ctx.maatschappij.traject.resultaat.plot();
            } else {
                results_layer.animate({
                    "top": results_layer.height()
                }, "slow");
            }
            ctx.maatschappij.traject.resultaat.SHOWING = toggleResults;
        });
        $("#render_table_button").click(function() {
            ctx.maatschappij.pause();
            ctx.maatschappij.traject.resultaat.RENDERED_TABLE = true;
            $("#uur_table").parent().css("overflow-y", "hidden");
            $("#uur_table").DataTable({
                "scrollY": "200px",
                "searching": false,
                "scrollCollapse": true,
                "paging": false,
                dom: 'Bfrtip',
                buttons: [{
                        extend: 'copyHtml5',
                        exportOptions: {
                            columns: ':contains("Office")'
                        }
                    },
                    'excelHtml5',
                    'csvHtml5',
                    'pdfHtml5'
                ]
            });
        });
        var lastVal = 1;
        $("#step_slider").on("change mousemove", function() {
            var val = parseInt($(this).val());

            if(val != lastVal){
              lastVal = val;
              ctx.maatschappij.dag.setStepsPerMinute(val);
              $(this).parent().find(".output").text(val);
            }
        });
        $("#select_plot_type").change(function() {
            ctx.maatschappij.traject.resultaat.plot();
        });

        $("#plot_button").click(function() {
            ctx.maatschappij.traject.resultaat.PLOT = $(this).is(":checked");
        });
        $("#log_dag_button").click(function() {
            ctx.maatschappij.traject.resultaat.LOG_DAG = $(this).is(":checked");
        });
        $("#log_uur_button").click(function() {
            ctx.maatschappij.traject.resultaat.LOG_UUR = $(this).is(":checked");
        });
    }
}

Gui.plotGraph = function(points, id) {
    var graph = $("#graph_layer");
    if (!graph.is(":visible")) {
        graph.show();
        graph.animate({
            "left": 0
        }, "slow");
    }
    var data = {
        labels: Util.range(points.length),
        series: [
            points
        ]
    };

    /* Set some base options (settings will override the default settings in Chartist.js *see default settings*). We are adding a basic label interpolation function for the xAxis labels. */
    var options = {
        axisX: {
            labelInterpolationFnc: function(value) {
                return value;
            }
        }
    };

    /* Initialize the chart with the above settings */
    new Chartist.Line("#" + id, data, options);
};


Gui.drawAantalInstappers = true; // false verhoogt performance
Gui.fps = 400;
Gui.enabled = true;

Gui.guiSettings = {
    layers: {
        canvas: {
            id: "canv",
            handle: null
        },
        haltes: {
            id: "halte_layer",
        },
        bussen: {
            id: "bus_layer"
        },
    },
    rotation: 0,
    busLijn: {
        401: {
            lijnKleur: "#00E2E2",
            halteKleur: "#226666",
            offsetY: 0
        },
        402: {
            lijnKleur: "#FFAA00",
            halteKleur: "#AA8439",
            offsetY: 40
        },

    }
};
