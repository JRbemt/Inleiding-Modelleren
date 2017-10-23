function Distribution(points){
  this.points     = points;
  this.iteration  = 0;
}

Distribution.prototype = {
  // Standard iteration procedure
  // Not really needed in our case
  /*
  hasNext : function(){
              return this.points.length == this.iteration;
  },
  next    : function(){
              var i = this.points[this.iteration];
              this.iteration += 1;
              return i;
  },
  reset   : function(){
              this.iteration = 0;
  },
  */
  // Iteration procedure for distributions
  // Accounts for step size being larger than 1 (our time function sometimes skip 1 second or gives 2 )
  get     : function(index){
              return this.points[index];
  },
  next    : function(index){
              if (index < this.iteration){
                throw "Index should be bigger than the previous index";
              }
              var sum = this.range(this.iteration, index);
              this.iteration = index;
              return sum;
  },
  range   : function(start, end){
              var sum = 0;
              for (var i = start; i < end; i++){
                sum += this.points[i];
              };

              return sum;
  },
  total   : function(){
              return this.range(0, this.points.length);
  }
};
// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you an uniform distribution!
Distribution.getRandomInt = function(min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
}
//  Will generate an uniform distribution
Distribution.distributeUniformly = function(totalValue, amountOfPoints) {
                                      var data = [];

                                      // fill array with 0 first
                                      for (var i = 0; i < amountOfPoints; ++i) {
                                        data[i] = 0;
                                      }

                                      var index = 0;
                                      // data[index] += 1 op random index een totalValue aantal keer
                                      // de kans dat ze alle op een index komen is (1/amountOfPoints)^totalValue

                                      for (var i = 0; i < totalValue; ++i) {
                                          index = Distribution.getRandomInt(0, amountOfPoints);
                                          data[index] += 1;
                                      }
                                      return new Distribution(data);
};

//-x^{10}+x^4+.3909090909090909
// rijdt van 5.34 tot 0.09
// spits van 7.00 tot 9.00 en van 16.30 en 18.30
// totaal 14.000
Distribution.aantalInstappersVerdeling = function(totalValue){
                                          var amountOfPoints = 24;
                                          var data = [0, 0, 0, 0, 300, 600, 1200, 1500, 900, 700, 600, 500, 500, 500, 800, 900, 1100, 1200, 700, 600, 500, 400, 300, 200];
                                          return data;
};
