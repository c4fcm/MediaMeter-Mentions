App.Router = Backbone.Router.extend({
    routes: {
        '': 'home'
        , '/': 'home'
        , 'login': 'login'
        , 'query/:keywords/:media/:start/:end': 'query'
    },
    
    initialize: function (options) {
        var that = this;
        this.vm = App.ViewManager;
        this.vm.initialize();
        this.userModel = options.userModel;
        this.mediaSources = options.mediaSources;
        App.debug('App.Router.initialize()');
        // Create application-level views
        this.controlsView = new App.ControlsView({ userModel: this.userModel });
        $('.controls').append(this.controlsView.el);
    },
    
    login: function () {
        App.debug('Route: login');
        this.loginView = new App.LoginView({ model: this.userModel });
        this.vm.showView(this.loginView);
    },
    
    home: function () {
        App.debug('Route: home');
        var that = this;
        if (!this.userModel.get('authenticated')) {
            this.navigate('login', true);
            return;
        }
        // Defaults media
        this.mediaModel = new App.MediaModel();
        this.mediaSources.deferred.then(function () {
            that.mediaModel.get('sets').add(that.mediaSources.get('sets').get('1'));
        });
        // Defaults dates
        var weekMs = 7 * 24 * 60 * 60 * 1000;
        var ts = new Date().getTime();
        var start = new Date(ts - 2*weekMs);
        var end = new Date(ts - weekMs);
        var attributes = {
            start: start.getFullYear() + '-' + (start.getMonth()+1) + '-' + start.getDate()
            , end: end.getFullYear() + '-' + (end.getMonth()+1) + '-' + end.getDate()
            , mediaModel: this.mediaModel
            , keywords: 'boston'
        };
        this.queryCollection = new App.QueryCollection();
        this.queryModel = new App.QueryModel(attributes);
        this.queryCollection.add(this.queryModel);
        this.queryListView = this.vm.getView(
            App.QueryListView
            , {
                collection: this.queryCollection
                , mediaSources: this.mediaSources
            }
        );
        this.queryCollection.on('execute', this.onQuery, this);
        this.vm.showView(this.queryListView);
    },
    
    query: function (keywords, media, start, end) {
        App.debug('Route: query');
        App.debug([keywords, media, start, end]);
        var that = this;
        if (!this.userModel.get('authenticated')) {
            this.navigate('login', true);
            return;
        }
        // Create media model for the query
        var mediaModel = new App.MediaModel();
        // When sources are loaded, populate the media model from the url
        this.mediaSources.deferred.then(function() {
            var subset = that.mediaSources.subset(media);
            subset.get('sources').each(function (m) {
                mediaModel.get('sources').add(m);
            });
            subset.get('sets').each(function (m) {
                mediaModel.get('sets').add(m);
            });
        });
        var opts = {
            keywords: keywords
            , media: media
            , mediaModel: mediaModel
            , start: start
            , end: end
            , mediaSources: this.mediaSources
        };
        this.queryModel = new App.QueryModel(opts);
        this.queryView = this.vm.getView(
            App.QueryView
            , {
                model: this.queryModel
                , mediaSources: this.mediaSources
            }
        );
        this.queryModel.on('execute', this.onQuery, this);
        this.sentences = new App.SentenceCollection(opts);
        this.wordcounts = new App.WordCountCollection(opts);
        this.datecounts = new App.DateCountCollection(opts);
        this.histogramView = new App.HistogramView({
            collection: this.datecounts
        });
        this.sentenceView = new App.SentenceView({
            collection: this.sentences
        });
        this.wordcountView = new App.WordCountView({
            collection: this.wordcounts
        });
        this.sentences.fetch();
        this.datecounts.fetch();
        this.wordcounts.fetch();
        this.vm.showViews([
            this.queryView
            , this.histogramView
            , this.wordcountView
            , this.sentenceView
        ]);
    },
    
    defaultRoute: function (routeId) {
        App.debug('Default route');
    },
    
    onQuery: function (qc) {
        this.navigate(qc.dashboardUrl());
        /*
        var opts = {
            keywords: qm.get('keywords')
            , media: qm.media()
            , start: qm.get('start')
            , end: qm.get('end')
            , mediaSources: this.mediaSources
        };
        this.sentences = new App.SentenceCollection(opts);
        this.wordcounts = new App.WordCountCollection(opts);
        this.datecounts = new App.DateCountCollection(opts);
        // Create new results views, replace old ones if necessary
        var histogramView = new App.HistogramView({
            collection: this.datecounts
        });
        var sentenceView = new App.SentenceView({
            collection: this.sentences
        });
        var wordcountView = new App.WordCountView({
            collection: this.wordcounts
        })
        this.vm.showViews([
            this.queryView
            , histogramView
            , wordcountView
            , sentenceView
        ]);
        // Populate with data
        this.wordcounts.fetch();
        this.datecounts.fetch();
        this.sentences.fetch();
        */
    }
}); 

