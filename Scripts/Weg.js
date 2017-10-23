/*
  afstand, stoplichten etc.
*/
function Weg(beginHalteNr, eindHalteNr, afstand){
  this.beginHalteNr = beginHalteNr;
  this.eindHalteNr  = eindHalteNr;
  this.afstand      = afstand;      // m
}

Weg.prototype = {
  calculateDuration : function(bus){
    return (this.afstand/ 1000)/Bus.snelheid*60*60;
  }
};
