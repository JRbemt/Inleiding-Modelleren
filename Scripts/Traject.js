/*
  Split
  Buslijnen
  Verkeer/ Stoplichten als (delay)
  Lijst met Haltes
*/
function Traject() {
    this.buslijnen = [];
    this.maxAantalBussen = 30;
    this.bussenInGebruik = 0;
    this.singleHaltesList = []; //hier houden we een lijst met alle haltes zodat we sommige berekening makkelijker kunnen maken (dubbel traject)
    this.totaalInstappers = Distribution.aantalInstappersVerdeling(14000);

    this.aantalGeweigerdeBussen = 0;
    this.resultaat = new Resultaat();
    this.statistieken = {};

    var ctx = this;
}


Traject.prototype = {
    addBuslijn: function(buslijn) {
        buslijn.opTraject = this;
        this.buslijnen.push(buslijn);

        this.resultaat.lijnnrs.push(buslijn.lijnnr);

        var ctx = this;
        buslijn.haltes.forEach(function(x) {
            ctx.singleHaltesList.push(x)
        });
    },
    brengBusTerug: function(bus) {
        this.bussenInGebruik -= 1;
    },
    vraagBusAan: function(buslijn) {

        if (this.bussenInGebruik >= this.maxAantalBussen) {
            this.aantalGeweigerdeBussen += 1;
            return false;
        } else {
            this.bussenInGebruik += 1;
            return true;
        }
    },
    minuutUpdate: function(dag){
      for (var i = 0; i < this.buslijnen.length; i++) {
        this.buslijnen[i].minuutUpdate(dag);
      }
      for (var i = 0; i < this.singleHaltesList.length; i++) {
        this.singleHaltesList[i].instapperPerMinuut(dag.getMinutes());
      }
    },
    uurUpdate: function(dag) {
        if (dag.getHours() === 1) {
            this.resultaat.logDag(dag.getDay(), this.buslijnen);
        }
        this.storeStatistics(dag);
        this.verdeelMensenOverHaltes(dag.getHours());
    },
    // sla winst en andere dingen per uur op zodat we de efficientie kunnen bepalen
    storeStatistics: function(dag) {
        for (var i = 0; i < this.buslijnen.length; i++) {
            var b = this.buslijnen[i];

            if (this.statistieken[b.lijnnr] === undefined) {
                this.statistieken[b.lijnnr] = [];
            }
            this.statistieken[b.lijnnr].push({
                dag: dag.getDay(),
                uur: dag.getHours(),
                winst: b.getTotaleWinst(),
                tijdGereden: b.totaleTijdGereden,
                geweigerdBussen: this.aantalGeweigerdeBussen,
                geweigerdPassagiers: b.totaalAantalMensenGeweigerd,
                vervoerd: b.totaalAantalMensenVervoerd,
                aangekomen: b.totaalAantalBussenAangekomen
            });
            //console.log(this.statistieken[b.lijnnr][this.statistieken[b.lijnnr].length-1]);
        }
        this.resultaat.update(this.statistieken);
        this.resultaat.logUur(this.statistieken);
    },
    // verdeel alle mensen over de buslijnen
    verdeelMensenOverHaltes: function(uur) {
        var mensenTotaal = this.totaalInstappers[uur - 1];
        var sum = function(acc, b) {
            return acc + b.halteInstapScore;
        };

        var instapScoresTotaal = this.singleHaltesList.reduce(sum, 0);

        for (var i = 0; i < this.singleHaltesList.length; i++) {
            var h = this.singleHaltesList[i];
            var mensen = Math.round(h.halteInstapScore / instapScoresTotaal * mensenTotaal);
            h.setAantalInstappersPerUur(mensen);
        }
    },
    getBuslijn: function(nr) {
        return this.buslijnen.filter(function(x) {
            return x.lijnnr === nr;
        })[0];
    },
    getTotaalMaximaleWachtijdMensen: function() {

    },
    reset: function() {
        this.statistieken = {};
        this.aantalGeweigerdeBussen = 0;
        for (var i = 0; i < this.singleHaltesList.length; i++) {
            var h = this.singleHaltesList[i];
            h.instappersLijnnrs = [];
            h.aantalInstappersDistributie = Distribution.distributeUniformly(0, 60);
        }
        for (var i = 0; i < this.buslijnen.length; i++) {
            this.buslijnen[i].reset();
        }
        this.resultaat.reset();
    }
}
