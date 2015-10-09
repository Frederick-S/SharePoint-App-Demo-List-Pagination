var contextHelper = require('sp-context-helper');
var queryString = require('query-string');
var each = require('sp-each');

var hostWebUrl = queryString.parse(location.search).SPHostUrl;
var contextWrapper = contextHelper(hostWebUrl, true);
var web = contextWrapper.web;
var clientContext = contextWrapper.clientContext;

function getLists(web, clientContext) {
    var deferred = $.Deferred();
    var lists = web.get_lists();

    clientContext.load(lists);
    clientContext.executeQueryAsync(function () {
        var listTitleCollection = [];

        each(lists, function (list) {
            if (!list.get_hidden()) {
                listTitleCollection.push(list.get_title());
            }
        });

        populateDropdownList($('#lists'), listTitleCollection);

        deferred.resolve();
    }, function (sender, args) {
        deferred.reject(args.get_message());
    });

    return deferred.promise();
}

function getViews(listTitle, web, clientContext) {
    var list = web.get_lists().getByTitle(listTitle);
    var views = list.get_views();
    var deferred = $.Deferred();

    clientContext.load(views);
    clientContext.executeQueryAsync(function () {
        var viewTitleCollection = [];

        each(views, function (view) {
            viewTitleCollection.push(view.get_title());
        });

        populateDropdownList($('#views'), viewTitleCollection);

        deferred.resolve();
    }, function (sender, args) {
        deferred.reject(args.get_message());
    });

    return deferred.promise();
}

function populateDropdownList($element, values) {
    var html = '';

    for (var i = 0, length = values.length; i < length; i++) {
        html += '<option value=\'' + values[i] + '\'>' + values[i] + '</option>';
    }

    $element.html(html);
}

function onError(message) {
    alert(message);
}

$(document).ready(function () {
    $('#lists').change(function () {
        getViews($(this).val(), web, clientContext);
    });

    getLists(web, clientContext).then(function () {
        $('#lists').change();
    });
});
