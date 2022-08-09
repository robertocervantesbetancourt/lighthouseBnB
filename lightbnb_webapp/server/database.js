const properties = require('./json/properties.json');
const users = require('./json/users.json');

///Postgres 
const {Pool} = require('pg');
const pool = new Pool({
  password: '123',
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
    .query(`SELECT * FROM users WHERE email LIKE $1;`, [email])
    .then((response) => {
      console.log(response.rows[0])
      return response.rows[0];
    })
    .catch((err) => {
      console.log(err.message)
    })
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1;`, [id])
    .then((response) => {
      return response.rows[0];
    })
    .catch((err) => {
      console.log(err.message)
    })
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`,[user.name, user.email, user.password])
    .then((response) => {
      console.log(response.rows[0])
      return response.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
      }
    );
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`SELECT properties.*, reservations.*, AVG(rating) as average_rating
    FROM reservations
    JOIN users ON users.id = reservations.guest_id
    JOIN properties ON properties.id = reservations.property_id
    JOIN property_reviews ON reservations.id = property_reviews.reservation_id
    WHERE reservations.guest_id = $1
    GROUP BY reservations.id, properties.id
    ORDER BY reservations.start_date DESC
    LIMIT $2;`, [guest_id, limit])
    .then((result) => {
      console.log(result.rows)
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
      }
    );

}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {

  const queryParams = [];

  let queryString = `
  SELECT properties.*, AVG(property_reviews.rating) as average_rating 
  FROM properties
  JOIN property_reviews ON properties.id = property_reviews.property_id `

  if(options.city){
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if(options.minimum_price_per_night){
    queryParams.push(options.minimum_price_per_night * 100);
    if(queryParams.length >= 1){
      queryString += `AND properties.cost_per_night >= $${queryParams.length} `
    } else {
      queryString += `WHERE properties.cost_per_night >= $${queryParams.length} `
    }
  }

  if(options.maximum_price_per_night){
    queryParams.push(options.maximum_price_per_night * 100);
    if(queryParams.length >= 1){
      queryString += `AND properties.cost_per_night <= $${queryParams.length} `
    } else {
      queryString += `WHERE properties.cost_per_night <= $${queryParams.length} `
    }
  }

  if(options.minimum_rating){
    queryParams.push(options.minimum_rating);
    if(queryParams.length >= 1){
      queryString += `AND rating >= $${queryParams.length} `;
    } else {
      queryString += `WHERE rating >= $${queryParams.length} `;
    }
  }


  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length}
  `;

  console.log(options, queryString, queryParams);

  return pool
    .query(queryString, queryParams)
    .then((result) => {return result.rows})
    .catch((err) => {
      console.log(err.message);
      }
    );
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {

const queryParams = [];
let index = 1;

let queryString =
  `INSERT INTO properties 
    (title,
    description,
    number_of_bedrooms,
    number_of_bathrooms,
    parking_spaces,
    cost_per_night,
    thumbnail_photo_url,
    cover_photo_url,
    street,
    country,
    city,
    province,
    post_code,
    owner_id)
    VALUES
    (`;

  const objLength = Object.keys(property).length

  
  for (let p in property){
    queryParams.push(property[p])
    queryString += `$${index}`
    if(index < objLength){
      queryString += `, `
    }
    index++;
  }
  
  queryString += `) RETURNING *;`

  // console.log(property, queryParams);
  


//console.log(queryString);

return pool
  .query(queryString, queryParams)
  .then((result) => 
        {console.log(result.rows);
        result.rows;})
  .catch((err) => {console.log(err.message);})


  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
}
exports.addProperty = addProperty;
