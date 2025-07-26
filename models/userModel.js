const pool = require('../db');

const getAllCustomers = async () => {
  const result = await pool.query("SELECT * FROM users WHERE role = 'CUSTOMER'");
  return result.rows;
};
const deleteCustomerById = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM cart_items WHERE user_id = $1", [id]);

    await client.query("DELETE FROM orders WHERE customer_id = $1", [id]);
    
    const result = await client.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const findUserByEmail = async (email) => {
  console.log(email)
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  console.log(result)
  return result.rows[0];
};

const createUser = async (name, email, hashedPassword) => {
  const result = await pool.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
    [name, email, hashedPassword]
  );
  return result.rows[0];
};

const getUserById = async (id) => {
  const result = await pool.query('SELECT id, name, email, role FROM users WHERE id=$1', [id]);
  return result.rows[0];
};

const updateUserRole = async (id, role) => {
  const result = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
    [role, id]
  );
  return result.rows[0];
};


module.exports = {
  getAllCustomers,
  deleteCustomerById,
  findUserByEmail,
  createUser,
  getUserById,
  updateUserRole
};
