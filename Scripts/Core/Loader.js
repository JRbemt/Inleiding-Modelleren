/*
  Loader object is onze builder.
  Deze zorgt ervoor dat data wordt ingelezen en gestructureed (bouwt het model).
  De logica van het model zelf wordt hier niet geïmplementeerd!
*/
function Loader(){
  this.cache = {};
};

Loader.prototype = {
  // leest een hele file naar memory (als String) (NOTE: kan langzaam zijn!!!)
  // TODO: als we tijd over hebben kunnen we dit mss in byte chunks opdelen en inlezen
  readlines  : function(file, callback){
    var start = 0;
    var stop  = file.size - 1;

    var reader = new FileReader();

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) { // DONE == 2
        callback(evt.target.result);
      }
    };

    var blob = file.slice(start, stop + 1);

    //bestaat niet in ie 11
    reader.readAsBinaryString(blob);
  },

  handleFileSelect : function(evt, simulationSettings, callback) {
      var files = evt.target.files; // FileList object

      //TODO might not work with files that are loaded reaaaallly fast
      var filesHandlingCount = 0;
      var filesFinished = 0;
      var fileHandleCounter = function(){
        filesFinished +=1;

        if (filesFinished === filesHandlingCount){
          callback();
        }
      };

      // files is a FileList of File objects. List some properties.
      var output = [];
      for (var key in simulationSettings.fileHandles) {
        if (simulationSettings.fileHandles.hasOwnProperty(key)) {
          filesHandlingCount+=1;
          for (var i = 0, file; file = files[i]; i++) {
            if(escape(file.name) === key){
              f = file;
              break;
            }
          }
          h =simulationSettings.fileHandles[key];
          h.handle(this, h.structure, f, simulationSettings.query, fileHandleCounter);
        }
      }
  }
};
/*
  Fitler haltes en plaats ze op de buslijn
*/
function handleTrajecten(loader, structure, file, query, callback){

  loader.readlines(file, function(fileString){
    Util.log("FILEHANDLE" ,"STARTED processing "+escape(file.name));
    var start = performance.now();

    lines = fileString.split(/\n/);
    fileString = null;

    var regexp = /(?:[^,"]+|"[^"]*")+/g;
    var haltes = {};
    var buslijnen = {};
    loader.cache["buslijnen"] = [];
    query.buslijnen.forEach(function(x){
      var r =  new Buslijn(x);
      buslijnen[x.toString()] = r;
      loader.cache["buslijnen"].push(r);
    });

    // reverse() en pop() is veel sneller dan shift()
    // vooral voor debug purposes !!! NOTE: verwijder
    // lines.reverse();

    var line;
    var len = lines.length;
    // haal alle relevante haltes uit de "database"
    while(len--){
      line = lines.pop();

      if (line === ""){
        continue;
      }
      var cells = line.match(regexp);
      // dagcode is waarde 1 t/m 7 (we pakken hier dagcode 1 zodat we haltes niet dubbel krijgen)
      // richting is 1 of 2        (pakken 1 voor uniek resultaat) !! LET OP!! Als we 2 richtingen in gaan mag moet je dit weg halen omdat er 2 haltes staan met verschillende codes
      // TODO: als we tijd hebben voor 2-richtings verkeer -> verwijder richting filter

      if (query.plaatsen.indexOf(cells[structure.plaats]) !== -1 &&
          cells[structure.richting] === "1" &&
          cells[structure.dagcode]  === "1"){


          if (cells[structure.lijn_nr] in buslijnen){
            var buslijn = buslijnen[cells[structure.lijn_nr]];
            var nr      = cells[structure.halte_nr];
            if (!(nr in haltes)){
              var h = new Halte(cells[structure.halte_naam], cells[structure.halte_nr], parseInt(cells[structure.xcoordinaat]), parseInt(cells[structure.ycoordinaat]), cells[structure.richting]);
              //TODO REMOVE
              h.halteInstapScore  = Distribution.getRandomInt(20, 200);
              h.halteUitstapScore = Distribution.getRandomInt(20, 200);

              haltes[nr] = h;
              h.insertOpBuslijn(buslijn);
            } else {
              if (haltes[nr].opBuslijn.indexOf(buslijn) == -1){
                // halte met identieke haltecode bestaat al maar met een verschillende buslijn
                haltes[nr].insertOpBuslijn(buslijn);
              } else if (haltes[nr].richting != cells[structure.richting]){
                // halte met identieke haltecode bestaat al maar verschilende richting
                // Dit komt alleen voor op het station !!
                haltes[nr].richting = Halte.richting.BEIDE;
              }
            }
          } else continue;
      } else continue;
    }
    lines = null;
    loader.cache["haltes"] = haltes;
    Util.log("FILEHANDLE" ,"DONE loading haltes ( "+(performance.now()-start).toString()+" ms )");
    callback();
  });
};

function handleWegen(loader, structure, file, query, callback){
  // we hebben de halte data eerste nodig, en files inlezen is async (beetje cheap)
  if (loader.cache["haltes"] === undefined){
    setTimeout(function(){
      handleWegen(loader, structure, file, query, callback);
    }, 1000);
    return;
  }

  loader.readlines(file, function(fileString){
    Util.log("FILEHANDLE" ,"STARTED processing "+escape(file.name));
    var start = performance.now();

    lines = fileString.split(/\n/);
    fileString = null;

    var regexp = /(?:[^,"]+|"[^"]*")+/g;
    var wegen  = {};

    // reverse() en pop() is veel sneller dan shift()
    // vooral voor debug purposes !!! NOTE: verwijder
    // lines.reverse();

    var line;
    var len = lines.length;
    // haal alle relevante haltes uit de "database"
    while(len--){
      line = lines.pop();

      if (line === ""){
        continue;
      }
      var cells = line.match(regexp);
      // waarde ziet er uit als "CXX:64111990" dus split haltenr van prefix
      begin = cells[structure.halte_nr_begin].split(":")[1];
      eind  = cells[structure.halte_nr_eind].split(":")[1];

      if (begin in loader.cache["haltes"] &&
          eind  in loader.cache["haltes"]){

            var w = new Weg(begin, eind, cells[structure.afstand]);

            if (parseInt(w.afstand) > query.maxWegLengte){
              continue;
            }
            beginHalte = loader.cache["haltes"][begin];
            lijnenAanBeginHalte = loader.cache["haltes"][begin].opBuslijn;

            for (var i = 0; i < lijnenAanBeginHalte.length; i++){
              var busLijn = lijnenAanBeginHalte[i];
              busLijn.addWeg(w);
            }
          }
    }
    lines = null;
    Util.log("FILEHANDLE" ,"DONE loading wegen ( "+(performance.now()-start).toString()+" ms )");
    callback();
  });
};

function handleScores(loader, structure, file, query, callback){
  // we hebben de halte data eerste nodig, en files inlezen is async (beetje cheap)
  if (loader.cache["haltes"] === undefined){
    setTimeout(function(){
      handleScores(loader, structure, file, query, callback);
    }, 1000);
    return;
  }

  loader.readlines(file, function(fileString){
    Util.log("FILEHANDLE" ,"STARTED processing "+escape(file.name));
    var start = performance.now();

    lines = fileString.split(/\n/);
    fileString = null;

    var regexp = /(?:[^,"]+|"[^"]*")+/g;
    var wegen  = {};

    var line;
    var len = lines.length;
    // haal alle relevante haltes uit de "database"
    while(len--){
      line = lines.pop();

      if (line === ""){
        continue;
      }
      var cells = line.match(regexp);
      if (cells[structure.haltenr] in loader.cache["haltes"]){
        loader.cache["haltes"][cells[structure.haltenr]].halteInstapScore = parseInt(cells[structure.instapscore]);
        loader.cache["haltes"][cells[structure.haltenr]].halteUitstapScore = parseInt(cells[structure.uitstapscore]);
      }
    }
    lines = null;
    Util.log("FILEHANDLE" ,"DONE loading scores ( "+(performance.now()-start).toString()+" ms )");
    callback();
  });
};


/*
  Dit is ons standaard static settings object
*/
Loader.simulationSettings = {
  //harcoded filenames and their handles (in order)
  fileHandles : {
    "trajecten.csv"  : {
      handle    : handleTrajecten,
      //  enum ( van de eigenschappen waar we op willen zoeken )
      //  maatschappij,	haltenr,	plaats,	haltenaam,	xcoordinaat,	ycoordinaat,	dagcode,	lijnnr,	richting,	dagfreq
      structure : {
        maatschappij : 0,
        halte_nr     : 1,
        plaats       : 2,
        halte_naam   : 3,
        xcoordinaat  : 4,
        ycoordinaat  : 5,
        dagcode      : 6,
        lijn_nr      : 7,
        richting     : 8,
        dagfreq      : 9
      }
    },
    "distance.csv"   : {
      handle        : handleWegen,
      // pointref, userstopcodebegin, pointref, userstopcodeend, distance
      structure     : {
        id_begin        : 0,
        halte_nr_begin  : 1,
        id_eind         : 2,
        halte_nr_eind   : 3,
        afstand         : 4
      }
    },
   "halte_scores.csv" : {
     handle : handleScores,
     structure    : {
       haltenr         : 0,
       haltenaam       : 1,
       instapscore     : 2,
       uitstapscore    : 3
     }
   }
  },
  duration    : 10,
  query       : {
    buslijnen     : [401, 402],
    plaatsen      : ["Eindhoven", "Veldhoven"],
    // tijdelijk om een directe link tusse airport en station te voorkomen
    // TODO: verbeteren als tijd
    maxWegLengte  : 5000
  }
};

Loader.build = function(simulationSettings, guiSettings){
  if (simulationSettings === undefined) {
    simulationSettings = Loader.simulationSettings;
  }
  if (guiSettings === undefined) {
    guiSettings = Gui.guiSettings;
  }


  document.getElementById('files').addEventListener('change', function(evt){
    var el = document.getElementById("select_file_overlay");

    var hidden = $('#select_file_overlay');
    // laas files na de animatie anders stottert deze
    hidden.animate({"top":-hidden.height()}, "slow", function(){
      hidden.hide();
      var load = new Loader();
      load.handleFileSelect(evt, simulationSettings, function(){
        var m = new Maatschappij(new Dag(simulationSettings.duration, 0, 1), guiSettings);
        load.cache["buslijnen"].forEach(function(x){m.traject.addBuslijn(x);});

        load.cache = null;
        m.prebuild();
        //m.start();
      });
    });
  }, false);
};
