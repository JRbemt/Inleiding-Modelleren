/*
  Split
  Buslijnen
  Verkeer/ Stoplichten als (delay)
  Lijst met Haltes
*/
function Bus(buslijn, vertrekTijd, id) {
    this.vertrekTijdMin = vertrekTijd;
    this.opBuslijn = buslijn;
    this.aantalMensen = 0;
    this.totaalDuurSec = 0; //totale duur van de rit

    this.vertrekTijdVorigeHalteMin = 0;
    this.aankomstTijdHuidigeHalteMin = 0;
    this.wachttijdHuidigeHalteSec = 0; //wachttijd huidige halte
    this.ritDuurHuidigeWegSec = 0; //duur van huidige weg
    this.isOpWeg = false;

    // flags
    this.laatsteHalteNr;


    // statistieken
    this.totaalAantalMensenGeweigerd = 0;
    this.totaalAantalMensenIngestapt = 0;
    this.totaalAantalHaltesGestopt = 0;
    this.gepasseerdeHaltes = 0;

    this.id = id;
}

Bus.prototype = {
    arriveerBijHalte: function(halte, tijd) {
        this.laatsteHalteNr = halte.haltenr;
        this.aankomstTijdHuidigeHalteMin = tijd;

        var wachttijd = 0;
        var uitstappers = 0;
        var instappers  = 0;
        if (this.gepasseerdeHaltes > 0) {
            // eerste halte stappen er alleen mensen in
            uitstappers += halte.getAantalUitstappers(this);
            this.aantalMensen -= uitstappers;
        }
        if (this.gepasseerdeHaltes === 0 || this.opBuslijn.getEindHalteNr() !== halte.haltenr) {
            // laatste halte stappen er alleen mensen uit
            instappers += halte.getAantalInstappers(this);
            this.aantalMensen += instappers;
            this.totaalAantalMensenIngestapt += instappers;
        }
        var stappers = uitstappers + instappers;
        if (stappers > 0) {
            wachttijd = stappers * Bus.wachttijdPerPassagierSec + Bus.stopStartTijdSec;
            this.totaalAantalHaltesGestopt += 1;
        }

        this.wachttijdHuidigeHalteSec = wachttijd;
        this.totaalDuurSec += wachttijd;
        this.isOpWeg = false;
    },
    rijdNaarVolgendeHalte: function(weg, tijd) {
        this.vertrekTijdVorigeHalteMin = tijd;
        this.gepasseerdeHaltes += 1;

        var ritDuur = weg.calculateDuration(this);
        this.ritDuurHuidigeWegSec = ritDuur;
        this.totaalDuurSec += ritDuur;
        this.isOpWeg = true;
    },
    getProgressie: function(tijd) {
        if (this.isOpWeg) {
            return Math.min(1.0, (tijd - this.vertrekTijdVorigeHalteMin) / (this.ritDuurHuidigeWegSec / 60));
        } else {
            return Math.min(1.0, (tijd - this.aankomstTijdHuidigeHalteMin) / (this.wachttijdHuidigeHalteSec / 60));
        }
    },
    getLijnnr: function() {
        return this.opBuslijn.lijnnr;
    }
};

// AANNAMES
Bus.snelheid = 40; // km/u
Bus.stopStartTijdSec = 20; // s
Bus.wachttijdPerPassagierSec = 2; // s
Bus.maxAantalMensen = 80;
