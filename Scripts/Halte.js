/*
  Dependencies:
    * Distribution.js

*/

function Halte(naam, haltenr, xcoordinaat, ycoordinaat, richting) {
    this.naam = naam;
    this.haltenr = haltenr;
    this.xcoordinaat = xcoordinaat;
    this.ycoordinaat = ycoordinaat;
    this.richting = richting;

    this.halteInstapScore = 0;
    this.halteUitstapScore = 0;

    this.opBuslijn = [];
    this.instappersLijnnrs = [];
    this.aantalInstappersDistributie = Distribution.distributeUniformly(0, 60);
    this.mogelijkeBuslijnen = []; // bijv. 401, 402 en ALLE

    this.TAG = "HALTE";
}

Halte.prototype = {
    insertOpBuslijn: function(buslijn) {
        buslijn.haltes.splice(0, 0, this);
        this.opBuslijn.push(buslijn);
        this.mogelijkeBuslijnen.push(buslijn.lijnnr.toString());
        if (this.mogelijkeBuslijnen.length > 1) {
            this.mogelijkeBuslijnen.push(Halte.elkeBusMogelijk);
        }
        Util.logGrouped(this.TAG, "ADDED "+this.naam+"("+this.richting+") to "+buslijn.lijnnr, this.TAG);
    },
    removeVanBuslijn: function(buslijn) {
        var i1 = buslijn.halte.indexOf(halte);
        buslijn.removeHalte(i1);

        var i2 = this.opBuslijn.indexOf(buslijn);
        this.opBuslijn.splice(i2, 1);
    },
    getTotaalAantalInstapers: function() {
        return this.instappersLijnnrs.length;
    },
    isOpEnkeleBuslijn: function() {
        return this.opBuslijn.length == 1;
    },
    getAantalUitstappers: function(bus) {
        return Math.round(this.halteUitstapScore / Halte.maxUitstapScore * bus.aantalMensen);
    },
    getAantalInstappers : function(bus) {
        var blijvers = []; // op halte
        var capaciteit = Bus.maxAantalMensen - bus.aantalMensen;
        var lijnnr = bus.getLijnnr().toString();
        var aantalInstappers = 0;

        for (var i = 0; i < this.instappersLijnnrs.length; i++) {
            var lijnnrVanInstapper = this.instappersLijnnrs[i];
            if (lijnnrVanInstapper === lijnnr || lijnnrVanInstapper === Halte.elkeBusMogelijk) {
                // check of de bus niet vol zit
                if (aantalInstappers < capaciteit) {
                    aantalInstappers += 1;
                    continue;
                } else {
                    bus.totaalAantalMensenGeweigerd += 1;
                }
            }

            blijvers.push(lijnnrVanInstapper)
        }
        this.instappersLijnnrs = blijvers;
        return aantalInstappers;
    },
    // set het aantal instappers en verdeel deze uniform random over het aantal minuten
    setAantalInstappersPerUur: function(instappers) {
        this.aantalInstappersDistributie = Distribution.distributeUniformly(instappers, 60);
    },
    toString: function() {
        return this.naam + " ( " + this.haltenr + " ) (" + this.richting + ")"
    },
    isRichting: function(richting) {
        return this.richting == richting || this.richting == Halte.richting.BEIDE;
    },
    // bepaal eindbestemming van de nieuwe instappers
    instapperPerMinuut : function(minuten){
      var nieuweInstappers = this.aantalInstappersDistributie.next(minuten);
      for (var i = 0; i < nieuweInstappers; i++) {
          var rnd = Distribution.getRandomInt(0, this.mogelijkeBuslijnen.length);
          this.instappersLijnnrs.push(this.mogelijkeBuslijnen[rnd]);
      }
    }
}

Halte.richting = {
    HEEN: "1",
    TERUG: "2",
    BEIDE: "3"
};
Halte.elkeBusMogelijk = "ALLE";
Halte.maxUitstapScore = 10;
