require('dotenv').config();
const Sequelize = require('sequelize');

// set up sequelize to point to our postgres database
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
});

const Theme = sequelize.define('Theme', {
  id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
  },
  name: Sequelize.STRING,
},
{
  createdAt: false, // disable createdAt
  updatedAt: false, // disable updatedAt
});

const Set = sequelize.define('Set', {
  set_num: {
      type: Sequelize.STRING,
      primaryKey: true,
  },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: Sequelize.INTEGER,
  img_url: Sequelize.STRING,
},
{
  createdAt: false, // disable createdAt
  updatedAt: false, // disable updatedAt
});

Set.belongsTo(Theme, { foreignKey: 'theme_id' });


// sequelize
//   .authenticate()
//   .then(() => {
//     console.log('Connection has been established successfully.');
//   })
//   .catch((err) => {
//     console.log('Unable to connect to the database:', err);
//   });



// const setData = require("../data/setData");
// const themeData = require("../data/themeData");

// let sets = [];

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(() => {
      resolve('operation was a success');
    }).catch(() => {
      reject("unable to sync the database");
    });
    // setData.forEach(setElement => {
    //   let setWithTheme = { ...setElement, theme: themeData.find(themeElement => themeElement.id == setElement.theme_id).name }
    //   sets.push(setWithTheme);
    //   resolve();
    // });
  });

}

function getAllSets() {
  return Set.findAll({ include: [Theme] });

    // Set.findAll().then(data=>{
    //   resolve(data);
    // }).catch( err =>{
    //   reject("no results returned");
    // });
    // resolve(sets);
}

function getSetByNum(setNum) {
  return Set.findAll({
      where: { set_num: setNum },
      include: [Theme],
  }).then((sets) => {
      if (sets.length > 0) {
          return sets[0];
      } else {
          throw new Error('Unable to find requested set');
      }
  });
}


function getSetsByTheme(theme) {
  return Set.findAll({
      include: [Theme],
      where: {
          '$Theme.name$': {
              [Sequelize.Op.iLike]: `%${theme}%`,
          },
      },
  }).then((sets) => {
      if (sets.length > 0) {
          return sets;
      } else {
          throw new Error('Unable to find requested sets');
      }
  });
}

function addSet(setData){
  return new Promise((resolve, reject) => {
      Set.create(setData)
          .then(() => resolve())
          .catch((err) => reject(err.errors[0].message));
  });
};

function getAllThemes(){
  return new Promise((resolve, reject) => {
      Theme.findAll()
          .then((themes) => resolve(themes))
          .catch((err) => reject(err));
  });
};

function editSet(set_num, setData){
  return new Promise((resolve, reject) => {
    Set.update(setData, { where: { set_num } })
      .then((result) => {
        if (result[0] === 0) {
          reject({ message: "Can not find the set" });
        } else {
          resolve();
        }
      })
      .catch((err) => {
        reject({ message: err.errors[0].message });
      });
  });
};

function deleteSet(set_num){
  return new Promise((resolve, reject) => {
    Set.destroy({
      where: {
        set_num: set_num
      }
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
};

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet }


// // Code Snippet to insert existing data from Set / Themes

// sequelize
//   .sync()
//   .then( async () => {
//     try{
//       await Theme.bulkCreate(themeData);
//       await Set.bulkCreate(setData); 
//       console.log("-----");
//       console.log("data inserted successfully");
//     }catch(err){
//       console.log("-----");
//       console.log(err.message);

//       // NOTE: If you receive the error:

//       // insert or update on table "Sets" violates foreign key constraint "Sets_theme_id_fkey"

//       // it is because you have a "set" in your collection that has a "theme_id" that does not exist in the "themeData".   

//       // To fix this, use PgAdmin to delete the newly created "Themes" and "Sets" tables, fix the error in your .json files and re-run this code
//     }

//     process.exit();
//   })
//   .catch((err) => {
//     console.log('Unable to connect to the database:', err);
//   });