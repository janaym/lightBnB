const properties = require("./json/properties.json");
// const users = require("./json/users.json");

const { Pool } = require('pg');
const pool = new Pool({
  user: 'janayma',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users
    WHERE email like $1`,
    [email])
    .then((result) => {
      // console.log(result.rows[0].password);
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};


/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  console.log(typeof(id));
  //return Promise.resolve(users[id]);
  return pool.query(`
    SELECT * FROM users WHERE id = $1`,
  [id])
    .then(result => {
      //console.log("SUCCESS!!!!!!!!!!!!!", result);
      return result.rows[0];
    })
    .catch(err => {
      console.log(err.message);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function(user) {
  const name = user.name;
  const email = user.email;
  const password = user.password;
  return pool
    .query(`
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [`${name}`, `${email}`, `${password}`])
    .then(result => {
      console.log(result.rows);
 
    })
    .catch(err => {
      console.log(err.message);
    });

};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {

  return pool.query(`
  SELECT properties.*
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE reservations.guest_id = $1
  GROUP BY properties.id, reservations.id
  ORDER BY start_date
  LIMIT $2`,
  [guest_id, limit])
    .then(result => {
      return result.rows;
    })
    .catch(err => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  //set up query and parameters
  const queryParams = [];
  let queryString =
  `SELECT properties.*, AVG(rating) as average_rating
  FROM properties 
  JOIN property_reviews ON properties.id = property_reviews.property_id `;

  const queryClauses = [];

  //if city requested
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    const currLen = (queryParams.length);
    queryClauses.push(`city LIKE $${currLen} `);
  }

  //if owner id filter on
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    const currLen = queryParams.length;
    queryClauses.push(`owner_id = $${currLen} `);
  }

  //check min price filter
  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    const currLen = queryParams.length;
    queryClauses.push(`cost_per_night > $${currLen} `);
  }
  //check max price filter
  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night);
    const currLen = queryParams.length;
    queryClauses.push(`cost_per_night < $${currLen} `);
  }

  //add where/and clauses
  if (queryClauses.length > 0) {
    queryString += `WHERE `;
    queryString += queryClauses.join("AND ");
  }

  //add GROUP BY
  queryString += `GROUP BY properties.id `;

  //add HAVING if rating condition applies
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    const currLen = queryParams.length;
    queryString += `HAVING AVG(rating) > $${currLen} `;
  }

  //add rest of query
  queryString +=
  `ORDER BY cost_per_night 
  LIMIT 10`;

  console.log(queryString, queryParams);

  //return promise
  return pool.query(queryString, queryParams)
    .then((result) => {
      //console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });

};


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
