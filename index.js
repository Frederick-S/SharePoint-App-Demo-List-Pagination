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

function getListItems(web, clientContext) {
    var deferred = $.Deferred();
    var listTitle = $('#lists').val();
    var viewTitle = $('#views').val();
    var rowLimit = parseInt($('#row-limit').val());
    var list = web.get_lists().getByTitle(listTitle);
    var view = list.get_views().getByTitle(viewTitle);

    clientContext.load(view);
    clientContext.executeQueryAsync(function () {
        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml('<View><Query>' + view.get_viewQuery() + '</Query><RowLimit>' + rowLimit + '</RowLimit></View>');

        var listItems = list.getItems(camlQuery);

        clientContext.load(listItems);
        clientContext.executeQueryAsync(function () {
            deferred.resolve(list, camlQuery, listItems);
        }, function (sender, args) {
            deferred.reject(args.get_message());
        });
    }, function (sender, args) {
        deferred.reject(args.get_message());
    });

    return deferred.promise();
}

function getListItemsByPosition(list, camlQuery, listItems, listItemCollectionPosition) {
    var deferred = $.Deferred();

    if (listItemCollectionPosition !== null) {
        camlQuery.set_listItemCollectionPosition(listItemCollectionPosition);
        listItems = list.getItems(camlQuery);

        clientContext.load(listItems);
        clientContext.executeQueryAsync(function () {
            deferred.resolve(listItems);
        }, onError);
    } else {
        deferred.reject('No more list items!');
    }

    return deferred.promise();
}

function renderListItems(listItems) {
    var head = '';
    var body = '';

    each(listItems, function (listItem) {
        var noHead = head === '';

        if (noHead) {
            head += '<tr>';
        }

        body += '<tr>';

        var fieldValues = listItem.get_fieldValues();

        for (var field in fieldValues) {
            if (fieldValues.hasOwnProperty(field)) {
                if (noHead) {
                    head += '<td>' + field + '</td>';
                }

                body += '<td>' + (fieldValues[field] === null ? '' : fieldValues[field].toString()) + '</td>';
            }
        }

        body += '</tr>';

        if (noHead) {
            head += '</tr>';
        }
    });

    $('#result').html('<table border="1">' + head + body + '</table>');
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
        getViews($(this).val(), web, clientContext).fail(onError);
    });

    getLists(web, clientContext).then(function () {
        $('#lists').change();
    }, onError);

    $('#get').click(function () {
        getListItems(web, clientContext).then(function (list, camlQuery, listItems) {
            renderListItems(listItems);

            $('#next').click(function () {
                var listItemCollectionPosition = listItems.get_listItemCollectionPosition();

                getListItemsByPosition(list, camlQuery, listItems, listItemCollectionPosition).then(function (listItemCollection) {
                    listItems = listItemCollection;

                    renderListItems(listItems);
                }, onError);
            });
        }, onError);
    });
});
