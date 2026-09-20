require('dotenv').config()

const db_url= `postgres://${ process.env.DB_USER}:${ process.env.DB_PASSWORD}@${ process.env.DB_HOST}:${ process.env.DB_PORT}/${ process.env.DB_NAME}`

console.log(db_url)
module.exports = {
  development: {
    url: db_url,
    dialect: 'postgres',
  },
  test: {
    url: db_url,
    dialect: 'postgres',
  },
  production: {
    url: db_url,
    dialect: 'postgres',
  },
}
