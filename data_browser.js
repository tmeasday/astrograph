Meteor.startup(function() {
  if (Meteor.Router) {
    Meteor.Router.add('/data-browser', 'dataBrowser');
  }
  
  var pulseAt = function(path) {
    console.log('pulsing ' + path);
    Session.set('dataBrowser-' + path + '-pulse', 'dataBrowserRed');
    Meteor.setTimeout(function() {
      Session.set('dataBrowser-' + path + '-pulse', null);
    }, 500);
  }
  
  var pulse = function(path) {
    pulseAt(path);
    var shorter = path.replace(/-[^\-]*$/, '');
    if (shorter !== path) pulse(shorter);
  }
  
  var walk = function(objA, objB, path) {
    // XXX: no point in looking for things missing from objA right now
    if (_.isArray(objA)) {
      _.each(objA, function(v, i) {
        if (!_.isEqual(v, objB[i])) walk(v, objB[i], path + '-' + i);
      })
    } else if (_.isObject(objA)) {
      _.each(objA, function(v, k) {
        if (!_.isEqual(v, objB[k])) walk(v, objB[k], path + '-' + k);
      });
    } else {
      pulse(path)
    } 
  }
  
  _.each(Meteor._LocalCollectionDriver.collections, function(collection, name) {
    collection.find().observe({
      changed: function(newDoc, index, oldDoc) {
        walk(newDoc, oldDoc, name + '-' + newDoc._id);
      }
    })
  });
});

//////////////////////

var keyFromPath = function(path) { 
  return 'dataBrowser-' + path + '-open';
}

Handlebars.registerHelper('isOpen', function(path) {
  return Session.equals(keyFromPath(path), true);
});

// XXX: make this behave like {{#each}}... i.e. use observe?
Handlebars.registerHelper('eachKeyValueWithPath', function(pair, fn) {
  return _.map(pair.value, function(value, key) {
    var newPath = pair.path + '-' + key;
    return Spark.labelBranch(newPath, function() {
      return fn({key: key, value: value, path: newPath});
    });
  }).join('');
})

Handlebars.registerHelper('renderDataBrowserNode', function(obj, path) {
  var str, pair = {value: obj, path: path};
  if (_.isArray(obj))
    str = Template.dataBrowserArray(pair);
  else if (_.isObject(obj))
    str = Template.dataBrowserObject(pair);
  else
    str = Template.dataBrowserScalar(pair);
  
  return new Handlebars.SafeString(str);
});

Handlebars.registerHelper('dataBrowserPulseClasses', function(path) {
  return 'class=' + Session.get('dataBrowser-' + path + '-pulse');
});

/////////////

var toggleEvents = {
  'click .expand': function(event, template) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return Session.set(keyFromPath(this), true);
  },
  'click .retract': function(event, template) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return Session.set(keyFromPath(this), false);
  }
};

///////////

Template.dataBrowser.helpers({
  collections: function() {
    var collections = _.without(
      _.keys(Meteor._LocalCollectionDriver.collections),
      'meteor_accounts_loginServiceConfiguration');
    return _.map(collections, function(c) {
      return {name: c, path: c}
    });
  }
});

Template.dataBrowserCollection.helpers({
  documents: function(path) {
    var collection = Meteor._LocalCollectionDriver.collections[this.name];
    return collection.find().map(function(doc) {
      var newPath = path + '-' + doc._id;
      return {doc: doc, path: newPath};
    });
  }
});

Template.dataBrowserCollection.events(toggleEvents);

Template.dataBrowserDocument.helpers({
  asObject: function() { return {value: this.doc, path: this.path}; }
})
Template.dataBrowserDocument.events(toggleEvents);

Template.dataBrowserObject.helpers({
  keys: function() { return _.keys(this); }
});
Template.dataBrowserObject.events(toggleEvents);

Template.dataBrowserArray.helpers({
  withPath: function() {
    var self = this;
    return _.map(this.value, function(object, index) {
      return {value: object, path: self.path + '-' + index};
    });
  }
})