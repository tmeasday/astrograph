Meteor.startup(function() {
  if (Meteor.Router) {
    Meteor.Router.add('/data-browser', 'dataBrowser');
  }  
});

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
  var str;
  if (_.isArray(obj))
    str = Template.dataBrowserArray({value: obj, path: path});
  else if (_.isObject(obj))
    str = Template.dataBrowserObject({value: obj, path: path});
  else
    str = Template.dataBrowserScalar(obj);
  
  return new Handlebars.SafeString(str);
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