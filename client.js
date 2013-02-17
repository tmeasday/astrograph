Meteor.startup(function() {
  if (Meteor.Router) {
    Meteor.Router.add('/data-browser', 'dataBrowser');
  }  
});

Handlebars.registerHelper('eachKeyValue', function(obj, fn) {
  var buffer = "", key;
  
  _.each(obj, function(value, key) {
    var branchKey = 'branch-' + key;
    buffer += Spark.labelBranch(branchKey, function() {
      return fn({key: key, value: value});
    });
  })
  
  return buffer;
})

Handlebars.registerHelper('renderDataBrowserNode', function(obj) {
  if (_.isArray(obj))
    return new Handlebars.SafeString(Template.dataBrowserArray(obj));
  else if (_.isObject(obj))
    return new Handlebars.SafeString(Template.dataBrowserObject(obj));
  else
    return new Handlebars.SafeString(Template.dataBrowserScalar(obj));
});

Template.dataBrowser.helpers({
  collections: function() {
    return _.without(_.keys(Meteor._LocalCollectionDriver.collections),
      'meteor_accounts_loginServiceConfiguration');
  }
});

Template.dataBrowserCollection.helpers({
  open: function() {
    return true;
  },
  documents: function() {
    return Meteor._LocalCollectionDriver.collections[this].find();
  }
});

Template.dataBrowserObject.helpers({
  keys: function() { return _.keys(this); }
})