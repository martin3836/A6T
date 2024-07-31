/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Aanchal Basra
*  Student ID: 156175200
*  Date: 26/11/2023
*
*  Published URL: https://easy-jade-bee-vest.cyclic.app/
*
********************************************************************************/


const authData = require("./modules/auth-service.js");
const clientSessions = require("client-sessions");

const legoData = require("./modules/legoSets");
const path = require("path");

const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.set('view engine', 'ejs');

app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "my secret is iron man is stronger than thor", // this should be a long un-guessable string.
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}


app.get('/', (req, res) => {
  res.render("home")
});

app.get('/about', (req, res) => {
  res.render("about");
});

app.get("/lego/sets", async (req,res)=>{

  let sets = [];

  try{    
    if(req.query.theme){
      sets = await legoData.getSetsByTheme(req.query.theme);
    }else{
      sets = await legoData.getAllSets();
    }

    res.render("sets", {sets})
  }catch(err){
    res.status(404).render("404", {message: err});
  }
  
});

app.get("/lego/sets/:num", async (req,res)=>{
  try{
    let set = await legoData.getSetByNum(req.params.num);
    res.render("set", {set})
  }catch(err){
    res.status(404).render("404", {message: err});
  }
});



app.get('/lego/addSet', ensureLogin, (req, res) => {
  legoData.getAllThemes()
      .then((themes) => {
          res.render('addSet', { themes: themes });
      })
      .catch((err) => {
          res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
      });
});

app.post('/lego/addSet', ensureLogin, (req, res) => {
  const setData = req.body;

  legoData.addSet(setData)
      .then(() => {
          res.redirect('/lego/sets');
      })
      .catch((err) => {
          res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
      });
});

app.get('/lego/editSet/:num', ensureLogin, async (req, res) => {
  try {
    // const setNum = req.params.num;
    let setData = await legoData.getSetByNum(req.params.num);
    let themeData = await legoData.getAllThemes();

    res.render("editSet", { "themes": themeData, "set": setData });
  } catch (err) {
    res.status(404).render('404', { message: err });
  }
});


app.post('/lego/editSet', ensureLogin, async (req, res) => {
  try {
    const setNum = req.body.set_num;
    const setData = req.body;

    await legoData.editSet(setNum, setData);

    res.redirect('/lego/sets');
  } catch (err) {
    res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/lego/deleteSet/:num", ensureLogin, (req, res) => {
  legoData.deleteSet(req.params.num).then(() => {
    res.redirect("/lego/sets");
  })
  .catch((err) => {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  });
});


// new get and post for login and logout functionality
app.get("/login", function(req, res) {
  res.render("login", { 
    errorMessage: ""
  });
});

app.get("/register", function(req, res) { 
  res.render('register', { 
    errorMessage: "",
    successMessage: ""
  });
});

app.post("/register", function(req, res) {
  authData.registerUser(req.body)
  .then(() => {
      res.render('register', { successMessage: "User created!"})
  })
  .catch((err) => {
      res.render('register', { errorMessage: err, userName: req.body.userName , successMessage: ""})
  });
});

app.post("/login", function(req, res) {
  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body).then(function(user) {
      req.session.user = {
          userName: user.userName,
          email: user.email,
          loginHistory: user.loginHistory
      }
      res.redirect('/lego/sets');
  })  
  .catch(function(err) {
      res.render('login', { errorMessage: err, userName: req.body.userName });
  });
});

app.get("/logout", function(req, res) {
  req.session.reset();
  res.redirect('/');
});

app.get("/userHistory", ensureLogin, function (req, res) {
  res.render('userHistory');
}); 



app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

// legoData.initialize().then(()=>{
//   app.listen(HTTP_PORT, () => { console.log(`server listening on: ${HTTP_PORT}`) });
// });
  legoData.initialize()
  .then(authData.initialize)
  .then(function(){
      app.listen(HTTP_PORT, function(){
          console.log(`app listening on:  ${HTTP_PORT}`);
      });
  }).catch(function(err){
      console.log(`unable to start server: ${err}`);
  });
