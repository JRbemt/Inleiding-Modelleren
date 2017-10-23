function Resultaat() {
    this.SHOWING = false;
    this.RENDERED_TABLE = false;

    this.PLOT = true;
    this.LOG_DAG = true;
    this.LOG_UUR = true;

    this.data = {};
    this.lijnnrs = [];
    this.dagLog = [];
};

Resultaat.prototype = {
    update: function(data) {
        this.data = data;
        if (this.SHOWING) {
            this.plot();
        }
    },
    plot: function() {
        if (!this.PLOT) {
            return;
        }
        var winsten = [];
        var ctx = this;

        if (this.data === undefined) {
            return;
        }

        var key = Resultaat.plotBindings[parseInt($("#select_plot_type").val())];

        for (var i = 0; i < this.lijnnrs.length; i++) {
            var lijnStatistieken = this.data[this.lijnnrs[i]];
            var winst = [];
            if (lijnStatistieken === undefined) {
                return;
            }
            for (var x = 0; x < lijnStatistieken.length; x++) {
                if (x > 0) {
                    winst.push(lijnStatistieken[x][key] - lijnStatistieken[x - 1][key]);
                } else winst.push(lijnStatistieken[x][key]);
            }
            winsten.push(winst);
        }

        var data = {
            labels: Util.range(winsten[0].length),
            series: winsten
        };

        /* Set some base options (settings will override the default settings in Chartist.js *see default settings*). We are adding a basic label interpolation function for the xAxis labels. */
        var options = {
            axisX: {
                labelInterpolationFnc: function(value) {
                    var val = ctx.data[ctx.lijnnrs[0]][value].uur;
                    if (winsten[0].length < 48) {
                        return val;
                    } else {
                        var val = ctx.data[ctx.lijnnrs[0]][value].uur;
                        if (val % 12 == 0) {
                            return val;
                        }
                        return "";
                    }
                }
            }
        };

        /* Initialize the chart with the above settings */
        new Chartist.Line(Resultaat.graphID, data, options);
    },
    logDag: function(numDag, lijnen) {
        if (!this.LOG_DAG) {
            return;
        }
        var target = $("#dag_log");
        var item = {
            dag: numDag,
            totaal: 0
        };
        var totaal = 0;;

        // voeg nieuwe dag toe
        for (var i = 0; i < lijnen.length; i++) {
            var l = lijnen[i];
            var winst = l.getTotaleWinst();
            totaal += winst;

            item[l.lijnnr] = parseInt(winst);
            item.totaal += parseInt(winst);
        }
        this.dagLog.push(item);
        //print alle dagen
        var txt = "";

        for (var i = 0; i < this.dagLog.length; i++) {
            for (var x = 0; x < lijnen.length; x++) {
                var l = lijnen[x];
                var val = this.dagLog[i][l.lijnnr];
                if (i > 0) {
                    val -= this.dagLog[i - 1][l.lijnnr];
                }
                txt += "[" + l.lijnnr + "] \t winst: " + val + "\n";
            }
            var tot = this.dagLog[i].totaal;
            if (i > 0) {
                tot -= this.dagLog[i - 1].totaal;
            }
            txt += "[DAG " + this.dagLog[i].dag + "] \t winst:" + tot + "\n\n";
        }
        txt += "TOTAAL: " + parseInt(totaal);
        target.text(txt);
    },
    logUur: function() {
        if (this.RENDERED_TABLE || !this.LOG_UUR) {
            return;
        }
        var table = $("#uur_table").find("tbody");

        var header = Object.keys(this.data[this.lijnnrs[0]][0]);

        //table.text("");

        for (var i = 0; i < this.lijnnrs.length; i++) {
            var lijnStatistieken = this.data[this.lijnnrs[i]];
            var uur = lijnStatistieken[lijnStatistieken.length - 1];

            var row = "<tr><td>" + this.lijnnrs[i] + "</td>"
            for (var h = 0; h < header.length; h++) {
                row += "<td>" + parseInt(uur[header[h]]) + "</td>";
            }

            row += "</tr>";
            table.append($.parseHTML(row));

        }

    },
    reset: function() {

        var header = Object.keys(this.data[this.lijnnrs[0]][0]);
        var headerStr = "<table id=\"uur_table\" class=\"display\"><thead><tr><th>lijnnr</th>";

        var parent = $("#uur_table_container");
        parent.empty();

        for (var i = 0; i < header.length; i++) {
          headerStr += "<th>"+header[i]+"</th>";
        }

        headerStr+="</tr></thead><tbody></tbody></table>";
        parent.append($.parseHTML(headerStr));
        this.RENDERED_TABLE = false;

        this.dagLog = [];
        this.data = [];
    }
};

Resultaat.graphID = "#results_graph";
// Zie Traject.js & index.html
Resultaat.plotBindings = [
    "winst",
    "tijdGereden",
    "geweigerdBussen",
    "geweigerdPassagiers",
    "vervoerd",
    "aangekomen"
];
