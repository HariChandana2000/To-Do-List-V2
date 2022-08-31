//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect to database
mongoose.connect("mongodb://localhost:27017/todolistDB");

//Creating schema
const itemSchema = {
  name: String
};

//Creating collection
const Item = mongoose.model("Item", itemSchema);

//Creating document
const item1 = new Item({
  name: "Make Coffee"
});

const item2 = new Item({
  name: "Read the book"
});

const item3 = new Item({
  name: "Get back to the Udemy Course"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  //Find the items
  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    }

    else if(foundItems.length === 0) {
      //Insertion
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Items are inserted succesfully!");
        }
      });
      res.redirect("/");
    }

    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });



});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  }

  else {
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItem = req.body.checkedItem;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItem, function(err) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("Item deleted successfully!");
      }
    });

    res.redirect("/");

  }

  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}, function (err, foundList) {
      res.redirect("/" + listName);
    });
  }
});


app.get("/:customListName", function(req, res) {
  const listName = _.capitalize(req.params.customListName);

  List.findOne({name: listName}, function(err, results) {
    if (err){
      console.log(err);
    }

    else if(!results) {
      const list = new List({
        name: listName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + listName);
    }

    else {
      res.render("list", {listTitle: results.name, newListItems: results.items});
    }
  });

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
