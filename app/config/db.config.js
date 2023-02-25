module.exports = {
    HOST: "localhost",
    USER: "admin",
    PASSWORD: "secret",
    DB: "postgres_db",
    dialect: "postgres",
    pool: {
        max: 100,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
}