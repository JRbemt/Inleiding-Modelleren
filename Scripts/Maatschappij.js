
function Maatschappij(dagObject, guiSettings){
  this.dag = dagObject;
  dagObject.startFrom(5);
  this.dag.dagEvent = this;

  this.traject        = new Traject();
  this.gui            = new Gui(this, guiSettings);
  this.currentHour    = -1;
}

Maatschappij.prototype = {
  onIteration     : function(dag){
    if (dag.getHours() > this.currentHour){
      this.currentHour = dag.getHours();
      this.traject.uurUpdate(dag);
    }
    this.traject.minuutUpdate(dag);

    var evt = new CustomEvent("change time", { detail : dag });
    window.dispatchEvent(evt);
  },
  prebuild   : function(){
    var ctx = this;
    this.gui.bindControls();
    this.gui.draw();
  },
  start      : function(){
    this.dag.start();
    this.start_time = performance.now();
    $("#start_button").removeClass("fa-play-circle-o").addClass("fa-pause-circle-o");
  },
  pause      : function(){
    this.dag.stop();
    $("#start_button").removeClass("fa-pause-circle-o").addClass("fa-play-circle-o");
  },
  onDayEnd : function(dag){
    this.currentHour = -1;
  },
  reset : function(){
    this.dag.reset();
    this.currentHour = 0;
    this.traject.reset();
    this.onIteration(this.dag);
    this.gui.clear();
    this.gui.draw();
  }
};
