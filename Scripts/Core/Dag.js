/*
  @param duration duration of 1 day in seconds
  @param duration update interval in miliseconds
  @param callback
*/
function Dag(duration, interval, amountOfDays, dagEvent) {
    this.durationSec = duration * 1000;
    this.intervalSec = interval * 1000;
    this.dagEvent = dagEvent;
    this.amountOfDays = amountOfDays;

    if (amountOfDays === undefined) {
        this.amountOfDays = 1;
    }

    //private
    this.minutesInDay = this.amountOfDays * 60 * 24;
    this.iterations = 0;

    if (this.intervalSec == 0) {
        this.intervalSec = this.durationSec / (this.minutesInDay);
    }
    this.stopped = false;
    this.startTime = 0;
}

/*
  Dag event object
  callbacks should have 1 param which is "Dag"

  @param onIteration
  @param onFinished
*/
function DagEvent(onIteration, onDayEnd) {
    this.onIteration = onIteration;
    this.onDayEnd = onDayEnd;
}



Dag.prototype = {
    getDay: function() {
        return parseInt(this.getTotalMinutes() / 60 / 24);
    },
    getHours: function() {
        return parseInt(this.getTotalMinutes() / 60) % 24;
    },
    getMinutes: function() {
        return this.getTotalMinutes() % 60;
    },
    getTotalMinutes: function() {
        return Math.round(this.percentage() * this.minutesInDay);
    },
    getTotalMinutesRaw: function() {
        return this.percentage() * this.minutesInDay;
    },
    percentage: function() {
        return (this.intervalSec * this.iterations) / this.durationSec;
    },
    getRealPassedTime: function() {
        return performance.now() - this.startTime;
    },
    setStepsPerMinute : function(val){
      var newInterval  = this.durationSec / (this.minutesInDay* val);
      this.iterations  = Math.round((this.intervalSec/ newInterval) * this.iterations);
      this.intervalSec = newInterval;
    },
    toString: function() {
        var h = this.getHours();
        var m = this.getMinutes();
        if (h < 10) {
            h = "0" + h;
        }
        if (m < 10) {
            m = "0" + m;
        }
        var d = this.getDay() > 0 ? "\n    " + this.getDay() : "";
        return h + ":" + m + d;
    },
    reset: function() {
        this.iterations = 0;
    },
    /*
      @param context Dag object
    */
    start: function(context) {

        if (context === undefined) {
            context = this
            this.startTime = performance.now();
            this.stopped = false;
        }
        if (this.stopped) {
            return;
        }
        this.iterations++;
        if (context.percentage() % (1.0 / context.amountOfDays) == 0.0) {
            //restart
            Util.log("DAG", "Dag finished ( " + (performance.now() - context.startTime).toString() + " ms )");
            context.dagEvent.onDayEnd(context);
            //context.iterations = 0;
        }
        context.dagEvent.onIteration(context);
        setTimeout(function() {
            context.start(context);
        }, this.intervalSec);
    },
    stop: function() {
        this.stopped = true;
    },
    startFrom: function(hour) {
        this.iterations = ((hour / (24 * this.amountOfDays)) * this.durationSec) / this.intervalSec;
    }
}



/*
function onIter(dag){
  console.log(dag.toString());
}
function onFin(dag){
  console.log("Done")
}
ev = new DagEvent(onIter, onFin);
new Dag(10, 0, ev).start();
*/
