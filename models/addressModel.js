const pool = require("../db");


const createAddress = async (user_id, city, zipcode, country, state, street, phone) => {
  const result = await pool.query(
    `INSERT INTO addresses (user_id, city, zipcode, country, state, street, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [user_id, city, zipcode, country, state, street, phone]
  );
  return result.rows[0];
};


const findAddressesByUserId = async (user_id) => {
  const result = await pool.query(
    `SELECT * FROM addresses WHERE user_id = $1 ORDER BY id DESC`,
    [user_id]
  );
  return result.rows;
};


const findAddressById = async (id) => {
  const result = await pool.query(
    `SELECT * FROM addresses WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

const removeAddress = async (id) => {
  await pool.query(`DELETE FROM addresses WHERE id = $1`, [id]);
};

module.exports = {
  createAddress,
  findAddressesByUserId,
  findAddressById,
  removeAddress
};
