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

/*
* console.log(createdDML)
* 
*/
~~~
