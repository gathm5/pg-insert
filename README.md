# pg-insert

Create bulk insert DML statement
___
## Install
`$ npm install https://github.com/gautham1985/pg-insert`
___
## Usage
~~~
const { Bulk, Column, Type } = require('pg-insert');

const dbColumns = [
  new Column(
    'userId',
    Type.Varchar(50),
    { required: true, underscored: true, },
  ),
  new Column(
    'createdAt',
    Type.Timestamp,
    { required: true, underscored: true, defaultValue: Date.now() },
  ),
  new Column(
    'ANY_JAVASCRIPT_VARIABLE_NAME',
    Type.Json,
    { required: false, alias: 'meta_data' },
  )
];

const bulk = new Bulk('user_table', dbColumns);

const sampleData = [{
  userId: 'asdf3234sdf9823hk9h',
  ANY_JAVASCRIPT_VARIABLE_NAME: {
    key: 'any value',
    numberValue: 1000,
  }
}, {
  userId: 'j3ljsdfj20o23k9sd',
  ANY_JAVASCRIPT_VARIABLE_NAME: {
    dummy: 23949,
    test: 'any data',
  }
}];

const createdDML = bulk.insert(sampleData);

console.log(createdDML);

/*
INSERT INTO user_table (user_id, created_at, meta_data) VALUES ('asdf3234sdf9823hk9h', '2019-03-14 20:46:01', '{"key":"any value","numberValue":1000}'), ('j3ljsdfj20o23k9sd', '2019-03-14 20:46:01', '{"dummy":23949,"test":"any data"}')
*/
~~~
___
## Notes
This library is useful only to create Bulk Insert statements or insert statements only. Schema creation could be handled directly by a database DBA or using other libraries like node-postgres, sequelize, etc (Sequelize would support migration).

This library has no other dependencies and is written in pure javascript and is useful to copy large set of data where `/copy` cannot be used to copy data.