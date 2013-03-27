// JavaScript Document

// Wait for PhoneGap to load
document.addEventListener("deviceready", onDeviceReady, false);

var myApp = new kendo.mobile.Application(document.body, { transition: "slide", layout: "mobile-tabstrip" });
//var myApp = {};
myApp.db = null;

// PhoneGap is ready
function onDeviceReady() {
    
    myApp.openDb();
    myApp.createTable();
    navigator.splashscreen.hide();
}

function addItem() {
    var item = document.getElementById("txtItem");
	myApp.addItem(item.value);
	item.value = "";
}


myApp.openDb = function() {
    if(window.sqlitePlugin !== undefined) {
        myApp.db = window.sqlitePlugin.openDatabase("shopping_list");
    } else {
        // For debugin in simulator fallback to native SQL Lite
        console.log("Use built in SQLite");
        myApp.db = window.openDatabase("shopping_list", "1.0", "Shopping List Demo", 200000);
    }
}
      
myApp.createTable = function() {
	var db = myApp.db;
	db.transaction(function(tx) {
		tx.executeSql("CREATE TABLE IF NOT EXISTS shopping_list(id INTEGER PRIMARY KEY ASC, item_name TEXT, is_done INTEGER)", []);
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

myApp.refresh = function() {
	var renderActiveItem = function (row) {
        return "<li>" + row.item_name + "<a data-role='detailbutton' onclick='myApp.markComplete(" + row.id + ");' data-icon='action'></a></li>";
	}
    
	var render = function (tx, rs) {
		var activeRows = "";
        var completedRows = "";
		var activeList = document.getElementById("activeItemList");
        var completedList;
		for (var i = 0; i < rs.rows.length; i++) {
            if (rs.rows.item(i).is_done === 0) {
			    activeRows += renderActiveItem(rs.rows.item(i));
            }
		}
      
		activeList.innerHTML = activeRows;
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

