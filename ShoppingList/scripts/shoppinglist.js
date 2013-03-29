// Wait for PhoneGap to load
document.addEventListener("deviceready", init, false);

var myApp = new kendo.mobile.Application(document.body, { transition: "slide", layout: "mobile-tabstrip" });

myApp._queryBase = "https://www.googleapis.com/shopping/search/v1/public/products?key=AIzaSyDPiYAwhCAw8ZYnLCbgPb8UFn-1rndKivk&country=US&startIndex=1&maxResults=1&promotions.enabled=false&orderby=relevance&q=";
myApp.db = null;
myApp.activeListView = null;
myApp.completedListView = null;
myApp.scanResult = null;

// PhoneGap is ready
function init() { 

    // Hide "Add Scanned Item" button
    $("#addScanButton").hide();
    
    myApp.activeListView = $("#activeItemList").kendoMobileListView({
                template: $("#list-template").html(),
                style: 'inset'
            }).data("kendoMobileListView");
 
    myApp.completedListView = $("#completedItemList").kendoMobileListView({
                template: $("#completed-list-template").html(),
                style: 'inset'
            }).data("kendoMobileListView");
    

    myApp.openDb();
    myApp.createTable();
    navigator.splashscreen.hide();
}

function markComplete(e){
    var data = e.button.data();
    myApp.markComplete(data.id);
}

function addItem() {
    var item = document.getElementById("txtItem");
    if (item.value && item.value.length > 0)
    {
        console.log("Adding item: " + item.value);
	    myApp.addItem(item.value);
    }
	item.value = "";
}

function addScannedItem() {
    if (myApp.scanResult && myApp.scanResult.length > 0) {
        myApp.addItem(myApp.scanResult);
        myApp.scanResult = null;
        $("#scanResult").html('');
        $("#addScanButton").hide();
    }
}


myApp.openDb = function() {
    console.log("About to open DB");
    
    if(window.sqlitePlugin !== undefined) {
        console.log("Using SQLite Plugin DB");
        myApp.db = window.sqlitePlugin.openDatabase("ShoppingListDB");
    } else {
        // For debugin in simulator fallback to native SQL Lite
        console.log("Use built in SQLite");
        myApp.db = window.openDatabase("ShoppingListDB", "1.0", "Shopping List Demo", 200000);
    }
}
      
myApp.createTable = function() {
	var db = myApp.db;
	db.transaction(function(tx) {
		tx.executeSql("CREATE TABLE IF NOT EXISTS shopping_list(id INTEGER PRIMARY KEY ASC, item_name TEXT, is_done INTEGER)", [], 
                      myApp.onSuccess,
					  myApp.onError);
	});
}

myApp.addItem = function(itemName){
    var db = myApp.db;
	db.transaction(function(tx) {
		tx.executeSql("INSERT INTO shopping_list(item_name, is_done) VALUES (?,?)",
					  [itemName, 0],
					  myApp.onSuccess,
					  myApp.onError);
	});
}

myApp.markComplete = function(itemId){
    var db = myApp.db;
	db.transaction(function(tx) {
		tx.executeSql("UPDATE shopping_list SET is_done = 1 WHERE id = ?",
					  [itemId],
					  myApp.onSuccess,
					  myApp.onError);
	});
}

myApp.clearCompleted = function() {
    var db = myApp.db;
	db.transaction(function(tx) {
		tx.executeSql("DELETE FROM shopping_list WHERE is_done = 1",
					  [],
					  myApp.onSuccess,
					  myApp.onError);
	});
}

myApp.refresh = function() {
    var sorting = function(a, b){
            var a1= a.item_name, b1= b.item_name;
            if(a1== b1) return 0;
            return a1> b1? 1: -1;
        }
    
	var render = function (tx, rs) {
		var activeRows = new Array();
        var completedRows = new Array();

		for (var i = 0; i < rs.rows.length; i++) {
            if (rs.rows.item(i).is_done === 0) {
                
                activeRows.push(rs.rows.item(i));
            }
            else {
                completedRows.push(rs.rows.item(i));
            }
		}
        
        // sort
        activeRows.sort(sorting);
        completedRows.sort(sorting);        
      
        var ds = new kendo.data.DataSource({ data: activeRows });
        var dscomplete = new kendo.data.DataSource({ data: completedRows });
        myApp.activeListView.setDataSource(ds);
        myApp.completedListView.setDataSource(dscomplete);
	}
    
	var db = myApp.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT * FROM shopping_list", [], 
					  render, 
					  myApp.onError);
	});
}

myApp.onError = function(tx, e) {
	console.log("Error: " + e.message);
} 
      
myApp.onSuccess = function(tx, r) {
	myApp.refresh();
}

// Barcode search extensions  
myApp.scan = function() {
		var that = this;
		window.plugins.barcodeScanner.scan(
			function(result) {
				if (!result.cancelled) {
                    myApp._searchCode(result.text);
					//that._addMessageToLog(result.format + " | " + result.text);    
				}
			}, 
			function(error) {
				console.log("Scanning failed: " + error);
			});
	};
    
myApp._searchCode = function(barcodeText) {
        var that = this;
        $.ajax({
                url: that._queryBase + barcodeText,
                crossDomain: true
            }).done(
            function(data, textStatus, jqXHR){
                    if (data.items && data.items.length > 0) {
                        var title = data.items[0].product.title;
                        if (title.length > 30) {
                            title = title.substring(0,30) + "...";
                        }
                        that._addMessageToLog(title);
                        that.scanResult = title;
                        $("#addScanButton").show();
                    }
                    else {
                        that._addMessageToLog("No Items Found");
                        that.scanResult = null;
                    }
                }
        );
    };

myApp._addMessageToLog = function(message) {
        $("#scanResult").html(message);
	};

