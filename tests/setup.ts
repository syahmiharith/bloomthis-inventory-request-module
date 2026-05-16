process.env.TEST_DATABASE_URL ??=
  "postgres://postgres:postgres@localhost:5432/inventory_request_module_test";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
