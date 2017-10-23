function Buslijn(lijnnr) {
    this.lijnnr = lijnnr;
    this.haltes = []; // lijst met alle haltes
    this.wegen = []; // lijst met alle wegen
    this.rijdendeBussen = []; // lijst met alle rijdende bussen
    this.vertrekTijdInterval = 0;
    this.vertrekHalteNr; // haltenr van de 1ste halte (station)
    this.eindHalteNr;
    this.totaleAfstandBuslijn = 0;
    this.opTraject;

    this.TAG = "BUSLIJN " + this.lijnnr;
    this.laatsteTijd = 0;

    this.totaalAantalBussenVertrokken = 0; // niet afhankelij van de rijstijd va nde bus
    this.totaalAantalBussenAangekomen = 0; // afhankelijk va nde rijstijd van de bus
    this.totaleTijdGereden = 0;
    this.totaalAantalMensenVervoerd = 0;
    this.totaalAantalMensenGeweigerd = 0;

    this.totaleOpbrengstenBuslijn = 0;
    this.totaleKostenBuslijn = 0;

    // GUI flag
    this.DIRTY = false; // wordt false wanneer er een bus klaar is (sheelt werk in gui)
}


Buslijn.prototype = {
    minuutUpdate: function(dag) {
        var sameMin = parseInt(this.laatsteTijd) === parseInt(dag.getTotalMinutesRaw());
        this.laatsteTijd = dag.getTotalMinutesRaw();

        if (dag.getHours() >= 6 && dag.getHours() <= 23) {
            if (!sameMin && dag.getTotalMinutes() % this.vertrekTijdInterval === 0) {
                this.laatsteTijdVerzondenBus = dag.getTotalMinutes();
                this.verstuurBus(dag);
            }
        }

        for (var i = 0; i < this.rijdendeBussen.length; i++) {
            var b = this.rijdendeBussen[i];
            if (b.getProgressie(this.laatsteTijd) >= 1.0) {
                if (b.isOpWeg) {
                    var weg = this.getWeg(b.laatsteHalteNr);
                    var h = this.getHalte(weg.eindHalteNr);
                    b.arriveerBijHalte(h, this.laatsteTijd);
                } else {
                    var weg = this.getWeg(b.laatsteHalteNr);
                    if (weg === undefined || (weg.beginHalteNr == this.vertrekHalteNr && b.gepasseerdeHaltes > 0)) {
                        this.eindigBusrit(b, i);
                    } else b.rijdNaarVolgendeHalte(weg, this.laatsteTijd);
                }
            }
        }
    },
    eindigBusrit: function(bus, index) {
        Util.logGrouped(this.TAG, "BUS gearriveerd na " + bus.totaalDuurSec / 60 + " m  ", "BUS");
        this.totaleTijdGereden += bus.totaalDuurSec / 60;
        this.totaalAantalMensenVervoerd += bus.totaalAantalMensenIngestapt;
        this.totaalAantalMensenGeweigerd += bus.totaalAantalMensenGeweigerd;
        this.totaalAantalBussenAangekomen += 1;


        this.rijdendeBussen.splice(index, 1);
        this.opTraject.brengBusTerug(bus);
        this.DIRTY = true;
    },
    verstuurBus: function(dag) {
        if (this.opTraject.vraagBusAan(this)) {
            var bus = new Bus(this, this.laatsteTijd, this.lijnnr.toString() + "_" + this.totaalAantalBussenVertrokken.toString());
            this.totaalAantalBussenVertrokken += 1;
            Util.logGrouped(this.TAG, "BUS verzonden", "BUS");
            bus.arriveerBijHalte(this.getHalte(this.getVertrekHalteNr()), this.laatsteTijd);
            this.rijdendeBussen.push(bus);
        } else {
            Util.logGrouped(this.TAG, "BUS aanvraag geweigerd", "BUS");
        }
    },


    // INTERFACE

    setVertrektijdInterval: function(val) {
        this.vertrekTijdInterval = val;
    },
    calculateCoordinatesOfBus: function(bus) {
        var prevH = this.getHalte(bus.laatsteHalteNr);
        if (bus.isOpWeg) {
            var nextH = this.getHalte(this.getWeg(prevH.haltenr).eindHalteNr);
            var prog = bus.getProgressie(this.laatsteTijd);

            return [
                prevH.xcoordinaat + (nextH.xcoordinaat - prevH.xcoordinaat) * prog,
                prevH.ycoordinaat + (nextH.ycoordinaat - prevH.ycoordinaat) * prog
            ]
        } else {
            return [
                prevH.xcoordinaat,
                prevH.ycoordinaat
            ]
        }
    },
    getBusCoordinates: function() {
        var coords = [];
        for (var i = 0; i < this.rijdendeBussen.length; i++) {
            var b = this.rijdendeBussen[i];
            coords.push(this.calculateCoordinatesOfBus(b));
        }
        return coords;
    },
    // geeft de halte met dit haltenr
    getHalte: function(haltenr) {
        return this.haltes.filter(function(halte) {
            return halte.haltenr === haltenr;
        })[0];
    },
    // geeft de de weg die begint bij dit haltenr
    getWeg: function(beginHalteNr) {
        return this.wegen.filter(function(weg) {
            return weg.beginHalteNr === beginHalteNr;
        })[0];
    },
    getVertrekHalteNr: function() {
        if (this.vertrekHalteNr === undefined) {
            var h = this.haltes.filter(function(x) {
                return x.isRichting(Halte.richting.HEEN) && x.naam.indexOf("Station") !== -1;
            })[0];
            if (h === undefined) {
                throw "geen beginhalte gevonden";
            }
            this.vertrekHalteNr = h.haltenr;
        }
        return this.vertrekHalteNr;
    },
    getEindHalteNr: function() {
        if (this.eindHalteNr === undefined) {
            var alleHaltes = this.krijgAlleHaltesVanaf(this.getVertrekHalteNr(), this.getVertrekHalteNr());
            this.eindHalteNr = alleHaltes[alleHaltes.length - 1].haltenr;
        }

        return this.eindHalteNr;
    },
    addWeg: function(weg) {
        begin = this.getHalte(weg.beginHalteNr);
        eind = this.getHalte(weg.eindHalteNr);

        var logbegin = (begin === undefined ? weg.beginHalteNr : begin.toString());
        var logeind = " naar " + (eind === undefined ? weg.eindHalteNr : eind.toString());

        var padding = 50;
        logeind = " ".repeat(padding - logbegin.length) + logeind;

        if (begin !== undefined && eind !== undefined) {
            this.wegen.push(weg);
            Util.logGrouped(this.TAG, "ADDED weg van             " + logbegin + logeind, "WEGEN");
        } else {
            Util.logGrouped(this.TAG, "REJECTED ADDING weg van   " + logbegin + logeind, "WEGEN");
        }
    },
    krijgAlleHaltesVanaf: function(startBijHaltenr, totEnMetHalteNr) {
        var haltesNew = [];
        var currHalte = startBijHaltenr;
        do {
            var w = this.getWeg(currHalte);

            if (w === undefined) {
                var laatste = this.getHalte(currHalte);
                if (laatste != undefined) {
                    haltesNew.push(laatste);
                }
                break;
            }
            var begin = this.getHalte(currHalte);
            if (haltesNew.indexOf(begin) != -1) {
                break;
            }
            haltesNew.push(begin);
            currHalte = w.eindHalteNr;

            if (totEnMetHalteNr !== undefined && currHalte === totEnMetHalteNr) {
                // stop bij eindhalte (station) (anders stopt hij bij startBijHaltenr)
                haltesNew.push(this.getHalte(totEnMetHalteNr));
                break;
            }

        } while (currHalte != undefined);

        return haltesNew;
    },
    sortHaltesRoughly: function() {
        var startBijHaltenr = this.getVertrekHalteNr();
        this.haltes = this.krijgAlleHaltesVanaf(startBijHaltenr);
    },
    getTotaleLengte: function() {
        if (this.totaleAfstandBuslijn === undefined) {
            var tot = 0;
            for (var i = 0; i < this.wegen.length; i++) {
                tot += this.wegen[i].afstand;
            }
            this.totaleAfstandBuslijn = tot;
        }
        return this.totaleAfstandBuslijn;
    },

    getTotaleWinst: function() {
        var kostenChauffeur = Buslijn.salarisChauffeur * (this.totaleTijdGereden / 60); // Euro/u * u
        var brandstofGebruik = Buslijn.zuinigheid * this.getTotaleLengte(); // Liter/km * km        per bus
        var brandStofKosten = brandstofGebruik * Buslijn.brandstofPrijs; // Liter * Euro/liter   per bus
        this.totaleKostenBuslijn = brandStofKosten * this.totaalAantalBussenAangekomen + kostenChauffeur;

        this.totaleOpbrengstenBuslijn = this.totaalAantalMensenVervoerd * Buslijn.gemPrijsTicket;

        return this.totaleOpbrengstenBuslijn - this.totaleKostenBuslijn;
    },
    reset: function() {
        this.laatsteTijd = 0;
        this.rijdendeBussen = [];

        this.totaalAantalBussenVertrokken = 0;
        this.totaalAantalBussenAangekomen = 0;
        this.totaleTijdGereden = 0;
        this.totaalAantalMensenVervoerd = 0;
        this.totaalAantalMensenGeweigerd = 0;

        this.totaleOpbrengstenBuslijn = 0;
        this.totaleKostenBuslijn = 0;
    }
};

Buslijn.salarisChauffeur = 13.21; // Euro/uur
Buslijn.zuinigheid = 1 / 3; // Liter/ km
Buslijn.brandstofPrijs = 1.226; // Euro/liter
Buslijn.gemPrijsTicket = 1.90; // Euro/klant
