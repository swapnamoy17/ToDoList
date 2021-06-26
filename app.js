require('dotenv').config();

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");
mongoose.connect(process.env.MONGODB_SERVER, {
  useNewUrlParser: true
});

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Wake Up"
});

const item2 = new Item({
  name: "Brush"
});

const item3 = new Item({
  name: "College"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const customList = mongoose.model("customList", listSchema);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.get("/", function(req, res) {
  var today = new Date();

  var options = {
    weekday: "long",
    day: "numeric",
    month: "long"
  };
  var DAY = today.toLocaleDateString('en-US', options);

  Item.find({}, function(err, result) {
    if (result.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Default Items inserted successfully.");
        }
      });
      res.redirect("/");
    } else {
      res.render('list', {
        listTitle: DAY,
        newListItem: result
      });
    }
  })
});

app.get("/:param", function(req, res) {
  const customListName = lodash.capitalize(req.params.param);

  customList.findOne({
    name: customListName
  }, function(err, listName) {
    if (!err)
      if (!listName) {
        const list = new customList({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else{
        res.render("list",{listTitle:listName.name,newListItem:listName.items});
      }
  });
});

app.post("/", function(req, res) {

  const newItem = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: newItem
  });


  if(listName==="Today"){
  item.save();
  res.redirect("/");
  }else{
    customList.findOne({name: listName},function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const deleteItem_id = req.body.checkbox;
  const listName = req.body.listName;

  if(listName==="Today"){
  Item.deleteOne({
    _id: deleteItem_id
  }, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully deleted.");
    }
  });
  res.redirect("/");}
  else{
    customList.findOneAndUpdate({name: listName},{$pull: {items:{_id:deleteItem_id}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }
});

app.listen(3000 || process.env.PORT , function(req, res) {
  console.log("Server is running.");
})
