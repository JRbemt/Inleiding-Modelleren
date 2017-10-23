function Util(){}

Util.range = function(end){
                return Array.apply(null, Array(end)).map(function (_, i) {return i;});
};

Util.values = function (obj) {
    var vals = [];
    for( var key in obj ) {
        if ( obj.hasOwnProperty(key) ) {
            vals.push(obj[key]);
        }
    }
    return vals;
};

Util.logSettings = {
    padding : 20,
    blackListed : ["GUI"],
    prevGroup : ""
};

Util.log = function(tag, msg, group){
            // NOTE: tag moet kleiner zijn dan padding
            if (Util.logSettings.blackListed.indexOf(tag) != -1){
              return;
            }
            if (group === undefined || group != Util.prevGroup){
              console.groupEnd();
            }
            var pre = "["+tag +"]"+ " ".repeat(Util.logSettings.padding - (tag.length+2));
            console.log(pre + msg);
};

Util.logGrouped  = function(tag, msg, group){
                      if (Util.logSettings.blackListed.indexOf(group) != -1){
                        return;
                      }
                      if (group != Util.prevGroup){
                        console.groupEnd();
                        console.groupCollapsed(group);
                      }
                      Util.prevGroup = group;
                      Util.log(tag, msg, group);
}
